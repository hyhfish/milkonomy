import type Calculator from "@/calculator"

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
  if (!cal.available) return
  if (!cal.result) {
    cal.run()
  }
  profitList.push(cal)
}
