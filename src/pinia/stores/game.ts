import type Calculator from "@/calculator"
import type { Action, GameData, NoncombatStatsKey } from "~/game"
import type { MarketData } from "~/market"
import locales from "@/locales"

import { defineStore } from "pinia"

const { t } = locales.global

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
    gameData: getGameData(),
    marketData: getMarketData(),
    leaderboardCache: {} as { [time: number]: Calculator[] },
    enhanposerCache: {} as { [time: number]: Calculator[] }
  }),
  actions: {
    async tryFetchData() {
      let retryCount = 5
      while (retryCount--) {
        try {
          await this.fetchData()
          break
        } catch (e) {
          console.error(`获取数据第${5 - retryCount}次失败`, e)
          if (this.gameData && this.marketData) {
            ElMessage.error(t("数据获取失败，直接使用缓存数据"))
            break
          }
          ElMessage.error(t("获取数据第{0}次失败，正在重试...", [5 - retryCount]))
        }
      }
      if (retryCount < 0) {
        ElMessage.error(t("数据获取失败，请检查网络连接"))
        throw new Error("强制宕机")
      }
    },
    async fetchData() {
      // 如果数据time晚于30min前，无需更新，减少流量
      if (this.gameData && this.marketData && this.marketData.time * 1000 > Date.now() - 1000 * 60 * 30) {
        return
      }
      const DATA_URL = [
        // client info 时效性不高，不需要更新
        "https://gh-proxy.com/raw.githubusercontent.com/silent1b/MWIData/main/init_client_info.json",
        "https://gh-proxy.470103427.workers.dev/raw.githubusercontent.com/holychikenz/MWIApi/main/milkyapi.json"
      ]

      // const url = import.meta.env.MODE === "development" ? "https://luyh7.github.io/milkonomy/" : "./"
      // const response = await Promise.all([fetch(`${url}data/data.json`), fetch(`${url}data/market.json`)])
      const response = await Promise.all(DATA_URL.map(url => fetch(url)))
      if (!response[0].ok || !response[1].ok) {
        throw new Error("Response not ok")
      }
      const newGameData = await response[0].json()
      const newMarketData = await response[1].json()
      this.gameData = newGameData
      this.marketData = newMarketData
      if (this.marketData?.time !== newMarketData.time) {
        ElMessage.success(t("已于{0}更新最新数据", [new Date().toLocaleTimeString()]))
      }
      setGameData(newGameData)
      setMarketData(newMarketData)
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

const KEY_PREFIX = "game-"
function getGameData() {
  return JSON.parse(localStorage.getItem(`${KEY_PREFIX}game-data`) || "null") as GameData | null
}
function setGameData(value: GameData) {
  localStorage.setItem(`${KEY_PREFIX}game-data`, JSON.stringify(value))
}

function getMarketData() {
  return JSON.parse(localStorage.getItem(`${KEY_PREFIX}market-data`) || "null") as MarketData | null
}
function setMarketData(value: MarketData) {
  localStorage.setItem(`${KEY_PREFIX}market-data`, JSON.stringify(value))
}
