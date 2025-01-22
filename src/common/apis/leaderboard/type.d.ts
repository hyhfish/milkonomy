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
  profitPH: number
  profitPD: number
  profitRate: string
  costPH: number
}
