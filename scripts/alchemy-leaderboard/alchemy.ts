import type { CalculatorConfig, Ingredient, Product } from "./calculator.ts"
import Calculator from "./calculator.ts"
import { getAlchemyEssenceDropTable, getAlchemyRareDropTable, getCoinifyTimeCost, getDecomposeTimeCost, getPriceOf, getTeaIngredientList, getTransmuteTimeCost } from "./utils.ts"

export interface AlchemyCalculatorConfig extends CalculatorConfig {
  /** 催化剂 1普通 2主要催化剂 */
  catalystRank?: number
}

export type AlchemyCatalyst = "prime_catalyst" | "catalyst_of_transmutation" | "catalyst_of_decomposition" | "catalyst_of_coinification"
export class TransmuteCalculator extends Calculator {
  get className() {
    return "TransmuteCalculator"
  }

  constructor(config: AlchemyCalculatorConfig) {
    super({ ...config, project: "转化", action: "alchemy" })
  }

  get catalyst(): AlchemyCatalyst | undefined {
    if (this.catalystRank === 1) {
      return "catalyst_of_transmutation"
    } else if (this.catalystRank === 2) {
      return "prime_catalyst"
    }
    return undefined
  }

  get available(): boolean {
    return this.item.alchemyDetail?.transmuteDropTable != null && getPriceOf(this.item.hrid).ask !== -1
  }

  get actionLevel(): number {
    return this.item.itemLevel
  }

  get timeCost(): number {
    return getTransmuteTimeCost() / this.speed
  }

  // todo 暂未找到成功率下降公式
  get successRate(): number {
    return Math.min(1, this.item.alchemyDetail.transmuteSuccessRate * this.catalystRate)
  }

  get ingredientList(): Ingredient[] {
    let list = [
      {
        hrid: this.item.hrid,
        count: this.item.alchemyDetail.bulkMultiplier * (1 - this.sameItemCounter),
        counterCount: this.item.alchemyDetail.bulkMultiplier * this.sameItemCounter,
        marketPrice: getPriceOf(this.item.hrid).ask
      },
      {
        hrid: Calculator.COIN_HRID,
        count: this.item.alchemyDetail.bulkMultiplier,
        marketPrice: Math.max(Math.floor(this.item.sellPrice / 5), 50)
      }
    ]
    this.catalyst && list.push({
      hrid: `/items/${this.catalyst}`,
      // 成功才会消耗
      count: this.successRate,
      marketPrice: getPriceOf(`/items/${this.catalyst}`).ask
    })

    list = list.concat(getTeaIngredientList(this))

    return list
  }

  get productList(): Product[] {
    const dropTable = this.item.alchemyDetail.transmuteDropTable
    return dropTable.map(drop => ({
      hrid: drop.itemHrid,
      count: (drop.maxCount - (drop.itemHrid === this.item.hrid ? drop.maxCount : 0)) * this.item.alchemyDetail.bulkMultiplier,
      counterCount: (drop.itemHrid === this.item.hrid ? drop.maxCount : 0) * this.item.alchemyDetail.bulkMultiplier,
      rate: drop.dropRate,
      marketPrice: getPriceOf(drop.itemHrid).bid
    })).concat(getAlchemyRareDropTable(this.item, getTransmuteTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      count: (drop.minCount + drop.maxCount) / 2,
      counterCount: 0,
      rate: drop.dropRate,
      marketPrice: getPriceOf(drop.itemHrid).bid
    }))).concat(getAlchemyEssenceDropTable(this.item, getTransmuteTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      count: (drop.minCount + drop.maxCount) / 2,
      counterCount: 0,
      rate: drop.dropRate,
      marketPrice: getPriceOf(drop.itemHrid).bid
    })))
  }

  get sameItemCounter(): number {
    const product = this.item.alchemyDetail.transmuteDropTable.find(p => p.itemHrid === this.item.hrid)
    if (!product) return 0
    return Math.min(1, product.maxCount * (product.dropRate || 1) * this.successRate)
  }

  // #region 项目特有属性

  get catalystTeaRate(): number {
    return this.catalyticTea ? 1.05 : 1
  }

  get catalystRate(): number {
    let rate = this.catalystTeaRate
    rate += (this.catalystRank ? this.catalystRank * 0.1 + 0.05 : 0)
    return rate
  }
  // #endregion
}
export class DecomposeCalculator extends Calculator {
  get className() {
    return "DecomposeCalculator"
  }

  constructor(config: AlchemyCalculatorConfig) {
    super({ ...config, project: "分解", action: "alchemy" })
  }

  get catalyst(): AlchemyCatalyst | undefined {
    if (this.catalystRank === 1) {
      return "catalyst_of_decomposition"
    } else if (this.catalystRank === 2) {
      return "prime_catalyst"
    }
    return undefined
  }

