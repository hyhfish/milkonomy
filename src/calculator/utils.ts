import type Calculator from "."
import type { StorageCalculatorItem } from "@/pinia/stores/favorite"
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
