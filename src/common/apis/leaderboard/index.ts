import type Calculator from "@/calculator"

import type * as Leaderboard from "./type"
import type { Action } from "~/game"
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "@/calculator/alchemy"
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
    const cList = []
    cList.push(new TransmuteCalculator({
      hrid: item.hrid
    }))
    cList.push(new DecomposeCalculator({
      hrid: item.hrid
    }))
    cList.push(new CoinifyCalculator({
      hrid: item.hrid
    }))
    if (params.degenerator) {
      cList.push(new TransmuteCalculator({
        hrid: item.hrid,
        catalystRank: 1
      }))
      cList.push(new TransmuteCalculator({
        hrid: item.hrid,
        catalystRank: 2
      }))
      cList.push(new DecomposeCalculator({
        hrid: item.hrid,
        catalystRank: 1
      }))
      cList.push(new DecomposeCalculator({
        hrid: item.hrid,
        catalystRank: 2
      }))
      cList.push(new CoinifyCalculator({
        hrid: item.hrid,
        catalystRank: 1
      }))
      cList.push(new CoinifyCalculator({
        hrid: item.hrid,
        catalystRank: 2
      }))
    }
    cList.forEach(c => c.available && profitList.push(profitConstructor(c)))
    const projects: [string, Action][] = [
      ["锻造", "cheesesmithing"],
      ["制造", "crafting"],
      ["裁缝", "tailoring"],
      ["烹饪", "cooking"],
      ["冲泡", "brewing"]
    ]
    for (const [project, action] of projects) {
      const c = new ManufactureCalculator({ hrid: item.hrid, project, action })
      c.available && profitList.push(profitConstructor(c))
    }
  })
  return profitList
}

function profitConstructor(cal: Calculator) {
  return { ...cal.result, calculator: cal }
}
