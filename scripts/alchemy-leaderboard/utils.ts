import type { DropTableItem, GameData, ItemDetail } from "../../types/game.d.ts"
import type { MarketData, MarketItem } from "../../types/market.d.ts"
import type { Ingredient } from "./calculator.ts"
import type Calculator from "./calculator.ts"
import axios from "axios"
import { COIN_HRID } from "@/pinia/stores/game.ts"

const data = {
  gameData: null as GameData | null,
  marketData: null as MarketData | null
}
const DATA_URL = [
  "https://raw.githubusercontent.com/silent1b/MWIData/main/init_client_info.json",
  "https://raw.githubusercontent.com/holychikenz/MWIApi/main/milkyapi.json"
]
export async function fetchData() {
  const response = await Promise.all(DATA_URL.map(url => axios.get(url)))
  data.gameData = await response[0].data
  data.marketData = await response[1].data
}

export function reverseMarket() {
  const market = getMarketDataApi().market
  for (const key in market) {
    const temp = market[key].ask
    market[key].ask = market[key].bid
    market[key].bid = temp
  }
}

export function getGameDataApi() {
  return data.gameData!
}
export function getMarketDataApi() {
  return data.marketData!
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

export function getTeaIngredientList(cal: Calculator) {
  const list: Ingredient[] = []
  // 喝茶
  if (cal.gourmetTea) {
    list.push({
      hrid: "/items/gourmet_tea",
      count: 3600 / 300 / cal.consumePH,
      marketPrice: getPriceOf("/items/gourmet_tea").ask
    })
  }
  if (cal.efficiencyTea) {
    list.push({
      hrid: "/items/efficiency_tea",
      count: 3600 / 300 / cal.consumePH,
      marketPrice: getPriceOf("/items/efficiency_tea").ask
    })
  }

  if (cal.artisanTea) {
    list.push({
      hrid: "/items/artisan_tea",
      count: 3600 / 300 / cal.consumePH,
      marketPrice: getPriceOf("/items/artisan_tea").ask
    })
  }

  if (cal.catalyticTea) {
    list.push({
      hrid: "/items/catalytic_tea",
      count: 3600 / 300 / cal.consumePH,
      marketPrice: getPriceOf("/items/catalytic_tea").ask
    })
  }
  return list
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
  if (SPECIAL_PRICE[hrid]) {
    return SPECIAL_PRICE[hrid]()
  }
  if (isLoot(hrid) && hrid !== "/items/bag_of_10_cowbells") {
    return getLootPrice(hrid)
  }
  const item = getGameDataApi().itemDetailMap[hrid]
  const shopItem = getGameDataApi().shopItemDetailMap[`/shop_items/${item.hrid.split("/").pop()}`]
  const price = getMarketDataApi().market[item.name]
  if (shopItem && shopItem.costs[0].itemHrid === COIN_HRID) {
    price.ask = shopItem.costs[0].count
  }
  return price
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
