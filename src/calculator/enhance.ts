import type { CalculatorConfig, Ingredient, IngredientWithPrice, Product } from "."
import { getEnhancelateCache, getEnhanceTimeCost, getEnhancingEssenceDropTable, getEnhancingRareDropTable, getGameDataApi, getPriceOf, setEnhancelateCache } from "@/common/apis/game"
import { getEnhanceSuccessRatio } from "@/common/apis/player"
import * as Format from "@@/utils/format"
import * as math from "mathjs"
import Calculator from "."
import { DecomposeCalculator } from "./alchemy"

export interface EnhancelateResult {
  actions: number
  protects: number
}
export interface EnhanceCalculatorConfig extends CalculatorConfig {
  protectLevel: number
}
/**
 * 强化+分解
 */
export class EnhanceCalculator extends Calculator {
  get className() {
    return "EnhanceCalculator"
  }

  enhanceLevel: number
  protectLevel: number
  protectionItem: IngredientWithPrice
  constructor(config: EnhanceCalculatorConfig) {
    super({ ...config, project: `强化+${config.enhanceLevel}`, action: "enhancing" })
    this.enhanceLevel = config.enhanceLevel!
    this.protectLevel = config.protectLevel
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
    this.protectionItem = list.reduce((min, item) => item.price < min.price ? item : min, list[0])
  }

  get timeCost() {
    return getEnhanceTimeCost() / this.speed
  }

  get equipmentSuccessRate(): number {
    return 0.0464
  }

  get speed() {
    return super.speed + Math.max(0, this.playerLevel - this.actionLevel) * 0.01
  }

  get efficiency() {
    return 1
  }

  _ingredientList: Ingredient[] = []
  get ingredientList(): Ingredient[] {
    if (this._ingredientList.length === 0) {
      // 为了与Calculator的设计理念一致，这里需要将成本和收益转换为单次成本和单次收益
      const { actions, protects } = this.enhancelate()
      this._ingredientList = [
        // 本体
        {
          hrid: this.item.hrid,
          count: 1 / actions,
          marketPrice: getPriceOf(this.item.hrid).ask
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
    }
    return this._ingredientList
  }

  _productList: Product[] = []
  get productList(): Product[] {
    if (this._productList.length === 0) {
      // 为了与Calculator的设计理念一致，这里需要将成本和收益转换为单次成本和单次收益
      const { actions } = this.enhancelate()

      this._productList = [
      // 强化后的本体
      // todo 考虑物品赋予强化等级字段
        {
          hrid: this.item.hrid,
          count: 1 / actions,
          marketPrice: getPriceOf(this.item.hrid).bid
        }
      ].concat(getEnhancingRareDropTable(this.item, getEnhanceTimeCost()).map(drop => ({
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

  get available(): boolean {
    return !!this.item.enhancementCosts && this.maxProfitApproximate > 0
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
    return this
  }

  // #region 项目特有属性

  get houseSuccessRate() {
    return 0.0005 * 4
  }

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
   * 用马尔科夫链计算从0级强化到目标等级的期望次数
   */
  enhancelate(): EnhancelateResult {
    let result = getEnhancelateCache(this.enhanceLevel, this.protectLevel, this.item.itemLevel)
    if (result) {
      return result
    }

    const targetLevel = this.enhanceLevel
    const successRateTable = getGameDataApi().enhancementLevelSuccessRateTable
    // 构造20x20的0矩阵
    const stMatrix = math.matrix(math.zeros(targetLevel, targetLevel))
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

    // 计算所有level到20级的期望 = (I - P)^-1 * 1
    const inv = math.inv(math.subtract(math.identity(targetLevel), stMatrix))
    const all = math.multiply(inv, math.ones(targetLevel, 1)) as math.Matrix

    // 计算从protectLevel级开始使用垫子的期望
    const protectVector = math.zeros(targetLevel, 1) as math.Matrix
    for (let i = this.protectLevel; i < targetLevel; i++) {
      protectVector.set([i, 0], this.failRate(successRateTable[i]))
    }
    const allMat = math.multiply(inv, protectVector) as math.Matrix

    const actions = all.get([0, 0])
    const protects = allMat.get([0, 0])
    result = { actions, protects }
    setEnhancelateCache(this.enhanceLevel, this.protectLevel, this.item.itemLevel, result)
    return result
  }

  successRateEnhance(rate: number): number {
    return rate * (1 + getEnhanceSuccessRatio(this.item))
  }

  levelUpRate(rate: number): number {
    const successRate = this.successRateEnhance(rate) * (this.blessedTea ? 0.99 : 1)
    return Math.min(1, successRate)
  }

  levelLeapRate(rate: number): number {
    return this.successRateEnhance(rate) * (this.blessedTea ? 0.01 : 0)
  }

  failRate(rate: number): number {
    return 1 - this.successRateEnhance(rate)
  }

  // #endregion
}
