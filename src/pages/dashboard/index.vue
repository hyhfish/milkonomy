<script lang="ts" setup>
import type { LeaderboardData } from "@/common/apis/leaderboard/type"
import type { FormInstance } from "element-plus"
import type { DropTableItem, Item, ItemDetail } from "~/game"
import { getItemDetailOf } from "@/common/apis/game"
import { getLeaderboardDataApi } from "@@/apis/leaderboard"
import { usePagination } from "@@/composables/usePagination"
import { Plus, Refresh, Search } from "@element-plus/icons-vue"

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

const sourceItem = ref<ItemDetail>()
const transmuteDropTable = ref<DropTableItem[]>([])
const detailLoading = ref<boolean>(false)
async function getDetail(row: LeaderboardData) {
  transmuteDropTable.value = []
  detailLoading.value = true
  try {
    sourceItem.value = (await getItemDetailOf(row.hrid))
    transmuteDropTable.value = sourceItem.value.alchemyDetail.transmuteDropTable
  } finally {
    detailLoading.value = false
  }
}
function handleSelfSelect() {
  console.log("加入自选")
}
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading">
      <template #header>
        <!-- <div class="card-header">
          <span>Card name</span>
        </div> -->
        <el-form class="rank-card" ref="searchFormRef" :inline="true" :model="searchData">
          <div class="title">
            扫单填单利润排行
          </div>
          <el-form-item prop="username" label="项目">
            <el-input v-model="searchData.username" placeholder="请输入" />
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
          <el-table-column prop="name" label="物品" />
          <el-table-column prop="project" label="项目" />
          <el-table-column prop="profitPD" label="利润" />
          <el-table-column prop="profitRate" label="利润率" />
          <el-table-column label="详情">
            <template #default="{ row }">
              <el-popover placement="top" width="50%" @show="getDetail(row)">
                <template #default>
                  <div class="detail-wrapper">
                    <el-card v-loading="detailLoading" shadow="never">
                      <div>{{ sourceItem?.hrid }}</div>
                    </el-card>
                    <el-icon class="transition" :size="36">
                      <DArrowRight />
                    </el-icon>
                    <el-card v-loading="detailLoading" shadow="never">
                      <div v-for="item in transmuteDropTable" :key="item.itemHrid">
                        <div>
                          {{ item.itemHrid }}
                        </div>
                      </div>
                    </el-card>
                  </div>
                  <div style="text-align: center;">
                    <el-button type="primary" :icon="Plus" @click="handleSelfSelect">
                      加入自选
                    </el-button>
                  </div>
                </template>
                <template #reference>
                  <el-link type="primary" :icon="Search">
                    查看
                  </el-link>
                </template>
              </el-popover>
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
  </div>
</template>

<style lang="scss" scoped>
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
}
</style>
