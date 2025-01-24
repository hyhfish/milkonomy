import type * as Leaderboard from "./type"
import * as Format from "@@/utils/format"

import { getGameDataApi, getPriceOf, getTransmuteTimeCost } from "../game"
/** 查 */
export async function getLeaderboardDataApi(params: Leaderboard.RequestData) {
  let profitList = calcTransmuteProfit()
  profitList.sort((a, b) => b.profitPD - a.profitPD)

  // params.name 忽略大小写
  params.name && (profitList = profitList.filter(item => item.name.toLowerCase().includes(params.name!.toLowerCase())))

  // 分页
  return { list: profitList.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: profitList.length }
}

function calcTransmuteProfit() {
  const gameData = getGameDataApi()

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
      const price = getPriceOf(drop.itemHrid)
      income += drop.dropRate * drop.maxCount * price.bid
    }

    // todo 计算效率
    const playerLevel = 100
    const level = item.itemLevel
    const equipmentEfficiency = 0.129
    const houseEfficiency = 0.06
    const efficiency = 1 + Math.max(0, (playerLevel - level) * 0.01) + equipmentEfficiency + houseEfficiency
    const equipmentSpeed = 1.161
    const speed = 1 + equipmentSpeed
    // todo 催化茶、催化剂
    const catalystTeaRate = 1
    const timeCost = (getTransmuteTimeCost()) / speed
    const actionsPH = ((60 * 60 * 1000000000) / timeCost) * efficiency

    const consumePH = actionsPH * item.alchemyDetail.bulkMultiplier
    const gainPH = actionsPH

    // 单次收益
    income = income * item.alchemyDetail.transmuteSuccessRate * catalystTeaRate

    let cost = (getPriceOf(item.hrid)).ask
    if (cost === -1) {
      // 跳过没有价格的物品
      continue
    }
    // 计算每小时成本
    const coinCost = 50
    cost += coinCost
    const costPH = cost * consumePH
    const coinCostPH = coinCost * consumePH
    const incomePH = income * gainPH
    const profitPH = incomePH - costPH

    // 一天收益
    const profitPD = profitPH * 24
    profitList.push({
      hrid: item.hrid,
      name: item.name,
      project: "重组",
      profitPD,
      profitPH,
      gainPH,
      profitPHFormat: Format.number(profitPH),
      profitPDFormat: Format.number(profitPD),
      profitRateFormat: Format.percent(profitPH / costPH),
      costPHFormat: Format.number(costPH),
      incomePHFormat: Format.number(incomePH),
      efficiencyFormat: Format.percent(efficiency - 1),
      timeCostFormat: Format.costTime(timeCost),
      coinCostPHFormat: Format.number(coinCostPH),
      consumePHFormat: Format.number(consumePH)
    })
  }

  return profitList
}
