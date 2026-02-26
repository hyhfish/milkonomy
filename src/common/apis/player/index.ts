import type Calculator from "@/calculator"
import type { ActionConfig, PlayerEquipmentItem } from "@/pinia/stores/player"
import type { Action, CommunityBuff, Equipment, ItemDetail, NoncombatStatsKey, NoncombatStatsProp } from "~/game"
import { DEFAULT_SEPCIAL_EQUIPMENT_LIST, DEFAULT_TEA } from "@/common/config"
import { getEquipmentTypeOf, getKeyOf } from "@/common/utils/game"
import { ACTION_LIST, COMMUNITY_BUFF_LIST, EQUIPMENT_LIST, HOUSE_MAP, useGameStoreOutside } from "@/pinia/stores/game"
import { usePlayerStoreOutside } from "@/pinia/stores/player"
import { getCommunityBuffDetailOf, getGameDataApi, getItemDetailOf, getPriceOf } from "../game"

/** 改 */
export function setActionConfigApi(config: ActionConfig, index: number) {
  usePlayerStoreOutside().setActionConfig(config, index)
  usePlayerStoreOutside().commit()
}

// #region 性能优化

let playerConfig = structuredClone(toRaw(usePlayerStoreOutside().config))
const defaultPlayerConfig = structuredClone(toRaw(usePlayerStoreOutside().config))
let equipmentList = [] as ItemDetail[]
let allEquipmentList = [] as ItemDetail[]
let teaList = [] as ItemDetail[]
let buffs = {} as Record<NoncombatStatsProp, number>

watch (() => useGameStoreOutside().gameData, () => {
  if (!useGameStoreOutside().gameData) return
  equipmentList = Object.freeze(structuredClone(Object.values(toRaw(useGameStoreOutside().gameData!.itemDetailMap))))
    .filter(item => item.equipmentDetail?.noncombatStats && Object.keys(item.equipmentDetail?.noncombatStats).length > 0)
  allEquipmentList = Object.freeze(structuredClone(Object.values(toRaw(useGameStoreOutside().gameData!.itemDetailMap))))
    .filter(item => item.equipmentDetail)
  teaList = Object.freeze(structuredClone(Object.values(toRaw(useGameStoreOutside().gameData!.itemDetailMap))))
    .filter(item => item.categoryHrid === "/item_categories/drink")
  initDefaultActionConfigMap()
  initDefaultSpecialEquipmentMap()
  initBuffMap()
  console.log("equipmentList changed")
}, { immediate: true })

watch(
  () => usePlayerStoreOutside().config,
  (value) => {
    playerConfig = structuredClone(toRaw(value))
    initBuffMap()
  },
  // 这里不能用 deep: true，否则在页面中修改数据时，保存前就会触发
  { immediate: true }
)

/**
 * 获取默认值
 */
function initDefaultActionConfigMap() {
  for (const action of Object.values(ACTION_LIST)) {
    const defaultTool = getToolListOf(action).find(item => item.itemLevel === 80)
    defaultPlayerConfig.actionConfigMap.set(action, {
      action,
      playerLevel: 100,
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
      back: {
        type: `back`,
        hrid: undefined,
        enhanceLevel: undefined
      },
      charm: {
        type: `charm`,
        hrid: undefined,
        enhanceLevel: undefined
      },
      houseLevel: 4,
      tea: structuredClone(DEFAULT_TEA[action])
    })
  }
}

function initDefaultSpecialEquipmentMap() {
  const map = new Map<Equipment, PlayerEquipmentItem>()
  for (const item of Object.values(DEFAULT_SEPCIAL_EQUIPMENT_LIST)) {
    defaultPlayerConfig.specialEquimentMap.set(item.type, {
      type: item.type,
      hrid: item.hrid,
      enhanceLevel: item.enhanceLevel
    })
  }
  return map
}

/**
 * 获取用户穿戴的action对应的配置
 * @param action
 */
export function getActionConfigOf(action: Action) {
  return playerConfig.actionConfigMap.get(action) ?? defaultPlayerConfig.actionConfigMap.get(action)!
}

export function getToolListOf(action: Action) {
  return equipmentList.filter(item => item.equipmentDetail?.type === `/equipment_types/${action}_tool`).sort((a, b) => a.itemLevel - b.itemLevel)
}

/**
 * 获取所有装备列表
 */
