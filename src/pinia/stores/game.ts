import type Calculator from "@/calculator"
import type { DecomposeCalculator } from "@/calculator/alchemy"
import type { EnhanceCalculator } from "@/calculator/enhance"
import type { ManufactureCalculator } from "@/calculator/manufacture"

import type { WorkflowCalculator } from "@/calculator/workflow"
import type { Action, GameData, NoncombatStatsKey } from "~/game"
import type { Market, MarketData, MarketDataPlain, MarketItemPrice } from "~/market"
import { defineStore } from "pinia"
import locales, { getTrans } from "@/locales"
import { pinia } from "@/pinia"

const { t } = locales.global

export const COIN_HRID = "/items/coin"

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

export enum PriceStatus {
  // 左价
  ASK = "ASK",
  // 右价
  BID = "BID",
  // 比左价低一档
  ASK_LOW = "ASK_LOW",
  // 比右价高一档
  BID_HIGH = "BID_HIGH"
}

export const PRICE_STATUS_LIST = [
  { value: PriceStatus.ASK, label: getTrans("左价") },
  { value: PriceStatus.ASK_LOW, label: getTrans("左价-") },
  { value: PriceStatus.BID, label: getTrans("右价") },
  { value: PriceStatus.BID_HIGH, label: getTrans("右价+") }
]

export const useGameStore = defineStore("game", {
  state: () => ({
    gameData: getGameData(),
    marketData: getMarketData(),
    leaderboardCache: {} as { [time: number]: Calculator[] },
    enhanposerCache: {} as { [time: number]: WorkflowCalculator[] },
    manualchemyCache: {} as { [time: number]: Calculator[] },
    jungleCache: {} as { [time: number]: WorkflowCalculator[] },
    junglestCache: {} as { [time: number]: EnhanceCalculator[] },
    inheritCache: {} as { [time: number]: ManufactureCalculator[] },
    decomposeCache: {} as { [time: number]: DecomposeCalculator[] },
    secret: loadSecret(),
    buyStatus: loadBuyStatus(),
    sellStatus: loadSellStatus()
  }),
  actions: {
    async tryFetchData() {
      let retryCount = 5
      while (retryCount--) {
        try {
          await this.fetchData(retryCount)
          break
        } catch (e) {
          console.error(`获取数据第${5 - retryCount}次失败`, e)
          ElMessage.error(t("获取数据第{0}次失败，正在重试...", [5 - retryCount]))
        }
      }
      if (this.gameData && this.marketData && retryCount === 0) {
        ElMessage.error(t("数据获取失败，直接使用缓存数据"))
        return
      }
      if (retryCount < 0) {
        ElMessage.error(t("数据获取失败，请检查网络连接"))
        throw new Error("强制宕机")
      }
    },
    async fetchData(offset: number) {
      // 如果数据time晚于30min前，无需更新，减少流量
      // if (this.gameData && this.marketData && this.marketData.timestamp * 1000 > Date.now() - 1000 * 60 * 30) {
      //   return
      // }
      const url = import.meta.env.MODE === "development" ? "/" : "./"
      const MARKET_URLS = [
        // "https://mooket.qi-e.top/market/api.json",
        "https://www.milkywayidle.com/game_data/marketplace.json"
      ]
      // const LAST_MARKET_URL = `${url}data/market.json`
      const DATA_URL = `${url}data/data.json`
      const marketUrl = MARKET_URLS[(4 - offset) % MARKET_URLS.length]

      const response = await Promise.all([fetch(DATA_URL), fetch(marketUrl)])
      if (!response[0].ok || !response[1].ok) {
        throw new Error("Response not ok")
      }
      const newGameData = await response[0].json()
      const newMarketData = await response[1].json()
      // 如果有缓存数据，则不更新gameData，防止国际化数据被覆
      if (!this.gameData) {
        this.gameData = newGameData
      }
      setGameData(newGameData)

      // 如果缓存数据的时间戳与新数据相同，则不更新
      if (this.marketData?.timestamp && this.marketData?.timestamp === newMarketData.timestamp) {
        return
      }

      this.marketData = updateMarketData(this.marketData, newMarketData, newGameData)
    },

    savePriceStatus() {
      // saveBuyStatus(this.buyStatus)
      // saveSellStatus(this.sellStatus)
      this.clearAllCaches()
    },
    resetPriceStatus() {
      this.buyStatus = loadBuyStatus()
      this.sellStatus = loadSellStatus()
    },
    getLeaderboardCache() {
      return this.leaderboardCache[this.marketData!.timestamp]
    },
    setLeaderBoardCache(list: Calculator[]) {
      this.clearLeaderBoardCache()
      this.leaderboardCache[this.marketData!.timestamp] = list
    },
    clearLeaderBoardCache() {
      this.leaderboardCache = {}
    },
    getEnhanposerCache() {
      return this.enhanposerCache[this.marketData!.timestamp]
    },
    setEnhanposerCache(list: WorkflowCalculator[]) {
      this.clearEnhanposerCache()
      this.enhanposerCache[this.marketData!.timestamp] = list
    },
    clearEnhanposerCache() {
      this.enhanposerCache = {}
    },
    getManualchemyCache() {
      return this.manualchemyCache[this.marketData!.timestamp]
    },
    setManualchemyCache(list: Calculator[]) {
      this.clearManualchemyCache()
      this.manualchemyCache[this.marketData!.timestamp] = list
    },
    clearManualchemyCache() {
      this.manualchemyCache = {}
    },
    getJungleCache() {
      return this.jungleCache[this.marketData!.timestamp]
    },
    setJungleCache(list: WorkflowCalculator[]) {
      this.clearJungleCache()
      this.jungleCache[this.marketData!.timestamp] = list
    },
    clearJungleCache() {
      this.jungleCache = {}
    },
    getJunglestCache() {
      return this.junglestCache[this.marketData!.timestamp]
    },
    setJunglestCache(list: EnhanceCalculator[]) {
      this.clearJunglestCache()
      this.junglestCache[this.marketData!.timestamp] = list
    },
    clearJunglestCache() {
      this.junglestCache = {}
    },
    getInheritCache() {
      return this.inheritCache[this.marketData!.timestamp]
    },
    setInheritCache(list: ManufactureCalculator[]) {
      this.clearInheritCache()
      this.inheritCache[this.marketData!.timestamp] = list
    },
    clearInheritCache() {
      this.inheritCache = {}
    },
    getDecomposeCache() {
      return this.decomposeCache[this.marketData!.timestamp]
    },
    setDecomposeCache(list: DecomposeCalculator[]) {
      this.clearDecomposeCache()
      this.decomposeCache[this.marketData!.timestamp] = list
    },
    clearDecomposeCache() {
      this.decomposeCache = {}
    },
    setSecret(value: string) {
      this.secret = value
      saveSecret(value)
    },
    checkSecret() {
      return btoa(this.secret) === "MTE0NTE0QA=="
    },

    clearAllCaches() {
      this.clearLeaderBoardCache()
      this.clearManualchemyCache()
      this.clearInheritCache()
      this.clearDecomposeCache()
      this.clearEnhanposerCache()
      this.clearJungleCache()
      this.clearJunglestCache()
    }
  }
})