  get available(): boolean {
    return this.item.alchemyDetail?.decomposeItems != null && getPriceOf(this.item.hrid).ask !== -1
  }

  get actionLevel(): number {
    return this.item.itemLevel
  }

  get timeCost(): number {
    return getDecomposeTimeCost() / this.speed
  }

  // todo 暂未找到分解成功率的来源及成功率下降公式
  get successRate(): number {
    return Math.min(1, 0.6 * this.catalystRate)
  }

  get ingredientList(): Ingredient[] {
    let list = [
      {
        hrid: this.item.hrid,
        count: this.item.alchemyDetail.bulkMultiplier,
        marketPrice: getPriceOf(this.item.hrid).ask
      },
      {
        hrid: Calculator.COIN_HRID,
        count: this.item.alchemyDetail.bulkMultiplier,
        marketPrice: 50 + 5 * this.item.itemLevel
      }

    ]
    if (this.catalyst) {
      list.push({
        hrid: `/items/${this.catalyst}`,
        // 成功才会消耗
        count: this.successRate,
        marketPrice: getPriceOf(`/items/${this.catalyst}`).ask
      })
    }

    list = list.concat(getTeaIngredientList(this))
    return list
  }

  get productList(): Product[] {
    const dropTable = this.item.alchemyDetail.decomposeItems
    return dropTable.map(drop => ({
      hrid: drop.itemHrid,
      count: drop.count * this.item.alchemyDetail.bulkMultiplier,
      marketPrice: getPriceOf(drop.itemHrid).bid
    })).concat(getAlchemyRareDropTable(this.item, getDecomposeTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      rate: drop.dropRate,
      count: (drop.minCount + drop.maxCount) / 2,
      marketPrice: getPriceOf(drop.itemHrid).bid
    }))).concat(getAlchemyEssenceDropTable(this.item, getDecomposeTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      count: (drop.minCount + drop.maxCount) / 2,
      rate: drop.dropRate,
      marketPrice: getPriceOf(drop.itemHrid).bid
    })))
  }

  // #region 项目特有属性

  get catalystTeaRate(): number {
    return this.catalyticTea ? 1.05 : 1
  }

  get catalystRate(): number {
    let rate = this.catalystTeaRate
    rate += (this.catalystRank ? this.catalystRank * 0.1 + 0.05 : 0)
    return rate
  }
  // #endregion
}

export class CoinifyCalculator extends Calculator {
  get className() {
    return "CoinifyCalculator"
  }

  constructor(config: AlchemyCalculatorConfig) {
    super({ ...config, project: "点金", action: "alchemy" })
  }

  get catalyst(): AlchemyCatalyst | undefined {
    if (this.catalystRank === 1) {
      return "catalyst_of_coinification"
    } else if (this.catalystRank === 2) {
      return "prime_catalyst"
    }
    return undefined
  }

  get available(): boolean {
    return this.item.alchemyDetail?.isCoinifiable && getPriceOf(this.item.hrid).ask !== -1
  }

  get actionLevel(): number {
    return this.item.itemLevel
  }

  get timeCost(): number {
    return getCoinifyTimeCost() / this.speed
  }

  // todo 暂未找到成功率下降公式
  get successRate(): number {
    return Math.min(1, 0.7 * this.catalystRate)
  }

  get ingredientList(): Ingredient[] {
    let list = [
      {
        hrid: this.item.hrid,
        count: this.item.alchemyDetail.bulkMultiplier,
        marketPrice: getPriceOf(this.item.hrid).ask
      }
    ]
    this.catalyst && list.push({
      hrid: `/items/${this.catalyst}`,
      // 成功才会消耗
      count: this.successRate,
      marketPrice: getPriceOf(`/items/${this.catalyst}`).ask
    })

    list = list.concat(getTeaIngredientList(this))

    return list
  }

  get productList(): Product[] {
    return [{
      hrid: Calculator.COIN_HRID,
      count: 1,
      marketPrice: this.item.sellPrice * 5 * this.item.alchemyDetail.bulkMultiplier
    }].concat(getAlchemyRareDropTable(this.item, getCoinifyTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      count: (drop.minCount + drop.maxCount) / 2,
      rate: drop.dropRate,
      marketPrice: getPriceOf(drop.itemHrid).bid
    }))).concat(getAlchemyEssenceDropTable(this.item, getCoinifyTimeCost()).map(drop => ({
      hrid: drop.itemHrid,
      count: (drop.minCount + drop.maxCount) / 2,
      rate: drop.dropRate,
      marketPrice: getPriceOf(drop.itemHrid).bid
    })))
  }

  // #region 项目特有属性

  get catalystTeaRate(): number {
    return this.catalyticTea ? 1.05 : 1
  }

  get catalystRate(): number {
    let rate = this.catalystTeaRate
    rate += (this.catalystRank ? this.catalystRank * 0.1 + 0.05 : 0)
    return rate
  }
  // #endregion
}
