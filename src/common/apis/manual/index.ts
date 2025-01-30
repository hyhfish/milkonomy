import type Calculator from "@/calculator"
import type { IngredientPriceConfig, ProductPriceConfig } from "@/calculator"
import type { LeaderboardData, RequestData } from "../leaderboard/type"
import { calculatorConstructable, catalystable, getCalculatorInstance, getStorageManualItem } from "@/calculator/utils"
import { useManualStore } from "@/pinia/stores/manual"
/** 查 */
export async function getManualDataApi(params: RequestData) {
  let profitList: LeaderboardData[] = []
  try {
    profitList = calcProfit()
  } catch (e: any) {
    console.error(e)
  }
  profitList.sort((a, b) => b.profitPH - a.profitPH)
  params.name && (profitList = profitList.filter(item => item.name.toLowerCase().includes(params.name!.toLowerCase())))
  params.project && (profitList = profitList.filter(item => item.project === params.project))
  params.profitRate && (profitList = profitList.filter(item => item.profitRate >= params.profitRate! / 100))
  params.banEquipment && (profitList = profitList.filter(item => !item.calculator.isEquipment))
  // 分页
  return { list: profitList.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: profitList.length }
}

function calcProfit() {
  // 所有物品列表
  const list = useManualStore().list
  const profitList: LeaderboardData[] = []
  list.filter(item => calculatorConstructable(item.className!)).forEach((item) => {
    const instance = getCalculatorInstance(item)
    catalystable(item)
    instance.available && profitList.push(profitConstructor(instance))
  })
  return profitList
}

function profitConstructor(cal: Calculator) {
  return { ...cal.result, calculator: cal }
}

/** 增 */
export function addManualApi(row: LeaderboardData) {
  const { calculator } = row
  const storageItem = getStorageManualItem(calculator)
  useManualStore().addManual(storageItem)
}
/** 删 */
export function deleteManualApi(row: LeaderboardData) {
  useManualStore().deleteManual({
    id: row.calculator.id,
    hrid: row.calculator.item.hrid,
    project: row.calculator.project,
    action: row.calculator.action,
    catalystRank: row.calculator.catalystRank
  })
}
/** 改 */
export function setPriceApi(row: LeaderboardData, ingredientPriceConfigList: IngredientPriceConfig[], productPriceConfigList: ProductPriceConfig[]) {
  useManualStore().setPrice({
    id: row.calculator.id,
    hrid: row.calculator.item.hrid,
    project: row.calculator.project,
    action: row.calculator.action,
    ingredientPriceConfigList,
    productPriceConfigList
  })
}
