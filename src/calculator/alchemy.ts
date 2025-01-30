import type { CalculatorConfig, Ingredient, Product } from "."
import { getGameDataApi, getPriceOf, getTransmuteTimeCost } from "@/common/apis/game"
import Calculator from "."

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
    super({ ...config, project: "重组", action: "alchemy" })
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
    const list = [
      {
        hrid: this.item.hrid,
        count: this.item.alchemyDetail.bulkMultiplier,
        marketPrice: getPriceOf(this.item.hrid).ask
      },
      {
        hrid: Calculator.COIN_HRID,
        count: this.item.alchemyDetail.bulkMultiplier,
        marketPrice: Math.max(this.item.sellPrice / 5, 50)
      }
    ]
    this.catalyst && list.push({
      hrid: `/items/${this.catalyst}`,
      // 成功才会消耗
      count: this.successRate,
      marketPrice: getPriceOf(`/items/${this.catalyst}`).ask
    })

    return list
  }

  get productList(): Product[] {
    const dropTable = this.item.alchemyDetail.transmuteDropTable
    return dropTable.map((drop) => {
      const price = getPriceOf(drop.itemHrid)
      return {
        hrid: drop.itemHrid,
        count: drop.maxCount * this.item.alchemyDetail.bulkMultiplier,
        rate: drop.dropRate,
        marketPrice: price.bid
      }
    })
  }

  // #region 项目特有属性
  get catalystTeaRate(): number {
    return 1.05
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
    return getGameDataApi().actionDetailMap["/actions/alchemy/decompose"].baseTimeCost / this.speed
  }

  // todo 暂未找到分解成功率的来源及成功率下降公式
  get successRate(): number {
    return Math.min(1, 0.6 * this.catalystRate)
  }

  get ingredientList(): Ingredient[] {
    const list = [
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
    return list
  }

  get productList(): Product[] {
    const dropTable = this.item.alchemyDetail.decomposeItems
    return dropTable.map((drop) => {
      const price = getPriceOf(drop.itemHrid)
      return {
        hrid: drop.itemHrid,
        count: drop.count * this.item.alchemyDetail.bulkMultiplier,
        marketPrice: price.bid
      }
    })
  }

  // #region 项目特有属性
  get catalystTeaRate(): number {
    return 1.05
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
    return getGameDataApi().actionDetailMap["/actions/alchemy/coinify"].baseTimeCost / this.speed
  }

  // todo 暂未找到成功率下降公式
  get successRate(): number {
    return Math.min(1, 0.7 * this.catalystRate)
  }

  get ingredientList(): Ingredient[] {
    const list = [
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

    return list
  }

  get productList(): Product[] {
    return [
      {
        hrid: Calculator.COIN_HRID,
        count: 1,
        marketPrice: this.item.sellPrice * 5 * this.item.alchemyDetail.bulkMultiplier
      }
    ]
  }

  // #region 项目特有属性
  get catalystTeaRate(): number {
    return 1.05
  }

  get catalystRate(): number {
    let rate = this.catalystTeaRate
    rate += (this.catalystRank ? this.catalystRank * 0.1 + 0.05 : 0)
    return rate
  }
  // #endregion
}
