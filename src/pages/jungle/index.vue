<script lang="ts" setup>
import type Calculator from "@/calculator"
import { getItemDetailOf, getMarketDataApi, getPriceOf } from "@/common/apis/game"
import { getDataApi } from "@/common/apis/jungle"
import { getPriceDataApi } from "@/common/apis/price"
import { useMemory } from "@/common/composables/useMemory"
import * as Format from "@/common/utils/format"
import { useGameStore } from "@/pinia/stores/game"

import { usePlayerStore } from "@/pinia/stores/player"
import { type StoragePriceItem, usePriceStore } from "@/pinia/stores/price"
import ItemIcon from "@@/components/ItemIcon/index.vue"
import { usePagination } from "@@/composables/usePagination"
import { Delete, Edit, Search } from "@element-plus/icons-vue"
import { ElMessageBox, type FormInstance, type Sort } from "element-plus"
import { cloneDeep } from "lodash-es"
import ActionDetail from "../dashboard/components/ActionDetail.vue"
import ActionPrice from "../dashboard/components/ActionPrice.vue"
import SinglePrice from "../dashboard/components/SinglePrice.vue"
import ActionConfig from "../enhancer/components/ActionConfig.vue"

// #region 查
const { paginationData: paginationDataLD, handleCurrentChange: handleCurrentChangeLD, handleSizeChange: handleSizeChangeLD } = usePagination({}, "jungle-leaderboard-pagination")
const leaderboardData = ref<Calculator[]>([])
const ldSearchFormRef = ref<FormInstance | null>(null)

const ldSearchData = useMemory("jungle-leaderboard-search-data", {
  name: "",
  project: "",
  profitRate: "",
  maxLevel: "",
  minLevel: "",
  banEquipment: false
})

