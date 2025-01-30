import type { StorageManualItem } from "@/pinia/stores/manual"
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

export function getCalculatorInstance(config: StorageManualItem): Calculator {
  const className = config.className!
  const constructor = CLASS_MAP[className]
  return new constructor(config) as Calculator
}

export function catalystable(config: StorageManualItem) {
  const className = config.className!
  const constructor = CLASS_MAP[className]
  console.log("constructor.prototype.catalyst", constructor.prototype.catalyst)
}

export function getStorageManualItem(calculator: Calculator): StorageManualItem {
  return { className: calculator.className, id: calculator.id, hrid: calculator.item.hrid, project: calculator.project, action: calculator.action, catalystRank: calculator.catalystRank }
}
