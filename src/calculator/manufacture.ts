import type { CalculatorConfig, Ingredient, Product } from "."
import { getActionDetailOf, getPriceOf } from "@/common/apis/game"
import { getBuffOf } from "@/common/apis/player"
import Calculator from "."
import { getTeaIngredientList } from "./utils"

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

  constructor(config: CalculatorConfig) {
    super(config)
  }

  get actionItem() {
    return getActionDetailOf(`/actions/${this.action}/${this.key}`)
  }

  get timeCost(): number {
    return this.actionItem.baseTimeCost / this.speed
  }

  get ingredientList(): Ingredient[] {
    let list = []
    if (this.actionItem.upgradeItemHrid) {
      list.push({
        hrid: this.actionItem.upgradeItemHrid,
        count: 1,
        marketPrice: getPriceOf(this.actionItem.upgradeItemHrid).ask
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
    let list = this.actionItem.outputItems.map(output => ({
      hrid: output.itemHrid,
      // 双倍茶补正
      count: output.count * (1 + gourmetBuff),
      marketPrice: getPriceOf(output.itemHrid).bid
    }))
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
