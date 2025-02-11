import type { CalculatorConfig, Ingredient, IngredientWithPrice, Product } from "."
import { getEnhanceTimeCost, getEnhancingEssenceDropTable, getEnhancingRareDropTable } from "@/common/apis/game"
import { getPriceOf } from "scripts/alchemy-leaderboard/utils"
import Calculator from "."

export interface EnhanposerCalculatorConfig extends CalculatorConfig {
  enhanceLevel: number
}
/**
 * 强化+分解
 */
export class EnhanposerCalculator extends Calculator {
  enhanceLevel: number
  constructor(config: EnhanposerCalculatorConfig) {
    super({ ...config, project: "强化", action: "alchemy" })
    this.enhanceLevel = config.enhanceLevel
  }

  get timeCost() {
    return getEnhanceTimeCost() / this.speed
  }

  get successRate(): number {
    return Math.min(1, 0.5 * (1 + this.equipmentSuccessRate + (this.actionLevel - this.item.itemLevel) * 0.0005))
  }

  get equipmentSuccessRate(): number {
    return 0.0464
  }

  get speed() {
    return super.speed + Math.max(0, this.actionLevel - this.item.itemLevel) * 0.01 + this.houseSpeed
  }

  get efficiency() {
    return 1
  }

  get equipementSpeed(): number {
    return super.equipmentSpeed + 0.129
  }

  get ingredientList(): Ingredient[] {
    return this.item.enhancementCosts!.map(item => ({
      hrid: item.itemHrid,
      count: item.count,
      marketPrice: getPriceOf(item.itemHrid).ask
    }))
  }

  get productList(): Product[] {
    return getEnhancingRareDropTable(this.item, getEnhanceTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      rate: drop.dropRate,
      count: (drop.minCount + drop.maxCount) / 2,
      marketPrice: getPriceOf(drop.itemHrid).bid
    })).concat(getEnhancingEssenceDropTable(this.item, getEnhanceTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      count: (drop.minCount + drop.maxCount) / 2,
      rate: drop.dropRate,
      marketPrice: getPriceOf(drop.itemHrid).bid
    })))
  }

  get available(): boolean {
    return !!this.item.enhancementCosts
  }

  get actionLevel(): number {
    return 100
  }

  get className() {
    return "EnhanposerCalculator"
  }

  // #region 项目特有属性
  get houseSpeed() {
    return 0.04
  }

  // 垫子
  get mat(): IngredientWithPrice {
    const list = this.handlePrice(
      this.item.protectionItemHrids!.map(hrid => ({
        hrid,
        count: 1,
        marketPrice: getPriceOf(hrid).ask
      })).concat([{
        hrid: "/items/mirror_of_protection",
        count: 1,
        marketPrice: getPriceOf("/items/mirror_of_protection").ask
      }]),
      [],
      "ask"
    )
    return list.reduce((min, item) => item.price < min.price ? item : min, list[0])
  }

  // 模拟不同等级使用垫子的期望，最终取成本最低的方案
  // 从 0 级开始强化，成功时等级+1，并且不消耗垫子，失败时，如果用了垫子，下降一级，如果没用垫子，降为 0 级
  // 计算从 i 级开始使用垫子的期望次数
  get countWithMat(): number {
    return 0
  }
  // #endregion
}
