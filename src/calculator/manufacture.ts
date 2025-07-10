import type { CalculatorConfig, Ingredient, Product } from "."
import { getActionDetailOf, getPriceOf } from "@/common/apis/game"
import { getBuffOf, getTeaIngredientList } from "@/common/apis/player"
import Calculator from "."

export class ManufactureCalculator extends Calculator {
  get className() {
    return "ManufactureCalculator"
  }

  get actionLevel(): number {
    return this.actionItem.levelRequirement.level
  }

  get available(): boolean {
    return !!this.actionItem
  }

  originLevel: number
  constructor(config: CalculatorConfig) {
    super(config)
    this.originLevel = config.originLevel || 0
  }

  get actionItem() {
    return getActionDetailOf(`/actions/${this.action}/${this.key}`)
  }

  get timeCost(): number {
    return this.actionItem.baseTimeCost / this.speed
  }

  get ingredientList(): Ingredient[] {
    let list: Ingredient[] = []
    if (this.actionItem.upgradeItemHrid) {
      list.push({
        hrid: this.actionItem.upgradeItemHrid,
        count: 1,
        level: this.originLevel,
        marketPrice: getPriceOf(this.actionItem.upgradeItemHrid, this.originLevel).ask
      })
    }
    const artisanBuff = getBuffOf(this.action, "Artisan")
    list = list.concat(this.actionItem.inputItems.map(input => ({
      hrid: input.itemHrid,
      // 工匠茶补正
      count: input.count * (1 - artisanBuff),
      marketPrice: getPriceOf(input.itemHrid).ask
    })))

    list = list.concat(getTeaIngredientList(this))
    return list
  }

  get productList(): Product[] {
    const gourmetBuff = getBuffOf(this.action, "Gourmet")
    let list: Product[] = []
    // 需要消除浮点数误差
    const targetLevel = Math.round(this.originLevel * 0.7 * 100) / 100
    const levelUpRate = targetLevel % 1
    if (targetLevel % 1 === 0) {
      list = this.actionItem.outputItems.map(output => ({
        hrid: output.itemHrid,
        // 双倍茶补正
        count: output.count * (1 + gourmetBuff),
        level: Math.floor(targetLevel),
        marketPrice: getPriceOf(output.itemHrid, Math.floor(targetLevel)).bid
      }))
      // 如果targetLevel不是整数，则再添加一个level为targetLevel+1的产品
    } else {
      let levelUpPrice = getPriceOf(this.item.hrid, Math.ceil(targetLevel)).bid
      if (levelUpPrice <= 0) {
        levelUpPrice = getPriceOf(this.item.hrid, Math.floor(targetLevel)).bid
      }
      list = list.concat([
        {
          hrid: this.item.hrid,
          count: 1 - levelUpRate,
          level: Math.floor(targetLevel),
          marketPrice: getPriceOf(this.item.hrid, Math.floor(targetLevel)).bid
        },
        {
          hrid: this.item.hrid,
          count: levelUpRate,
          level: Math.ceil(targetLevel),
          marketPrice: levelUpPrice
        }
      ])
    }

    list = list.concat(this.actionItem.essenceDropTable?.map(essence => ({
      hrid: essence.itemHrid,
      count: essence.maxCount,
      rate: essence.dropRate * (1 + this.essenceRatio),
      marketPrice: getPriceOf(essence.itemHrid).bid
    })) || [])
    list = list.concat(this.actionItem.rareDropTable?.map(rare => ({
      hrid: rare.itemHrid,
      count: rare.maxCount,
      rate: rare.dropRate * (1 + this.rareRatio),
      marketPrice: getPriceOf(rare.itemHrid).bid
    })) || []
    )
    return list
  }
}
