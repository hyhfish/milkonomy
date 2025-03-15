import type Calculator from "@/calculator"
import type { Action, GameData, NoncombatStatsKey } from "~/game"
import type { MarketData } from "~/market"
import { defineStore } from "pinia"

export const ACTION_LIST = [
  "milking",
  "foraging",
  "woodcutting",
  "cheesesmithing",
  "crafting",
  "tailoring",
  "cooking",
  "brewing",
  "alchemy",
  "enhancing"
] as const

export const EQUIPMENT_LIST = [
  "head",
  "body",
  "legs",
  "feet",
  "hands",

  "ring",
  "neck",
  "earrings",
  "back",
  "off_hand",
  "pouch"
  // 'main_hand'
] as const

const DEFAULT_HOUSE = {
  Efficiency: 0.015,
  Experience: 0.0005,
  RareFind: 0.002
}
export const HOUSE_MAP: Record<Action, Partial<Record<NoncombatStatsKey, number>>> = {
  milking: { ...DEFAULT_HOUSE },
  foraging: { ...DEFAULT_HOUSE },
  woodcutting: { ...DEFAULT_HOUSE },
  cheesesmithing: { ...DEFAULT_HOUSE },
  crafting: { ...DEFAULT_HOUSE },
  tailoring: { ...DEFAULT_HOUSE },
  brewing: { ...DEFAULT_HOUSE },
  cooking: { ...DEFAULT_HOUSE },
  alchemy: { ...DEFAULT_HOUSE },
  enhancing: {
    Speed: 0.01,
    Success: 0.0005,
    Experience: 0.0005,
    RareFind: 0.002
  }
}

export const useGameStore = defineStore("game", {
  state: () => ({
    gameData: null as GameData | null,
    marketData: null as MarketData | null,
    leaderboardCache: {} as { [time: number]: Calculator[] },
    enhanposerCache: {} as { [time: number]: Calculator[] }
  }),
  actions: {
    async fetchData() {
      // 如果数据time晚于一个半小时前，无需更新
      if (this.gameData && this.marketData && this.marketData.time * 1000 > Date.now() - 1000 * 60 * 90) {
        // 无需更新
        return
      }
      const DATA_URL = [
        "https://gh-proxy.com/raw.githubusercontent.com/silent1b/MWIData/main/init_client_info.json",
        "https://gh-proxy.com/raw.githubusercontent.com/holychikenz/MWIApi/main/milkyapi.json"
      ]
      // const url = import.meta.env.MODE === "development" ? "https://luyh7.github.io/milkonomy/" : "./"
      // const response = await Promise.all([fetch(`${url}data/data.json`), fetch(`${url}data/market.json`)])
      const response = await Promise.all(DATA_URL.map(url => fetch(url)))
      if (!response[0].ok || !response[1].ok) {
        throw new Error("Failed to fetch data")
      }
      const newGameData = await response[0].json()
      const newMarketData = await response[1].json()
      if (!this.gameData || !this.marketData || this.marketData.time !== newMarketData.time) {
        this.gameData = newGameData
        this.marketData = newMarketData
        ElMessage.success(`已于 ${new Date().toLocaleTimeString()} 更新最新数据`)
      }
    },
    getLeaderboardCache() {
      return this.leaderboardCache[this.marketData!.time]
    },
    setLeaderBoardCache(list: Calculator[]) {
      this.clearLeaderBoardCache()
      this.leaderboardCache[this.marketData!.time] = list
    },
    clearLeaderBoardCache() {
      this.leaderboardCache = {}
    },
    getEnhanposerCache() {
      return this.enhanposerCache[this.marketData!.time]
    },
    setEnhanposerCache(list: Calculator[]) {
      this.clearEnhanposerCache()
      this.enhanposerCache[this.marketData!.time] = list
    },
    clearEnhanposerCache() {
      this.enhanposerCache = {}
    }
  }
})
