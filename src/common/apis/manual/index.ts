import type Calculator from "@/calculator"
import type { RequestData } from "../leaderboard/type"
import { calculatorConstructable, getCalculatorInstance, getStorageManualItem } from "@/calculator/utils"
import { useManualStore } from "@/pinia/stores/manual"
/** 查 */
export async function getManualDataApi(params: RequestData) {
  await new Promise(resolve => setTimeout(resolve, 0))
  let profitList: Calculator[] = []
  try {
    profitList = calcProfit()
  } catch (e: any) {
    console.error(e)
  }
  profitList.sort((a, b) => b.result.profitPH - a.result.profitPH)
  params.name && (profitList = profitList.filter(item => item.item.name.toLowerCase().includes(params.name!.toLowerCase())))
  params.project && (profitList = profitList.filter(item => item.project === params.project))
  params.profitRate && (profitList = profitList.filter(item => item.result.profitRate >= params.profitRate! / 100))
  params.banEquipment && (profitList = profitList.filter(item => !item.isEquipment))
  // 分页
  return { list: profitList.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: profitList.length }
}

function calcProfit() {
  // 所有物品列表
  const list = useManualStore().list
  const profitList: Calculator[] = []
  list.filter(item => calculatorConstructable(item.className!)).forEach((item) => {
    const instance = getCalculatorInstance(item)
    instance.available && profitList.push(instance.run())
  })
  return profitList
}

/** 增 */
export function addManualApi(row: Calculator) {
  const storageItem = getStorageManualItem(row)
  useManualStore().addManual(storageItem)
}
/** 删 */
export function deleteManualApi(row: Calculator) {
  useManualStore().deleteManual({
    id: row.id,
    hrid: row.item.hrid,
    project: row.project,
    action: row.action,
    catalystRank: row.catalystRank
  })
}
