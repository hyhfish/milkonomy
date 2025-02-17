import type Calculator from "@/calculator"
import type { GameData } from "~/game"
import type { MarketData } from "~/market"
import { defineStore } from "pinia"

export const ACTION_LIST = [
  "cheesesmithing",
  "crafting",
  "tailoring",
  "brewing",
  "cooking",
  "alchemy",
  "enhancing"
] as const

export const EQUIPMENT_LIST = [
  "head",
  "neck",
  "earrings",
  "body",
  "legs",
  "feet",
  "hands",

  "ring",
  "neck",
  "ring",
  "back",
  "off_hand"
  // 'pouch'
] as const

export const useGameStore = defineStore("game", {
  state: () => ({
    gameData: null as GameData | null,
    marketData: null as MarketData | null,
    leaderboardCache: {} as { [time: number]: Calculator[] }
  }),
  actions: {
    async fetchData() {
      const url = import.meta.env.MODE === "development" ? "https://luyh7.github.io/milkonomy/" : "./"
      const response = await Promise.all([fetch(`${url}data/data.json`), fetch(`${url}data/market.json`)])
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
    }
  }
})
