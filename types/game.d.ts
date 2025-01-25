interface PROP_TODO {
  [key: string]: any
}

// #region Game
export interface GameData {
  gameVersion: string
  versionTimestamp: string
  itemDetailMap: Record<string, ItemDetail>
  actionDetailMap: Record<string, ActionDetail>
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
  minEliteTier: number
}
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
