import type Calculator from "@/calculator"

import type { StorageManualItem } from "@/pinia/stores/manual"
import type * as Leaderboard from "./type"
import type { Action } from "~/game"
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "@/calculator/alchemy"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getStorageManualItem } from "@/calculator/utils"
import { WorkflowCalculator } from "@/calculator/workflow"
import { useGameStore } from "@/pinia/stores/game"
import { getGameDataApi } from "../game"
/** 查 */
export async function getLeaderboardDataApi(params: Leaderboard.RequestData) {
  let profitList: Calculator[] = []
  if (useGameStore().getLeaderboardCache()) {
    profitList = useGameStore().getLeaderboardCache()
  } else {
    try {
      profitList = calcProfit()
      profitList = profitList.concat(calcAllFlowProfit())
    } catch (e: any) {
      console.error(e)
    }
    profitList.sort((a, b) => b.result.profitPH - a.result.profitPH)
    useGameStore().setLeaderBoardCache(profitList)
  }
  params.name && (profitList = profitList.filter(cal => cal.item.name.toLowerCase().includes(params.name!.toLowerCase())))
  params.project && (profitList = profitList.filter(cal => cal.project.match(params.project!)))
  params.banEquipment && (profitList = profitList.filter(cal => !cal.isEquipment))
  params.profitRate && (profitList = profitList.filter(cal => cal.result.profitRate >= params.profitRate! / 100))

  // 分页
  return { list: profitList.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: profitList.length }
}

function calcProfit() {
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
    cList.forEach(c => handlePush(profitList, c))
    const projects: [string, Action][] = [
      ["锻造", "cheesesmithing"],
      ["制造", "crafting"],
      ["裁缝", "tailoring"],
      ["烹饪", "cooking"],
      ["冲泡", "brewing"]
    ]
    for (const [project, action] of projects) {
      const c = new ManufactureCalculator({ hrid: item.hrid, project, action })
      handlePush(profitList, c)
    }
  })
  return profitList
}

function calcAllFlowProfit() {
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
          handlePush(profitList, new WorkflowCalculator(configs, `${configs.length}步${configs[0].project}`))
        }
        actionItem = c.actionItem
      }
      configs.unshift(getStorageManualItem(c))
      handlePush(profitList, new WorkflowCalculator(configs, `${configs.length}步${configs[0].project}`))
    }
  })
  return profitList
}

function handlePush(profitList: Calculator[], cal: Calculator) {
  if (!cal.available) return
  profitList.push(cal.run())
}
