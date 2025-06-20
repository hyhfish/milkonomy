import type { Action } from "~/game"
import { ManufactureCalculator } from "@/calculator/manufacture"
import locales from "@/locales"

import { useGameStore } from "@/pinia/stores/game"
import { getGameDataApi, getPriceOf } from "../game"
import { handlePage, handlePush, handleSearch, handleSort } from "../utils"

const { t } = locales.global
/** 查 */
export async function getDataApi(params: any) {
  let profitList: ManufactureCalculator[] = []
  if (useGameStore().getInheritCache()) {
    profitList = useGameStore().getInheritCache()
  } else {
    await new Promise(resolve => setTimeout(resolve, 300))
    const startTime = Date.now()
    try {
      profitList = profitList.concat(calcProfit())
    } catch (e: any) {
      console.error(e)
    }
    useGameStore().setInheritCache(profitList)
    ElMessage.success(t("计算完成，耗时{0}秒", [(Date.now() - startTime) / 1000]))
  }

  profitList = profitList.filter(item => params.maxLevel ? item.originLevel <= params.maxLevel : true)
  profitList = profitList.filter(item => params.minLevel ? item.originLevel >= params.minLevel : true)

  return handlePage(handleSort(handleSearch(profitList, params), params), params)
}

function calcProfit() {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: ManufactureCalculator[] = []
  list.filter(item => item.enhancementCosts).forEach((item) => {
    for (let originLevel = 1; originLevel <= 20; originLevel++) {
      const projects: [string, Action][] = [
        [t("锻造"), "cheesesmithing"],
        [t("制造"), "crafting"],
        [t("裁缝"), "tailoring"]
      ]
      for (const [project, action] of projects) {
        const c = new ManufactureCalculator({ hrid: item.hrid, project, action, originLevel })
        const actionItem = c.actionItem
        if (!actionItem?.upgradeItemHrid || actionItem.upgradeItemHrid === "/items/philosophers_stone") {
          continue
        }
        const originPrice = getPriceOf(actionItem.upgradeItemHrid, originLevel)
        if (originPrice.ask <= 0) {
          continue
        }
        const targetPrice = getPriceOf(item.hrid, Math.floor(originLevel * 0.7))
        if (targetPrice.bid <= 0) {
          continue
        }
        handlePush(profitList, c)
      }
    }
  })
  return profitList
}
