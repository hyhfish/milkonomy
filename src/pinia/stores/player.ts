import type { Action, Equipment } from "~/game"
import { defineStore } from "pinia"
import { useGameStore } from "./game"

export const usePlayerStore = defineStore("player", {
  state: () => ({
    actionConfigMap: load(),
    actionConfigActivated: getActivated(),
    specialEquimentMap: loadSpecial()
  }),
  actions: {
    commit() {
      save(this.actionConfigMap)
      saveSpecial(this.specialEquimentMap)
      useGameStore().clearLeaderBoardCache()
    },
    setActionConfig(list: ActionConfigItem[]) {
      this.actionConfigMap = new Map(list.map(item => [item.action, toRaw(item)]))
    },
    setSpecialEquipment(list: PlayerEquipmentItem[]) {
      this.specialEquimentMap = new Map(list.map(item => [item.type, toRaw(item)]))
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
  actionLevel: number
  tool: PlayerEquipmentItem
  body: PlayerEquipmentItem
  legs: PlayerEquipmentItem
  houseLevel: number
}
export interface PlayerEquipmentItem {
  type: Equipment
  hrid?: string
  enhanceLevel?: number
}
function load(): Map<Action, ActionConfigItem> {
  let map = new Map<Action, ActionConfigItem>()
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "{}")
    map = new Map<Action, ActionConfigItem>(Object.entries(data) as [Action, ActionConfigItem][])
  } catch {
  }
  return map
}
function save(map: Map<Action, ActionConfigItem>) {
  localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(map.entries())))
}

const SPECIAL_KEY = "player-special-equipment"
function loadSpecial(): Map<Equipment, PlayerEquipmentItem> {
  let map = new Map<Equipment, PlayerEquipmentItem>()
  try {
    const data = JSON.parse(localStorage.getItem(SPECIAL_KEY) || "{}")
    map = new Map<Equipment, PlayerEquipmentItem>(Object.entries(data) as [Equipment, PlayerEquipmentItem][])
  } catch {
  }
  return map
}
function saveSpecial(map: Map<Equipment, PlayerEquipmentItem>) {
  localStorage.setItem(SPECIAL_KEY, JSON.stringify(Object.fromEntries(map.entries())))
}

const ACTIVATED_KEY = "player-action-activated"
function getActivated() {
  return localStorage.getItem(ACTIVATED_KEY) === "true"
}
function setActivated(value: string) {
  localStorage.setItem(ACTIVATED_KEY, value)
}
