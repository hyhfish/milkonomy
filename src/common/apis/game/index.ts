import type { EnhancelateResult } from "@/calculator/enhance"
import type { DropTableItem, GameData, ItemDetail } from "~/game"
import type { MarketData, MarketItem } from "~/market"
import Calculator from "@/calculator"
import { useGameStore } from "@/pinia/stores/game"

// 把Proxy扒下来，提高性能
const game = {
  gameData: null as GameData | null,
  marketData: null as MarketData | null
}

let _priceCache = {} as Record<string, MarketItem>

watch(() => useGameStore().gameData, () => {
  game.gameData = Object.freeze(structuredClone(toRaw(useGameStore().gameData)))
  _priceCache = {}
}, { immediate: true })
watch(() => useGameStore().marketData, () => {
  console.log("raw marketData changed")
  game.marketData = Object.freeze(structuredClone(toRaw(useGameStore().marketData)))
  _priceCache = {}
}, { immediate: true })

/** 查 */
export function getGameDataApi() {
  const res = game.gameData
  return res!
}
export function getMarketDataApi() {
  const res = game.marketData
  return res!
}
const SPECIAL_PRICE: Record<string, () => MarketItem> = {
  "/items/cowbell": () => ({
    ask: getPriceOf("/items/bag_of_10_cowbells").ask / 10 || 40000,
    bid: getPriceOf("/items/bag_of_10_cowbells").bid / 10 || 40000
  }),
  "/items/coin": () => ({
    ask: 1,
    bid: 1
  })
}

export function getPriceOf(hrid: string): MarketItem {
  if (_priceCache[hrid]) {
    return _priceCache[hrid]
  }
  if (SPECIAL_PRICE[hrid]) {
    _priceCache[hrid] = SPECIAL_PRICE[hrid]()
    return _priceCache[hrid]
  }
  if (isLoot(hrid) && hrid !== "/items/bag_of_10_cowbells") {
    _priceCache[hrid] = getLootPrice(hrid)
    return _priceCache[hrid]
  }
  // todo此处有性能瓶颈，应该是因为itemDetailMap和market的数据量过大
  const item = getGameDataApi().itemDetailMap[hrid]
  const shopItem = getGameDataApi().shopItemDetailMap[`/shop_items/${item.hrid.split("/").pop()}`]
  const price = getMarketDataApi().market[item.name] || { ask: -1, bid: -1 }
  if (shopItem && shopItem.costs[0].itemHrid === Calculator.COIN_HRID) {
    price.ask = shopItem.costs[0].count
  }
  _priceCache[hrid] = price

  return _priceCache[hrid]
}

function isLoot(hrid: string) {
  return getItemDetailOf(hrid).categoryHrid === "/item_categories/loot"
}

function getLootPrice(hrid: string): MarketItem {
  const drop = getGameDataApi().openableLootDropMap[hrid]
  return drop.reduce((acc, cur) => {
    const count = (cur.maxCount + cur.minCount) / 2
    const item = getPriceOf(cur.itemHrid)
    acc.ask += item.ask * count * cur.dropRate
    acc.bid += item.bid * count * cur.dropRate
    return acc
  }, { ask: 0, bid: 0 })
}

export function getItemDetailOf(hrid: string) {
  return getGameDataApi().itemDetailMap[hrid]
}

export function getActionDetailOf(key: string) {
  return getGameDataApi().actionDetailMap[key]
}

export function getTransmuteTimeCost() {
  return getGameDataApi().actionDetailMap["/actions/alchemy/transmute"].baseTimeCost
}

export function getDecomposeTimeCost() {
  return getGameDataApi().actionDetailMap["/actions/alchemy/decompose"].baseTimeCost
}

export function getCoinifyTimeCost() {
  return getGameDataApi().actionDetailMap["/actions/alchemy/coinify"].baseTimeCost
}

export function getEnhanceTimeCost() {
  return getGameDataApi().actionDetailMap["/actions/enhancing/enhance"].baseTimeCost
}

export function enhancementLevelSuccessRateTable() {
  return getGameDataApi().enhancementLevelSuccessRateTable
}

