import type { StorageCalculatorItem } from "@/pinia/stores/favorite"
import type Calculator from "."
import { getPriceOf } from "@/common/apis/game"
import { getActionConfigOf, getDrinkConcentration } from "@/common/apis/player"
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
  return (getActionConfigOf(cal.action).tea || []).map(hrid => ({
    hrid,
    count: 3600 / 300 / cal.consumePH * (1 + getDrinkConcentration()),
    marketPrice: getPriceOf(hrid).ask
  }))
}
