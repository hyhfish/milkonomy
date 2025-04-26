import { getItemDetailOf } from "@/common/apis/game"
import { defineStore } from "pinia"

export const useEnhancerStore = defineStore("enhancer", {
  state: () => ({
    config: loadConfig(),
    favorite: loadFavorite()
  }),
  actions: {
    saveConfig() {
      saveConfig(this.config)
    },
    addFavorite(hrid: string) {
      if (!hrid) return
      const index = this.favorite.indexOf(hrid)
      if (index === -1) {
        this.favorite.push(hrid)
      }
      this.favorite.sort((a, b) => getItemDetailOf(a).sortIndex - getItemDetailOf(b).sortIndex)
      saveFavorite(this.favorite)
    },
    removeFavorite(hrid: string) {
      if (!hrid) return
      const index = this.favorite.indexOf(hrid)
      if (index !== -1) {
        this.favorite.splice(index, 1)
      }
      saveFavorite(this.favorite)
    },
    hasFavorite(hrid: string) {
      if (!hrid) return false
      const index = this.favorite.indexOf(hrid)
      return index !== -1
    }
  },
  getters: {
    enhanceLevel: state => state.config.enhanceLevel,
    hourlyRate: state => state.config.hourlyRate,
    taxRate: state => state.config.taxRate,
    hrid: state => state.config.hrid
  }
})

export interface EnhancerConfig {
  enhanceLevel?: number
  hourlyRate?: number
  taxRate?: number
  hrid?: string
}
const KEY_PREFIX = "enhancer-"
function loadConfig(): EnhancerConfig {
  try {
    return JSON.parse(localStorage.getItem(`${KEY_PREFIX}config`) || "{}")
  } catch {
    return {}
  }
}

function saveConfig(item: EnhancerConfig) {
  localStorage.setItem(`${KEY_PREFIX}config`, JSON.stringify(item))
}

function loadFavorite(): string[] {
  try {
    return JSON.parse(localStorage.getItem(`${KEY_PREFIX}favorite`) || "[]")
  } catch {
    return []
  }
}
function saveFavorite(item: string[]) {
  localStorage.setItem(`${KEY_PREFIX}favorite`, JSON.stringify(item))
}
