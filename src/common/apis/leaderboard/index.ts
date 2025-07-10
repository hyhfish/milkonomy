import type * as Leaderboard from "./type"

import type Calculator from "@/calculator"
import type { Action } from "~/game"
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "@/calculator/alchemy"
import { GatherCalculator } from "@/calculator/gather"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getStorageCalculatorItem } from "@/calculator/utils"
import { WorkflowCalculator } from "@/calculator/workflow"
import locales, { getTrans } from "@/locales"
import { type StorageCalculatorItem, useFavoriteStoreOutside } from "@/pinia/stores/favorite"
import { useGameStoreOutside } from "@/pinia/stores/game"
import { getGameDataApi } from "../game"
import { handlePage, handlePush, handleSearch, handleSort } from "../utils"

const { t } = locales.global
/** 查 */
export async function getLeaderboardDataApi(params: Leaderboard.RequestData) {
  let profitList: Calculator[] = []
  if (useGameStoreOutside().getLeaderboardCache()) {
    profitList = useGameStoreOutside().getLeaderboardCache()
  } else {
    await new Promise(resolve => setTimeout(resolve, 100))
    const startTime = Date.now()
    try {
      profitList = calcProfit()
      profitList = profitList.concat(calcAllFlowProfit())
    } catch (e: any) {
      console.error(e)
    }

    useGameStoreOutside().setLeaderBoardCache(profitList)
    ElMessage.success(t("计算完成，耗时{0}秒", [(Date.now() - startTime) / 1000]))
  }
  profitList.forEach(item => item.favorite = useFavoriteStoreOutside().hasFavorite(item))

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
      [getTrans("锻造"), "cheesesmithing"],
      [getTrans("制造"), "crafting"],
      [getTrans("裁缝"), "tailoring"],
      [getTrans("烹饪"), "cooking"],
      [getTrans("冲泡"), "brewing"]
    ]
    for (const [project, action] of projects) {
      const c = new ManufactureCalculator({ hrid: item.hrid, project, action })
      handlePush(profitList, c)
    }

    const gatherings: [string, Action][] = [
      [getTrans("挤奶"), "milking"],
      [getTrans("采摘"), "foraging"],
      [getTrans("伐木"), "woodcutting"]
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
      [getTrans("锻造"), "cheesesmithing"],
      [getTrans("制造"), "crafting"],
      [getTrans("裁缝"), "tailoring"],
      [getTrans("烹饪"), "cooking"],
      [getTrans("冲泡"), "brewing"]
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

        if (configs.length > 1) {
          let projectName = t("{0}步{1}", [configs.length, project])
          const otherProject = configs.find(conf => conf.project !== project)
          otherProject && (projectName += t("({0})", [otherProject?.project]))
          handlePush(profitList, new WorkflowCalculator(configs, projectName))
        }

        // D4更新后，会出现多步动作中出现不同Action组合的情况
        for (const [project, action] of projects) {
          c = new ManufactureCalculator({ hrid: actionItem.upgradeItemHrid, project, action })
          if (c.actionItem) {
            break
          }
        }

        actionItem = c.actionItem
      }
      configs.unshift(getStorageCalculatorItem(c))

      let projectName = t("{0}步{1}", [configs.length, project])
      const otherProject = configs.find(conf => conf.project !== project)
      otherProject && (projectName += t("({0})", [otherProject?.project]))
      handlePush(profitList, new WorkflowCalculator(configs, projectName))
    }
  })
  return profitList
}
