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
  const item = getGameDataApi().itemDetailMap[hrid]
  return getMarketDataApi().market[item.name]
}

export function getItemDetailOf(hrid: string) {
  return getGameDataApi().itemDetailMap[hrid]
}

export function getTransmuteTimeCost() {
  return getGameDataApi().actionDetailMap["/actions/alchemy/transmute"].baseTimeCost
}
