import type Calculator from "@/calculator"

import type * as Leaderboard from "./type"
import type { Action } from "~/game"
import { DecomposeCalculator, TransmuteCalculator } from "@/calculator/alchemy"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getGameDataApi } from "../game"
/** 查 */
export async function getLeaderboardDataApi(params: Leaderboard.RequestData) {
  let profitList: Leaderboard.LeaderboardData[] = []
  try {
    profitList = calcProfit(params)
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

function calcProfit(params: Leaderboard.RequestData) {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: Leaderboard.LeaderboardData[] = []
  list.forEach((item) => {
    const c1 = new TransmuteCalculator({
      hrid: item.hrid,
      catalyst: params.catalystRank === 2 ? "prime_catalyst" : params.catalystRank === 1 ? "catalyst_of_transmutation" : undefined
    })
    const c2 = new DecomposeCalculator({
      hrid: item.hrid,
      catalyst: params.catalystRank === 2 ? "prime_catalyst" : params.catalystRank === 1 ? "catalyst_of_decomposition" : undefined
    })
    c1.available && profitList.push(profitConstructor(c1))
    c2.available && profitList.push(profitConstructor(c2))
    const projects: [string, Action][] = [
      ["锻造", "cheesesmithing"],
      ["制造", "crafting"],
      ["裁缝", "tailoring"],
      ["烹饪", "cooking"],
      ["冲泡", "brewing"]
    ]
    for (const [project, action] of projects) {
      const c3 = new ManufactureCalculator({ hrid: item.hrid, project, action })
      c3.available && profitList.push(profitConstructor(c3))
    }
  })
  return profitList
}

function profitConstructor(cal: Calculator) {
  return { ...cal.result, calculator: cal }
}
