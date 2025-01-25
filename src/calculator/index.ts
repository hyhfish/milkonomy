import type { ItemDetail } from "~/game"
import * as Format from "@@/utils/format"

export default abstract class Calculator {
  static COIN_HRID = "/items/coin"
  item: ItemDetail
  project: string
  constructor(item: ItemDetail, project: string) {
    this.item = item
    this.project = project
  }

  // #region 固定继承属性

  get key() {
    return this.item.hrid.split("/").pop()
  }

  get efficiency(): number {
    return 1 + Math.max(0, (this.playerLevel - this.actionLevel) * 0.01) + this.equipementEfficiency + this.houseEfficiency + this.efficiencyTea
  }

  get speed(): number {
    return 1 + this.equipmentSpeed
  }

  /**
   * 单次成本
   * - 原料+消耗硬币
   * - 不包括一切 buff
   */
  get cost(): number {
    return this.ingredientList.reduce((acc, ingredient) => {
      return acc + ingredient.count * ingredient.price
    }, 0)
  }

  /**
   * 单次成功行动的收益
   * - 不包括一切 buff
   */
  get income(): number {
    const income = this.productList.reduce((acc, product) => {
      return acc + product.count * (product.rate || 1) * product.price
    }, 0)
    return income * 0.98
  }

  get result() {
    const actionsPH = ((60 * 60 * 1000000000) / this.timeCost) * this.efficiency
    const consumePH = actionsPH * (this.artisan ? 0.9 : 1)
    const costPH = this.cost * consumePH
    const gainPH = actionsPH * this.successRate * (this.gourmet ? 1.12 : 1)
    const incomePH = this.income * gainPH
    const profitPH = incomePH - costPH
    const profitRate = profitPH / costPH
    return {
      hrid: this.item.hrid,
      name: this.item.name,
      project: this.project,
      successRate: this.successRate,
      costPH,
      consumePH,
      gainPH,
      incomePH,
      profitPH,
      profitRate,
      costPHFormat: Format.number(costPH),
      incomePHFormat: Format.number(incomePH),
      profitPHFormat: Format.number(profitPH),
      profitPDFormat: Format.number(profitPH * 24),
      profitRateFormat: Format.percent(profitRate),
      efficiencyFormat: Format.percent(this.efficiency - 1),
      timeCostFormat: Format.costTime(this.timeCost),
      successRateFormat: Format.percent(this.successRate)
    }
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

  get efficiencyTea(): number {
    return 0.1
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

  get artisan(): boolean {
    return false
  }

  get gourmet(): boolean {
    return false
  }
  /**
   * 数据是否可用
   */
  abstract get available(): boolean

  abstract get actionLevel(): number
  // #endregion
}

export interface Ingredient {
  hrid: string
  count: number
  price: number
}
export interface Product extends Ingredient {
  rate?: number
}
