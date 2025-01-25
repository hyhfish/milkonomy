import type * as Leaderboard from "./type"

import type { Action } from "~/game"
import { DecomposeCalculator, TrunsmuteCalculator } from "@/calculator/alchemy"
import { ManufactureCalculator } from "@/calculator/manufature"
import { getGameDataApi } from "../game"
/** 查 */
export async function getLeaderboardDataApi(params: Leaderboard.RequestData) {
  let profitList = calcProfit()
  profitList.sort((a, b) => b.profitPH - a.profitPH)
  params.name && (profitList = profitList.filter(item => item.name.toLowerCase().includes(params.name!.toLowerCase())))
  params.project && (profitList = profitList.filter(item => item.project === params.project))
  params.profitRate && (profitList = profitList.filter(item => item.profitRate >= params.profitRate! / 100))
  params.banEquipment && (profitList = profitList.filter(item => !item.calculator.isEquipment))
  // 分页
  return { list: profitList.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: profitList.length }
}

function calcProfit() {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: Leaderboard.LeaderboardData[] = []
  list.forEach((item) => {
    const c1 = new TrunsmuteCalculator(item)
    const c2 = new DecomposeCalculator(item)

    c1.available && profitList.push({ ...c1.result, calculator: c1 })
    c2.available && profitList.push({ ...c2.result, calculator: c2 })
    const projects: [string, Action][] = [
      ["锻造", "cheesesmithing"],
      ["制造", "crafting"],
      ["裁缝", "tailoring"],
      ["烹饪", "cooking"],
      ["冲泡", "brewing"]
    ]
    for (const [project, action] of projects) {
      const c3 = new ManufactureCalculator(item, project, action)
      c3.available && profitList.push({ ...c3.result, calculator: c3 })
    }
  })
  return profitList
}
