export function number(value: number, decimal = 0) {
  // 如果value~(0,10),保留三位小数
  // 否则保留整数
  if (value >= 0 && value < 10) {
    value = Math.floor(value * (10 ** decimal)) / (10 ** decimal)
  } else {
    value = Math.floor(value)
  }
  return value.toLocaleString("en-US")
}
export function costTime(value: number) {
  return `${Math.floor(value / 10000000) / 100}s`
}

export function percent(value: number, decimal = 2) {
  return `${Math.floor(value * 100 * (10 ** decimal)) / (10 ** decimal)}%`
}

export function money(value: number) {
  return `￥${value.toLocaleString("en-US")}`
}
