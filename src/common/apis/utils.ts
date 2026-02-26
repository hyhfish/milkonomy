import type Calculator from "@/calculator"
import { getEquipmentTypeOf } from "../utils/game"

export function handleSort(profitList: Calculator[], params: any) {
  // 首先进行一次利润排序
  profitList.sort((a, b) => b.result.profitPH - a.result.profitPH)

  // 排序
  if (params.sort && params.sort.order) {
    const props = params.sort.prop.split(".")
    function getValue(c: any) {
      let value = c
      for (let i = 0; i < props.length; ++i) {
        value = value[props[i]]
      }
      return value
    }
    const order = params.sort.order
    profitList.sort((a, b) => {
      return order === "descending" ? getValue(b) - getValue(a) : getValue(a) - getValue(b)
    })
  }
  return profitList
}

export function handlePage(profitList: Calculator[], params: any) {
  return { list: profitList.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: profitList.length }
}

export function handlePush(profitList: Calculator[], cal: Calculator) {
  try {
    // 注意：cal.available / cal.run() 可能因为数据缺失/异常而抛错。
    // 如果这里不兜底，会导致整批利润榜计算直接中断，最终缓存空数组。
    if (!cal.available) return
    if (!cal.result) {
      cal.run()
    }
    // run() 失败或被中断时，result 可能仍为空；此时不要 push。
    if (!cal.result) return
    profitList.push(cal)
  } catch (e) {
    // 不要让单个条目影响整体列表
    console.error("[handlePush] calculator failed", {
      className: (cal as any)?.className,
      hrid: (cal as any)?.hrid,
      project: (cal as any)?.project,
      action: (cal as any)?.action
    }, e)
  }
}

export function handleSearch(profitList: Calculator[], params: any) {
  params.name && (profitList = profitList.filter((cal) => {
    const nameRegex = new RegExp(params.name!, "i")
    return cal.result.name.match(nameRegex)
  })
  )

  params.project && (profitList = profitList.filter(cal => cal.project.match(params.project!)))
  params.banEquipment && (profitList = profitList.filter(cal => !cal.isEquipment))
  params.banJewelry && (profitList = profitList.filter(cal =>
    getEquipmentTypeOf(cal.item) !== "neck" && getEquipmentTypeOf(cal.item) !== "ring" && getEquipmentTypeOf(cal.item) !== "earrings"))

  // 排除护符（charm）
  params.banCharm && (profitList = profitList.filter(cal => !cal.item || getEquipmentTypeOf(cal.item) !== "charm"))

  params.profitRate && (profitList = profitList.filter(cal => cal.result.profitRate >= params.profitRate! / 100))
  params.maxRisk && (profitList = profitList.filter(cal => cal.result.risk <= params.maxRisk))
  return profitList
}
