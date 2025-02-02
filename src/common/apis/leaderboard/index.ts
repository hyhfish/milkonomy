import type Calculator from "@/calculator"

import type { StorageManualItem } from "@/pinia/stores/manual"
import type * as Leaderboard from "./type"
import type { Action } from "~/game"
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "@/calculator/alchemy"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getStorageManualItem } from "@/calculator/utils"
import { WorkflowCalculator } from "@/calculator/workflow"
import { getGameDataApi } from "../game"
/** 查 */
export async function getLeaderboardDataApi(params: Leaderboard.RequestData) {
  let profitList: Calculator[] = []
  try {
    profitList = calcProfit(params)
    profitList = profitList.concat(calcAllFlowProfit(params))
  } catch (e: any) {
    console.error(e)
  }
  profitList.sort((a, b) => b.result.profitPH - a.result.profitPH)
  // 分页
  return { list: profitList.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: profitList.length }
}

function calcProfit(params: Leaderboard.RequestData) {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: Calculator[] = []
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
    cList.forEach(c => handlePush(profitList, c, params))
    const projects: [string, Action][] = [
      ["锻造", "cheesesmithing"],
      ["制造", "crafting"],
      ["裁缝", "tailoring"],
      ["烹饪", "cooking"],
      ["冲泡", "brewing"]
    ]
    for (const [project, action] of projects) {
      const c = new ManufactureCalculator({ hrid: item.hrid, project, action })
      handlePush(profitList, c, params)
    }
  })
  return profitList
}

function calcAllFlowProfit(params: Leaderboard.RequestData) {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: Calculator[] = []
  list.forEach((item) => {
    const projects: [string, Action][] = [
      ["锻造", "cheesesmithing"],
      ["制造", "crafting"],
      ["裁缝", "tailoring"],
      ["烹饪", "cooking"],
      ["冲泡", "brewing"]
    ]
    for (const [project, action] of projects) {
      const configs: StorageManualItem[] = []
      let c = new ManufactureCalculator({ hrid: item.hrid, project, action })
      let actionItem = c.actionItem
      if (!actionItem?.upgradeItemHrid || actionItem.upgradeItemHrid === "/items/philosophers_stone") {
        continue
      }
      while (actionItem.upgradeItemHrid) {
        configs.unshift(getStorageManualItem(c))
        c = new ManufactureCalculator({ hrid: actionItem.upgradeItemHrid, project, action })
        if (configs.length > 1) {
          handlePush(profitList, new WorkflowCalculator(configs, `${configs.length}步${configs[0].project}`), params)
        }
        actionItem = c.actionItem
      }
      configs.unshift(getStorageManualItem(c))
      handlePush(profitList, new WorkflowCalculator(configs, `${configs.length}步${configs[0].project}`), params)
    }
  })
  return profitList
}

function handlePush(profitList: Calculator[], cal: Calculator, params: Leaderboard.RequestData) {
  // todo 收藏夹的不过滤
  if (!cal.available) return
  if (params.name && !cal.item.name.toLowerCase().includes(params.name!.toLowerCase())) return
  if (params.project && !cal.project.match(params.project!)) return
  if (params.banEquipment && cal.isEquipment) return
  const c = cal.run()
  if (params.profitRate && c.result.profitRate < params.profitRate! / 100) return
  profitList.push(c)
}
