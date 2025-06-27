import type { Action, Equipment } from "~/game"
import { clearEnhancelateCache } from "@/common/apis/game"
import { defineStore } from "pinia"
import { useGameStore } from "./game"

export const usePlayerStore = defineStore("player", {
  state: () => ({
    config: load(),
    actionConfigActivated: getActivated()
  }),
  actions: {
    commit() {
      save(this.config)
      useGameStore().clearLeaderBoardCache()
      useGameStore().clearManualchemyCache()
      useGameStore().clearInheritCache()
      useGameStore().clearDecomposeCache()
      clearEnhancelateCache()
    },
    setActionConfig(list: ActionConfigItem[], sepecial: PlayerEquipmentItem[]) {
      // this.config = {
      //   actionConfigMap: new Map(list.map(item => [item.action, toRaw(item)])),
      //   specialEquimentMap: new Map(sepecial.map(item => [item.type, toRaw(item)]))
      // }

      for (const item of list) {
        this.config.actionConfigMap.set(item.action, toRaw(item))
      }

      for (const item of sepecial) {
        this.config.specialEquimentMap.set(item.type, toRaw(item))
      }

      // 触发更新
      this.config = {
        actionConfigMap: new Map(Array.from(this.config.actionConfigMap.entries()).map(([key, value]) => [key, toRaw(value)])),
        specialEquimentMap: new Map(Array.from(this.config.specialEquimentMap.entries()).map(([key, value]) => [key, toRaw(value)]))
      }
    },
    setActivated(value: boolean) {
      this.actionConfigActivated = value
      setActivated(String(value))
    }
  }
})
const KEY = "player-action-config"
export interface ActionConfigItem {
  action: Action
  playerLevel: number
  tool: PlayerEquipmentItem
  body: PlayerEquipmentItem
  legs: PlayerEquipmentItem
  houseLevel: number
  tea: string[]
}
export interface PlayerEquipmentItem {
  type: Equipment
  hrid?: string
  enhanceLevel?: number
}
export interface ActionConfig {
  actionConfigMap: Map<Action, ActionConfigItem>
  specialEquimentMap: Map<Equipment, PlayerEquipmentItem>
}

function load(): ActionConfig {
  const config = {
    actionConfigMap: new Map<Action, ActionConfigItem>(),
    specialEquimentMap: new Map<Equipment, PlayerEquipmentItem>()
  }
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "{}")
    config.actionConfigMap = new Map<Action, ActionConfigItem>(Object.entries(data.actionConfigMap || {}) as [Action, ActionConfigItem][])
    config.specialEquimentMap = new Map<Equipment, PlayerEquipmentItem>(Object.entries(data.specialEquimentMap || {}) as [Equipment, PlayerEquipmentItem][])
  } catch {
  }
  return config
}
function save(config: ActionConfig) {
  // localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(map.entries())))
  const object: Record<string, any> = {}
  for (const [key, value] of Object.entries(config)) {
    if (value instanceof Map) {
      object[key] = Object.fromEntries(value.entries())
    } else {
      object[key] = value
    }
  }
  localStorage.setItem(KEY, JSON.stringify(object))
}

const ACTIVATED_KEY = "player-action-activated"
function getActivated() {
  return localStorage.getItem(ACTIVATED_KEY) === "true"
}
function setActivated(value: string) {
  localStorage.setItem(ACTIVATED_KEY, value)
}
