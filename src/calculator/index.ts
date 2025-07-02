import type { Action, ItemDetail } from "~/game"
import * as Format from "@@/utils/format"
import { getItemDetailOf } from "@/common/apis/game"
import { getBuffOf, getPlayerLevelOf } from "@/common/apis/player"
import { getManualPriceActivated, getManualPriceOf } from "@/common/apis/price"
import locales from "@/locales"

const { t } = locales.global

export interface CalculatorConfig {
  hrid: string
  project?: string
  action?: Action
  ingredientPriceConfigList?: IngredientPriceConfig[]
  productPriceConfigList?: ProductPriceConfig[]
  /** 催化剂 1普通 2主要催化剂 */
  catalystRank?: number
  enhanceLevel?: number
  originLevel?: number
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
  config: CalculatorConfig
  enhanceLevel: number = 0
  constructor(config: CalculatorConfig) {
    const { hrid, project, action, ingredientPriceConfigList = [], productPriceConfigList = [], catalystRank } = config
    this.config = config
    this.hrid = hrid
    this.project = project!
    this.action = action!
    this.ingredientPriceConfigList = ingredientPriceConfigList
    this.productPriceConfigList = productPriceConfigList
    this.catalystRank = catalystRank
  }

  // #region 固定继承属性

  _item?: ItemDetail
  get item() {
    if (!this._item) {
      this._item = getItemDetailOf(this.hrid)
    }
    return this._item
  }

  get id(): `${string}-${string}-${Action}` {
    return `${this.hrid}-${this.project}-${this.action}`
  }

  get key() {
    return this.item.hrid.split("/").pop()
  }

  get efficiency(): number {
    return 1 + Math.max(0, (this.playerLevel - this.actionLevel) * 0.01) + getBuffOf(this.action, "Efficiency")
  }

  get speed(): number {
    return 1 + getBuffOf(this.action, "Speed")
  }

  get isEquipment(): boolean {
    return this.item.categoryHrid === "/item_categories/equipment"
  }

  handlePrice(list: Ingredient[], priceConfigList: IngredientPriceConfig[], type: "ask" | "bid") {
    const result = []
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      const priceConfig = priceConfigList[i]
      const hasManualPrice = this.enhanceLevel > 0 ? false : getManualPriceOf(item.hrid, item.level)?.[type]?.manual && getManualPriceActivated()
      const manualPrice = getManualPriceOf(item.hrid, item.level)?.[type]?.manualPrice
      if (!priceConfig?.immutable && hasManualPrice) {
        this.hasManualPrice = true
      }
      const price = priceConfig?.immutable ? priceConfig.price! : hasManualPrice ? manualPrice! : item.marketPrice
      result.push({
        ...item,
        price
      })
    }
    return result
  }

  _ingredientListWithPrice?: IngredientWithPrice[]
  get ingredientListWithPrice(): IngredientWithPrice[] {
    if (!this._ingredientListWithPrice) {
      const list = this.ingredientList.map((item) => {
        return {
          ...item,
          countPH: item.count * this.consumePH,
          counterCountPH: item.counterCount ? item.counterCount * this.consumePH : undefined
        }
      })

      this._ingredientListWithPrice = this.handlePrice(list, this.ingredientPriceConfigList, "ask")
    }

    return this._ingredientListWithPrice
  }

  _productListWithPrice?: ProductWithPrice[]
  get productListWithPrice(): ProductWithPrice[] {
    if (!this._productListWithPrice) {
      const list = this.productList.map((item) => {
        return {
          ...item,
          countPH: item.count * this.gainPH * (item.rate || 1),
          counterCountPH: item.counterCount ? item.counterCount * this.gainPH * (item.rate || 1) : undefined
        }
      })
      this._productListWithPrice = this.handlePrice(list, this.productPriceConfigList, "bid")
    }
    return this._productListWithPrice
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

  /** 本体之外的消耗，一般仅用于强化 */
  get cost4Mat(): number {
    // 从第2个原料开始计算
    return this.ingredientListWithPrice.slice(1).reduce((acc, ingredient) => {
      return acc + ingredient.count * ingredient.price
    }, 0)
  }

  /** 装备逃逸造成的资产折损，一般仅用于强化 */
  get cost4EscapePH(): number {
    const item = this.ingredientListWithPrice[0]
    const escape = this.productListWithPrice[1]
    return escape.countPH! * (item.price - escape.price * 0.98)
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

  _actionsPH?: number
  get actionsPH(): number {
    if (this._actionsPH === undefined) {
      this._actionsPH = ((60 * 60 * 1000000000) / this.timeCost) * this.efficiency
    }
    return this._actionsPH
  }

  _consumePH?: number
  get consumePH(): number {
    if (this._consumePH === undefined) {
      this._consumePH = this.actionsPH
    }
    return this._consumePH
  }

  _gainPH?: number
  get gainPH(): number {
    if (this._gainPH === undefined) {
      this._gainPH = this.actionsPH * this.successRate
    }
    return this._gainPH
  }

  /**
   * 收益是否有效
   */
  get valid(): boolean {
    for (const ingredient of this.ingredientListWithPrice) {
      if (ingredient.price === -1) {
        return false
      }
    }
    return true
  }

  run() {
    const costPH = this.cost * this.consumePH
    const cost4MatPH = this.cost4Mat * this.consumePH
    const incomePH = this.income * this.gainPH
    let profitPH = incomePH - costPH
    // 单次利润
    const profitPP = profitPH / this.actionsPH
    const profitRate = costPH ? profitPH / costPH : 0

    if (!this.valid) {
      profitPH = -1 / 24
    }

    this.result = {
      hrid: this.item.hrid,
      name: t(this.item.name),
      project: this.project,
      successRate: this.successRate,
      costPH,
      cost4MatPH,
      consumePH: this.consumePH,
      gainPH: this.gainPH,
      incomePH,
      profitPH,
      profitRate,
      costPHFormat: Format.money(costPH),
      cost4MatPHFormat: Format.money(cost4MatPH),
      incomePHFormat: Format.money(incomePH),
      profitPHFormat: Format.money(profitPH),
      profitPDFormat: Format.money(profitPH * 24),
      profitPPFormat: Format.money(profitPP),
      profitRateFormat: Format.percent(profitRate),
      efficiencyFormat: Format.percent(this.efficiency - 1),
      speedFormat: Format.percent(this.speed - 1),
      timeCostFormat: Format.costTime(this.timeCost),
      successRateFormat: Format.percent(this.successRate)
    }
    return this
  }
  // #endregion

  // #region 用户配置属性
  get playerLevel(): number {
    return getPlayerLevelOf(this.action)
  }

  get essenceRatio(): number {
    return getBuffOf(this.action, "EssenceFind") || 0
  }

  get rareRatio(): number {
    return getBuffOf(this.action, "RareFind") || 0
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
  marketTime?: number
  /** 等级 */
  level?: number
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
