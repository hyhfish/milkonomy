<script lang="ts" setup>
import type Calculator from "@/calculator"
import type { IngredientPriceConfig } from "@/calculator"
import type { FormInstance } from "element-plus"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getGameDataApi, getItemDetailOf, getMarketDataApi } from "@/common/apis/game"
import { addManualApi, deleteManualApi, getManualDataApi, setPriceApi } from "@/common/apis/manual"
import * as Format from "@/common/utils/format"
import { useManualStore } from "@/pinia/stores/manual"
import { getLeaderboardDataApi } from "@@/apis/leaderboard"
import ItemIcon from "@@/components/ItemIcon/index.vue"
import { usePagination } from "@@/composables/usePagination"
import { Delete, Edit, Plus, Search } from "@element-plus/icons-vue"
import ActionDetail from "./components/ActionDetail.vue"

// #region 查
const manualStore = useManualStore()
const { paginationData: paginationDataLD, handleCurrentChange: handleCurrentChangeLD, handleSizeChange: handleSizeChangeLD } = usePagination()
const leaderboardData = ref<Calculator[]>([])
const ldSearchFormRef = ref<FormInstance | null>(null)
const ldSearchData = reactive({
  name: "",
  project: "",
  profitRate: 10,
  banEquipment: true
})

const loading = ref(false)

function getLeaderboardData() {
  loading.value = true
  getLeaderboardDataApi({
    currentPage: paginationDataLD.currentPage,
    size: paginationDataLD.pageSize,
    ...ldSearchData
  }).then((data) => {
    paginationDataLD.total = data.total
    leaderboardData.value = data.list
    console.log("getLeaderboardData", data)
  }).catch(() => {
    leaderboardData.value = []
  }).finally(() => {
    loading.value = false
  })
}
function handleSearchLD() {
  paginationDataLD.currentPage === 1 ? getLeaderboardData() : (paginationDataLD.currentPage = 1)
}
// 监听分页参数的变化
watch([() => paginationDataLD.currentPage, () => paginationDataLD.pageSize, () => getGameDataApi()], getLeaderboardData, { immediate: true })

const { paginationData: paginationDataMN, handleCurrentChange: handleCurrentChangeMN, handleSizeChange: handleSizeChangeMN } = usePagination()
const manualData = ref<Calculator[]>([])
const mnSearchFormRef = ref<FormInstance | null>(null)
const mnSearchData = reactive({
  name: "",
  project: ""
})

function getManualData() {
  getManualDataApi({
    currentPage: paginationDataMN.currentPage,
    size: paginationDataMN.pageSize,
    ...mnSearchData
  }).then((data) => {
    paginationDataMN.total = data.total
    manualData.value = data.list
    console.log("getManualData", data)
  }).catch(() => {
    manualData.value = []
  })
}

function handleSearchMN() {
  paginationDataMN.currentPage === 1 ? getManualData() : (paginationDataMN.currentPage = 1)
}
// 监听分页参数的变化
watch([() => paginationDataMN.currentPage, () => paginationDataMN.pageSize, () => getGameDataApi()], getManualData, { immediate: true })

watch(() => manualStore, () => {
  getManualData()
}, { deep: true })
// #endregion

