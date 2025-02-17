<script lang="ts" setup>
import type Calculator from "@/calculator"
import type { FormInstance, Sort } from "element-plus"
import { WorkflowCalculator } from "@/calculator/workflow"
import { addFavoriteApi, deleteFavoriteApi, getFavoriteDataApi } from "@/common/apis/favorite"
import { getGameDataApi, getItemDetailOf, getMarketDataApi, getPriceOf } from "@/common/apis/game"
import { getPriceDataApi } from "@/common/apis/price"
import { useMemory } from "@/common/composables/useMemory"
import * as Format from "@/common/utils/format"
import { useFavoriteStore } from "@/pinia/stores/favorite"
import { type StoragePriceItem, usePriceStore } from "@/pinia/stores/price"

import { getLeaderboardDataApi } from "@@/apis/leaderboard"
import ItemIcon from "@@/components/ItemIcon/index.vue"
import { usePagination } from "@@/composables/usePagination"
import { Delete, Edit, Search, Star, StarFilled } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import ActionConfig from "./components/ActionConfig.vue"
import ActionDetail from "./components/ActionDetail.vue"
import ActionPrice from "./components/ActionPrice.vue"
import SinglePrice from "./components/SinglePrice.vue"
// #region 查
const favoriteStore = useFavoriteStore()
const { paginationData: paginationDataLD, handleCurrentChange: handleCurrentChangeLD, handleSizeChange: handleSizeChangeLD } = usePagination({}, "dashboard-leaderboard-pagination")
const leaderboardData = ref<Calculator[]>([])
const ldSearchFormRef = ref<FormInstance | null>(null)

const ldSearchData = useMemory("dashboard-leaderboard-search-data", {
  name: "",
  project: "",
  profitRate: 10,
  banEquipment: true
})

const loadingLD = ref(false)
function getLeaderboardData() {
  loadingLD.value = true
  getLeaderboardDataApi({
    currentPage: paginationDataLD.currentPage,
    size: paginationDataLD.pageSize,
    ...ldSearchData.value,
    sort: sortLD.value
  }).then((data) => {
    paginationDataLD.total = data.total
    leaderboardData.value = data.list
  }).catch((e) => {
    console.error(e)
    leaderboardData.value = []
  }).finally(() => {
    loadingLD.value = false
  })
}
function handleSearchLD() {
  paginationDataLD.currentPage === 1 ? getLeaderboardData() : (paginationDataLD.currentPage = 1)
}

const sortLD: Ref<Sort | undefined> = ref()
function handleSortLD(sort: Sort) {
  sortLD.value = sort
  getLeaderboardData()
}

// 监听分页参数的变化
watch([
  () => paginationDataLD.currentPage,
  () => paginationDataLD.pageSize,
  () => getMarketDataApi(),
  () => useFavoriteStore().list,
  () => usePriceStore()
], getLeaderboardData, { immediate: true, deep: true })

const { paginationData: paginationDataMN, handleCurrentChange: handleCurrentChangeFR, handleSizeChange: handleSizeChangeFR } = usePagination({}, "dashboard-favorite-pagination")
const favoriteData = ref<Calculator[]>([])
const frSearchFormRef = ref<FormInstance | null>(null)
const frSearchData = useMemory("dashboard-favorite-search-data", {
  name: "",
  project: ""
})

const loadingFR = ref(false)
function getFavoriteData() {
  loadingFR.value = true
  getFavoriteDataApi({
    currentPage: paginationDataMN.currentPage,
    size: paginationDataMN.pageSize,
    ...frSearchData.value
  }).then((data) => {
    paginationDataMN.total = data.total
    favoriteData.value = data.list
  }).catch(() => {
    favoriteData.value = []
  }).finally(() => {
    loadingFR.value = false
  })
}

function handleSearchMN() {
  paginationDataMN.currentPage === 1 ? getFavoriteData() : (paginationDataMN.currentPage = 1)
}
// 监听分页参数的变化
watch([
  () => paginationDataMN.currentPage,
  () => paginationDataMN.pageSize,
  () => getMarketDataApi(),
  () => usePriceStore(),
  () => favoriteStore
], getFavoriteData, { immediate: true, deep: true })

