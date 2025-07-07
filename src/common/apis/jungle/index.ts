import type { Action } from "~/game"
import { EnhanceCalculator } from "@/calculator/enhance"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getStorageCalculatorItem } from "@/calculator/utils"
import { WorkflowCalculator } from "@/calculator/workflow"
import locales, { getTrans } from "@/locales"

import { useGameStoreOutside } from "@/pinia/stores/game"
import { getGameDataApi } from "../game"
import { getUsedPriceOf } from "../price"
import { handlePage, handlePush, handleSearch, handleSort } from "../utils"

const { t } = locales.global
/** 查 */
export async function getDataApi(params: any) {
  let profitList: WorkflowCalculator[] = []
  if (useGameStoreOutside().getJungleCache()) {
    profitList = useGameStoreOutside().getJungleCache()
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    const startTime = Date.now()
    try {
      profitList = profitList.concat(calcEnhanceProfit())
    } catch (e: any) {
      console.error(e)
    }
    useGameStoreOutside().setJungleCache(profitList)
    ElMessage.success(t("计算完成，耗时{0}秒", [(Date.now() - startTime) / 1000]))
    console.log(`计算完成，耗时秒${(Date.now() - startTime) / 1000}`)
  }

  profitList = profitList.filter(item => params.maxLevel ? item.calculator.enhanceLevel <= params.maxLevel : true)
  profitList = profitList.filter(item => params.minLevel ? item.calculator.enhanceLevel >= params.minLevel : true)
  profitList = profitList.filter(item => params.minSellPrice ? item.calculator.productListWithPrice[0].price >= params.minSellPrice * 1e6 : true)
  profitList = profitList.filter(item => params.maxSellPrice ? item.calculator.productListWithPrice[0].price <= params.maxSellPrice * 1e6 : true)

  profitList = profitList.filter(item => params.minItemLevel ? (item.calculator.item.itemLevel >= params.minItemLevel) : true)

  if (params.bestManufacture) {
    const maxProfitMap: Record<string, WorkflowCalculator> = {}
    profitList.forEach((item) => {
      const key = `${item.calculator.hrid}-${item.calculator.enhanceLevel}`
      if (!maxProfitMap[key] || maxProfitMap[key].result.profitPH < item.result.profitPH) {
        maxProfitMap[key] = item
      }
    })
    profitList = Object.values(maxProfitMap)
  }

  return handlePage(handleSort(handleSearch(profitList, params), params), params)
}

function calcEnhanceProfit() {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: WorkflowCalculator[] = []
  list.filter(item => item.enhancementCosts).forEach((item) => {
    for (let enhanceLevel = 1; enhanceLevel <= 20; enhanceLevel++) {
      if (getUsedPriceOf(item.hrid, enhanceLevel, "bid") === -1) {
        continue
      }

      let bestProfit = -Infinity
      let bestCal: WorkflowCalculator | undefined
      let bestProfitStep2 = -Infinity
      let bestCalStep2: WorkflowCalculator | undefined

      let bestProfitStep0 = -Infinity
      let bestCalStep0: EnhanceCalculator | undefined

      for (let protectLevel = (enhanceLevel > 2 ? 2 : enhanceLevel); protectLevel <= enhanceLevel; protectLevel++) {
        const enhancer = new EnhanceCalculator({ enhanceLevel, protectLevel, hrid: item.hrid })
        const projects: [string, Action][] = [
          [getTrans("锻造"), "cheesesmithing"],
          [getTrans("制造"), "crafting"],
          [getTrans("裁缝"), "tailoring"]
        ]
        for (const [projectLast, actionLast] of projects) {
          for (const [project, action] of projects) {
            const manual = new ManufactureCalculator({ hrid: item.hrid, project, action })
            if (!enhancer.available || !manual.available) {
              continue
            }

            const manualLast = new ManufactureCalculator({ hrid: manual.actionItem.upgradeItemHrid, project: projectLast, action: actionLast })

            // protectLevel = enhanceLevel 时表示不用垫子
            const c = new WorkflowCalculator([
              getStorageCalculatorItem(manual),
              getStorageCalculatorItem(enhancer)
            ], `${project}${getTrans("强化")}+${enhanceLevel}`)

            c.run()
            let cStep2
            if (manual.actionItem.upgradeItemHrid && manualLast.available) {
              cStep2 = new WorkflowCalculator([
                getStorageCalculatorItem(manualLast),
                getStorageCalculatorItem(manual),
                getStorageCalculatorItem(enhancer)
              ], `2步${project}${getTrans("强化")}+${enhanceLevel}`)
              cStep2.run()
            }

            enhancer.run()
            if (enhancer.result.profitPH > bestProfitStep0) {
              bestProfitStep0 = enhancer.result.profitPH
              bestCalStep0 = enhancer
            }

            if (c.result.profitPH > bestProfit) {
              bestProfit = c.result.profitPH
              bestCal = c
            }

            if (cStep2 && cStep2.result.profitPH > bestProfitStep2) {
              bestProfitStep2 = cStep2.result.profitPH
              bestCalStep2 = cStep2
            }
          }
        }
      }
      // 只取最优的保护情况
      bestCal && handlePush(profitList, bestCal)
      bestCalStep2 && handlePush(profitList, bestCalStep2)
      bestCalStep0 && handlePush(profitList, bestCalStep0)
    }
  })
  return profitList
}
