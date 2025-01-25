import type { Ingredient, Product } from "."
import type { ItemDetail } from "~/game"
import { getGameDataApi, getPriceOf, getTransmuteTimeCost } from "@/common/apis/game"
import Calculator from "."

export class TrunsmuteCalculator extends Calculator {
  constructor(item: ItemDetail) {
    super(item, "重组")
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
        price: getPriceOf(this.item.hrid).ask
      },
      {
        hrid: Calculator.COIN_HRID,
        count: this.item.alchemyDetail.bulkMultiplier,
        price: Math.max(this.item.sellPrice / 5, 50)
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
        price: price.bid
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
  constructor(item: ItemDetail) {
    super(item, "分解")
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
        price: getPriceOf(this.item.hrid).ask
      },
      {
        hrid: Calculator.COIN_HRID,
        count: this.item.alchemyDetail.bulkMultiplier,
        price: 50 + 5 * this.item.itemLevel
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
        price: price.bid
      }
    })
  }

  // #region 项目特有属性
  get catalystTeaRate(): number {
    return 1.05
  }
  // #endregion
}
