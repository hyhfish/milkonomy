import type { ActionConfigItem } from "@/pinia/stores/player"
import type { StoragePriceItem } from "@/pinia/stores/price"
import type { RequestData } from "../leaderboard/type"
import type { Action, ItemDetail } from "~/game"
import { ACTION_LIST, useGameStore } from "@/pinia/stores/game"
import { usePlayerStore } from "@/pinia/stores/player"
import { usePriceStore } from "@/pinia/stores/price"
import { getGameDataApi, getItemDetailOf } from "../game"

/** 查 */
export async function getPriceDataApi(params: RequestData) {
  await new Promise(resolve => setTimeout(resolve, 0))
  let list: StoragePriceItem[] = Array.from(usePriceStore().map.values())
  params.name && (list = list.filter(item => getItemDetailOf(item.hrid).name.toLocaleLowerCase().includes(params.name!.toLowerCase())))
  return { list: list.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: list.length }
}

/** 改 */
export function setActionConfigApi(list: ActionConfigItem[], activated: boolean) {
  usePlayerStore().setActionConfig(list)
  usePlayerStore().setActivated(activated)
  usePlayerStore().commit()
}

// #region 性能优化

const player = structuredClone(toRaw(usePlayerStore().$state))
let equipmentList = [] as ItemDetail[]

watch (() => useGameStore().gameData, () => {
  equipmentList = Object.values(getGameDataApi().itemDetailMap).filter(item => item.equipmentDetail?.noncombatStats)
}, { immediate: true })

watch(
  () => usePlayerStore().actionConfigMap
  , () => {
    player.actionConfigMap = Object.freeze(toRaw(structuredClone(toRaw(usePlayerStore().actionConfigMap))))
    console.log("raw actionConfigMap changed")

    // 设置默认值
    for (const action of Object.values(ACTION_LIST)) {
      if (!player.actionConfigMap.has(action)) {
        const defaultTool = getToolListOf(action).find(item => item.itemLevel === 80)
        player.actionConfigMap.set(action, {
          action,
          actionLevel: 100,
          toolHrid: defaultTool?.hrid,
          toolEnhanceLevel: 10,
          equipmentHrid: undefined,
          equipmentEnhanceLevel: 10,
          houseLevel: 4
        })
      }
    }
  },
  { immediate: true, deep: true }
)

watch(() => usePlayerStore().actionConfigActivated, () => {
  player.actionConfigActivated = usePlayerStore().actionConfigActivated
})

export function getActionConfigOf(action: Action) {
  return player.actionConfigMap.get(action)
}

export function getActionConfigValueOf(action: Action, key: keyof ActionConfigItem) {
  return player.actionConfigMap.get(action)?.[key]
}

export function getToolListOf(action: Action) {
  return equipmentList.filter(item => item.equipmentDetail?.type === `/equipment_types/${action}_tool`).sort((a, b) => a.itemLevel - b.itemLevel)
}

// #endregion
