import type { MarketItem } from "~/market"
import Calculator from "@/calculator"
import { useGameStore } from "@/pinia/stores/game"

/** 查 */
export function getGameDataApi() {
  const res = useGameStore().gameData
  return res!
}
export function getMarketDataApi() {
  const res = useGameStore().marketData
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
  if (SPECIAL_PRICE[hrid]) {
    return SPECIAL_PRICE[hrid]()
  }
  if (isLoot(hrid) && hrid !== "/items/bag_of_10_cowbells") {
    return getLootPrice(hrid)
  }
  const item = getGameDataApi().itemDetailMap[hrid]
  const shopItem = getGameDataApi().shopItemDetailMap[`/shop_items/${item.hrid.split("/").pop()}`]
  const price = getMarketDataApi().market[item.name]
  if (shopItem && shopItem.costs[0].itemHrid === Calculator.COIN_HRID) {
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

export function getItemDetailOf(hrid: string) {
  return getGameDataApi().itemDetailMap[hrid]
}

export function getActionDetailOf(key: string) {
  return getGameDataApi().actionDetailMap[key]
}

export function getTransmuteTimeCost() {
  return getGameDataApi().actionDetailMap["/actions/alchemy/transmute"].baseTimeCost
}
