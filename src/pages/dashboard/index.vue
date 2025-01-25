<script lang="ts" setup>
import type Calculator from "@/calculator"
import type { LeaderboardData } from "@/common/apis/leaderboard/type"
import type { FormInstance } from "element-plus"
import { getGameDataApi, getItemDetailOf, getMarketDataApi } from "@/common/apis/game"
import * as Format from "@/common/utils/format"
import { getLeaderboardDataApi } from "@@/apis/leaderboard"
import ItemIcon from "@@/components/ItemIcon/index.vue"
import { usePagination } from "@@/composables/usePagination"
import { Refresh, Search } from "@element-plus/icons-vue"

// #region 查
const loading = ref<boolean>(false)
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const leaderboardData = ref<LeaderboardData[]>([])
const searchFormRef = ref<FormInstance | null>(null)
const searchData = reactive({
  name: "",
  project: ""
})
function getLeaderboardData() {
  loading.value = true
  getLeaderboardDataApi({
    currentPage: paginationData.currentPage,
    size: paginationData.pageSize,
    ...searchData
  }).then((data) => {
    paginationData.total = data.total
    leaderboardData.value = data.list
    console.log("getLeaderboardData", data)
  }).catch(() => {
    leaderboardData.value = []
  }).finally(() => {
    loading.value = false
  })
}
function handleSearch() {
  paginationData.currentPage === 1 ? getLeaderboardData() : (paginationData.currentPage = 1)
}
function resetSearch() {
  searchFormRef.value?.resetFields()
  handleSearch()
}
// 监听分页参数的变化
watch([() => paginationData.currentPage, () => paginationData.pageSize, () => getGameDataApi()], getLeaderboardData, { immediate: true })

// #endregion

const currentRow = ref<LeaderboardData>()
const currentCalculator = ref<Calculator>()
const detailVisible = ref<boolean>(false)
const detailLoading = ref<boolean>(false)
async function getDetail(row: LeaderboardData) {
  currentRow.value = row
  currentCalculator.value = row.calculator
}
async function showDetail(row: LeaderboardData) {
  detailVisible.value = true
  getDetail(row)
}
function handleSelfSelect() {
  console.log("加入自选")
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
    <el-card v-loading="loading">
      <template #header>
        <el-form class="rank-card" ref="searchFormRef" :inline="true" :model="searchData">
          <div class="title">
            扫单填单利润排行
          </div>
          <el-form-item prop="name" label="物品">
            <el-input style="width:100px" v-model="searchData.name" placeholder="请输入" clearable />
          </el-form-item>
          <el-form-item prop="phone" label="项目">
            <el-select v-model="searchData.project" placeholder="请选择" style="width:100px" clearable>
              <el-option label="锻造" value="锻造" />
              <el-option label="制造" value="制造" />
              <el-option label="裁缝" value="裁缝" />
              <el-option label="烹饪" value="烹饪" />
              <el-option label="冲泡" value="冲泡" />
              <el-option label="重组" value="重组" />
              <el-option label="分解" value="分解" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">
              查询
            </el-button>
            <el-button :icon="Refresh" @click="resetSearch">
              重置
            </el-button>
          </el-form-item>
        </el-form>
        <div style="font-size:12px;color:#999">
          默认工具（+10）、技能100级、房子（4级）、装备（+10），使用工匠茶、效率茶、催化茶，未计算精华、稀有掉落
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
          <el-table-column prop="profitPDFormat" label="利润 / 天" />
          <el-table-column prop="profitRateFormat" label="利润率" />
          <el-table-column label="详情">
            <template #default="{ row }">
              <el-link type="primary" :icon="Search" @click="showDetail(row)">
                查看
              </el-link>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <div class="pager-wrapper">
          <el-pagination
            background
            :layout="paginationData.layout"
            :page-sizes="paginationData.pageSizes"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :current-page="paginationData.currentPage"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </template>
    </el-card>
    <!-- 去掉关闭按钮 -->
    <el-dialog v-model="detailVisible" :show-close="false" width="80%">
      <el-row :gutter="10" style="padding: 0 20px">
        <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
          <el-card v-loading="detailLoading">
            <div v-for="item in currentCalculator?.ingredientList" :key="item.hrid" class="item-wrapper">
              <div class="item-name">
                <div style="width:30px">
                  <ItemIcon :hrid="item.hrid" />
                </div>
                <div>{{ getItemDetailOf(item.hrid).name }}</div>
              </div>
              <div style="min-width:60px">
                {{ item.count }}个
              </div>
              <div style="min-width:80px">
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
            <div v-if="currentCalculator?.successRate! < 1">
              成功率：{{ currentRow?.successRateFormat }}
            </div>
            <div v-if="currentCalculator?.artisan">
              工匠茶
            </div>
            <div v-if="currentCalculator?.gourmet">
              双倍茶
            </div>
            <div>效率：{{ currentRow?.efficiencyFormat }}</div>
            <div>时间：{{ currentRow?.timeCostFormat }}</div>
            <el-icon class="transition" :size="36">
              <DArrowRight />
            </el-icon>
          </div>
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
          <el-card v-loading="detailLoading">
            <div v-for="(item) in currentCalculator?.productList" :key="item.hrid" class="item-wrapper">
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
              <div style="min-width:80px">
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

      <template #footer>
        <div style="text-align: center;">
          <el-button type="primary" @click="handleSelfSelect">
            加入自选
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
</style>
