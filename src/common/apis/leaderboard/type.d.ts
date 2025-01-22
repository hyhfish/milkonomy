export interface RequestData {
  /** 当前页码 */
  currentPage: number
  /** 查询条数 */
  size: number
  /** 查询参数：名称 */
  name?: string
}

export type ResponseData = ApiResponseData<{
  list: LeaderboardData[]
  total: number
}>

export interface LeaderboardData {
  hrid: string
  name: string
  project: string
  profitPHFormat: string
  profitPDFormat: string
  profitRateFormat: string
  costPHFormat: string
  coinCostPHFormat: string
  incomePHFormat: string
  efficiencyFormat: string
  timeCostFormat: string
  profitPH: number
  profitPD: number
  gainPH: number
  consumePHFormat: string
}
