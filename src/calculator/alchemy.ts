import type { CalculatorConfig, Ingredient, Product } from "."
import { getGameDataApi, getPriceOf, getTransmuteTimeCost } from "@/common/apis/game"
import Calculator from "."

export interface AlchemyCalculatorConfig extends CalculatorConfig {
  catalyst?: "prime_catalyst" | "catalyst_of_transmutation" | "catalyst_of_decomposition" | "catalyst_of_coinification"
}
export class TransmuteCalculator extends Calculator {
  catalyst?: AlchemyCalculatorConfig["catalyst"]
  get className() {
    return "TransmuteCalculator"
  }

  constructor(config: AlchemyCalculatorConfig) {
    super({ ...config, project: "重组", action: "alchemy" })
    this.catalyst = config.catalyst
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
    if (this.catalyst === "prime_catalyst") {
      rate += 0.25
    }
    if (this.catalyst === "catalyst_of_transmutation") {
      rate += 0.15
    }
    return rate
  }
  // #endregion
}
export class DecomposeCalculator extends Calculator {
  get className() {
    return "DecomposeCalculator"
  }

  catalyst?: AlchemyCalculatorConfig["catalyst"]
  constructor(config: AlchemyCalculatorConfig) {
    super({ ...config, project: "分解", action: "alchemy" })
    this.catalyst = config.catalyst
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
    if (this.catalyst === "prime_catalyst") {
      rate += 0.25
    }
    if (this.catalyst === "catalyst_of_decomposition") {
      rate += 0.15
    }
    return rate
  }
  // #endregion
}

export class CoinifyCalculator extends Calculator {
  catalyst?: AlchemyCalculatorConfig["catalyst"]
  get className() {
    return "CoinifyCalculator"
  }

  constructor(config: AlchemyCalculatorConfig) {
    super({ ...config, project: "点金", action: "alchemy" })
    this.catalyst = config.catalyst
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
    if (this.catalyst === "prime_catalyst") {
      rate += 0.25
    }
    if (this.catalyst === "catalyst_of_coinification") {
      rate += 0.15
    }
    return rate
  }
  // #endregion
}
