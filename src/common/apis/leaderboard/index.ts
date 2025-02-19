import type Calculator from "@/calculator"

import type * as Leaderboard from "./type"
import type { Action } from "~/game"
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "@/calculator/alchemy"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getStorageCalculatorItem } from "@/calculator/utils"
import { WorkflowCalculator } from "@/calculator/workflow"
import { type StorageCalculatorItem, useFavoriteStore } from "@/pinia/stores/favorite"
import { useGameStore } from "@/pinia/stores/game"
import { getGameDataApi } from "../game"
import { handlePage, handlePush, handleSort } from "../utils"
/** 查 */
export async function getLeaderboardDataApi(params: Leaderboard.RequestData) {
  let profitList: Calculator[] = []
  if (useGameStore().getLeaderboardCache()) {
    profitList = useGameStore().getLeaderboardCache()
  } else {
    await new Promise(resolve => setTimeout(resolve, 0))
    const startTime = Date.now()
    try {
      profitList = calcProfit()
      profitList = profitList.concat(calcAllFlowProfit())
    } catch (e: any) {
      console.error(e)
    }
    useGameStore().setLeaderBoardCache(profitList)
    ElMessage.success(`计算完成，耗时${(Date.now() - startTime) / 1000}秒`)
  }
  params.name && (profitList = profitList.filter(cal => cal.item.name.toLowerCase().includes(params.name!.toLowerCase())))
  params.project && (profitList = profitList.filter(cal => cal.project.match(params.project!)))
  params.banEquipment && (profitList = profitList.filter(cal => !cal.isEquipment))
  params.profitRate && (profitList = profitList.filter(cal => cal.result.profitRate >= params.profitRate! / 100))

  profitList.forEach(item => item.favorite = useFavoriteStore().hasFavorite(item))

  return handlePage(handleSort(profitList, params), params)
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
      const configs: StorageCalculatorItem[] = []
      let c = new ManufactureCalculator({ hrid: item.hrid, project, action })
      let actionItem = c.actionItem
      if (!actionItem?.upgradeItemHrid || actionItem.upgradeItemHrid === "/items/philosophers_stone") {
        continue
      }
      while (actionItem.upgradeItemHrid) {
        configs.unshift(getStorageCalculatorItem(c))
        c = new ManufactureCalculator({ hrid: actionItem.upgradeItemHrid, project, action })
        if (configs.length > 1) {
          handlePush(profitList, new WorkflowCalculator(configs, `${configs.length}步${configs[0].project}`))
        }
        actionItem = c.actionItem
      }
      configs.unshift(getStorageCalculatorItem(c))
      handlePush(profitList, new WorkflowCalculator(configs, `${configs.length}步${configs[0].project}`))
    }
  })
  return profitList
}