function updateMarketData(oldData: MarketData | null, newData: MarketDataPlain, newGameData: GameData): MarketData {
  const oldMarket = oldData?.marketData || {}
  const newMarket: Market = { }

  // 将 MarketDataPlain 转成 MarketData 的结构
  for (const hrid in newData.marketData) {
    if (newData.marketData[hrid]) {
      newMarket[hrid] = {}
    }
    for (const level in newData.marketData[hrid]) {
      newMarket[hrid][level] = {
        ask: newData.marketData[hrid][level].a,
        bid: newData.marketData[hrid][level].b
      }
    }
  }

  // 取得name->isEquipment的映射
  const itemDetailMap = newGameData.itemDetailMap
  const isEquipmentMap: Record<string, boolean> = {}
  for (const key in itemDetailMap) {
    const item = itemDetailMap[key]
    isEquipmentMap[item.hrid] = item.categoryHrid === "/item_categories/equipment"
  }
  for (const hrid in newMarket) {
    // 如果是装备，则不保留旧值
    if (isEquipmentMap[hrid] || oldMarket[hrid]) {
      continue
    }
    for (const level in newMarket[hrid]) {
      const price = newMarket[hrid][level]
      if (price.ask === -1) {
        price.ask = (oldMarket[hrid]?.[level] as MarketItemPrice)?.ask || -1
      }
      if (price.bid === -1) {
        price.bid = (oldMarket[hrid]?.[level] as MarketItemPrice)?.bid || -1
      }
    }
  }

  // 有些物品可能是oldMarket有的，newMarket没有的
  // for (const key in oldMarket) {
  //   if (!newMarket[key] && !isEquipmentMap[key]) {
  //     newMarket[key] = JSON.parse(JSON.stringify(oldMarket[key]))
  //   }
  // }

  // if (oldData?.timestamp !== newData.timestamp) {
  //   ElMessage.success(t("已于{0}更新最新数据", [new Date().toLocaleTimeString()]))
  // }
  const result = {
    timestamp: newData.timestamp,
    marketData: newMarket
  }
  setMarketData(result)

  return result
}

const KEY_PREFIX = "game-"

function getMarketData() {
  return JSON.parse(localStorage.getItem(`${KEY_PREFIX}market-data`) || "null") as MarketData | null
}
function setMarketData(value: MarketData) {
  localStorage.setItem(`${KEY_PREFIX}market-data`, JSON.stringify(value))
}

function getGameData() {
  return JSON.parse(localStorage.getItem(`${KEY_PREFIX}game-data`) || "null") as GameData | null
}
function setGameData(value: GameData) {
  localStorage.setItem(`${KEY_PREFIX}game-data`, JSON.stringify(value))
}

function loadSecret() {
  return localStorage.getItem(`${KEY_PREFIX}secrete`) || ""
}

function saveSecret(value: string) {
  localStorage.setItem(`${KEY_PREFIX}secrete`, value)
}

function loadBuyStatus() {
  return PriceStatus.ASK
}
function loadSellStatus() {
  return PriceStatus.BID
}

export function useGameStoreOutside() {
  return useGameStore(pinia)
}
