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
  askTime?: number
  bidTime?: number
  vendor?: number
}

export interface MarketDataLevel {
  [name: string]: {
    [level: string]: {
      bid: {
        time: number
        price: number
      }
      ask: {
        time: number
        price: number
      }
    }
  }
}
