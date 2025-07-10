export interface MarketData {
  marketData: Market
  timestamp: number
}

export interface Market {
  [hrid: string]: MarketItem
}

export interface MarketItem {
  [level: string]: MarketItemPrice
}

export interface MarketItemPrice {
  ask: number
  bid: number
}

export interface MarketDataPlain {
  marketData: {
    [hrid: string]: {
      [level: string]: {
        a: number
        b: number
      }
    }
  }
  timestamp: number
}
