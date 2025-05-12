import type { DecomposeCalculator } from "@/calculator/alchemy"
import type { Action } from "~/game"
import { EnhanceCalculator } from "@/calculator/enhance"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getStorageCalculatorItem } from "@/calculator/utils"
import { WorkflowCalculator } from "@/calculator/workflow"
import locales from "@/locales"

import { useGameStore } from "@/pinia/stores/game"
import { getGameDataApi, getPriceOf } from "../game"
import { handlePage, handlePush, handleSearch, handleSort } from "../utils"

const { t } = locales.global
/** 查 */
export async function getDataApi(params: any) {
  let profitList: WorkflowCalculator[] = []
  if (useGameStore().getJungleCache()) {
    profitList = useGameStore().getJungleCache()
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    const startTime = Date.now()
    try {
      profitList = profitList.concat(calcEnhanceProfit())
    } catch (e: any) {
      console.error(e)
    }
    useGameStore().setJungleCache(profitList)
    ElMessage.success(t("计算完成，耗时{0}秒", [(Date.now() - startTime) / 1000]))
  }

  profitList = profitList.filter(item => params.maxLevel ? (item.calculator as DecomposeCalculator).enhanceLevel <= params.maxLevel : true)
  profitList = profitList.filter(item => params.minLevel ? (item.calculator as DecomposeCalculator).enhanceLevel >= params.minLevel : true)

  return handlePage(handleSort(handleSearch(profitList, params), params), params)
}

function calcEnhanceProfit() {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: WorkflowCalculator[] = []
  list.filter(item => item.enhancementCosts).forEach((item) => {
    for (let enhanceLevel = 1; enhanceLevel <= 20; enhanceLevel++) {
      const price = getPriceOf(item.hrid, enhanceLevel)
      if (!price.bid) {
        continue
      }
      let bestProfit = -Infinity
      let bestCal: WorkflowCalculator | undefined
      for (let protectLevel = (enhanceLevel > 2 ? 2 : enhanceLevel); protectLevel <= enhanceLevel; protectLevel++) {
        const enhancer = new EnhanceCalculator({ enhanceLevel, protectLevel, hrid: item.hrid })
        const projects: [string, Action][] = [
          [t("锻造"), "cheesesmithing"],
          [t("制造"), "crafting"],
          [t("裁缝"), "tailoring"]
        ]
        for (const [project, action] of projects) {
          const manual = new ManufactureCalculator({ hrid: item.hrid, project, action })
          if (!enhancer.available || !manual.available) {
            continue
          }

          // protectLevel = enhanceLevel 时表示不用垫子
          const c = new WorkflowCalculator([
            getStorageCalculatorItem(manual),
            getStorageCalculatorItem(enhancer)
          ], `${project}${t("强化")}+${enhanceLevel}`)

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
