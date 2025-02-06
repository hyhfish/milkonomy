import type { Action } from "~/game"
import { getItemDetailOf } from "@/common/apis/game"
import { usePriceStore } from "@/pinia/stores/price"
import * as Format from "@@/utils/format"

export interface CalculatorConfig {
  hrid: string
  project?: string
  action?: Action
  ingredientPriceConfigList?: IngredientPriceConfig[]
  productPriceConfigList?: ProductPriceConfig[]
  /** 催化剂 1普通 2主要催化剂 */
  catalystRank?: number
}
export default abstract class Calculator {
  static COIN_HRID = "/items/coin"
  hrid: string
  project: string
  action: Action
  /** 此价格配置优先级大于自定义价格 */
  ingredientPriceConfigList: IngredientPriceConfig[]
  /** 此价格配置优先级大于自定义价格 */
  productPriceConfigList: ProductPriceConfig[]
  /** 催化剂 1普通 2主要催化剂 */
  catalystRank?: number
  result: any
  favorite?: boolean
  hasManualPrice: boolean = false
  constructor({ hrid, project, action, ingredientPriceConfigList = [], productPriceConfigList = [], catalystRank }: CalculatorConfig) {
    this.hrid = hrid
    this.project = project!
    this.action = action!
    this.ingredientPriceConfigList = ingredientPriceConfigList
    this.productPriceConfigList = productPriceConfigList
    this.catalystRank = catalystRank
  }

  // #region 固定继承属性

  get item() {
    return getItemDetailOf(this.hrid)
  }

  get id(): `${string}-${string}-${Action}` {
    return `${this.hrid}-${this.project}-${this.action}`
  }

  get key() {
    return this.item.hrid.split("/").pop()
  }

  get efficiency(): number {
    return 1 + Math.max(0, (this.playerLevel - this.actionLevel) * 0.01) + this.equipementEfficiency + this.houseEfficiency + (this.efficiencyTea ? 0.1 : 0)
  }

  get speed(): number {
    return 1 + this.equipmentSpeed
  }

  get isEquipment(): boolean {
    return this.item.categoryHrid === "/item_categories/equipment"
  }

  handlePrice(list: Ingredient[], priceConfigList: IngredientPriceConfig[], type: "ask" | "bid") {
    return list.map((item, i) => {
      const priceConfig = priceConfigList[i]
      const hasManualPrice = usePriceStore().getPrice(item.hrid)?.[type]?.manual && usePriceStore().activated
      const manualPrice = usePriceStore().getPrice(item.hrid)?.[type]?.manualPrice
      if (hasManualPrice) {
        this.hasManualPrice = true
      }
      const price = priceConfig?.immutable ? priceConfig.price! : hasManualPrice ? manualPrice! : item.marketPrice
      return {
        ...item,
        price
      }
    })
  }

  get ingredientListWithPrice(): IngredientWithPrice[] {
    let list = this.ingredientList
    list = list.map((item) => {
      return {
        ...item,
        countPH: item.count * this.consumePH,
        counterCountPH: item.counterCount ? item.counterCount * this.consumePH : undefined
      }
    })
    return this.handlePrice(list, this.ingredientPriceConfigList, "ask")
  }

  get productListWithPrice(): ProductWithPrice[] {
    let list = this.productList
    list = list.map((item) => {
      return {
        ...item,
        countPH: item.count * this.gainPH * (item.rate || 1),
        counterCountPH: item.counterCount ? item.counterCount * this.gainPH * (item.rate || 1) : undefined
      }
    })
    return this.handlePrice(list, this.productPriceConfigList, "bid")
  }

  /**
   * 单次成本
   * - 原料+消耗硬币
   * - 不包括一切 buff
   */
  get cost(): number {
    return this.ingredientListWithPrice.reduce((acc, ingredient) => {
      return acc + ingredient.count * ingredient.price
    }, 0)
  }

  /**
   * 单次成功行动的收益
   * - 不包括一切 buff
   */
  get income(): number {
    const income = this.productListWithPrice.reduce((acc, product) => {
      return acc + product.count * (product.rate || 1) * product.price
    }, 0)
    return income * 0.98
  }

  get actionsPH(): number {
    return ((60 * 60 * 1000000000) / this.timeCost) * this.efficiency
  }

  get consumePH(): number {
    return this.actionsPH
  }

  get gainPH(): number {
    return this.actionsPH * this.successRate
  }

  run() {
    const costPH = this.cost * this.consumePH
    const incomePH = this.income * this.gainPH
    const profitPH = incomePH - costPH
    const profitRate = profitPH / costPH

    this.result = {
      hrid: this.item.hrid,
      name: this.item.name,
      project: this.project,
      successRate: this.successRate,
      costPH,
      consumePH: this.consumePH,
      gainPH: this.gainPH,
      incomePH,
      profitPH,
      profitRate,
      costPHFormat: Format.money(costPH),
      incomePHFormat: Format.money(incomePH),
      profitPHFormat: Format.money(profitPH),
      profitPDFormat: Format.money(profitPH * 24),
      profitRateFormat: Format.percent(profitRate),
      efficiencyFormat: Format.percent(this.efficiency - 1),
      timeCostFormat: Format.costTime(this.timeCost),
      successRateFormat: Format.percent(this.successRate)
    }
    return this
  }
  // #endregion

  // #region 未来用户配置属性
  get playerLevel(): number {
    return 100
  }

  // +10生产装备
  get equipementEfficiency(): number {
    return 0.129
  }

  // 4级房子
  get houseEfficiency(): number {
    return 0.06
  }

  // +10神圣工具
  get equipmentSpeed(): number {
    return 1.161
  }

  // #endregion

  // #region 子类override属性

  abstract get timeCost(): number

  /**
   * 单次消耗的原料 + 硬币列表
   */
  abstract get ingredientList(): Ingredient[]

  /**
   * 单次成功行动的收益列表
   */
  abstract get productList(): Product[]

  get successRate(): number {
    return 1
  }

  get efficiencyTea(): boolean {
    return getItemDetailOf("/items/efficiency_tea").consumableDetail.usableInActionTypeMap[`/action_types/${this.action}`]
  }

  get artisanTea(): boolean {
    return getItemDetailOf("/items/artisan_tea").consumableDetail.usableInActionTypeMap[`/action_types/${this.action}`]
  }

  get gourmetTea(): boolean {
    return getItemDetailOf("/items/gourmet_tea").consumableDetail.usableInActionTypeMap[`/action_types/${this.action}`]
  }
  /**
   * 数据是否可用
   */
  abstract get available(): boolean

  abstract get actionLevel(): number

  abstract get className(): string
  // #endregion
}

export interface Ingredient {
  hrid: string
  /** 原料产物抵消后的数量 */
  count: number
  /** 原料产物抵消的数量 */
  counterCount?: number
  marketPrice: number
}
export interface IngredientWithPrice extends Ingredient {
  /** 原料产物抵消后的数量 */
  countPH?: number
  /** 原料产物抵消的数量 */
  counterCountPH?: number
  price: number
}
export interface Product extends Ingredient {
  rate?: number
}
export interface ProductWithPrice extends Product, IngredientWithPrice {
}

export interface IngredientPriceConfig {
  hrid: string
  manual?: boolean
  immutable?: boolean
  price?: number
}
export interface ProductPriceConfig extends IngredientPriceConfig {}
