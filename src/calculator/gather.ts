import type { CalculatorConfig, Ingredient, Product } from "."
import { getActionDetailOf, getPriceOf, getProcessingProduct } from "@/common/apis/game"
import { getBuffOf } from "@/common/apis/player"
import Calculator from "."
import { getTeaIngredientList } from "./utils"

export class GatherCalculator extends Calculator {
  get className() {
    return "GatherCalculator"
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
    const actionKey = this.key?.replace(/milk$/, "cow").replace(/log$/, "tree")
    return getActionDetailOf(`/actions/${this.action}/${actionKey}`)
  }

  get timeCost(): number {
    return this.actionItem.baseTimeCost / this.speed
  }

  get ingredientList(): Ingredient[] {
    return getTeaIngredientList(this) || []
  }

  get productList(): Product[] {
    const gatheringBuff = getBuffOf(this.action, "Gathering")
    const processingBuff = getBuffOf(this.action, "Processing")

    let list = this.actionItem.dropTable!.map(output => ({
      hrid: output.itemHrid,
      // 采集茶补正
      count: (output.maxCount + output.minCount) / 2 * (1 - processingBuff) * (1 + gatheringBuff),
      marketPrice: getPriceOf(output.itemHrid).bid
    }))

    // 加工茶
    const processingHrid = getProcessingProduct(this.hrid)
    if (processingHrid) {
      list.push({
        hrid: processingHrid,
        count: processingBuff,
        marketPrice: getPriceOf(processingHrid).bid
      })
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
