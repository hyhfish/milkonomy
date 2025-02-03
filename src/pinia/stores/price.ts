import { defineStore } from "pinia"
import { useGameStore } from "./game"

export const usePriceStore = defineStore("price", {
  state: () => ({
    list: load(),
    activated: getActivated()
  }),
  actions: {
    commit() {
      save(this.list)
      useGameStore().clearLeaderBoardCache()
    },
    setPrice(row: StoragePriceItem) {
      let price = this.getPrice(row.hrid)
      if (!price) {
        price = {
          hrid: row.hrid,
          ask: { manual: false, manualPrice: undefined },
          bid: { manual: false, manualPrice: undefined }
        }
        this.list.push(price)
      }
      Object.assign(price.ask!, row.ask)
      Object.assign(price.bid!, row.bid)
    },
    deletePrice(row: StoragePriceItem) {
      const price = this.getPrice(row.hrid)
      if (!price) {
        throw new Error("未找到该记录")
      }
      this.list.splice(this.list.indexOf(price), 1)
      this.commit()
    },
    getPrice(hrid: string): StoragePriceItem | undefined {
      return this.list.find(item => item.hrid === hrid)
    },
    hasPrice(hrid: string): boolean {
      return !!this.getPrice(hrid)
    },
    setActivated(value: boolean) {
      this.activated = value
      setActivated(String(value))
      useGameStore().clearLeaderBoardCache()
    }
  }
})
const KEY = "price-list"
export interface StoragePriceItem {
  hrid: string
  ask?: StoragePriceItemValue
  bid?: StoragePriceItemValue
}
export interface StoragePriceItemValue {
  manual: boolean
  manualPrice?: number
}
function load(): StoragePriceItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

function save(list: StoragePriceItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

const ACTIVATED_KEY = "price-activated"
function getActivated() {
  return localStorage.getItem(ACTIVATED_KEY) === "true"
}
function setActivated(value: string) {
  localStorage.setItem(ACTIVATED_KEY, value)
}
