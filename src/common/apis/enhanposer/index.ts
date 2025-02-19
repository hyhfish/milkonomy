import type Calculator from "@/calculator"

import { DecomposeCalculator } from "@/calculator/alchemy"
import { EnhanceCalculator } from "@/calculator/enhance"
import { getStorageCalculatorItem } from "@/calculator/utils"
import { WorkflowCalculator } from "@/calculator/workflow"
import { useFavoriteStore } from "@/pinia/stores/favorite"
import { useGameStore } from "@/pinia/stores/game"
import { getGameDataApi } from "../game"
import { handlePage, handlePush, handleSort } from "../utils"

/** 查 */
export async function getEnhanposerDataApi(params: any) {
  let profitList: Calculator[] = []
  if (useGameStore().getEnhanposerCache()) {
    profitList = useGameStore().getEnhanposerCache()
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    const startTime = Date.now()
    try {
      profitList = profitList.concat(calcEnhanceProfit())
    } catch (e: any) {
      console.error(e)
    }
    useGameStore().setEnhanposerCache(profitList)
    ElMessage.success(`计算完成，耗时${(Date.now() - startTime) / 1000}秒`)
  }
  params.name && (profitList = profitList.filter(cal => cal.item.name.toLowerCase().includes(params.name!.toLowerCase())))
  params.profitRate && (profitList = profitList.filter(cal => cal.result.profitRate >= params.profitRate! / 100))
  profitList.forEach(item => item.favorite = useFavoriteStore().hasFavorite(item))
  // 首先进行一次利润排序

  return handlePage(handleSort(profitList, params), params)
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
