import type Calculator from "./calculator.ts"
import axios from "axios"
import { CoinifyCalculator, DecomposeCalculator, TransmuteCalculator } from "./alchemy.ts"
import { dic } from "./trans.ts"
import { fetchData, getGameDataApi, getMarketDataApi, reverseMarket } from "./utils.ts"

fetchData().then(() => {
  getLeaderboardData()
})

function getLeaderboardData() {
  let profitList: TransmuteCalculator[] = []
  let profitListR: TransmuteCalculator[] = []
  profitList = calcProfit() as TransmuteCalculator[]

  // market的 ask 和 bid 反转
  reverseMarket()
  profitListR = calcProfit() as TransmuteCalculator[]

  profitList = profitList.filter(cal => !cal.isEquipment)
  profitListR = profitListR.filter(cal => !cal.isEquipment)
  // profitList = profitList.filter(cal => cal.result.profitRate >= params.profitRate! / 100)

  // 首先进行一次利润排序
  profitList.sort((a, b) => b.result.profitPH - a.result.profitPH)
  profitListR.sort((a, b) => b.result.profitPH - a.result.profitPH)
  // 取前100个
  profitList = profitList.slice(0, 100)
  profitListR = profitListR.slice(0, 100)

  axios.post("https://script.google.com/macros/s/AKfycbwr0ijGPDBuw0GWv375wvV72e0aHQswCLF_JYrWum3dyu7oMJLnX2iRNeQiNt0Bk_zhOw/exec", {
    time: new Date(getMarketDataApi()?.time * 1000).toLocaleString(),
    // 转成二维数组
    list1: profitList.map(cal => [
      dic[cal.item.name],
      cal.project,
      // 将 xxx_xxx_xxx 转成 Xxx Xxx Xxx，首字母大写
      cal.catalyst ? dic[cal.catalyst.replace(/_/g, " ").replace(/\b\w/g, word => word.toUpperCase())] : "",
      cal.result.profitPH * 24,
      cal.result.profitRate
    ]),
    list2: profitListR.map(cal => [
      dic[cal.item.name],
      cal.project,
      // 将 xxx_xxx_xxx 转成 Xxx Xxx Xxx，首字母大写
      cal.catalyst ? dic[cal.catalyst.replace(/_/g, " ").replace(/\b\w/g, word => word.toUpperCase())] : "",
      cal.result.profitPH * 24,
      cal.result.profitRate
    ])
  })
}

function calcProfit() {
  const gameData = getGameDataApi()
  // 所有物品列表
  const list = Object.values(gameData.itemDetailMap)
  const profitList: Calculator[] = []
  list.forEach((item) => {
    const cList = []
    cList.push(new TransmuteCalculator({
      hrid: item.hrid
    }))
    cList.push(new DecomposeCalculator({
      hrid: item.hrid
    }))
    cList.push(new CoinifyCalculator({
      hrid: item.hrid
    }))
    cList.push(new TransmuteCalculator({
      hrid: item.hrid,
      catalystRank: 1
    }))
    cList.push(new TransmuteCalculator({
      hrid: item.hrid,
      catalystRank: 2
    }))
    cList.push(new DecomposeCalculator({
      hrid: item.hrid,
      catalystRank: 1
    }))
    cList.push(new DecomposeCalculator({
      hrid: item.hrid,
      catalystRank: 2
    }))
    cList.push(new CoinifyCalculator({
      hrid: item.hrid,
      catalystRank: 1
    }))
    cList.push(new CoinifyCalculator({
      hrid: item.hrid,
      catalystRank: 2
    }))
    cList.forEach(c => handlePush(profitList, c))
  })
  return profitList
}

function handlePush(profitList: Calculator[], cal: Calculator) {
  if (!cal.available) return
  profitList.push(cal.run())
}