export function getEquipmentList() {
  return allEquipmentList
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
export function getSpecialEquipmentOf(type: Equipment) {
  return playerConfig.specialEquimentMap.get(type) ?? defaultPlayerConfig.specialEquimentMap.get(type)!
}

/**
 * 获取用户设置的社区buff
 * @param type
 */

export function getCommunityBuffOf(type: CommunityBuff) {
  return playerConfig.communityBuffMap.get(type) ?? defaultPlayerConfig.communityBuffMap.get(type)!
}

// #endregion

// #region 茶
export function getTeaListOf(action: Action) {
  return teaList.filter(item => item.consumableDetail?.usableInActionTypeMap[`/action_types/${action}`]).sort((a, b) => a.itemLevel - b.itemLevel).sort((a, b) => Number(a.hrid.includes(action)) - Number(b.hrid.includes(action)))
}

export function getTeaIngredientList(cal: Calculator) {
  return (getActionConfigOf(cal.action).tea || []).map(hrid => ({
    hrid,
    count: 3600 / 300 / cal.consumePH * (1 + getDrinkConcentration()),
    marketPrice: getPriceOf(hrid).ask
  }))
}
// #endregion

// #region buff计算
function initBuffMap() {
  if (!getGameDataApi()) return
  buffs = {} as Record<NoncombatStatsProp, number>
  const enhanceMultiplier = getGameDataApi().enhancementLevelTotalBonusMultiplierTable
  // 特殊装备
  for (const equipment of EQUIPMENT_LIST) {
    const eq = getSpecialEquipmentOf(equipment)
    if (eq && eq.hrid) {
      const item = getItemDetailOf(eq.hrid!)
      item.equipmentDetail?.noncombatStats && Object.entries(item.equipmentDetail.noncombatStats).forEach(([key, value]) => {
        const bonus = item.equipmentDetail?.noncombatEnhancementBonuses[key as NoncombatStatsProp]
        buffs[key as NoncombatStatsProp] = (buffs[key as NoncombatStatsProp] || 0) + value + ((bonus || 0) * (enhanceMultiplier[eq.enhanceLevel || 0]))
      })
    }
  }

  // 社区buff
  for (const communityBuff of COMMUNITY_BUFF_LIST) {
    const cb = getCommunityBuffOf(communityBuff)
    if (cb && cb.hrid && cb.level) {
      const detail = getCommunityBuffDetailOf(cb.hrid!)
      const buff = detail.buff
      for (const actionType in detail.usableInActionTypeMap) {
        const action = getKeyOf(actionType) as Action
        if (buff.typeHrid === "/buff_types/action_speed") {
          buffs[`${action}Speed`] = (buffs[`${action}Speed`] || 0) + (buff.flatBoost + buff.flatBoostLevelBonus * (cb.level - 1))
        }
        if (buff.typeHrid === "/buff_types/wisdom") {
          buffs[`${action}Experience`] = (buffs[`${action}Experience`] || 0) + (buff.flatBoost + buff.flatBoostLevelBonus * (cb.level - 1))
        }
        if (buff.typeHrid === "/buff_types/gathering") {
          buffs[`${action}Gathering`] = (buffs[`${action}Gathering`] || 0) + (buff.flatBoost + buff.flatBoostLevelBonus * (cb.level - 1))
        }
        if (buff.typeHrid === "/buff_types/efficiency") {
          buffs[`${action}Efficiency`] = (buffs[`${action}Efficiency`] || 0) + (buff.flatBoost + buff.flatBoostLevelBonus * (cb.level - 1))
        }
      }
    }
  }

  for (const action of ACTION_LIST) {
    // 职业装备
    const actionConfig = getActionConfigOf(action)
    for (const ac of Object.values(actionConfig)) {
      if (ac && typeof ac === "object" && !Array.isArray(ac) && ac.hrid) {
        const item = getItemDetailOf(ac.hrid)
        item.equipmentDetail?.noncombatStats && Object.entries(item.equipmentDetail.noncombatStats).forEach(([key, value]) => {
          const bonus = item.equipmentDetail?.noncombatEnhancementBonuses[key as NoncombatStatsProp]
          buffs[key as NoncombatStatsProp] = (buffs[key as NoncombatStatsProp] || 0) + value + ((bonus || 0) * (enhanceMultiplier[ac.enhanceLevel || 0]))
        })
      }
    }
    // 房子
    Object.keys(HOUSE_MAP[action as Action]).forEach((key) => {
      let buffAction = action as Action | "skilling"
      if (key === "RareFind" || key === "Experience") {
        buffAction = "skilling"
      }
      buffs[`${buffAction}${key}` as NoncombatStatsProp] = (buffs[`${buffAction}${key}` as NoncombatStatsProp] || 0) + (HOUSE_MAP[action as Action][key as NoncombatStatsKey] || 0) * (actionConfig.houseLevel || 0)
    })

    // 茶
    for (const tea of actionConfig.tea || []) {
      const item = getItemDetailOf(tea)
      item.consumableDetail?.buffs && item.consumableDetail.buffs.forEach((buff) => {
        if (buff.typeHrid === `/buff_types/${action}_level`) {
          buffs[`${action}Level`] = (buffs[`${action}Level`] || 0) + (buff.flatBoost * (1 + (buffs.drinkConcentration || 0)))
        }
        if (buff.typeHrid === "/buff_types/efficiency") {
          buffs[`${action}Efficiency`] = (buffs[`${action}Efficiency`] || 0) + (buff.flatBoost * (1 + (buffs.drinkConcentration || 0)))
        }
        if (buff.typeHrid === "/buff_types/artisan") {
          buffs[`${action}Artisan`] = (buffs[`${action}Artisan`] || 0) + (buff.flatBoost * (1 + (buffs.drinkConcentration || 0)))
        }
        // 工匠茶的等级debuff
        if (buff.typeHrid === "/buff_types/action_level") {
          buffs[`${action}Level`] = (buffs[`${action}Level`] || 0) - buff.flatBoost
        }
        if (buff.typeHrid === "/buff_types/gourmet") {
          buffs[`${action}Gourmet`] = (buffs[`${action}Gourmet`] || 0) + (buff.flatBoost * (1 + (buffs.drinkConcentration || 0)))
        }
        if (buff.typeHrid === `/buff_types/${action}_success`) {
          buffs[`${action}Success`] = (buffs[`${action}Success`] || 0) + (buff.ratioBoost * (1 + (buffs.drinkConcentration || 0)))
        }
        if (buff.typeHrid === "/buff_types/blessed") {
          buffs[`${action}Blessed`] = (buffs[`${action}Blessed`] || 0) + (buff.flatBoost * (1 + (buffs.drinkConcentration || 0)))
        }
        if (buff.typeHrid === "/buff_types/action_speed") {
          buffs[`${action}Speed`] = (buffs[`${action}Speed`] || 0) + (buff.flatBoost * (1 + (buffs.drinkConcentration || 0)))
        }
        if (buff.typeHrid === "/buff_types/gathering") {
          buffs[`${action}Gathering`] = (buffs[`${action}Gathering`] || 0) + (buff.flatBoost * (1 + (buffs.drinkConcentration || 0)))
        }
        if (buff.typeHrid === "/buff_types/processing") {
          buffs[`${action}Processing`] = (buffs[`${action}Processing`] || 0) + (buff.flatBoost * (1 + (buffs.drinkConcentration || 0)))
        }
        if (buff.typeHrid === "/buff_types/wisdom") {
          buffs[`${action}Experience`] = (buffs[`${action}Experience`] || 0) + (buff.flatBoost * (1 + (buffs.drinkConcentration || 0)))
        }
      })
    }
  }
  console.log("buffs", buffs)
}

export function getBuffOf(action: Action, key: NoncombatStatsKey) {
  return (buffs[`${action}${key}`] || 0) + (buffs[`skilling${key}`] || 0)
}

export function getDrinkConcentration() {
  return buffs.drinkConcentration || 0
}

export function getPlayerLevelOf(action: Action) {
  return getActionConfigOf(action).playerLevel + getBuffOf(action, "Level")
}

export function getAlchemySuccessRatio(item: ItemDetail) {
  const action = "alchemy"
  const playerLevel = getPlayerLevelOf(action)
  const levelRatio = playerLevel >= item.itemLevel
    ? 0
    : -0.9 * (1 - playerLevel / item.itemLevel)
  return levelRatio
}

export function getEnhanceSuccessRatio(item: ItemDetail) {
  const action = "enhancing"
  const playerLevel = getPlayerLevelOf(action)
  const levelRatio = playerLevel >= item.itemLevel
    ? (playerLevel - item.itemLevel) * 0.0005
    : -0.5 * (1 - playerLevel / item.itemLevel)
  const buff = getBuffOf(action, "Success")
  return levelRatio + buff
}

// #endregion
