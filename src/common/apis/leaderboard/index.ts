import type Calculator from "@/calculator"

import type * as Leaderboard from "./type"
import type { Action } from "~/game"
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "@/calculator/alchemy"
import { EnhanceCalculator } from "@/calculator/enhance"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getStorageCalculatorItem } from "@/calculator/utils"
import { WorkflowCalculator } from "@/calculator/workflow"
import { type StorageCalculatorItem, useFavoriteStore } from "@/pinia/stores/favorite"
import { useGameStore } from "@/pinia/stores/game"
import { getGameDataApi } from "../game"
/** 查 */
export async function getLeaderboardDataApi(params: Leaderboard.RequestData) {
  let profitList: Calculator[] = []
  if (useGameStore().getLeaderboardCache()) {
    profitList = useGameStore().getLeaderboardCache()
  } else {
    await new Promise(resolve => setTimeout(resolve, 0))
    const startTime = Date.now()
    try {
      if (params.enhanposer) {
        profitList = profitList.concat(calcEnhanceProfit())
      } else {
        profitList = calcProfit()
        profitList = profitList.concat(calcAllFlowProfit())
      }
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
  // 首先进行一次利润排序
  profitList.sort((a, b) => b.result.profitPH - a.result.profitPH)

  // 排序
  if (params.sort && params.sort.order) {
    const props = params.sort.prop.split(".")
    function getValue(c: any) {
      let value = c
      for (let i = 0; i < props.length; ++i) {
        value = value[props[i]]
      }
      return value
    }
    const order = params.sort.order
    profitList.sort((a, b) => {
      return order === "descending" ? getValue(b) - getValue(a) : getValue(a) - getValue(b)
    })
  }
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

function calcEnhanceProfit() {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: Calculator[] = []
  list.filter(item => item.enhancementCosts).forEach((item) => {
    for (let enhanceLevel = 1; enhanceLevel <= 20; enhanceLevel++) {
      let bestProfit = -Infinity
      let bestCal: WorkflowCalculator | undefined
      for (let protectLevel = (enhanceLevel > 2 ? 2 : enhanceLevel); protectLevel <= enhanceLevel; protectLevel++) {
        for (let catalystRank = 0; catalystRank <= 2; catalystRank++) {
          const enhancer = new EnhanceCalculator({ enhanceLevel, protectLevel, hrid: item.hrid })
          // 预筛选，把不可能盈利的去掉
          if (!enhancer.available) {
            continue
          }

          // protectLevel = enhanceLevel 时表示不用垫子
          const c = new WorkflowCalculator([
            getStorageCalculatorItem(enhancer),
            getStorageCalculatorItem(new DecomposeCalculator({ enhanceLevel, hrid: item.hrid, catalystRank }))
          ], `强化分解+${enhanceLevel}`)

          c.run()

          if (c.result.profitPH > bestProfit) {
            bestProfit = c.result.profitPH
            bestCal = c
          }
        }
      }
      bestCal && handlePush(profitList, bestCal)
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

function handlePush(profitList: Calculator[], cal: Calculator) {
  if (!cal.available) return
  if (!cal.result) {
    cal.run()
  }
  profitList.push(cal)
}