// #region enhancelate
let enhancelateCache = {} as Record<string, EnhancelateResult>
export function getEnhancelateCache(enhanceLevel: number, protectLevel: number, itemLevel: number) {
  return enhancelateCache[`${enhanceLevel}-${protectLevel}-${itemLevel}`]
}
export function setEnhancelateCache(enhanceLevel: number, protectLevel: number, itemLevel: number, result: EnhancelateResult) {
  enhancelateCache[`${enhanceLevel}-${protectLevel}-${itemLevel}`] = result
}
export function clearEnhancelateCache() {
  enhancelateCache = {}
}
// #region 游戏内代码
const TIMEVALUES = {
  SECOND: 1e9,
  MINUTE: 6e10,
  HOUR: 36e11,
  NANOSECONDS_IN_MILLISECOND: 1e6,
  NANOSECONDS_IN_SECOND: 1e9,
  SECONDS_IN_YEAR: 31536e3,
  SECONDS_IN_DAY: 86400,
  SECONDS_IN_HOUR: 3600,
  SECONDS_IN_MINUTE: 60
}

export function getAlchemyRareDropTable(item: ItemDetail, baseTimeCost: number): DropTableItem[] {
  let dropHrid = "/items/small_artisans_crate"
  const i = 1 * baseTimeCost / (8 * TIMEVALUES.HOUR)
  let s = 0
  if (item.itemLevel < 35) {
    dropHrid = "/items/small_artisans_crate"
    s = (item.itemLevel + 100) / 100
  } else if (item.itemLevel < 70) {
    dropHrid = "/items/medium_artisans_crate"
    s = (item.itemLevel - 35 + 100) / 150
  } else {
    dropHrid = "/items/large_artisans_crate"
    s = (item.itemLevel - 70 + 100) / 200
  }
  return [{
    itemHrid: dropHrid,
    dropRate: i * s,
    minCount: 1,
    maxCount: 1
  }]
}

export function getAlchemyEssenceDropTable(item: ItemDetail, timeCost: number): DropTableItem[] {
  return [{
    itemHrid: "/items/alchemy_essence",
    dropRate: 1 * timeCost / (6 * TIMEVALUES.MINUTE) * ((item.itemLevel + 100) / 100),
    minCount: 1,
    maxCount: 1
  }]
}

// 分解强化物品
export function getAlchemyDecomposeEnhancingEssenceOutput(item: ItemDetail, enhancementLevel: number) {
  return enhancementLevel === 0
    ? 0
    : (item.itemLevel = item.itemLevel || 0,
      Math.round(2 * (0.5 + 0.1 * 1.05 ** item.itemLevel) * 2 ** enhancementLevel))
}

export function getAlchemyDecomposeCoinCost(item: ItemDetail) {
  const itemLevel = item.itemLevel || 0
  return Math.floor(5 * (10 + itemLevel))
}

export function getEnhancingEssenceDropTable(item: ItemDetail, timeCost: number) {
  const a = 1 * timeCost / (2 * TIMEVALUES.MINUTE) * ((item.itemLevel + 100) / 100)
  return [{
    itemHrid: "/items/enhancing_essence",
    dropRate: a,
    minCount: 1,
    maxCount: 1
  }]
}

export function getEnhancingRareDropTable(item: ItemDetail, timeCost: number) {
  let dropHird = "/items/small_artisans_crate"
  const i = 1 * timeCost / (4 * TIMEVALUES.HOUR)
  let s = 0
  if (item.itemLevel < 35) {
    dropHird = "/items/small_artisans_crate"
    s = (item.itemLevel + 100) / 100
  } else if (item.itemLevel < 70) {
    dropHird = "/items/medium_artisans_crate"
    s = (item.itemLevel - 35 + 100) / 150
  } else {
    dropHird = "/items/large_artisans_crate"
    s = (item.itemLevel - 70 + 100) / 200
  }
  return [{
    itemHrid: dropHird,
    dropRate: i * s,
    minCount: 1,
    maxCount: 1
  }]
}

// #endregion
