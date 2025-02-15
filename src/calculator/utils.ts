import type { StorageCalculatorItem } from "@/pinia/stores/favorite"
import type Calculator from "."
import type { Ingredient } from "."
import { getPriceOf } from "@/common/apis/game"
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "./alchemy"
import { EnhanceCalculator } from "./enhance"
import { ManufactureCalculator } from "./manufacture"

const CLASS_MAP: { [key: string]: any } = {
  DecomposeCalculator,
  TransmuteCalculator,
  ManufactureCalculator,
  CoinifyCalculator,
  EnhanceCalculator
}

export function calculatorConstructable(className: string): boolean {
  return !!CLASS_MAP[className]
}

export function getCalculatorInstance(config: StorageCalculatorItem): Calculator {
  const className = config.className!
  const constructor = CLASS_MAP[className]
  return new constructor(config) as Calculator
}

export function getStorageCalculatorItem(calculator: Calculator): StorageCalculatorItem {
  return {
    className: calculator.className,
    id: calculator.id,
    ...calculator.config
  }
}
export function getTeaIngredientList(cal: Calculator) {
  const list: Ingredient[] = []

  // 喝茶
  if (cal.gourmetTea) {
    list.push({
      hrid: "/items/gourmet_tea",
      count: 3600 / 300 / cal.consumePH,
      marketPrice: getPriceOf("/items/gourmet_tea").ask
    })
  }

  if (cal.efficiencyTea) {
    list.push({
      hrid: "/items/efficiency_tea",
      count: 3600 / 300 * cal.consumePH,
      marketPrice: getPriceOf("/items/efficiency_tea").ask
    })
  }

  if (cal.artisanTea) {
    list.push({
      hrid: "/items/artisan_tea",
      count: 3600 / 300 / cal.consumePH,
      marketPrice: getPriceOf("/items/artisan_tea").ask
    })
  }

  if (cal.catalyticTea) {
    list.push({
      hrid: "/items/catalytic_tea",
      count: 3600 / 300 / cal.consumePH,
      marketPrice: getPriceOf("/items/catalytic_tea").ask
    })
  }
  return list
}
