<script lang="ts" setup>
import type Calculator from "@/calculator"
import { getLeaderboardDataApi } from "@@/apis/leaderboard"
import ItemIcon from "@@/components/ItemIcon/index.vue"
import { usePagination } from "@@/composables/usePagination"
import { Delete, Edit, Search, Star, StarFilled, Warning } from "@element-plus/icons-vue"
import { ElMessageBox, type FormInstance, type Sort } from "element-plus"
import { cloneDeep, debounce } from "lodash-es"
import { WorkflowCalculator } from "@/calculator/workflow"

import { addFavoriteApi, deleteFavoriteApi, getFavoriteDataApi } from "@/common/apis/favorite"
import { getMarketDataApi } from "@/common/apis/game"
import { getActionConfigOf } from "@/common/apis/player"
import { useMemory } from "@/common/composables/useMemory"
import { usePriceStatus } from "@/common/composables/usePriceStatus"
import { useFavoriteStore } from "@/pinia/stores/favorite"
import { useGameStore } from "@/pinia/stores/game"
import { usePlayerStore } from "@/pinia/stores/player"
import { usePriceStore } from "@/pinia/stores/price"
import ActionConfig from "./components/ActionConfig.vue"
import ActionDetail from "./components/ActionDetail.vue"

import ActionPrice from "./components/ActionPrice.vue"
import ManualPriceCard from "./components/ManualPriceCard.vue"
import PriceStatusSelect from "./components/PriceStatusSelect.vue"

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

const getLeaderboardData = debounce(() => {
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
}, 300)

function handleInput(val: string) {
  if (val && val.includes("@")) {
    useGameStore().setSecret(val)
    if (useGameStore().checkSecret()) {
      useGameStore().clearJungleCache()
      useGameStore().fetchMarketDataLevel()
      router.push({ path: "/jungle" })
    }
  }

  handleSearchLD()
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
  () => usePlayerStore().config,
  () => useGameStore().buyStatus,
  () => useGameStore().sellStatus
], getLeaderboardData, { immediate: true })

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
  () => useGameStore().marketData,
  () => usePlayerStore().config,
  () => useGameStore().buyStatus,
  () => useGameStore().sellStatus
], getFavoriteData, { immediate: true })

// #endregion

// #region deepWatch
watch(() => favoriteStore.list, () => {
  getLeaderboardData()
  getFavoriteData()
}, { deep: true })

watch(() => usePriceStore(), () => {
  getLeaderboardData()
  getFavoriteData()
}, { deep: true })
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

const router = useRouter()
const { t } = useI18n()

