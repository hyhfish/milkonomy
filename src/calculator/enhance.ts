import type { CalculatorConfig, Ingredient, IngredientWithPrice, Product } from "."
import { getEnhanceTimeCost, getEnhancingEssenceDropTable, getEnhancingRareDropTable, getGameDataApi, getPriceOf } from "@/common/apis/game"
import * as math from "mathjs"
import Calculator from "."

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

  // 手套
  get equipmentSpeed(): number {
    return 0.129
  }

  get speed() {
    return super.speed + Math.max(0, this.actionLevel - this.item.itemLevel) * 0.01 + this.houseSpeed + (this.ultraEnhancingTea ? 0.06 : 0)
  }

  get efficiency() {
    return 1
  }

  _ingredientList: Ingredient[] = []
  get ingredientList(): Ingredient[] {
    return this._ingredientList
  }

  _productList: Product[] = []
  get productList(): Product[] {
    return this._productList
  }

  get available(): boolean {
    return !!this.item.enhancementCosts
  }

  get actionLevel(): number {
    return 100 + (this.ultraEnhancingTea ? 8 : 0)
  }

  // #region 项目特有属性
  get houseSpeed() {
    return 0.04
  }

  get houseSuccessRate() {
    return 0.0005 * 4
  }

  get ultraEnhancingTea() {
    return false
  }

  run() {
    // 期望次数
    const { actions, protects } = this.enhancelate()
    this._ingredientList = [{
      hrid: this.item.hrid,
      count: 1,
      marketPrice: getPriceOf(this.item.hrid).ask
    }, {
      hrid: this.protectionItem.hrid,
      count: 1,
      marketPrice: this.protectionItem.marketPrice
    }].concat(
      this.item.enhancementCosts!.map(item => ({
        hrid: item.itemHrid,
        count: item.count,
        marketPrice: getPriceOf(item.itemHrid).ask
      }))
    )

    this._productList = [
      // 第一个产出还是被强化物品
      // todo 考虑物品赋予强化等级字段
      {
        hrid: this.item.hrid,
        count: 1,
        marketPrice: getPriceOf(this.item.hrid).bid
      }
    ].concat(getEnhancingRareDropTable(this.item, getEnhanceTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      rate: drop.dropRate,
      count: (drop.minCount + drop.maxCount) / 2,
      marketPrice: getPriceOf(drop.itemHrid).bid
    }))).concat(getEnhancingEssenceDropTable(this.item, getEnhanceTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      count: (drop.minCount + drop.maxCount) / 2,
      rate: drop.dropRate,
      marketPrice: getPriceOf(drop.itemHrid).bid
    })))

    /**
     * 为了与Calculator的设计理念一致，这里需要将成本和收益转换为单次成本和单次收益
     */
    // 每次强化消耗的被强化物品数量
    this._ingredientList[0].count = 1 / actions
    this._ingredientList[1].count = protects / actions

    this._productList[0].count = 1 / actions
    return super.run()
  }

  /**
   * 用马尔科夫链计算从0级强化到目标等级的期望次数
   */
  enhancelate() {
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
    return { actions, protects }
  }

  successRateEnhance(rate: number): number {
    const buff = (1 + this.equipmentSuccessRate + this.houseSuccessRate + (this.actionLevel - this.item.itemLevel) * 0.0005)
    return rate * buff
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
