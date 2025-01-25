import type { Ingredient, Product } from "."
import type { ItemDetail } from "~/game"
import { getActionDetailOf, getPriceOf } from "@/common/apis/game"
import Calculator from "."

export class ManufactureCalculator extends Calculator {
  action: string
  get actionLevel(): number {
    return this.actionItem.levelRequirement.level + (this.artisan ? 5 : 0)
  }

  constructor(item: ItemDetail, project: string, action: string) {
    super(item, project)
    this.action = action
  }

  get actionItem() {
    return getActionDetailOf(`/actions/${this.action}/${this.key}`)
  }

  get timeCost(): number {
    return this.actionItem.baseTimeCost / this.speed
  }

  get artisan(): boolean {
    return true
  }

  get gourmet(): boolean {
    return true
  }

  get ingredientList(): Ingredient[] {
    let list = []
    if (this.actionItem.upgradeItemHrid) {
      list.push({
        hrid: this.actionItem.upgradeItemHrid,
        count: 1,
        price: getPriceOf(this.actionItem.upgradeItemHrid).ask
      })
    }
    list = list.concat(this.actionItem.inputItems.map(input => ({
      hrid: input.itemHrid,
      count: input.count,
      price: getPriceOf(input.itemHrid).ask
    })))
    return list
  }

  get productList(): Product[] {
    return this.actionItem.outputItems.map(output => ({
      hrid: output.itemHrid,
      count: output.count,
      price: getPriceOf(output.itemHrid).bid
    }))
  }
}
