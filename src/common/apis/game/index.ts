import { useGameStore } from "@/pinia/stores/game"

async function loadData() {
  return await useGameStore().fetchData()
}
/** 查 */
export async function getGameDataApi() {
  const res = await loadData()
  return res.gameData!
}
export async function getMarketDataApi() {
  const res = await loadData()
  return res.marketData!
}
export async function getPriceOf(hrid: string) {
  const item = (await getGameDataApi()).itemDetailMap[hrid]
  return (await getMarketDataApi()).market[item.name]
}

export async function getItemDetailOf(hrid: string) {
  return (await getGameDataApi()).itemDetailMap[hrid]
}

export async function getTransmuteTimeCost() {
  return (await getGameDataApi()).actionDetailMap["/actions/alchemy/transmute"].baseTimeCost
}