const currentRow = ref<Calculator>()
const detailVisible = ref<boolean>(false)
async function showDetail(row: Calculator) {
  detailVisible.value = true
  currentRow.value = row
}
function addManual(row: Calculator) {
  const r = row || currentRow.value!
  try {
    addManualApi(r)
    detailVisible.value = false
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

function deleteManual(row: Calculator) {
  try {
    deleteManualApi(row)
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}
const priceVisible = ref<boolean>(false)
const currentPriceRow = ref<Calculator>()
const currentIngredientPriceConfigList = ref<IngredientPriceConfig[]>([])
const currentProductPriceConfigList = ref<IngredientPriceConfig[]>([])
function setPrice(row: Calculator) {
  currentPriceRow.value = row
  currentIngredientPriceConfigList.value = row.ingredientListWithPrice.map((_, i) => ({
    manualPrice: row.ingredientPriceConfigList[i]?.manualPrice,
    manual: row.ingredientPriceConfigList[i]?.manual
  }))
  currentProductPriceConfigList.value = row.productListWithPrice.map((_, i) => ({
    manualPrice: row.productPriceConfigList[i]?.manualPrice,
    manual: row.productPriceConfigList[i]?.manual
  }))
  priceVisible.value = true
}

function handleSetPrice() {
  try {
    setPriceApi(currentPriceRow.value!, currentIngredientPriceConfigList.value, currentProductPriceConfigList.value)
    priceVisible.value = false
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
    </div>
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="12">
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
              默认工具（+10）、技能100级、房子（4级）、装备（+10），使用工匠茶、效率茶、催化茶，未计算喝茶价格及稀有掉落
            </div>
          </template>
          <template #default>
            <el-table :data="leaderboardData" v-loading="loading">
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
              <el-table-column prop="actionLevel" label="等级" />
              <el-table-column prop="result.profitPDFormat" label="利润 / 天" />
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
                  <el-link v-if="!manualStore.hasManual(row)" type="success" :icon="Plus" @click="addManual(row)">
                    自选
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
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="12">
        <el-card>
          <template #header>
            <el-form class="rank-card" ref="mnSearchFormRef" :inline="true" :model="mnSearchData">
              <div class="title">
                自选利润排行
              </div>
              <el-form-item prop="name" label="物品">
                <el-input style="width:100px" v-model="mnSearchData.name" placeholder="请输入" clearable @input="handleSearchMN" />
              </el-form-item>
              <el-form-item prop="phone" label="项目">
                <el-select v-model="mnSearchData.project" placeholder="请选择" style="width:100px" clearable @change="handleSearchMN">
                  <el-option label="锻造" value="锻造" />
                  <el-option label="制造" value="制造" />
                  <el-option label="裁缝" value="裁缝" />
                  <el-option label="烹饪" value="烹饪" />
                  <el-option label="冲泡" value="冲泡" />
                  <el-option label="重组" value="重组" />
                  <el-option label="分解" value="分解" />
                </el-select>
              </el-form-item>
            </el-form>
            <div style="font-size:12px;color:#999">
              默认工具（+10）、技能100级、房子（4级）、装备（+10），使用工匠茶、效率茶、催化茶，未计算喝茶价格及稀有掉落
            </div>
          </template>
          <template #default>
            <el-table :data="manualData">
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
              <el-table-column prop="result.profitPDFormat" label="利润 / 天">
                <template #default="{ row }">
                  {{ row.result.profitPDFormat }}&nbsp;
                  <el-link type="primary" :icon="Edit" @click="setPrice(row)">
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
                  <el-link type="danger" :icon=" Delete" @click="deleteManual(row)">
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
                @size-change="handleSizeChangeMN"
                @current-change="handleCurrentChangeMN"
              />
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>
    <ActionDetail v-model="detailVisible" :data="currentRow" />
    <el-dialog v-model="priceVisible" :show-close="false" width="80%">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="12">
          <el-card>
            <el-table :data="currentPriceRow?.ingredientListWithPrice">
              <el-table-column label="物品" width="54">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column label="物品">
                <template #default="{ row }">
                  {{ getItemDetailOf(row.hrid).name }}
                </template>
              </el-table-column>
              <el-table-column prop="price" label="市场价格">
                <template #default="{ row }">
                  {{ Format.money(row.marketPrice) }}
                </template>
              </el-table-column>

              <el-table-column label="自定义价格">
                <template #default="{ row, $index }">
                  <el-checkbox style="margin-right: 10px;" v-if="row.hrid !== ManufactureCalculator.COIN_HRID" v-model="currentIngredientPriceConfigList[$index].manual" />
                  <el-input-number v-if="currentIngredientPriceConfigList[$index].manual" v-model="currentIngredientPriceConfigList[$index].manualPrice" :controls="false" />
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="12">
          <el-card>
            <el-table :data="currentPriceRow?.productListWithPrice">
              <el-table-column prop="name" label="物品" width="54">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column prop="name" label="物品">
                <template #default="{ row }">
                  {{ getItemDetailOf(row.hrid).name }}
                </template>
              </el-table-column>
              <el-table-column prop="price" label="市场价格">
                <template #default="{ row }">
                  {{ Format.money(row.marketPrice) }}
                </template>
              </el-table-column>
              <el-table-column label="自定义价格">
                <template #default="{ row, $index }">
                  <el-checkbox style="margin-right: 10px;" v-if="row.hrid !== ManufactureCalculator.COIN_HRID" v-model="currentProductPriceConfigList[$index].manual" />
                  <el-input-number v-if="currentProductPriceConfigList[$index].manual" v-model="currentProductPriceConfigList[$index].manualPrice" :controls="false" />
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <template #footer>
        <div style="text-align: center;">
          <el-button type="primary" @click="handleSetPrice">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.game-info {
  display: flex;
  margin-bottom: 20px;
  font-size: 14px;
  * {
    margin-right: 20px;
  }
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
</style>
