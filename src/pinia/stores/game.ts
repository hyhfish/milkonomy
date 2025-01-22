import type { GameData } from "~/game"
import type { MarketData } from "~/market"
import { defineStore } from "pinia"

export const useGameStore = defineStore("data", {
  state: () => ({
    gameData: null as GameData | null,
    marketData: null as MarketData | null,
    lastUpdated: 0
  }),
  actions: {
    async fetchData(forceRefresh = false) {
      const now = Date.now()
      const cacheDuration = 600 * 1000 // 缓存 10 分钟

      if (this.gameData && this.marketData && now - this.lastUpdated < cacheDuration && !forceRefresh) {
        return { gameData: this.gameData, marketData: this.marketData }
      }

      console.log("Fetching new data...")
      const response = await Promise.all([fetch("./data/data.json"), fetch("./data/market.json")])
      // if (!response.ok) throw new Error('Failed to fetch data')
      if (!response[0].ok || !response[1].ok) {
        throw new Error("Failed to fetch data")
      }
      this.gameData = await response[0].json()
      this.marketData = await response[1].json()
      this.lastUpdated = now

      return { gameData: this.gameData, marketData: this.marketData }
    }
  }
})
