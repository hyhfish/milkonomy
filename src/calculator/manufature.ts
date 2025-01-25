import type { Ingredient, Product } from "."
import type { Action, ItemDetail } from "~/game"
import { getActionDetailOf, getPriceOf } from "@/common/apis/game"
import Calculator from "."

export class ManufactureCalculator extends Calculator {
  get actionLevel(): number {
    return this.actionItem.levelRequirement.level + (this.artisanTea ? 5 : 0)
  }

  get available(): boolean {
    if (!getActionDetailOf(`/actions/${this.action}/${this.key}`)) {
      return false
    }
    for (const ingredient of this.ingredientList) {
      if (ingredient.price === -1) {
        return false
      }
    }
    return true
  }

  constructor(item: ItemDetail, project: string, action: Action) {
    super(item, project, action)
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
