import type { ACTION_LIST, EQUIPMENT_LIST } from "@/pinia/stores/game"

interface PROP_TODO {
  [key: string]: any
}

// #region Game
export interface GameData {
  gameVersion: string
  versionTimestamp: string
  itemDetailMap: Record<string, ItemDetail>
  actionDetailMap: Record<string, ActionDetail>
  shopItemDetailMap: Record<string, ShopItemDetail>
  openableLootDropMap: Record<string, DropTableItem[]>
  enhancementLevelSuccessRateTable: number[]
  enhancementLevelTotalBonusMultiplierTable: number[]
}
export interface ShopItemDetail {
  hrid: string
  category: string
  itemHrid: string
  costs: Item[]
  sortIndex: number
}
export interface ItemDetail {
  hrid: string
  name: string
  categoryHrid: string
  sellPrice: number
  isTradable: boolean
  itemLevel: number
  enhancementCosts?: Item[]
  protectionItemHrids?: string[]
  alchemyDetail: AlchemyDetail
  equipmentDetail?: EquipmentDetail
  consumableDetail: ConsumableDetail
  sortIndex: number
}
export interface ActionDetail {
  hrid: string
  function: string
  type: string
  category: string
  name: string
  levelRequirement: {
    skillHrid: string
    level: number
  }
  baseTimeCost: number
  experienceGain: {
    skillHrid: string
    value: number
  }
  dropTable?: DropTableItem[]
  essenceDropTable?: DropTableItem[]
  rareDropTable?: DropTableItem[]
  upgradeItemHrid: string
  inputItems: Item[]
  outputItems: Item[]
  combatZoneInfo: PROP_TODO
  maxPartySize: number
  buffs: PROP_TODO
  sortIndex: 0
}
export interface Item {
  itemHrid: string
  count: number
}

export interface DropTableItem {
  itemHrid: string
  dropRate: number
  minCount: number
  maxCount: number
  minEliteTier?: number
}

export interface ConsumableDetail {
  cooldownDuration: number
  usableInActionTypeMap: Record<ActionType, boolean>
  hitpointRestore: number
  manapointRestore: number
  recoveryDuration: number
  buffs: Buff[]
  defaultCombatTriggers: PROP_TODO
}
export interface Buff {
  uniqueHrid: string
  typeHrid: string
  ratioBoost: number
  ratioBoostLevelBonus: number
  flatBoost: number
  flatBoostLevelBonus: number
  startTime: string
  duration: number
}

type Action = typeof ACTION_LIST[number]
type ActionType = `/action_types/${Action}`
type Equipment = typeof EQUIPMENT_LIST[number] | `${Action}_tool`
type EquipmentType = `/equipment_types/${Equipment}`
// #endregion

// #region Alchemy
export interface AlchemyDetail {
  bulkMultiplier: number
  isCoinifiable: boolean
  decomposeItems: Item[]
  transmuteSuccessRate: number
  transmuteDropTable: DropTableItem[]
}

// #endregion

// #region Equipment

type NoncombatStatsKey = "Speed" | "Efficiency" | "Success" | "RareFind" | "EssenceFind" | "Experience" | "Level" | "Artisan" | "Gourmet" | "Blessed" | "Gathering" | "Processing"
type NoncombatStatsProp = `${Action | "skilling"}${NoncombatStatsKey}`

export interface EquipmentDetail {
  type: EquipmentType
  levelRequirements: {
    skillHrid: string
    level: number
  }[]
  combatStats: PROP_TODO
  noncombatStats: {
    [key in NoncombatStatsProp]?: number
  }
  combatEnhancementBonuses: PROP_TODO
  noncombatEnhancementBonuses: {
    [key in NoncombatStatsProp]?: number
  }
}
// #endregion
