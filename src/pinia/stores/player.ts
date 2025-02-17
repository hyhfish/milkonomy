import type { Action } from "~/game"
import { defineStore } from "pinia"
import { useGameStore } from "./game"

export const usePlayerStore = defineStore("player", {
  state: () => ({
    actionConfigMap: load(),
    actionConfigActivated: getActivated()
  }),
  actions: {
    commit() {
      save(this.actionConfigMap)
      useGameStore().clearLeaderBoardCache()
    },
    setActionConfig(list: ActionConfigItem[]) {
      this.actionConfigMap = new Map(list.map(item => [item.action, item]))
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
  toolHrid?: string
  toolEnhanceLevel: number
  equipmentHrid?: string
  equipmentEnhanceLevel: number
  houseLevel: number
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

function save(map: Map<string, ActionConfigItem>) {
  localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(map.entries())))
}

const ACTIVATED_KEY = "player-action-activated"
function getActivated() {
  return localStorage.getItem(ACTIVATED_KEY) === "true"
}
function setActivated(value: string) {
  localStorage.setItem(ACTIVATED_KEY, value)
}
