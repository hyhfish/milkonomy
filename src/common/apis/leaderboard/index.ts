import type * as Leaderboard from "./type"
import { getGameDataApi, getPriceOf, getTransmuteTimeCost } from "../game"

function formatNumber(value: number) {
  value = Math.floor(value)
  return value && value.toLocaleString("en-US")
}
/** 查 */
export async function getLeaderboardDataApi(params: Leaderboard.RequestData) {
  const profitList = await calcTransmuteProfit()
  profitList.sort((a, b) => b.profitPD - a.profitPD)
  profitList.forEach((item) => {
    item.profitPH = formatNumber(item.profitPH)
    item.profitPD = formatNumber(item.profitPD)
    item.costPH = formatNumber(item.costPH)
  })
  // 分页
  return { list: profitList.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: profitList.length }
}

async function calcTransmuteProfit() {
  const gameData = await getGameDataApi()

  // 所有可重组的物品
  const transmuteList = Object.values(gameData.itemDetailMap).filter(item => item.alchemyDetail && item.alchemyDetail.transmuteDropTable)

  const profitList = []

  for (let i = 0; i < transmuteList.length; i++) {
    const item = transmuteList[i]
    // 掉落表
    const dropTable = item.alchemyDetail.transmuteDropTable

    let income = 0

    // 单次收益
    for (let j = 0; j < dropTable.length; j++) {
      const drop = dropTable[j]
      const price = await getPriceOf(drop.itemHrid)
      income += drop.dropRate * drop.maxCount * price.bid
    }

    // todo 计算效率
    const level = item.itemLevel
    const efficiency = 1
    const speed = 1
    // todo 催化茶、催化剂
    const catalystTeaRate = 1
    const timeCost = (await getTransmuteTimeCost()) / speed
    const actionsPH = ((60 * 60 * 1000000000) / timeCost) * efficiency

    // 单次收益
    income = income * item.alchemyDetail.transmuteSuccessRate * catalystTeaRate

    // 计算每小时成本
    const cost = (await getPriceOf(item.hrid)).ask
    if (cost === -1) {
      // 跳过没有价格的物品
      continue
    }
    const costPH = cost * actionsPH * item.alchemyDetail.bulkMultiplier
    const incomePH = income * actionsPH
    const profitPH = incomePH - costPH

    const profitRate = `${Math.floor((profitPH / costPH) * 10000) / 100}%`

    // 一天收益
    const profitPD = profitPH * 24
    profitList.push({ hrid: item.hrid, name: item.name, profitPH, profitPD, profitRate, costPH, project: "重组" })
  }

  return profitList
}
