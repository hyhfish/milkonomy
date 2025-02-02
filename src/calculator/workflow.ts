import type { StorageManualItem } from "@/pinia/stores/manual"
import type { Ingredient, IngredientWithPrice, Product, ProductWithPrice } from "."
import * as Format from "@@/utils/format"
import Calculator from "."
import { getCalculatorInstance } from "./utils"

export class WorkflowCalculator extends Calculator {
  get ingredientList(): Ingredient[] {
    return []
  }

  get productList(): Product[] {
    return []
  }

  get className(): string {
    return "WorkflowCalculator"
  }

  calculatorList: Calculator[] = []

  /**
   * configs为工作流顺叙排列
   * @param configs StorageManualItem[]
   */
  constructor(configs: StorageManualItem[]) {
    const last = configs[configs.length - 1]
    super({
      hrid: last.hrid,
      project: `全流程${last.project}`,
      action: last.action
    })
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i]
      if (i > 0) {
        config.ingredientPriceConfigList = [{ manual: true, manualPrice: 0 }]
      }
      if (i < configs.length - 1) {
        config.productPriceConfigList = [{ manual: true, manualPrice: 0 }]
      }
      const cal = getCalculatorInstance(config)
      cal.run()
      this.calculatorList.push(cal)
    }
  }

  /** 纯展示，不用于计算 */
  get ingredientListPreprocess(): IngredientWithPrice[] {
    const list = this.calculatorList.map(cal => cal.ingredientListWithPrice).flatMap(
      (list, i) => list.map((item) => {
        return { ...item, countPH: item.countPH! * this.workMultiplier[i] }
      })
    )
    return this.mergeIngredient(list)
  }

  get productListWithPricePreprocess(): ProductWithPrice[] {
    const list = this.calculatorList.map(cal => cal.productListWithPrice).flatMap(
      (list, i) => list.map((item) => {
        return { ...item, countPH: item.countPH! * this.workMultiplier[i] }
      })
    )
    return this.mergeIngredient(list)
  }

  get ingredientListWithPrice(): IngredientWithPrice[] {
    let list = this.ingredientListPreprocess
    const sameItemCounterMap = this.sameItemCounterMap
    list = list.map((item) => {
      if (sameItemCounterMap.has(item.hrid)) {
        return { ...item, countPH: item.countPH! - sameItemCounterMap.get(item.hrid)! }
      }
      return item
    })
    // 数量小于1e-8，可视为计算误差，忽略不计
    return list.filter(item => item.countPH! > 1e-8)
  }

  get productListWithPrice(): ProductWithPrice[] {
    let list = this.productListWithPricePreprocess
    const sameItemCounterMap = this.sameItemCounterMap
    list = list.map((item) => {
      if (sameItemCounterMap.has(item.hrid)) {
        return { ...item, countPH: item.countPH! - sameItemCounterMap.get(item.hrid)! }
      }
      return item
    })
    // 数量小于1e-8，可视为计算误差，忽略不计
    return list.filter(item => item.countPH! > 1e-8)
  }

  get sameItemCounterMap() {
    const left = this.ingredientListPreprocess
    const right = this.productListWithPricePreprocess
    const leftItemMap = new Map<string, number>()
    left.forEach(item => leftItemMap.set(item.hrid, item.countPH!))
    const sameItemMap = new Map<string, number>()
    right.forEach((item) => {
      if (leftItemMap.has(item.hrid)) {
        sameItemMap.set(item.hrid, Math.min(leftItemMap.get(item.hrid)!, item.countPH!))
      }
    })
    return sameItemMap
  }

  mergeIngredient(list: IngredientWithPrice[]): IngredientWithPrice[] {
    // 合并相同hrid的产品
    const map = new Map<string, ProductWithPrice>()
    list.forEach((item) => {
      const key = item.hrid
      if (map.has(key)) {
        const target = map.get(key)!
        target.count += item.count
        target.countPH! += item.countPH!
      } else {
        map.set(key, item)
      }
    })
    return Array.from(map.values())
  }

  get available(): boolean {
    return this.calculatorList.every(cal => cal.available)
  }

  get actionLevel(): number {
    return Math.max(...this.calculatorList.map(cal => cal.actionLevel))
  }

  get timeCost() {
    return this.calculatorList[0].timeCost / this.workMultiplier[0]
  }

  get calculator() {
    return this.calculatorList[this.calculatorList.length - 1]
  }

  /**
   * 工作流阶段倍率\
   * 以第一阶段为基准，第一阶段产生的产物作为原料，后面的阶段刚好消耗完毕\
   *
   * 假设三个阶段原料->产品为 a->2b, b->3c, c->5d, 耗时都为 1h\
   * 那么按照本算法计算出来的单步倍率为 [1, 2, 3], 整体倍率为[1, 1x2, 1x2x3]\
   * 最终以整个工作流 1h 计算, 三个阶段的耗时为分别为 [1/9h, 2/9h, 6/9h]
   */
  get workMultiplier() {
    const singleMultiplier = [1]
    const resultList = this.calculatorList.map(cal => cal.result)
    for (let i = 0; i < this.calculatorList.length; i++) {
      const cal = this.calculatorList[i]
      const next = this.calculatorList[i + 1]
      if (!next) break
      // todo 未来 target 可能不固定
      const target = cal.hrid
      const targetProduct = cal.productList.find(p => p.hrid === target)!
      const targetOutput = targetProduct.count * (targetProduct.rate || 1) * resultList[i].gainPH
      const targetIngredient = next.ingredientList.find(i => i.hrid === target)!
      const targetInput = targetIngredient.count * resultList[i + 1].consumePH
      singleMultiplier.push(targetOutput / targetInput)
    }
    const multiplier = singleMultiplier.map((m, i) => m * (singleMultiplier[i - 1] || 1))
    const total = multiplier.reduce((prev, curr) => prev + curr, 0)
    return multiplier.map(m => m / total)
  }

  run() {
    const item = this.calculator.item
    const costPH = this.resultList.reduce((acc, curr) => acc + curr.costPH, 0)
    const incomePH = this.resultList.reduce((acc, curr) => acc + curr.incomePH, 0)
    const profitPH = this.resultList.reduce((acc, curr) => acc + curr.profitPH, 0)
    const profitRate = profitPH / costPH

    this.result = {
      workMultiplier: this.workMultiplier,
      hrid: item.hrid,
      name: item.name,
      project: this.project,
      successRate: 1,
      costPH,
      consumePH: -1,
      gainPH: -1,
      incomePH,
      profitPH,
      profitRate,
      costPHFormat: Format.number(costPH),
      incomePHFormat: Format.number(incomePH),
      profitPHFormat: Format.number(profitPH),
      profitPDFormat: Format.number(profitPH * 24),
      profitRateFormat: Format.percent(profitRate),
      efficiencyFormat: Format.percent(0),
      timeCostFormat: Format.costTime(this.timeCost),
      successRateFormat: Format.percent(1)
    }
    return this
  }

  get resultList() {
    const workMultiplier = this.workMultiplier
    return this.calculatorList.map((cal, i) => {
      const result = cal.result
      return {
        workMultiplier: workMultiplier[i],
        hrid: cal.item.hrid,
        name: cal.item.name,
        project: cal.project,
        successRate: cal.successRate,
        costPH: result.costPH * workMultiplier[i],
        consumePH: result.consumePH * workMultiplier[i],
        gainPH: result.gainPH * workMultiplier[i],
        incomePH: result.incomePH * workMultiplier[i],
        profitPH: result.profitPH * workMultiplier[i],
        profitRate: result.profitRate,
        costPHFormat: Format.number(result.costPH * workMultiplier[i]),
        incomePHFormat: Format.number(result.incomePH * workMultiplier[i]),
        profitPHFormat: Format.number(result.profitPH * workMultiplier[i]),
        profitPDFormat: Format.number(result.profitPH * 24 * workMultiplier[i]),
        profitRateFormat: Format.percent(result.profitRate),
        efficiencyFormat: Format.percent(cal.efficiency - 1),
        timeCostFormat: Format.costTime(cal.timeCost),
        successRateFormat: Format.percent(result.successRate)
      }
    })
  }
}
