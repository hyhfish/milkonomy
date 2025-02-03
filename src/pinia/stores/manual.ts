import type { AlchemyCalculatorConfig } from "@/calculator/alchemy"
import type { Action } from "~/game"
import { find } from "lodash-es"
import { defineStore } from "pinia"

export const useManualStore = defineStore("manual", {
  state: () => ({
    list: loadList()
  }),
  actions: {
    setList() {
      saveList(this.list)
    },
    setPrice(row: StorageManualItem) {
      const findManual = this.findManual(row)
      if (!findManual) {
        throw new Error("未找到该记录")
      }
      Object.assign(findManual, row)
      this.setList()
    },
    addManual(row: StorageManualItem) {
      // 不允许重复添加
      if (this.hasManual(row)) {
        throw new Error("请勿重复添加")
      }
      this.list.push(row)
      this.setList()
    },
    deleteManual(row: StorageManualItem) {
      const findManual = this.findManual(row)
      if (!findManual) {
        throw new Error("未找到该记录")
      }
      this.list.splice(this.list.indexOf(findManual), 1)
      this.setList()
    },
    hasManual(row: StorageManualItem) {
      return this.findManual(row) !== undefined
    },
    findManual(row: StorageManualItem) {
      return find(this.list, item => item.id === row.id && item.catalystRank === row.catalystRank)
    }
  }
})
const LIST_KEY = "manual-list"
export interface StorageManualItem extends AlchemyCalculatorConfig {
  id: `${string}-${string}-${Action}`
  className?: string
}
function loadList(): StorageManualItem[] {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY) || "[]")
  } catch {
    return []
  }
}

function saveList(list: StorageManualItem[]) {
  localStorage.setItem(LIST_KEY, JSON.stringify(list))
}
