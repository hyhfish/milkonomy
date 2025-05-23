import { EnhanceCalculator } from "@/calculator/enhance"
import locales from "@/locales"

import { useGameStore } from "@/pinia/stores/game"
import { getGameDataApi, getPriceOf } from "../game"
import { handlePage, handlePush, handleSearch, handleSort } from "../utils"

const { t } = locales.global
/** 查 */
export async function getDataApi(params: any) {
  let profitList: EnhanceCalculator[] = []
  if (useGameStore().getJunglestCache()) {
    profitList = useGameStore().getJunglestCache()
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    const startTime = Date.now()
    try {
      profitList = profitList.concat(calcEnhanceProfit())
    } catch (e: any) {
      console.error(e)
    }
    useGameStore().setJunglestCache(profitList)
    ElMessage.success(t("计算完成，耗时{0}秒", [(Date.now() - startTime) / 1000]))
  }

  profitList = profitList.filter(item => params.maxLevel ? item.enhanceLevel <= params.maxLevel : true)
  profitList = profitList.filter(item => params.minLevel ? item.enhanceLevel >= params.minLevel : true)

  return handlePage(handleSort(handleSearch(profitList, params), params), params)
}

function calcEnhanceProfit() {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: EnhanceCalculator[] = []
  const escapeLevels = [0, 5, 7, 8, 10, 12, 14]
  const originLevels = [5, 7, 8, 10, 12, 14]
  const targetLevels = [10, 12, 14, 16]
  list.filter(item => item.enhancementCosts).forEach((item) => {
    for (const enhanceLevel of targetLevels) {
      const price = getPriceOf(item.hrid, enhanceLevel)
      if (price.bid <= 0) {
        continue
      }

      let bestProfit = -Infinity
      let bestCal: EnhanceCalculator | undefined

      for (const originLevel of originLevels) {
        const originPrice = getPriceOf(item.hrid, originLevel)
        if (originPrice.ask <= 0) {
          continue
        }
        for (const escapeLevel of escapeLevels) {
          if (originLevel >= enhanceLevel || escapeLevel >= originLevel) {
            continue
          }
          for (let protectLevel = Math.max(2, escapeLevel + 1); protectLevel <= enhanceLevel; protectLevel++) {
            const c = new EnhanceCalculator({ originLevel, enhanceLevel, protectLevel, hrid: item.hrid, escapeLevel })
            if (!c.available) {
              continue
            }
            c.run()

            if (c.result.profitPH > bestProfit) {
              bestProfit = c.result.profitPH
              bestCal = c
            }
          }
        }
      }
      // 只取最优的保护情况
      bestCal && handlePush(profitList, bestCal)
    }
  })
  return profitList
}
