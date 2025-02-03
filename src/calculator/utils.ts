import type { StorageCalculatorItem } from "@/pinia/stores/favorite"
import type Calculator from "."
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "./alchemy"
import { ManufactureCalculator } from "./manufacture"

const CLASS_MAP: { [key: string]: any } = {
  DecomposeCalculator,
  TransmuteCalculator,
  ManufactureCalculator,
  CoinifyCalculator
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
  return { className: calculator.className, id: calculator.id, hrid: calculator.item.hrid, project: calculator.project, action: calculator.action, catalystRank: calculator.catalystRank }
}
