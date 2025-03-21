import type Calculator from "@/calculator"
import type { RequestData } from "../leaderboard/type"
import { calculatorConstructable, getCalculatorInstance, getStorageCalculatorItem } from "@/calculator/utils"
import { useFavoriteStore } from "@/pinia/stores/favorite"
/** 查 */
export async function getFavoriteDataApi(params: RequestData) {
  await new Promise(resolve => setTimeout(resolve, 300))
  let profitList: Calculator[] = []
  try {
    profitList = calcProfit()
  } catch (e: any) {
    console.error(e)
  }
  profitList.sort((a, b) => b.result.profitPH - a.result.profitPH)
  params.name && (profitList = profitList.filter(item => item.result.name.toLowerCase().includes(params.name!.toLowerCase())))
  params.project && (profitList = profitList.filter(item => item.project === params.project))
  params.profitRate && (profitList = profitList.filter(item => item.result.profitRate >= params.profitRate! / 100))
  params.banEquipment && (profitList = profitList.filter(item => !item.isEquipment))
  // 分页
  return { list: profitList.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: profitList.length }
}

function calcProfit() {
  // 所有物品列表
  const list = useFavoriteStore().list
  const profitList: Calculator[] = []
  list.filter(item => calculatorConstructable(item.className!)).forEach((item) => {
    const instance = getCalculatorInstance(item)
    instance.available && profitList.push(instance.run())
  })
  return profitList
}

/** 增 */
export function addFavoriteApi(row: Calculator) {
  const storageItem = getStorageCalculatorItem(row)
  useFavoriteStore().addFavorite(storageItem)
}
/** 删 */
export function deleteFavoriteApi(row: Calculator) {
  useFavoriteStore().deleteFavorite({
    id: row.id,
    hrid: row.item.hrid,
    project: row.project,
    action: row.action,
    catalystRank: row.catalystRank
  })
}