const { paginationData: paginationDataPrice, handleCurrentChange: handleCurrentChangePrice, handleSizeChange: handleSizeChangePrice } = usePagination({}, "dashboard-price-pagination")
const priceData = ref<StoragePriceItem[]>([])
const priceSearchFormRef = ref<FormInstance | null>(null)
const priceSearchData = useMemory("dashboard-price-search-data", {
  name: ""
})

const loadingPrice = ref(false)
function getPriceData() {
  loadingPrice.value = true
  getPriceDataApi({
    currentPage: paginationDataPrice.currentPage,
    size: paginationDataPrice.pageSize,
    ...priceSearchData.value
  }).then((data) => {
    console.log("getPriceData", data)
    paginationDataPrice.total = data.total
    priceData.value = data.list
  }).catch(() => {
    priceData.value = []
  }).finally(() => {
    loadingPrice.value = false
  })
}

function handleSearchPrice() {
  paginationDataPrice.currentPage === 1 ? getPriceData() : (paginationDataPrice.currentPage = 1)
}
// 监听分页参数的变化
watch([
  () => paginationDataPrice.currentPage,
  () => paginationDataPrice.pageSize,
  () => usePriceStore()
], getPriceData, { immediate: true, deep: true })

// #endregion

const currentRow = ref<Calculator>()
const detailVisible = ref<boolean>(false)
async function showDetail(row: Calculator) {
  currentRow.value = cloneDeep(row)
  detailVisible.value = true
}
function addFavorite(row: Calculator) {
  const r = row || currentRow.value!
  try {
    addFavoriteApi(r)
    detailVisible.value = false
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

function deleteFavorite(row: Calculator) {
  try {
    deleteFavoriteApi(row)
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}
const priceVisible = ref<boolean>(false)
const currentPriceRow = ref<Calculator>()
function setPrice(row: Calculator) {
  currentPriceRow.value = cloneDeep(row)
  priceVisible.value = true
}
function deletePrice(row: StoragePriceItem) {
  try {
    usePriceStore().deletePrice(row)
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}
</script>

<template>
  <div class="app-container">
    <div class="game-info">
      <div>MWI版本：{{ getGameDataApi()?.gameVersion }}</div>
      <div
        :class="{
          error: getMarketDataApi()?.time * 1000 < Date.now() - 1000 * 60 * 120,
          success: getMarketDataApi()?.time * 1000 > Date.now() - 1000 * 60 * 120,
        }"
      >
        市场数据更新时间:{{ new Date(getMarketDataApi()?.time * 1000).toLocaleString() }}
      </div>
      <div>
        <ActionConfig />
      </div>
    </div>
    <el-row :gutter="20" class="row">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="14">
        <el-card>
          <template #header>
            <el-form class="rank-card" ref="ldSearchFormRef" :inline="true" :model="ldSearchData">
              <div class="title">
                扫单填单利润排行
              </div>
              <el-form-item prop="name" label="物品">
                <el-input style="width:100px" v-model="ldSearchData.name" placeholder="请输入" clearable @input="handleSearchLD" />
              </el-form-item>
              <el-form-item prop="phone" label="项目">
                <el-select v-model="ldSearchData.project" placeholder="请选择" style="width:100px" clearable @change="handleSearchLD">
                  <el-option label="锻造" value="锻造" />
                  <el-option label="制造" value="制造" />
                  <el-option label="裁缝" value="裁缝" />
                  <el-option label="烹饪" value="烹饪" />
                  <el-option label="冲泡" value="冲泡" />
                  <el-option label="点金" value="点金" />
                  <el-option label="重组" value="重组" />
                  <el-option label="分解" value="分解" />
                  <el-option label="强化分解" value="强化分解" />
                </el-select>
              </el-form-item>

              <el-form-item prop="name" label="利润率 >">
                <el-input style="width:60px" v-model="ldSearchData.profitRate" placeholder="请输入" clearable @input="handleSearchLD" />&nbsp;%
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="ldSearchData.banEquipment" @change="handleSearchLD">
                  排除装备
                </el-checkbox>
              </el-form-item>
            </el-form>
            <div style="font-size:12px;color:#999">
              默认工具（+10）、技能100级、房子（4级）、装备（+10），使用工匠茶、效率茶、催化茶
            </div>
          </template>
          <template #default>
            <el-table :data="leaderboardData" v-loading="loadingLD" @sort-change="handleSortLD">
              <el-table-column width="54">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column prop="item.name" label="物品" />
              <el-table-column width="54">
                <template #default="{ row }">
                  <ItemIcon v-if="row.catalyst" :hrid="`/items/${row.catalyst}`" />
                </template>
              </el-table-column>
              <el-table-column prop="project" label="项目" />
              <el-table-column prop="actionLevel" label="等级" align="center" />
              <el-table-column label="利润 / 天" align="center" min-width="120">
                <template #default="{ row }">
                  <span :class="row.hasManualPrice ? 'manual' : ''">
                    {{ row.result.profitPDFormat }}&nbsp;
                  </span>
                  <el-link v-if="usePriceStore().activated" type="primary" :icon="Edit" @click="setPrice(row)">
                    自定义
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="result.profitRate" label="利润率" align="center" sortable="custom" :sort-orders="['descending', null]">
                <template #default="{ row }">
                  {{ row.result.profitRateFormat }}
                </template>
              </el-table-column>

              <el-table-column label="详情" align="center">
                <template #default="{ row }">
                  <el-link type="primary" :icon="Search" @click="showDetail(row)">
                    查看
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="favorite" label="收藏" align="center" sortable="custom" :sort-orders="['descending', null]">
                <template #default="{ row }">
                  <template v-if="!(row instanceof WorkflowCalculator)">
                    <el-link v-if="!favoriteStore.hasFavorite(row)" :underline="false" type="warning" :icon="Star" @click="addFavorite(row)" style="font-size:24px" />
                    <el-link v-else :underline="false" :icon="StarFilled" type="warning" @click="deleteFavorite(row)" style="font-size:28px" />
                  </template>
                  <template v-else />
                </template>
              </el-table-column>
            </el-table>
          </template>
          <template #footer>
            <div class="pager-wrapper">
              <el-pagination
                background
                :layout="paginationDataLD.layout"
                :page-sizes="paginationDataLD.pageSizes"
                :total="paginationDataLD.total"
                :page-size="paginationDataLD.pageSize"
                :current-page="paginationDataLD.currentPage"
                @size-change="handleSizeChangeLD"
                @current-change="handleCurrentChangeLD"
              />
            </div>
          </template>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="10">
        <el-card>
          <template #header>
            <el-form class="rank-card" ref="priceSearchFormRef" :inline="true" :model="priceSearchData">
              <div class="title">
                自定义价格
              </div>

              <el-form-item>
                <el-switch v-model="usePriceStore().activated" @change="usePriceStore().setActivated" active-text="已开启" inactive-text="已关闭" inline-prompt />
              </el-form-item>

              <el-form-item prop="name" label="物品">
                <el-input style="width:100px" v-model="priceSearchData.name" placeholder="请输入" clearable @input="handleSearchPrice" />
              </el-form-item>
            </el-form>
          </template>
          <template #default>
            <el-table :data="priceData" v-loading="loadingPrice">
              <el-table-column width="54">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column label="物品" min-width="120">
                <template #default="{ row }">
                  {{ getItemDetailOf(row.hrid).name }}
                </template>
              </el-table-column>

              <el-table-column label="市场价格" min-width="120">
                <template #default="{ row }">
                  {{ Format.price(getPriceOf(row.hrid).ask) }} / {{ Format.price(getPriceOf(row.hrid).bid) }}
                </template>
              </el-table-column>
              <el-table-column label="自定义价格" min-width="120">
                <template #default="{ row }">
                  {{ row.ask?.manual ? Format.price(row.ask?.manualPrice) : '-' }} / {{ row.bid?.manual ? Format.price(row.bid?.manualPrice) : '-' }}
                </template>
              </el-table-column>
              <el-table-column min-width="80">
                <template #default="{ row }">
                  <SinglePrice :data="row">
                    <el-link type="primary" :icon="Edit">
                      修改
                    </el-link>
                  </SinglePrice>
                </template>
              </el-table-column>
              <el-table-column min-width="80">
                <template #default="{ row }">
                  <el-link type="danger" :icon=" Delete" @click="deletePrice(row)">
                    删除
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </template>
          <template #footer>
            <div class="pager-wrapper">
              <el-pagination
                background
                :layout="paginationDataPrice.layout"
                :page-sizes="paginationDataPrice.pageSizes"
                :total="paginationDataPrice.total"
                :page-size="paginationDataPrice.pageSize"
                :current-page="paginationDataPrice.currentPage"
                @size-change="handleSizeChangePrice"
                @current-change="handleCurrentChangePrice"
              />
            </div>
          </template>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="14">
        <el-card>
          <template #header>
            <el-form class="rank-card" ref="frSearchFormRef" :inline="true" :model="frSearchData">
              <div class="title">
                收藏夹
              </div>
              <el-form-item prop="name" label="物品">
                <el-input style="width:100px" v-model="frSearchData.name" placeholder="请输入" clearable @input="handleSearchMN" />
              </el-form-item>
              <el-form-item prop="phone" label="项目">
                <el-select v-model="frSearchData.project" placeholder="请选择" style="width:100px" clearable @change="handleSearchMN">
                  <el-option label="锻造" value="锻造" />
                  <el-option label="制造" value="制造" />
                  <el-option label="裁缝" value="裁缝" />
                  <el-option label="烹饪" value="烹饪" />
                  <el-option label="冲泡" value="冲泡" />
                  <el-option label="重组" value="重组" />
                  <el-option label="分解" value="分解" />
                  <el-option label="强化分解" value="强化分解" />
                </el-select>
              </el-form-item>
            </el-form>
            <div style="font-size:12px;color:#999">
              默认工具（+10）、技能100级、房子（4级）、装备（+10），使用工匠茶、效率茶、催化茶
            </div>
          </template>
          <template #default>
            <el-table :data="favoriteData" v-loading="loadingFR">
              <el-table-column width="54">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column prop="item.name" label="物品" />
              <el-table-column width="54">
                <template #default="{ row }">
                  <ItemIcon v-if="row.catalyst" :hrid="`/items/${row.catalyst}`" />
                </template>
              </el-table-column>
              <el-table-column prop="project" label="项目" />
              <el-table-column label="利润 / 天">
                <template #default="{ row }">
                  <span :class="row.hasManualPrice ? 'manual' : ''">
                    {{ row.result.profitPDFormat }}&nbsp;
                  </span>
                  <el-link v-if="usePriceStore().activated" type="primary" :icon="Edit" @click="setPrice(row)">
                    自定义
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="result.profitRateFormat" label="利润率" />
              <el-table-column label="详情">
                <template #default="{ row }">
                  <el-link type="primary" :icon="Search" @click="showDetail(row)">
                    查看
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="{ row }">
                  <el-link type="danger" :icon=" Delete" @click="deleteFavorite(row)">
                    删除
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </template>
          <template #footer>
            <div class="pager-wrapper">
              <el-pagination
                background
                :layout="paginationDataMN.layout"
                :page-sizes="paginationDataMN.pageSizes"
                :total="paginationDataMN.total"
                :page-size="paginationDataMN.pageSize"
                :current-page="paginationDataMN.currentPage"
                @size-change="handleSizeChangeFR"
                @current-change="handleCurrentChangeFR"
              />
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>
    <ActionDetail v-model="detailVisible" :data="currentRow" />

    <ActionPrice v-model="priceVisible" :data="currentPriceRow" />
  </div>
</template>

<style lang="scss" scoped>
.game-info {
  display: flex;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 14px;
  gap: 10px 20px;
  .error {
    color: #f56c6c;
  }
  .success {
    color: #67c23a;
  }
}
.rank-card {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  .title {
    width: 160px;
    margin-bottom: 12px;
  }
}
.pager-wrapper {
  display: flex;
  justify-content: center;
}

.row {
  .el-col {
    margin-bottom: 20px;
  }
}
// 蓝色
.manual {
  color: #409eff;
}
</style>
