<script lang="ts" setup>
import type Calculator from "@/calculator"
import type { IngredientPriceConfig } from "@/calculator"
import type { LeaderboardData } from "@/common/apis/leaderboard/type"
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

// #region 查
const manualStore = useManualStore()
const { paginationData: paginationDataLD, handleCurrentChange: handleCurrentChangeLD, handleSizeChange: handleSizeChangeLD } = usePagination()
const leaderboardData = ref<LeaderboardData[]>([])
const ldSearchFormRef = ref<FormInstance | null>(null)
const ldSearchData = reactive({
  name: "",
  project: "",
  profitRate: 1,
  banEquipment: false,
  catalystRank: 0
})

function getLeaderboardData() {
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
  })
}
function handleSearchLD() {
  paginationDataLD.currentPage === 1 ? getLeaderboardData() : (paginationDataLD.currentPage = 1)
}
// 监听分页参数的变化
watch([() => paginationDataLD.currentPage, () => paginationDataLD.pageSize, () => getGameDataApi()], getLeaderboardData, { immediate: true })

const { paginationData: paginationDataMN, handleCurrentChange: handleCurrentChangeMN, handleSizeChange: handleSizeChangeMN } = usePagination()
const manualData = ref<LeaderboardData[]>([])
const mnSearchFormRef = ref<FormInstance | null>(null)
const mnSearchData = reactive({
  name: "",
  project: "",
  catalystRank: 0
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

const currentRow = ref<LeaderboardData>()
const currentCalculator = ref<Calculator>()
const detailVisible = ref<boolean>(false)
async function getDetail(row: LeaderboardData) {
  currentRow.value = row
  currentCalculator.value = row.calculator
}
async function showDetail(row: LeaderboardData) {
  detailVisible.value = true
  getDetail(row)
}
function addManual(row: LeaderboardData) {
  const r = row || currentRow.value!
  try {
    addManualApi(r)
    detailVisible.value = false
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

function deleteManual(row: LeaderboardData) {
  try {
    deleteManualApi(row)
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

const priceVisible = ref<boolean>(false)
const currentPriceRow = ref<LeaderboardData>()
const currentIngredientPriceConfigList = ref<IngredientPriceConfig[]>([])
const currentProductPriceConfigList = ref<IngredientPriceConfig[]>([])
function setPrice(row: LeaderboardData) {
  currentPriceRow.value = row
  currentIngredientPriceConfigList.value = row.calculator.ingredientListWithPrice.map((_, i) => ({
    manualPrice: row.calculator.ingredientPriceConfigList[i]?.manualPrice,
    manual: row.calculator.ingredientPriceConfigList[i]?.manual
  }))
  currentProductPriceConfigList.value = row.calculator.productListWithPrice.map((_, i) => ({
    manualPrice: row.calculator.productPriceConfigList[i]?.manualPrice,
    manual: row.calculator.productPriceConfigList[i]?.manual
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
              <el-form-item>
                <el-checkbox v-model="ldSearchData.catalystRank" :true-value="1" :false-value="0" @change="handleSearchLD">
                  催化剂
                </el-checkbox>
                <el-checkbox v-model="ldSearchData.catalystRank" :true-value="2" :false-value="0" @change="handleSearchLD">
                  主要催化剂
                </el-checkbox>
              </el-form-item>
            </el-form>
            <div style="font-size:12px;color:#999">
              默认工具（+10）、技能100级、房子（4级）、装备（+10），使用工匠茶、效率茶、催化茶，未计算喝茶价格及稀有掉落
            </div>
          </template>
          <template #default>
            <el-table :data="leaderboardData">
              <el-table-column prop="name" width="54">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column prop="name" label="物品" />

              <el-table-column prop="project" label="项目" />
              <el-table-column prop="calculator.actionLevel" label="等级" />
              <el-table-column prop="profitPDFormat" label="利润 / 天" />
              <el-table-column prop="profitRateFormat" label="利润率" />
              <el-table-column label="详情">
                <template #default="{ row }">
                  <el-link type="primary" :icon="Search" @click="showDetail(row)">
                    查看
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="{ row }">
                  <el-link v-if="!manualStore.hasManual(row.calculator)" type="success" :icon="Plus" @click="addManual(row)">
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
              <el-checkbox v-model="mnSearchData.catalystRank" :true-value="1" :false-value="0" @change="handleSearchMN">
                催化剂
              </el-checkbox>
              <el-checkbox v-model="mnSearchData.catalystRank" :true-value="2" :false-value="0" @change="handleSearchMN">
                主要催化剂
              </el-checkbox>
            </el-form>
            <div style="font-size:12px;color:#999">
              默认工具（+10）、技能100级、房子（4级）、装备（+10），使用工匠茶、效率茶、催化茶，未计算喝茶价格及稀有掉落
            </div>
          </template>
          <template #default>
            <el-table :data="manualData">
              <el-table-column prop="name" width="54">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column prop="name" label="物品" />
              <el-table-column prop="project" label="项目" />
              <el-table-column prop="profitPDFormat" label="利润 / 天">
                <template #default="{ row }">
                  {{ row.profitPDFormat }}&nbsp;
                  <el-link type="primary" :icon="Edit" @click="setPrice(row)">
                    自定义
                  </el-link>
                </template>
              </el-table-column>
              <el-table-column prop="profitRateFormat" label="利润率" />
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
    <!-- 去掉关闭按钮 -->
    <el-dialog v-model="detailVisible" :show-close="false" width="80%">
      <el-row :gutter="10" style="padding: 0 20px">
        <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
          <div style="font-size:12px;color:#999;margin-bottom:10px">
            如果当前市场价格 {{ '<' }} 显示价格，则价格为<span class="green">绿色</span>，反之为<span class="red">红色</span>
          </div>
          <el-card>
            <div v-for="item in currentCalculator?.ingredientListWithPrice" :key="item.hrid" class="item-wrapper">
              <div class="item-name">
                <div style="width:30px">
                  <ItemIcon :hrid="item.hrid" />
                </div>
                <div>{{ getItemDetailOf(item.hrid).name }}</div>
              </div>
              <div style="min-width:60px">
                {{ item.count }}个
              </div>
              <div style="min-width:80px" :class="item.price < item.marketPrice ? item.price > item.marketPrice ? 'green' : 'red' : ''">
                {{ Format.money(item.price) }}
              </div>
              <div style="min-width:60px">
                {{ Format.number(item.count * currentRow?.consumePH!, 3) }} / h
              </div>
            </div>
            <div>
              成本：{{ currentRow?.costPHFormat }} / h
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="4" :xl="4">
          <div class="param-wrapper">
            <div v-if="currentCalculator?.efficiencyTea">
              效率茶
            </div>
            <div v-if="currentCalculator?.artisanTea">
              工匠茶
            </div>
            <div v-if="currentCalculator?.gourmetTea">
              双倍茶
            </div>
            <div v-if="currentCalculator?.successRate! < 1">
              成功率：{{ currentRow?.successRateFormat }}
            </div>
            <div>效率：{{ currentRow?.efficiencyFormat }}</div>
            <div>时间：{{ currentRow?.timeCostFormat }}</div>
            <el-icon class="transition" :size="36">
              <DArrowRight />
            </el-icon>
          </div>
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
          <div style="font-size:12px;color:#999;margin-bottom:10px">
            如果当前市场价格 > 显示价格，则价格为<span class="green">绿色</span>，反之为<span class="red">红色</span>
          </div>
          <el-card>
            <div v-for="(item) in currentCalculator?.productListWithPrice" :key="item.hrid" class="item-wrapper">
              <div class="item-name">
                <div style="width:30px">
                  <ItemIcon :hrid="item.hrid" />
                </div>
                <div>
                  {{ getItemDetailOf(item.hrid).name }}
                </div>
              </div>
              <div style="min-width:60px" v-if="item.rate">
                {{ Math.floor(item.rate * 1000000) / 10000 }}%
              </div>
              <div style="min-width:80px" :class="item.price > item.marketPrice ? item.price < item.marketPrice ? 'green' : 'red' : ''">
                {{ Format.money(item.price) }}
              </div>
              <div style="min-width:60px">
                {{ Format.number((item.rate || 1) * item.count * currentRow?.gainPH!, 3) }} / h
              </div>
            </div>
            <div>收入：{{ currentRow?.incomePHFormat }} / h</div>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>
    <el-dialog v-model="priceVisible" :show-close="false" width="80%">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="12">
          <el-card>
            <el-table :data="currentPriceRow?.calculator.ingredientListWithPrice">
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
            <el-table :data="currentPriceRow?.calculator.productListWithPrice">
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
.param-wrapper {
  margin-top: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  * {
    margin-bottom: 10px;
  }
}
.item-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  .item-name {
    display: flex;
    align-items: center;
    div {
      margin-right: 10px;
    }
  }
}

.red {
  color: #f56c6c;
}
.green {
  color: #67c23a;
}
</style>
