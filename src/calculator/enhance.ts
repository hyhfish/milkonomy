import type { CalculatorConfig, Ingredient, IngredientWithPrice, Product } from "."
import { getEnhancelateCache, getEnhanceTimeCost, getEnhancingEssenceDropTable, getEnhancingRareDropTable, getGameDataApi, getPriceOf, setEnhancelateCache } from "@/common/apis/game"
import { getBuffOf, getEnhanceSuccessRatio } from "@/common/apis/player"
import * as Format from "@@/utils/format"
import * as math from "mathjs"
import Calculator from "."
import { DecomposeCalculator } from "./alchemy"
import { getTeaIngredientList } from "./utils"

export interface EnhancelateResult {
  actions: number
  protects: number
  targetRate: number
  leapRate: number
  escapeRate: number
}
export interface EnhanceCalculatorConfig extends CalculatorConfig {
  originLevel?: number
  escapeLevel?: number
  protectLevel: number
}
/**
 * 强化+分解
 */
export class EnhanceCalculator extends Calculator {
  get className() {
    return "EnhanceCalculator"
  }

  protectLevel: number
  originLevel: number
  escapeLevel: number
  protectionItem: IngredientWithPrice
  constructor(config: EnhanceCalculatorConfig) {
    super({ ...config, project: `强化+${config.enhanceLevel}`, action: "enhancing" })
    this.enhanceLevel = config.enhanceLevel!
    this.protectLevel = config.protectLevel
    this.originLevel = config.originLevel ?? 0
    this.escapeLevel = config.escapeLevel ?? -1
    let protectionList = [{
      hrid: super.item.hrid,
      count: 1,
      marketPrice: getPriceOf(super.item.hrid).ask
    }]
    if (super.item.protectionItemHrids) {
      protectionList = super.item.protectionItemHrids!.map(hrid => ({
        hrid,
        count: 1,
        marketPrice: getPriceOf(hrid).ask
      }))
    }
    const list = super.handlePrice(
      protectionList.concat([{
        hrid: "/items/mirror_of_protection",
        count: 1,
        marketPrice: getPriceOf("/items/mirror_of_protection").ask
      }]),
      [],
      "ask"
    )
    this.protectionItem = list.reduce((min, item) => {
      if (min.price === -1) {
        return item
      }
      if (item.price === -1) {
        return min
      }
      return (item.price < min.price) ? item : min
    }, list[0])
  }

  get timeCost() {
    return getEnhanceTimeCost() / this.speed
  }

  get speed() {
    return super.speed + Math.max(0, this.playerLevel - this.actionLevel) * 0.01
  }

  get efficiency() {
    return 1
  }

  _ingredientList?: Ingredient[]
  get ingredientList(): Ingredient[] {
    if (!this._ingredientList) {
      // 为了与Calculator的设计理念一致，这里需要将成本和收益转换为单次成本和单次收益
      const { actions, protects } = this.enhancelate()
      this._ingredientList = [
        // 本体
        {
          hrid: this.item.hrid,
          count: 1 / actions,
          marketPrice: getPriceOf(this.item.hrid, this.originLevel).ask,
          level: this.originLevel
        },
        // 垫子
        {
          hrid: this.protectionItem.hrid,
          count: protects / actions,
          marketPrice: this.protectionItem.marketPrice
        }
      ].concat(
        // 强化材料
        this.item.enhancementCosts!.map(item => ({
          hrid: item.itemHrid,
          count: item.count,
          marketPrice: getPriceOf(item.itemHrid).ask
        }))
      )

      this._ingredientList = this._ingredientList.concat(getTeaIngredientList(this))
    }
    return this._ingredientList
  }

  _targetRate?: number
  get targetRate() {
    return this._targetRate
  }

  _productList?: Product[]
  get productList(): Product[] {
    if (!this._productList) {
      // 为了与Calculator的设计理念一致，这里需要将成本和收益转换为单次成本和单次收益
      const { actions, escapeRate, targetRate, leapRate } = this.enhancelate()
      // 暂不计算最终祝福茶狗叫的额外收益
      const successRate = targetRate + leapRate
      this._targetRate = successRate

      this._productList = [
      // 强化后的本体
        {
          hrid: this.item.hrid,
          count: 1 / actions * successRate,
          marketPrice: getPriceOf(this.item.hrid, this.enhanceLevel).bid,
          level: this.enhanceLevel
        }
      ]

      // 如果有逃逸可能，则加上逃逸的收益
      if (escapeRate > 0) {
        this._productList.push({
          hrid: this.item.hrid,
          count: 1 / actions * escapeRate,
          marketPrice: getPriceOf(this.item.hrid, this.realEscapeLevel).bid,
          level: this.realEscapeLevel
        })
      }

      this._productList = this._productList.concat(getEnhancingRareDropTable(this.item, getEnhanceTimeCost()).map(drop => ({
        hrid: drop.itemHrid,
        rate: drop.dropRate * (1 + this.rareRatio),
        count: (drop.minCount + drop.maxCount) / 2,
        marketPrice: getPriceOf(drop.itemHrid).bid
      }))).concat(getEnhancingEssenceDropTable(this.item, getEnhanceTimeCost()).map(drop => ({
        hrid: drop.itemHrid,
        count: (drop.minCount + drop.maxCount) / 2,
        rate: drop.dropRate * (1 + this.essenceRatio),
        marketPrice: getPriceOf(drop.itemHrid).bid
      })))
    }
    return this._productList
  }

  get profitable(): boolean {
    return !!this.item.enhancementCosts && this.maxProfitApproximate > 0
  }

  get available(): boolean {
    return !!this.item.enhancementCosts
  }

