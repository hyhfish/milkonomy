import type { CalculatorConfig, Ingredient, Product } from "."
import { getActionDetailOf, getPriceOf } from "@/common/apis/game"
import Calculator from "."
import { getTeaIngredientList } from "./utils"

export class ManufactureCalculator extends Calculator {
  get className() {
    return "ManufactureCalculator"
  }

  get actionLevel(): number {
    return this.actionItem.levelRequirement.level + (this.artisanTea ? 5 : 0)
  }

  get available(): boolean {
    if (!getActionDetailOf(`/actions/${this.action}/${this.key}`)) {
      return false
    }
    for (const ingredient of this.ingredientList) {
      if (ingredient.marketPrice === -1) {
        return false
      }
    }
    return true
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
    list = list.concat(this.actionItem.inputItems.map(input => ({
      hrid: input.itemHrid,
      // 工匠茶补正
      count: input.count * (this.artisanTea ? 0.9 : 1),
      marketPrice: getPriceOf(input.itemHrid).ask
    })))

    list = list.concat(getTeaIngredientList(this))
    return list
  }

  get productList(): Product[] {
    let list = this.actionItem.outputItems.map(output => ({
      hrid: output.itemHrid,
      // 双倍茶补正
      count: output.count * (this.gourmetTea ? 1.12 : 1),
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