const onPriceStatusChange = usePriceStatus("dashboard-price-status")
// 离开页面时重置
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

      <PriceStatusSelect
        @change="onPriceStatusChange"
      />
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
                <el-input style="width:100px" v-model="ldSearchData.name" :placeholder="t('请输入')" clearable @input="handleInput" />
              </el-form-item>
              <el-form-item prop="phone" :label="t('动作')">
                <el-select v-model="ldSearchData.project" :placeholder="t('请选择')" style="width:100px" clearable @change="handleSearchLD">
                  <el-option :label="t('挤奶')" :value="t('挤奶')" />
                  <el-option :label="t('采摘')" :value="t('采摘')" />
                  <el-option :label="t('伐木')" :value="t('伐木')" />
                  <el-option :label="t('锻造')" :value="t('锻造')" />
                  <el-option :label="t('制造')" :value="t('制造')" />
                  <el-option :label="t('裁缝')" :value="t('裁缝')" />
                  <el-option :label="t('烹饪')" :value="t('烹饪')" />
                  <el-option :label="t('冲泡')" :value="t('冲泡')" />
                  <el-option :label="t('点金')" :value="t('点金')" />
                  <el-option :label="t('分解')" :value="t('分解')" />
                  <el-option :label="t('转化')" :value="t('转化')" />
                </el-select>
              </el-form-item>

              <el-form-item prop="name" :label="`${t('利润率')} >`">
                <el-input style="width:60px" v-model="ldSearchData.profitRate" :placeholder="t('请输入')" clearable @input="handleSearchLD" />&nbsp;%
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="ldSearchData.banEquipment" @change="handleSearchLD">
                  {{ t('排除装备') }}
                </el-checkbox>
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
              <el-table-column width="54">
                <template #default="{ row }">
                  <ItemIcon v-if="row.catalyst" :hrid="`/items/${row.catalyst}`" />
                </template>
              </el-table-column>
              <el-table-column prop="project" :label="t('动作')" />
              <el-table-column prop="actionLevel" :label="t('要求等级')" align="center">
                <template #default="{ row }">
                  <div :class="row.actionLevel > getActionConfigOf(row.action).playerLevel ? 'red' : ''">
                    {{ row.actionLevel }}
                  </div>
                </template>
              </el-table-column>
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
              <el-table-column prop="result.profitPHFormat" :label="t('利润 / h')" align="center" min-width="120" />
              <el-table-column prop="result.profitRate" :label="t('利润率')" min-width="120" align="center" sortable="custom" :sort-orders="['descending', null]">
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
              <el-table-column prop="favorite" :label="t('收藏')" align="center" sortable="custom" :sort-orders="['descending', null]">
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
        <ManualPriceCard memory-key="dashboard" />
      </el-col>
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="14">
        <el-card>
          <template #header>
            <el-form class="rank-card" ref="frSearchFormRef" :inline="true" :model="frSearchData">
              <div class="title">
                {{ t('收藏夹') }}
              </div>
              <el-form-item prop="name" :label="t('物品')">
                <el-input style="width:100px" v-model="frSearchData.name" :placeholder="t('请输入')" clearable @input="handleSearchMN" />
              </el-form-item>
              <el-form-item prop="phone" :label="t('动作')">
                <el-select v-model="frSearchData.project" :placeholder="t('请选择')" style="width:100px" clearable @change="handleSearchMN">
                  <el-option :label="t('挤奶')" :value="t('挤奶')" />
                  <el-option :label="t('采摘')" :value="t('采摘')" />
                  <el-option :label="t('伐木')" :value="t('伐木')" />
                  <el-option :label="t('锻造')" :value="t('锻造')" />
                  <el-option :label="t('制造')" :value="t('制造')" />
                  <el-option :label="t('裁缝')" :value="t('裁缝')" />
                  <el-option :label="t('烹饪')" :value="t('烹饪')" />
                  <el-option :label="t('冲泡')" :value="t('冲泡')" />
                  <el-option :label="t('点金')" :value="t('点金')" />
                  <el-option :label="t('分解')" :value="t('分解')" />
                  <el-option :label="t('转化')" :value="t('转化')" />
                </el-select>
              </el-form-item>
            </el-form>
          </template>
          <template #default>
            <el-table :data="favoriteData" v-loading="loadingFR">
              <el-table-column width="54">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column prop="result.name" :label="t('物品')" />
              <el-table-column width="54">
                <template #default="{ row }">
                  <ItemIcon v-if="row.catalyst" :hrid="`/items/${row.catalyst}`" />
                </template>
              </el-table-column>
              <el-table-column prop="project" :label="t('动作')" />
              <el-table-column :label="t('利润 / 天')">
                <template #default="{ row }">
                  <span :class="row.hasManualPrice ? 'manual' : ''">
                    {{ row.result.profitPDFormat }}&nbsp;
                  </span>
                  <el-link v-if="usePriceStore().activated" type="primary" :icon="Edit" @click="setPrice(row)">
                    {{ t('自定义') }}
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="result.profitPHFormat" :label="t('利润 / h')" align="center" min-width="120" />
              <el-table-column prop="result.profitRateFormat" :label="t('利润率')" align="center" min-width="120" />
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
              <el-table-column :label="t('详情')">
                <template #default="{ row }">
                  <el-link type="primary" :icon="Search" @click="showDetail(row)">
                    {{ t('查看') }}
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column :label="t('操作')">
                <template #default="{ row }">
                  <el-link type="danger" :icon=" Delete" @click="deleteFavorite(row)">
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

.red {
  color: #f56c6c;
}
.green {
  color: #67c23a;
}
</style>
