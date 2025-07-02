import type { Ingredient, IngredientWithPrice, Product, ProductWithPrice } from "."
import type { StorageCalculatorItem } from "@/pinia/stores/favorite"
import * as Format from "@@/utils/format"
import locales from "@/locales"
import Calculator from "."

import { getCalculatorInstance } from "./utils"

const { t } = locales.global

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

  get catalyst() {
    return (this.calculatorList[this.calculatorList.length - 1] as any).catalyst
  }

  calculatorList: Calculator[] = []

  /**
   * configs为工作流顺序排列
   */
  constructor(configs: StorageCalculatorItem[], project: string) {
    const last = configs[configs.length - 1]
    super({
      hrid: last.hrid,
      project,
      action: last.action
    })
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i]
      if (i > 0) {
        config.ingredientPriceConfigList = [{ immutable: true, price: 0, hrid: config.hrid }]
      }
      if (i < configs.length - 1) {
        config.productPriceConfigList = [{ immutable: true, price: 0, hrid: config.hrid }]
      }
      const cal = getCalculatorInstance(config)
      cal.available && cal.run()
      if (cal.hasManualPrice) {
        this.hasManualPrice = true
      }
      this.calculatorList.push(cal)
    }
  }

  private _ingredientPreprocess?: { list: IngredientWithPrice[], map: Map<string, number> }
  private _productPreprocess?: { list: ProductWithPrice[], map: Map<string, number> }

  // 预处理并缓存原料列表及数量映射
  get ingredientListPreprocess(): { list: IngredientWithPrice[], map: Map<string, number> } {
    if (!this._ingredientPreprocess) {
      const list = this.calculatorList.map(cal => cal.ingredientListWithPrice).flatMap(
        (list, i) => list.map(item => ({
          ...item,
          countPH: item.countPH! * this.workMultiplier[i]
        }))
      )
      const merged = this.mergeIngredient(list)
      const map = new Map<string, number>()
      merged.forEach(item => map.set(`${item.hrid}-${item.level || 0}`, item.countPH!))
      this._ingredientPreprocess = { list: merged, map }
    }
    return this._ingredientPreprocess
  }

  // 预处理并缓存产品列表及数量映射
  get productListWithPricePreprocess(): { list: ProductWithPrice[], map: Map<string, number> } {
    if (!this._productPreprocess) {
      const list = this.calculatorList.map(cal => cal.productListWithPrice).flatMap(
        (list, i) => list.map(item => ({
          ...item,
          countPH: item.countPH! * this.workMultiplier[i]
        }))
      )
      const merged = this.mergeIngredient(list)
      const map = new Map<string, number>()
      merged.forEach(item => map.set(`${item.hrid}-${item.level || 0}`, item.countPH!))
      this._productPreprocess = { list: merged, map }
    }
    return this._productPreprocess
  }

  // 优化抵消映射计算
  get sameItemCounterMap(): Map<string, number> {
    const { map: leftMap } = this.ingredientListPreprocess
    const { map: rightMap } = this.productListWithPricePreprocess
    const sameItemMap = new Map<string, number>()

    rightMap.forEach((rightCount, key) => {
      if (leftMap.has(key)) {
        sameItemMap.set(key, Math.min(leftMap.get(key)!, rightCount))
      }
    })
    return sameItemMap
  }

  // 优化最终原料列表生成
  get ingredientListWithPrice(): IngredientWithPrice[] {
    const { list } = this.ingredientListPreprocess
    const sameItemMap = this.sameItemCounterMap

    return list
      .map(item => ({
        ...item,
        countPH: item.countPH! - (sameItemMap.get(`${item.hrid}-${item.level || 0}`) || 0)
      }))
      .filter(item => item.countPH! > 1e-8)
  }

  // 优化最终产品列表生成
  get productListWithPrice(): ProductWithPrice[] {
    const { list } = this.productListWithPricePreprocess
    const sameItemMap = this.sameItemCounterMap
    return list
      .map(item => ({
        ...item,
        countPH: item.countPH! - (sameItemMap.get(`${item.hrid}-${item.level || 0}`) || 0)
      }))
      .filter(item => item.countPH! > 1e-8)
  }

  // 把相同hrid的原料合并，用于左右抵消
  mergeIngredient(list: IngredientWithPrice[]): IngredientWithPrice[] {
    const map = new Map<string, IngredientWithPrice>()
    list.forEach((item) => {
      const key = `${item.hrid}-${item.level || 0}`
      if (map.has(key)) {
        const target = map.get(key)!
        target.count += item.count
        target.countPH! += item.countPH!
      } else {
        map.set(key, { ...item })
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
   * 假设四个阶段原料->产品为 a->2b, b->3c, c->5d, d->7e 耗时都为 1h\
   * 那么按照本算法计算出来的单步倍率为 [1, 2, 3, 5], 整体倍率为[1, 1x2, 1x2x3, 1x2x3x5]\
   * 最终以整个工作流 1h 计算, 三个阶段的耗时为分别为 [1/39h, 2/39h, 6/39h, 30/39h]\
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

    const multiplier: number[] = []
    for (let i = 0; i < singleMultiplier.length; i++) {
      multiplier[i] = singleMultiplier[i] * (multiplier[i - 1] || 1)
    }
    const total = multiplier.reduce((prev, curr) => prev + curr, 0)
    return multiplier.map(m => m / total)
  }

  run() {
    const item = this.calculator.item
    const costPH = this.resultList.reduce((acc, curr) => acc + curr.costPH, 0)
    const incomePH = this.resultList.reduce((acc, curr) => acc + curr.incomePH, 0)
    let profitPH = this.resultList.reduce((acc, curr) => acc + curr.profitPH, 0)
    const profitRate = profitPH / costPH

    if (this.calculatorList.some(cal => !cal.valid)) {
      profitPH = -1 / 24
    }

    // 计算最后一个动作整体执行一次的利润
    const lastCal = this.calculatorList[this.calculatorList.length - 1]
    const lastRes = this.resultList[this.resultList.length - 1]
    const ac = lastCal.actionsPH * lastRes.workMultiplier
    const profitPP = profitPH / ac

    this.result = {
      workMultiplier: this.workMultiplier,
      hrid: item.hrid,
      name: t(item.name),
      project: this.project,
      successRate: 1,
      costPH,
      consumePH: -1,
      gainPH: -1,
      incomePH,
      profitPH,
      profitRate,
      costPHFormat: Format.money(costPH),
      incomePHFormat: Format.money(incomePH),
      profitPHFormat: Format.money(profitPH),
      profitPDFormat: Format.money(profitPH * 24),
      profitPPFormat: Format.money(profitPP),
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
        costPHFormat: Format.money(result.costPH * workMultiplier[i]),
        incomePHFormat: Format.money(result.incomePH * workMultiplier[i]),
        profitPHFormat: Format.money(result.profitPH * workMultiplier[i]),
        profitPDFormat: Format.money(result.profitPH * 24 * workMultiplier[i]),
        profitRateFormat: Format.percent(result.profitRate),
        efficiencyFormat: Format.percent(cal.efficiency - 1),
        timeCostFormat: Format.costTime(cal.timeCost),
        successRateFormat: Format.percent(result.successRate)
      }
    })
  }
}
