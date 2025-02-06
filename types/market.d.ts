export interface MarketData {
  market: Market
  time: number
}

export interface Market {
  [key: string]: MarketItem
}

export interface MarketItem {
  ask: number
  bid: number
  vendor?: number
}
