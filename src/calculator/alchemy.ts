import type { CalculatorConfig, Ingredient, Product } from "."
import { getGameDataApi, getPriceOf, getTransmuteTimeCost } from "@/common/apis/game"
import Calculator from "."

export class TransmuteCalculator extends Calculator {
  get className() {
    return "TransmuteCalculator"
  }

  constructor(config: CalculatorConfig) {
    super({ ...config, project: "重组", action: "alchemy" })
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
    return this.item.alchemyDetail.transmuteSuccessRate * this.catalystTeaRate
  }

  get ingredientList(): Ingredient[] {
    return [
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
  // #endregion
}
export class DecomposeCalculator extends Calculator {
  get className() {
    return "DecomposeCalculator"
  }

  constructor(config: CalculatorConfig) {
    super({ ...config, project: "分解", action: "alchemy" })
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
    return 0.6 * this.catalystTeaRate
  }

  get ingredientList(): Ingredient[] {
    return [
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
  // #endregion
}
