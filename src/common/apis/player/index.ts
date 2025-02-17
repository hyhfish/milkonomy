import type { ActionConfigItem, PlayerEquipmentItem } from "@/pinia/stores/player"
import type { StoragePriceItem } from "@/pinia/stores/price"
import type { RequestData } from "../leaderboard/type"
import type { Action, Equipment, ItemDetail } from "~/game"
import { DEFAULT_SEPCIAL_EQUIPMENT_LIST } from "@/common/config"
import { getEquipmentTypeOf } from "@/common/utils/game"
import { ACTION_LIST, useGameStore } from "@/pinia/stores/game"
import { usePlayerStore } from "@/pinia/stores/player"
import { usePriceStore } from "@/pinia/stores/price"
import { getItemDetailOf } from "../game"

/** 查 */
export async function getPriceDataApi(params: RequestData) {
  await new Promise(resolve => setTimeout(resolve, 0))
  let list: StoragePriceItem[] = Array.from(usePriceStore().map.values())
  params.name && (list = list.filter(item => getItemDetailOf(item.hrid).name.toLocaleLowerCase().includes(params.name!.toLowerCase())))
  return { list: list.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: list.length }
}

/** 改 */
export function setActionConfigApi(list: ActionConfigItem[], sepecial: PlayerEquipmentItem[], activated: boolean) {
  if (activated) {
    usePlayerStore().setActionConfig(list)
    usePlayerStore().setSpecialEquipment(sepecial)
  }
  usePlayerStore().setActivated(activated)
  usePlayerStore().commit()
}

// #region 性能优化

const player = structuredClone(toRaw(usePlayerStore().$state))
const defaultPlayer = structuredClone(toRaw(usePlayerStore().$state))
let equipmentList = [] as ItemDetail[]

watch (() => useGameStore().gameData, () => {
  if (!useGameStore().gameData) return
  equipmentList = Object.freeze(structuredClone(Object.values(toRaw(useGameStore().gameData!.itemDetailMap))))
    .filter(item => item.equipmentDetail?.noncombatStats && Object.keys(item.equipmentDetail?.noncombatStats).length > 0)

  initDefaultActionConfigMap()
  initDefaultSpecialEquipmentMap()
  console.log("equipmentList changed")
}, { immediate: true })

watch(
  () => usePlayerStore().actionConfigMap
  , (value) => {
    player.actionConfigMap = structuredClone(toRaw(value))
  },
  { immediate: true }
)

watch(() => usePlayerStore().specialEquimentMap, (value) => {
  player.specialEquimentMap = structuredClone(toRaw(value))
}, { immediate: true })

/**
 * 获取默认值
 */
function initDefaultActionConfigMap() {
  for (const action of Object.values(ACTION_LIST)) {
    const defaultTool = getToolListOf(action).find(item => item.itemLevel === 80)
    defaultPlayer.actionConfigMap.set(action, {
      action,
      actionLevel: 100,
      tool: {
        type: `${action}_tool`,
        hrid: defaultTool?.hrid,
        enhanceLevel: 10
      },
      legs: {
        type: `legs`,
        hrid: undefined,
        enhanceLevel: undefined
      },
      body: {
        type: `body`,
        hrid: undefined,
        enhanceLevel: undefined
      },
      houseLevel: 4
    })
  }
}

function initDefaultSpecialEquipmentMap() {
  const map = new Map<Equipment, PlayerEquipmentItem>()
  for (const item of Object.values(DEFAULT_SEPCIAL_EQUIPMENT_LIST)) {
    defaultPlayer.specialEquimentMap.set(item.type, {
      type: item.type,
      hrid: item.hrid,
      enhanceLevel: item.enhanceLevel
    })
  }
  return map
}

watch(() => usePlayerStore().actionConfigActivated, () => {
  player.actionConfigActivated = usePlayerStore().actionConfigActivated
})

export function getActionConfigActivated() {
  return player.actionConfigActivated
}
/**
 * 获取用户穿戴的action对应的配置
 * @param action
 */
export function getActionConfigOf(action: Action, activated: boolean) {
  return activated
    ? player.actionConfigMap.size
      ? player.actionConfigMap.get(action)
      : defaultPlayer.actionConfigMap.get(action)
    : defaultPlayer.actionConfigMap.get(action)
}

export function getToolListOf(action: Action) {
  return equipmentList.filter(item => item.equipmentDetail?.type === `/equipment_types/${action}_tool`).sort((a, b) => a.itemLevel - b.itemLevel)
}

/**
 * 获取action,type对应的所有装备列表
 * @param action
 */
export function getEquipmentListOf(action: Action, type: Equipment) {
  return equipmentList
    .filter(item => Object.keys(item.equipmentDetail!.noncombatStats).find(key => key.includes(action)))
    .filter(item => getEquipmentTypeOf(item) === type)
}
/**
 * 获取所有special装备列表
 */
export function getSpecialEquipmentList() {
  return equipmentList.filter(item => DEFAULT_SEPCIAL_EQUIPMENT_LIST.find(se => se.type === getEquipmentTypeOf(item)))
}

/**
 * 获取单个部位的所有special装备列表
 * @param type
 */
export function getSpecialEquipmentListOf(type: string) {
  return getSpecialEquipmentList().filter(item => getEquipmentTypeOf(item) === type)
}

/**
 * 获取用户穿戴的special装备
 * @param type
 */
export function getSpecialEquipmentOf(type: Equipment, activated: boolean) {
  return activated
    ? player.specialEquimentMap.size
      ? player.specialEquimentMap.get(type)
      : defaultPlayer.specialEquimentMap.get(type)
    : defaultPlayer.specialEquimentMap.get(type)
}

// #endregion