  get isEnhance(): boolean {
    return !!this.item.enhancementCosts
  }

  get actionLevel(): number {
    return this.item.itemLevel
  }

  run() {
    super.run()
    // 0->1 的成功率显示出来
    const successRate = this.successRateEnhance(getGameDataApi().enhancementLevelSuccessRateTable[0])
    this.result.successRate = successRate
    this.result.successRateFormat = Format.percent(successRate)
    this.result.targetRateFormat = Format.percent(this.targetRate!)
    return this
  }

  get realEscapeLevel() {
    return this.protectLevel <= this.escapeLevel + 1 ? this.escapeLevel : 0
  }

  // #region 项目特有属性

  /**
   * 预估强化->分解最大利润
   * 最大利润小于0时，不可用
   */
  get maxProfitApproximate() {
    const { actions, protects } = this.enhancelate()

    // 只对比强化材料+垫子 与 分解产生精华的价格
    const protectCost = this.ingredientListWithPrice[1].price * protects
    const materialCost = this.ingredientListWithPrice.slice(2).reduce((acc, item) => acc + item.price * item.count * actions, 0)
    const cost = protectCost + materialCost

    const decomposeCal = new DecomposeCalculator({
      hrid: this.item.hrid,
      /** 催化剂 1普通 2主要催化剂 */
      catalystRank: 2,
      enhanceLevel: this.enhanceLevel
    })

    const product = decomposeCal.productListWithPrice[0]
    // 收益
    const gain = product.price * product.count * decomposeCal.successRate

    return gain - cost
  }

  /**
   * 用马尔科夫链计算从originLevel级强化到目标等级的期望次数
   * 其中protectLevel表示从几级开始保护，如果使用保护道具，则失败只会下降1级，否则会下降到0级
   * escapeLevel表示降到几级就逃跑，逃跑后不会再强化
   */
  enhancelate(): EnhancelateResult {
    let result = getEnhancelateCache({
      enhanceLevel: this.enhanceLevel,
      protectLevel: this.protectLevel,
      itemLevel: this.item.itemLevel,
      originLevel: this.originLevel,
      escapeLevel: this.escapeLevel
    })
    if (result) {
      return result
    }

    const targetLevel = this.enhanceLevel
    const successRateTable = getGameDataApi().enhancementLevelSuccessRateTable

    const offset = this.escapeLevel + 1
    const size = targetLevel - offset

    // 构造targetLevel x targetLevel的0矩阵
    let stMatrix = math.matrix(math.zeros(targetLevel, targetLevel))
    // 在此基础上构造转移矩阵 P
    for (let i = 0; i < targetLevel; i++) {
      if (i < targetLevel - 1) {
        stMatrix.set([i, i + 1], this.levelUpRate(successRateTable[i]))
      }
      if (i < targetLevel - 2) {
        stMatrix.set([i, i + 2], this.levelLeapRate(successRateTable[i]))
      }
      stMatrix.set([i, i >= this.protectLevel ? i - 1 : 0], this.failRate(successRateTable[i]))
    }

    // 删除 stMatrix 的前 escapeLevel+1 行和列
    stMatrix = math.subset(stMatrix, math.index(math.range(offset, targetLevel), math.range(offset, targetLevel)))

    // 计算所有level到targetLevel的期望 = (I - P)^-1 * 1
    const inv = math.inv(math.subtract(math.identity(size), stMatrix)) as math.Matrix
    const all = math.multiply(inv, math.ones(size, 1)) as math.Matrix

    // console.log("inv", inv)
    // console.log("all", all)

    // 计算从protectLevel级开始使用垫子的期望
    let protectVector = math.zeros(targetLevel, 1) as math.Matrix
    for (let i = this.protectLevel; i < targetLevel; i++) {
      protectVector.set([i, 0], this.failRate(successRateTable[i]))
    }

    protectVector = math.subset(protectVector, math.index(math.range(offset, targetLevel), 0))

    // console.log("protectVector", protectVector)
    const allMat = math.multiply(inv, protectVector) as math.Matrix
    const actions = all.get([this.originLevel - offset, 0])
    const protects = allMat.get([this.originLevel - offset, 0])
    const targetRate = this.levelLeapRate(successRateTable[targetLevel - 2]) * (size > 1 ? inv.get([this.originLevel - offset, size - 2]) : 0)
      + +this.levelUpRate(successRateTable[targetLevel - 1]) * inv.get([this.originLevel - offset, size - 1])
    const leapRate = this.levelLeapRate(successRateTable[targetLevel - 1]) * inv.get([this.originLevel - offset, size - 1])
    let escapeRate = 1 - targetRate - leapRate
    // 消除浮点数误差
    escapeRate = Math.abs(escapeRate) < 1e-10 ? 0 : escapeRate

    result = { actions, protects, targetRate, leapRate, escapeRate }
    setEnhancelateCache({
      enhanceLevel: this.enhanceLevel,
      protectLevel: this.protectLevel,
      itemLevel: this.item.itemLevel,
      originLevel: this.originLevel,
      escapeLevel: this.escapeLevel
    }, result)
    return result
  }

  successRateEnhance(rate: number): number {
    return rate * (1 + getEnhanceSuccessRatio(this.item))
  }

  levelUpRate(rate: number): number {
    const successRate = this.successRateEnhance(rate) * (1 - getBuffOf(this.action, "Blessed"))
    return Math.min(1, successRate)
  }

  levelLeapRate(rate: number): number {
    return this.successRateEnhance(rate) * getBuffOf(this.action, "Blessed")
  }

  failRate(rate: number): number {
    return 1 - this.successRateEnhance(rate)
  }

  // #endregion
}
