import type Calculator from "@/calculator"

import type * as Leaderboard from "./type"
import type { Action } from "~/game"
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "@/calculator/alchemy"
import { GatherCalculator } from "@/calculator/gather"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getStorageCalculatorItem } from "@/calculator/utils"
import { WorkflowCalculator } from "@/calculator/workflow"
import locales from "@/locales"
import { type StorageCalculatorItem, useFavoriteStore } from "@/pinia/stores/favorite"
import { useGameStore } from "@/pinia/stores/game"
import { getGameDataApi } from "../game"
import { handlePage, handlePush, handleSearch, handleSort } from "../utils"

const { t } = locales.global
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
    ElMessage.success(t("计算完成，耗时{0}秒", [(Date.now() - startTime) / 1000]))
  }
  profitList.forEach(item => item.favorite = useFavoriteStore().hasFavorite(item))

  return handlePage(handleSort(handleSearch(profitList, params), params), params)
}

function calcProfit() {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: Calculator[] = []
  list.forEach((item) => {
    const cList = []
    for (let catalystRank = 0; catalystRank <= 2; catalystRank++) {
      cList.push(new TransmuteCalculator({
        hrid: item.hrid,
        catalystRank
      }))
      cList.push(new DecomposeCalculator({
        hrid: item.hrid,
        catalystRank
      }))
      cList.push(new CoinifyCalculator({
        hrid: item.hrid,
        catalystRank
      }))
    }
    cList.forEach(c => handlePush(profitList, c))
    const projects: [string, Action][] = [
      [t("锻造"), "cheesesmithing"],
      [t("制造"), "crafting"],
      [t("裁缝"), "tailoring"],
      [t("烹饪"), "cooking"],
      [t("冲泡"), "brewing"]
    ]
    for (const [project, action] of projects) {
      const c = new ManufactureCalculator({ hrid: item.hrid, project, action })
      handlePush(profitList, c)
    }

    const gatherings: [string, Action][] = [
      [t("挤奶"), "milking"],
      [t("采摘"), "foraging"],
      [t("伐木"), "woodcutting"]
    ]
    for (const [project, action] of gatherings) {
      const c = new GatherCalculator({ hrid: item.hrid, project, action })
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
      [t("锻造"), "cheesesmithing"],
      [t("制造"), "crafting"],
      [t("裁缝"), "tailoring"],
      [t("烹饪"), "cooking"],
      [t("冲泡"), "brewing"]
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
          handlePush(profitList, new WorkflowCalculator(configs, t("{0}步{1}", [configs.length, configs[0].project])))
        }
        actionItem = c.actionItem
      }
      configs.unshift(getStorageCalculatorItem(c))
      handlePush(profitList, new WorkflowCalculator(configs, t("{0}步{1}", [configs.length, configs[0].project])))
    }
  })
  return profitList
}