const loadingLD = ref(false)
function getLeaderboardData() {
  loadingLD.value = true
  getDataApi({
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
  () => useGameStore().marketData,
  () => useGameStore().marketDataLevel,
  () => usePlayerStore().config,
  () => usePlayerStore().actionConfigActivated
], getLeaderboardData, { immediate: true })

const { paginationData: paginationDataPrice, handleCurrentChange: handleCurrentChangePrice, handleSizeChange: handleSizeChangePrice } = usePagination({}, "jungle-price-pagination")
const priceData = ref<StoragePriceItem[]>([])
const priceSearchFormRef = ref<FormInstance | null>(null)
const priceSearchData = useMemory("jungle-price-search-data", {
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
  () => useGameStore().marketData
], getPriceData, { immediate: true })
// #endregion

// #region deepWatch

watch(() => usePriceStore(), () => {
  getLeaderboardData()
  getPriceData()
}, { deep: true })
// #endregion

const currentRow = ref<Calculator>()
const detailVisible = ref<boolean>(false)
async function showDetail(row: Calculator) {
  currentRow.value = cloneDeep(row)
  detailVisible.value = true
}

const priceVisible = ref<boolean>(false)
const currentPriceRow = ref<Calculator>()
function setPrice(row: Calculator) {
  const activated = usePriceStore().activated
  if (!activated) {
    ElMessageBox.confirm(t("是否确定开启自定义价格？"), t("需先开启自定义价格"), {
      confirmButtonText: t("确定"),
      cancelButtonText: t("取消"),
      closeOnClickModal: true
    }).then(() => {
      usePriceStore().setActivated(true)
    })
    return
  }
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

const { t } = useI18n()
</script>

<template>
  <div class="app-container">
    <div class="game-info">
      <div> {{ t('MWI版本') }}: {{ useGameStore().gameData?.gameVersion }}</div>
      <div
        :class="{
          error: getMarketDataApi()?.time * 1000 < Date.now() - 1000 * 60 * 120,
          success: getMarketDataApi()?.time * 1000 > Date.now() - 1000 * 60 * 120,
        }"
      >
        {{ t('市场数据更新时间') }}: {{ new Date(useGameStore().marketData?.time! * 1000).toLocaleString() }}
      </div>
      <div>
        <ActionConfig />
      </div>
      <div>
        {{ t('打野爽！') }}
      </div>
    </div>
    <el-row :gutter="20" class="row">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="14">
        <el-card>
          <template #header>
            <el-form class="rank-card" ref="ldSearchFormRef" :inline="true" :model="ldSearchData">
              <div class="title">
                {{ t('利润排行') }}
              </div>
              <el-form-item prop="name" :label="t('物品')">
                <el-input style="width:100px" v-model="ldSearchData.name" :placeholder="t('请输入')" clearable @input="handleSearchLD" />
              </el-form-item>

              <el-form-item :label="t('目标等级从')">
                <el-input-number style="width:80px" :min="1" :max="20" v-model="ldSearchData.minLevel" placeholder="1" clearable @change="handleSearchLD" controls-position="right" />&nbsp;{{ t('到') }}&nbsp;
                <el-input-number style="width:80px" :min="1" :max="20" v-model="ldSearchData.maxLevel" placeholder="20" clearable @change="handleSearchLD" controls-position="right" />
              </el-form-item>
            </el-form>
          </template>
          <template #default>
            <el-table :data="leaderboardData" v-loading="loadingLD" @sort-change="handleSortLD">
              <el-table-column width="54">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column prop="result.name" :label="t('物品')" />
              <el-table-column min-width="70">
                <template #default="{ row }">
                  <div style="display:flex;">
                    <ItemIcon v-if="row.calculatorList && row.calculatorList[row.calculatorList.length - 1].protectLevel < row.calculatorList[row.calculatorList.length - 1].enhanceLevel" :hrid="row.calculatorList[row.calculatorList.length - 1].protectionItem.hrid" />
                    <ItemIcon v-if="row.catalyst" :hrid="`/items/${row.catalyst}`" />
                  </div>
                  <div v-if="row.calculatorList && row.calculatorList[row.calculatorList.length - 1].protectLevel < row.calculatorList[row.calculatorList.length - 1].enhanceLevel">
                    {{ t('从{0}保护', [row.calculatorList[row.calculatorList.length - 1].protectLevel]) }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="project" :label="t('动作')" />
              <el-table-column :label="t('利润 / 天')" align="center" min-width="120">
                <template #default="{ row }">
                  <span :class="row.hasManualPrice ? 'manual' : ''">
                    {{ row.result.profitPDFormat }}&nbsp;
                  </span>
                  <el-link type="primary" :icon="Edit" @click="setPrice(row)">
                    {{ t('自定义') }}
                  </el-link>
                </template>
              </el-table-column>

              <el-table-column prop="result.profitPHFormat" :label="t('工时费')" align="center" min-width="120" />
              <el-table-column prop="result.profitRate" :label="t('利润率')" align="center" sortable="custom" :sort-orders="['descending', null]">
                <template #default="{ row }">
                  {{ row.result.profitRateFormat }}
                </template>
              </el-table-column>
              <el-table-column align="center" min-width="120">
                <template #header>
                  <div style="display: flex; justify-content: center; align-items: center; gap: 5px">
                    <div>{{ t('利润 / 次') }}</div>
                    <el-tooltip placement="top" effect="light">
                      <template #content>
                        {{ t('单次动作产生的利润。') }}
                        <br>
                        {{ t('#多步动作利润提示') }}
                        <br>
                        {{ t('#多步动作利润举例') }}
                      </template>
                      <el-icon>
                        <Warning />
                      </el-icon>
                    </el-tooltip>
                  </div>
                </template>
                <template #default="{ row }">
                  <span :class="row.hasManualPrice ? 'manual' : ''">
                    {{ row.result.profitPPFormat }}&nbsp;
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="t('详情')" align="center">
                <template #default="{ row }">
                  <el-link type="primary" :icon="Search" @click="showDetail(row)">
                    {{ t('查看') }}
                  </el-link>
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
                {{ t('自定义价格') }}
              </div>

              <el-form-item>
                <el-switch v-model="usePriceStore().activated" @change="usePriceStore().setActivated" :active-text="t('已开启')" :inactive-text="t('已关闭')" inline-prompt />
              </el-form-item>

              <el-form-item prop="name" :label="t('物品')">
                <el-input style="width:100px" v-model="priceSearchData.name" :placeholder="t('请输入')" clearable @input="handleSearchPrice" />
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
              <el-table-column :label="t('物品')" min-width="120">
                <template #default="{ row }">
                  {{ t(getItemDetailOf(row.hrid).name) }}
                </template>
              </el-table-column>

              <el-table-column :label="t('市场价格')" min-width="120">
                <template #default="{ row }">
                  {{ Format.price(getPriceOf(row.hrid).ask) }} / {{ Format.price(getPriceOf(row.hrid).bid) }}
                </template>
              </el-table-column>
              <el-table-column :label="t('自定义价格')" min-width="120">
                <template #default="{ row }">
                  {{ row.ask?.manual ? Format.price(row.ask?.manualPrice) : '-' }} / {{ row.bid?.manual ? Format.price(row.bid?.manualPrice) : '-' }}
                </template>
              </el-table-column>
              <el-table-column min-width="80">
                <template #default="{ row }">
                  <SinglePrice :data="row">
                    <el-link type="primary" :icon="Edit">
                      {{ t('修改') }}
                    </el-link>
                  </SinglePrice>
                </template>
              </el-table-column>
              <el-table-column min-width="80">
                <template #default="{ row }">
                  <el-link type="danger" :icon=" Delete" @click="deletePrice(row)">
                    {{ t('删除') }}
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
