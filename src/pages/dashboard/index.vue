<script lang="ts" setup>
import type { LeaderboardData } from "@/common/apis/leaderboard/type"
import type { FormInstance } from "element-plus"
import type { DropTableItem, ItemDetail } from "~/game"
import { getGameDataApi, getItemDetailOf, getMarketDataApi, getPriceOf } from "@/common/apis/game"
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
  name: ""
})
function getLeaderboardData() {
  loading.value = true
  getLeaderboardDataApi({
    currentPage: paginationData.currentPage,
    size: paginationData.pageSize,
    name: searchData.name
  }).then((data) => {
    paginationData.total = data.total
    leaderboardData.value = data.list
    console.log(data)
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
watch([() => paginationData.currentPage, () => paginationData.pageSize], getLeaderboardData, { immediate: true })
// #endregion

const currentRow = ref<LeaderboardData>()
const sourceItem = ref<ItemDetail>()
const transmuteDropTable = ref<DropTableItem[]>([])
const transmuteItemList = ref<ItemDetail[]>([])
const detailVisible = ref<boolean>(false)
const detailLoading = ref<boolean>(false)
async function getDetail(row: LeaderboardData) {
  transmuteDropTable.value = []
  transmuteItemList.value = []
  currentRow.value = row
  sourceItem.value = undefined
  detailLoading.value = true
  try {
    sourceItem.value = getItemDetailOf(row.hrid)
    transmuteDropTable.value = sourceItem.value.alchemyDetail.transmuteDropTable
    transmuteItemList.value = sourceItem.value.alchemyDetail.transmuteDropTable.map(item => getItemDetailOf(item.itemHrid))
  } finally {
    detailLoading.value = false
  }
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
      <div>MWI版本：{{ getGameDataApi().gameVersion }}</div>
      <div
        :class="{
          error: getMarketDataApi().time < Date.now() - 1000 * 60 * 60,
          success: getMarketDataApi().time > Date.now() - 1000 * 60 * 60,
        }"
      >
        市场数据更新时间:{{ new Date(getMarketDataApi().time * 1000).toLocaleString() }}
      </div>
    </div>
    <el-card v-loading="loading">
      <template #header>
        <el-form class="rank-card" ref="searchFormRef" :inline="true" :model="searchData">
          <div class="title">
            扫单填单利润排行
          </div>
          <el-form-item prop="name" label="物品">
            <el-input v-model="searchData.name" placeholder="请输入" />
          </el-form-item>
          <!-- <el-form-item prop="phone" label="物品">
            <el-input v-model="searchData.name" placeholder="请输入" />
          </el-form-item> -->
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">
              查询
            </el-button>
            <el-button :icon="Refresh" @click="resetSearch">
              重置
            </el-button>
          </el-form-item>
        </el-form>
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
    <el-dialog v-model="detailVisible" :show-close="false">
      <div class="detail-wrapper">
        <el-card v-loading="detailLoading">
          <div class="item-wrapper">
            <ItemIcon :hrid="sourceItem?.hrid" />
            <div>{{ sourceItem?.name }}</div>
            <div>
              {{ sourceItem && Format.money(getPriceOf(sourceItem.hrid).ask) }}
            </div>
            <div>{{ currentRow?.consumePHFormat }} / h</div>
          </div>
          <div>
            成本：{{ currentRow?.costPHFormat }} / h
          </div>
        </el-card>

        <div class="param-wrapper">
          <div>效率：{{ currentRow?.efficiencyFormat }}</div>
          <div>时间：{{ currentRow?.timeCostFormat }}</div>
          <el-icon class="transition" :size="36">
            <DArrowRight />
          </el-icon>
        </div>
        <el-card v-loading="detailLoading">
          <div v-for="(item, i) in transmuteDropTable" class="item-wrapper" :key="item.itemHrid">
            <ItemIcon :hrid="item.itemHrid" />
            <div>{{ transmuteItemList[i]?.name }}</div>
            <!-- <div>{{ Math.floor(item.dropRate * 1000000) / 10000 }}%</div> -->
            <div>
              {{ Format.money(getPriceOf(item.itemHrid).bid) }}
            </div>
            <div>
              {{ Format.number(item.dropRate * item.maxCount * currentRow?.gainPH!, 3) }} / h
            </div>
          </div>
          <div>收入：{{ currentRow?.incomePHFormat }} / h</div>
        </el-card>
      </div>

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
.detail-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px;
  .transition {
    margin: 0 20px;
  }

  .param-wrapper {
    margin: 0 20px;
  }
  .item-wrapper {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    * {
      margin-right: 10px;
    }
  }
}
</style>
