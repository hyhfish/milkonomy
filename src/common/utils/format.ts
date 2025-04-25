export function number(value: number, decimal = 0) {
  // 如果value~(0,100),保留decimal位小数
  // 否则保留整数
  if (value >= 0 && value < 2) {
    value = Math.floor(value * (10 ** decimal)) / (10 ** decimal)
  } else if (value >= 0 && value < 10) {
    value = Math.floor(value * (10 ** Math.min(decimal, 2))) / (10 ** Math.min(decimal, 2))
  } else if (value >= 10 && value < 100) {
    value = Math.floor(value * (10 ** Math.min(decimal, 1))) / (10 ** Math.min(decimal, 1))
  } else {
    value = Math.floor(value)
  }
  return value.toLocaleString("en-US")
}
export function costTime(value: number) {
  // return `${Math.floor(value / 10000000) / 100}s`
  let result = ""
  value /= 1000000000
  const h = Math.floor(value / 3600)
  const m = Math.floor(value % 3600 / 60)
  const decimal = h || m ? 0 : 2
  const s = Math.floor(value % 60 * (10 ** decimal)) / (10 ** decimal)
  if (h) {
    result += `${h}h`
  }
  if (m) {
    // 个位数前面补0
    result += `${m < 10 ? "0" : ""}${m}m`
  }
  if (s) {
    result += `${s < 10 ? "0" : ""}${s}s`
  }
  return result
}

export function percent(value: number, decimal = 2) {
  return `${Math.floor(value * 100 * (10 ** decimal)) / (10 ** decimal)}%`
}

const priceConfig = ["", "K", "M", "B", "T"]
export function price(value: number) {
  for (let i = 0; i < priceConfig.length; i++) {
    if (Math.abs(value) < 10 ** ((i + 2) * 3 - 1)) {
      return `${number(value / (1000 ** i))}${priceConfig[i]}`
    }
  }
  // 数值超过 1000T
  return number(value)
}

export function money(value: number) {
  for (let i = 0; i < priceConfig.length; i++) {
    if (Math.abs(value) < 10 ** ((i + 1) * 3)) {
      return `${number(value / (1000 ** i), 2)}${priceConfig[i]}`
    }
  }

  return `${value.toLocaleString("en-US")}`
}
