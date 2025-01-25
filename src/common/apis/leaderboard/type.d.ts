import type Calculator from "@/calculator"

export interface RequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  size: number
  /** 查询参数：名称 */
  name?: string
  /** 查询参数：项目 */
  project?: string
  /** 查询参数：利润率% */
  profitRate?: number
  /** 查询参数：排除装备 */
  banEquipment?: boolean
}

export type ResponseData = ApiResponseData<{
  list: LeaderboardData[]
  total: number
}>

export interface LeaderboardData {
  calculator: Calculator
  hrid: string
  name: string
  project: string
  successRate: number
  costPH: number
  consumePH: number
  gainPH: number
  incomePH: number
  profitPH: number
  profitRate: number

  costPHFormat: string
  incomePHFormat: string
  profitPHFormat: string
  profitPDFormat: string
  profitRateFormat: string
  efficiencyFormat: string
  timeCostFormat: string
  successRateFormat: string

}
