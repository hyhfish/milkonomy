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
export function getPriceOf(hrid: string) {
  if (hrid === Calculator.COIN_HRID) {
    return { ask: 1, bid: 1 }
  }
  const item = getGameDataApi().itemDetailMap[hrid]
  const shopItem = getGameDataApi().shopItemDetailMap[`/shop_items/${item.hrid.split("/").pop()}`]
  const price = getMarketDataApi().market[item.name]
  if (shopItem && shopItem.costs[0].itemHrid === Calculator.COIN_HRID) {
    price.ask = shopItem.costs[0].count
  }
  return price
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
