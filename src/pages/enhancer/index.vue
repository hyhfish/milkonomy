<script lang="ts" setup>
import type { Action, ItemDetail } from "~/game"
import ItemIcon from "@@/components/ItemIcon/index.vue"

import * as Format from "@@/utils/format"
import { Star, StarFilled } from "@element-plus/icons-vue"
import { ElTable } from "element-plus"
import { EnhanceCalculator } from "@/calculator/enhance"
import { ManufactureCalculator } from "@/calculator/manufacture"
import { getItemDetailOf, getMarketDataApi, getPriceOf } from "@/common/apis/game"
import { getEquipmentList } from "@/common/apis/player"
import { useEnhancerStore } from "@/pinia/stores/enhancer"
import { COIN_HRID, useGameStore } from "@/pinia/stores/game"
import { usePlayerStore } from "@/pinia/stores/player"
import ActionConfig from "../dashboard/components/ActionConfig.vue"
import GameInfo from "../dashboard/components/GameInfo.vue"

const enhancerStore = useEnhancerStore()
const { t } = useI18n()

const dialogVisible = ref(false)
const search = ref("")
const equipmentList = computed(() => {
  return getEquipmentList().filter(item => t(item.name).toLocaleLowerCase().includes(search.value.toLowerCase())).sort((a, b) =>
    a.sortIndex - b.sortIndex
  )
})

const currentItem = ref<Item>({
  protection: {} as Ingredient,
  originPrice: 0
})
const manufactureIngredients = ref<Ingredient[]>([])
const enhancementCosts = ref<Ingredient[]>([])
const protectionList = ref<Ingredient[]>([])

const defaultConfig = {
  hourlyRate: 5000000,
  taxRate: 2,
  enhanceLevel: 10
}

onMounted(() => {
  enhancerStore.hrid && onSelect(getItemDetailOf(enhancerStore.hrid))
})

watch(
  () => enhancerStore.config,
  () => {
    enhancerStore.saveConfig()
  },
  { deep: true }
)

interface Ingredient {
  hrid: string
  count: number
  originPrice: number
  price?: number
}
interface Item {
  hrid?: string
  originPrice: number
  productPrice?: number
  price?: number
  protection?: Ingredient
}

const gearManufacture = ref(false)
watch([
  () => manufactureIngredients.value,
  () => gearManufacture.value
], resetPrice, { deep: true })

function onSelect(item: ItemDetail) {
  if (!item) {
    return
  }
  enhancerStore.config.hrid = item.hrid
  currentItem.value = {
    hrid: item.hrid,
    originPrice: 0
  }
  dialogVisible.value = false
  const projects: [string, Action][] = [
    [t("锻造"), "cheesesmithing"],
    [t("制造"), "crafting"],
    [t("裁缝"), "tailoring"]
  ]
  let calc: ManufactureCalculator
  for (const [project, action] of projects) {
    calc = new ManufactureCalculator({
      hrid: item.hrid,
      project,
      action
    })
    if (calc.available) {
      break
    }
  }
  manufactureIngredients.value = calc!.available
    ? calc!.ingredientList.filter(item => getItemDetailOf(item.hrid).categoryHrid !== "/item_categories/drink").map(item => ({
        hrid: item.hrid,
        count: item.count,
        originPrice: getPriceOf(item.hrid).ask
      }))
    : []

  enhancementCosts.value = item.enhancementCosts!.map(item => ({
    hrid: item.itemHrid,
    count: item.count,
    originPrice: getPriceOf(item.itemHrid).ask
  }))

  protectionList.value = item.protectionItemHrids
    ? item.protectionItemHrids.map(hrid => ({
        hrid,
        count: 1,
        originPrice: getPriceOf(hrid).ask
      }))
    : []
  if (!protectionList.value.length) {
    protectionList.value.push({
      hrid: item.hrid,
      count: 1,
      originPrice: getPriceOf(item.hrid).ask
    })
  }

  protectionList.value.push({
    hrid: "/items/mirror_of_protection",
    count: 1,
    originPrice: getPriceOf("/items/mirror_of_protection").ask
  })

  // price最低的
  currentItem.value.protection = protectionList.value.reduce((acc: Ingredient, item) => {
    if (!acc) {
      return item
    }
    return acc.originPrice < item.originPrice ? acc : item
  })
}

const results = computed(() => {
  if (!currentItem.value.hrid) {
    return []
  }

  const result = []
  const enhanceLevel = enhancerStore.enhanceLevel ?? defaultConfig.enhanceLevel
  for (let i = 1; i <= enhanceLevel; ++i) {
    const calc = new EnhanceCalculator({
      hrid: currentItem.value.hrid,
      enhanceLevel,
      protectLevel: i
    })

    const { actions, protects } = calc.enhancelate()
    const matCost
        = enhancementCosts.value.reduce((acc, item) => {
          const price = typeof item.price === "number" ? item.price : item.originPrice
          return acc + (price * item.count * actions)
        }, 0) + (typeof currentItem.value.protection?.price === "number"
          ? currentItem.value.protection!.price
          : currentItem.value.protection!.originPrice) * protects

    const totalCostNoHourly = matCost + (typeof currentItem.value?.price === "number"
      ? currentItem.value!.price
      : currentItem.value!.originPrice)
    let totalCost = totalCostNoHourly + (enhancerStore.hourlyRate ?? defaultConfig.hourlyRate) * (actions / calc.actionsPH)
    totalCost *= (1 + (enhancerStore.taxRate ?? defaultConfig.taxRate) / 100)

    const productPrice = typeof currentItem.value.productPrice === "number"
      ? currentItem.value.productPrice
      : getPriceOf(currentItem.value.hrid, enhanceLevel).bid

    const hourlyCost = (productPrice * 0.98 - totalCostNoHourly) / actions * calc.actionsPH
    const profitPP = productPrice * 0.98 - totalCostNoHourly

    const seconds = actions / calc.actionsPH * 3600
    result.push({
      actions,
      actionsFormatted: Format.number(actions, 2),
      protects,
      protectsFormatted: Format.number(protects, 2),
      protectLevel: i,
      time: Format.costTime(seconds * 1000000000),
      expPHFormat: Format.money(calc.exp * calc.actionsPH),
      matCost: Format.money(matCost),
      totalCostFormatted: Format.money(totalCost),
      totalCost,
      totalCostNoHourly,
      matCostPH: `${Format.money(matCost / seconds * 3600)} / h`,
      hourlyCost,
      hourlyCostFormatted: Format.money(hourlyCost),
      profitPPFormatted: Format.money(profitPP),
      profitRateFormatted: Format.percent(profitPP / totalCostNoHourly)
    })
  }
  return result
})

const columnWidths = computed(() => {
  interface ResultItem {
    actions: number
    actionsFormatted: string
    protects: number
    protectsFormatted: string
    protectLevel: number
    time: string
    matCost: string
    totalCostFormatted: string
    matCostPH: string
  }
  if (!results.value.length) {
    return {}
  }

  const props = Object.keys(results.value[0]) as (keyof ResultItem)[]
  const widths: Record<string, number> = {}
  for (const prop of props) {
    const maxWidth = Math.max(...results.value.map(item => item[prop]?.toString().length || 0))
    widths[prop] = Math.max(maxWidth * 10 + 20, 60)
  }
  for (const item of enhancementCosts.value) {
    const maxWidth = Math.max(...results.value.map(result => (Format.number(item.count * result.actions)).toString().length || 0))
    widths[item.hrid] = Math.max(maxWidth * 10 + 20, 60)
  }
  return widths
})

const refTable = ref<InstanceType<typeof ElTable> | null>(null)
const tableWidth = computed(() => {
  const columns = refTable.value?.columns as unknown as any[] ?? []
  const width = columns.reduce((acc, item) => {
    return acc + (item.minWidth || 0)
  }, 0) ?? 0
  return Math.max(width + 100, 1100)
})

watch([
  () => getMarketDataApi(),
  () => usePlayerStore().config
], () => enhancerStore.hrid && onSelect(getItemDetailOf(enhancerStore.hrid)), { immediate: false })

function resetPrice() {
  if (!currentItem.value.hrid) {
    return
  }
  // 触发一次computed
  currentItem.value = JSON.parse(JSON.stringify(currentItem.value))

  if (!gearManufacture.value) {
    currentItem.value.originPrice = getPriceOf(currentItem.value.hrid!).ask
    return
  }
  const val = manufactureIngredients.value
  currentItem.value.originPrice = val.length
    ? val.reduce((acc, item) => {
        const price = typeof item.price === "number" ? item.price : item.originPrice
        return acc + (price * item.count)
      }, 0)
    : getPriceOf(currentItem.value.hrid!).ask

  manufactureIngredients.value.forEach((item) => {
    item.originPrice = getPriceOf(item.hrid).ask
  })
  enhancementCosts.value.forEach((item) => {
    item.originPrice = getPriceOf(item.hrid).ask
  })
}

function rowStyle({ row }: { row: any }) {
  // totalcost最小的为半透明浅绿色（内容不要透明）
  // totalCostNoHourly最小的为半透明浅蓝色

  if (enhancerStore.config.tab === "1") {
    if (row.hourlyCost === Math.max(...results.value.map(item => item.hourlyCost))) {
      return { background: "rgb(34, 68, 34)" }
    }
  } else {
    if (row.totalCost === Math.min(...results.value.map(item => item.totalCost))) {
      return { background: "rgb(34, 68, 34)" }
    }
  }
  if (row.totalCostNoHourly === Math.min(...results.value.map(item => item.totalCostNoHourly))) {
    return { background: "rgb(34, 51, 85)" }
  }
}

const menuVisible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedTag = ref("")
function openMenu(hrid: string, e: MouseEvent) {
  const menuMinWidth = 100
  // 当前页面宽度
  const offsetWidth = document.body.offsetWidth
  // 面板的最大左边距
  const maxLeft = offsetWidth - menuMinWidth
  // 面板距离鼠标指针的距离
  const left15 = e.clientX + 10
  left.value = left15 > maxLeft ? maxLeft : left15
  top.value = e.clientY
  // 显示面板
  menuVisible.value = true
  // 更新当前正在右键操作的标签页
  selectedTag.value = hrid
}

/** 关闭右键菜单面板 */
function closeMenu() {
  menuVisible.value = false
}

watch(menuVisible, (value) => {
  value ? document.body.addEventListener("click", closeMenu) : document.body.removeEventListener("click", closeMenu)
})
</script>

<template>
  <div class="app-container">
    <ul v-show="menuVisible" class="contextmenu" :style="{ left: `${left}px`, top: `${top}px` }">
      <li v-if="!enhancerStore.hasFavorite(selectedTag)" @click="enhancerStore.addFavorite(selectedTag)">
        收藏
      </li>
      <li v-else @click="enhancerStore.removeFavorite(selectedTag)">
        取消收藏
      </li>
    </ul>
    <div class="game-info">
      <GameInfo />

      <div>
        <ActionConfig :actions="['enhancing']" :equipments="['hands', 'neck', 'earrings', 'ring', 'pouch']" />
      </div>
    </div>
    <el-row :gutter="20" class="row max-w-1100px mx-auto!">
      <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8" class="max-w-400px mx-auto">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span>{{ t('装备成本') }}</span>
              <el-checkbox v-model="gearManufacture">
                {{ t('制作装备') }}
              </el-checkbox>
            </div>
          </template>
          <template v-if="gearManufacture && manufactureIngredients.length">
            <ElTable :data="manufactureIngredients" style="--el-table-border-color:none" :cell-style="{ padding: '0' }">
              <el-table-column :label="t('物品')">
                <template #default="{ row }">
                  <ItemIcon :hrid="row.hrid" />
                </template>
              </el-table-column>
              <el-table-column prop="count" :label="t('数量')">
                <template #default="{ row }">
                  {{ Format.number(row.count, 2) }}
                </template>
              </el-table-column>

              <el-table-column :label="t('价格')" align="center" min-width="120">
                <template #default="{ row }">
                  <el-input-number v-if="row.hrid !== COIN_HRID" class="max-w-100%" v-model="row.price" :placeholder="Format.number(row.originPrice)" :controls="false" />
                </template>
              </el-table-column>
            </ElTable>
            <el-divider class="mt-2 mb-2" />
          </template>
          <ElTable :data="[currentItem]" :show-header="false" style="--el-table-border-color:none">
            <el-table-column>
              <template #default="{ row }">
                <ItemIcon :hrid="row.hrid" />
              </template>
            </el-table-column>
            <el-table-column prop="count" />
            <el-table-column min-width="120" align="center">
              <template #default="{ row }">
                <el-input-number class="max-w-100%" v-model="row.price" :placeholder="Format.number(row.originPrice)" :controls="false" />
              </template>
            </el-table-column>
          </ElTable>
        </el-card>
      </el-col>
      <el-col :xs="16" :sm="10" :md="10" :lg="6" :xl="6" class="max-w-300px mx-auto">
        <el-card>
          <div style="position: relative; width: 100%; padding-bottom: 100%;">
            <ItemIcon
              :hrid="currentItem?.hrid"
              style="position: absolute; bottom:10%; left:10%; width: 80%; height: 80%;"
            />
            <el-button style="position: absolute; width: 100%; height: 100%; opacity: 0.5;" @click="dialogVisible = true, search = ''">
              {{ currentItem?.hrid ? '' : t('选择装备') }}
            </el-button>
            <div v-if="currentItem?.hrid" class="absolute bottom-0 right-0">
              <el-link v-if="!enhancerStore.hasFavorite(currentItem.hrid)" :underline="false" type="info" :icon="Star" @click="enhancerStore.addFavorite(currentItem.hrid)" style="font-size:42px" />
              <el-link v-else :underline="false" :icon="StarFilled" type="primary" @click="enhancerStore.removeFavorite(currentItem.hrid)" style="font-size:42px" />
            </div>
            <el-dialog
              v-model="dialogVisible"
              :show-close="false"
            >
              <el-input v-model="search" :placeholder="t('搜索')" />
              <template v-if="enhancerStore.favorite.length && !search">
                <el-divider class="mt-2 mb-2" />
                <div class="mb-2 color-gray-500">
                  {{ t('收藏') }}
                  <span color-gray-600>
                    ({{ t('右键/长按取消收藏') }})</span>
                </div>
                <div class="flex flex-wrap">
                  <el-button
                    v-for="hrid in enhancerStore.favorite"
                    :key="hrid"
                    class="relative"
                    style="width: 50px; height: 50px; margin: 2px;"
                    @click="onSelect(getItemDetailOf(hrid))"
                    @contextmenu.prevent="openMenu(hrid, $event)"
                  >
                    <ItemIcon
                      :hrid="hrid"
                    />

                    <div class="absolute bottom-0 right-0">
                      <el-link :underline="false" :icon="StarFilled" type="primary" style="font-size:16px" />
                    </div>
                  </el-button>
                </div>
                <el-divider class="mt-2 mb-1" />
              </template>
              <div style="display: flex; flex-wrap: wrap;margin-top:10px">
                <el-button
                  v-for="item in equipmentList"
                  :key="item.hrid"
                  style="width: 50px; height: 50px; margin: 2px;"
                  class="relative"
                  @click="onSelect(item)"
                  @contextmenu.prevent="openMenu(item.hrid, $event)"
                >
                  <ItemIcon
                    :hrid="item.hrid"
                  />

                  <div v-if="enhancerStore.hasFavorite(item.hrid)" class="absolute bottom-0 right-0">
                    <el-link :underline="false" :icon="StarFilled" type="primary" style="font-size:16px" />
                  </div>
                </el-button>
              </div>
            </el-dialog>
          </div>
        </el-card>

        <el-card class="mt-2">
          <el-tabs v-model="enhancerStore.config.tab" type="border-card" stretch>
            <el-tab-pane :label="t('工时费')">
              <div class="flex justify-between items-center">
                <div class="font-size-14px">
                  {{ t('工时费/h') }}
                </div>
                <el-input-number
                  class="w-120px"
                  v-model="enhancerStore.config.hourlyRate"
                  :step="1"
                  :min="0"
                  :max="5000000000"
                  :placeholder="Format.number(defaultConfig.hourlyRate)"
                  :controls="false"
                />
              </div>

              <div class="flex justify-between items-center">
                <div class="font-size-14px">
                  {{ t('溢价率%') }}
                </div>
                <el-input-number
                  class="w-120px"
                  v-model="enhancerStore.config.taxRate"
                  :step="1"
                  :min="0"
                  :max="20"
                  controls-position="right"
                  :placeholder="defaultConfig.taxRate.toString()"
                />
              </div>
            </el-tab-pane>
            <el-tab-pane :label="t('成品售价')">
              <div class="flex justify-between items-center">
                <div class="font-size-14px">
                  {{ t('价格') }}
                </div>
                <el-input-number
                  class="w-130px"
                  v-model="currentItem.productPrice"
                  :step="1"
                  :min="0"
                  :placeholder="Format.number(getPriceOf(currentItem.hrid!, enhancerStore.enhanceLevel ?? defaultConfig.enhanceLevel).bid)"
                  :controls="false"
                />
              </div>

              <div class="flex justify-between items-center">
                <div class="font-size-14px">
                  {{ t('税率%') }}
                </div>
                <el-input-number
                  class="w-130px"
                  placeholder="2"
                  :step="1"
                  :min="0"
                  :max="20"
                  controls-position="right"
                  :controls="false"
                  disabled
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8" class="max-w-400px mx-auto">
        <el-card :header="t('强化消耗')">
          <ElTable :data="enhancementCosts" style="--el-table-border-color:none;" :cell-style="{ padding: '0' }">
            <el-table-column :label="t('物品')">
              <template #default="{ row }">
                <ItemIcon :hrid="row.hrid" />
              </template>
            </el-table-column>
            <el-table-column prop="count" :label="t('数量')">
              <template #default="{ row }">
                {{ Format.number(row.count, 2) }}
              </template>
            </el-table-column>

            <el-table-column :label="t('价格')" align="center" min-width="120">
              <template #default="{ row }">
                <el-input-number v-if="row.hrid !== COIN_HRID" class="max-w-100%" v-model="row.price" :placeholder="Format.number(row.originPrice)" :controls="false" />
              </template>
            </el-table-column>
          </ElTable>
          <el-divider class="mt-2 mb-2" />
          <ElTable :data="[currentItem]" :show-header="false" style="--el-table-border-color:none">
            <el-table-column min-width="160">
              <template #default="{ row }">
                <el-radio-group v-model="row.protection.hrid">
                  <el-radio
                    v-for="item in protectionList"
                    :key="item.hrid"
                    :value="item.hrid"
                    border
                    style="width: 50px; height: 50px; margin: 2px;"
                    @click="() => row.protection = item"
                  >
                    <ItemIcon
                      :hrid="item.hrid"
                    />
                  </el-radio>
                </el-radio-group>
              </template>
            </el-table-column>
            <el-table-column min-width="120" align="center">
              <template #default="{ row }">
                <el-input-number class="max-w-100%" v-model="row.protection.price" :placeholder="Format.number(row.protection.originPrice)" :controls="false" />
              </template>
            </el-table-column>
          </ElTable>
          <el-divider class="mt-2 mb-2" />

          <ElTable :data="[currentItem]" :show-header="false" style="--el-table-border-color:none">
            <el-table-column>
              <template #default>
                {{ t('目标') }}:
              </template>
            </el-table-column>
            <el-table-column />
            <el-table-column min-width="120" align="center">
              <template #default>
                <el-input-number
                  class="max-w-100%"
                  :max="20"
                  :min="1"
                  v-model="enhancerStore.config.enhanceLevel"
                  :placeholder="Format.number(defaultConfig.enhanceLevel)"
                  controls-position="right"
                />
              </template>
            </el-table-column>
          </ElTable>
        </el-card>
      </el-col>
    </el-row>
    <el-card class="mx-auto" :style="{ width: `${tableWidth}px`, maxWidth: '100%' }">
      <ElTable
        ref="refTable"
        :data="results"
        size="large"
        border
        fit
        :header-cell-style="{ padding: '8px 0' }"
        :style="{ width: `${tableWidth}px` }"
        :row-style="rowStyle"
      >
        <el-table-column prop="protectLevel" :label="t('Prot')" :min-width="columnWidths.protectLevel" header-align="center" align="right" />
        <el-table-column prop="actionsFormatted" :label="t('次数')" :min-width="columnWidths.actionsFormatted" header-align="center" align="right" />
        <el-table-column prop="time" :label="t('时间')" :min-width="columnWidths.time" align="right" />
        <!-- <el-table-column prop="exp" :label="t('经验')" :min-width="100" align="right" /> -->
        <el-table-column prop="expPHFormat" :label="t('经验 / h')" :min-width="100" align="right" />

        <el-table-column v-for="item in enhancementCosts" :key="item.hrid" :min-width="100" header-align="center" align="right">
          <template #header>
            <ItemIcon class="mt-[8px]" :width="20" :height="20" :hrid="item.hrid" />
          </template>
          <template #default="{ row }">
            {{ Format.money(item.count * row.actions) }}
          </template>
        </el-table-column>

        <el-table-column prop="protectsFormatted" :label="t('保护')" :min-width="columnWidths.protectsFormatted" header-align="center" align="right" />
        <el-table-column prop="matCost" :label="t('材料费用')" :min-width="100" header-align="center" align="right" />
        <el-table-column prop="matCostPH" :label="t('损耗')" :min-width="120" header-align="center" align="right" />
        <el-table-column v-if="enhancerStore.config.tab === '1' && useGameStore().checkSecret()" prop="profitRateFormatted" :label="t('利润率')" :min-width="100" header-align="center" align="right" />
        <el-table-column v-if="enhancerStore.config.tab === '1' " prop="profitPPFormatted" :label="t('单个利润')" :min-width="100" header-align="center" align="right" />
        <el-table-column v-if="enhancerStore.config.tab === '1' " prop="hourlyCostFormatted" :label="t('工时费')" :min-width="100" header-align="center" align="right" />
        <el-table-column v-else prop="totalCostFormatted" :label="t('总费用')" :min-width="120" header-align="center" align="right" />
      </ElTable>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.error {
  color: #f56c6c;
}
.success {
  color: #67c23a;
}
.el-col {
  margin-bottom: 20px !important;
}

/* 隐藏单选框的圆形选择器 */
:deep(.el-radio__inner) {
  display: none;
}
:deep(.el-radio__label) {
  padding-left: 0;
  padding-top: 9px;
}
:deep(.el-radio.is-bordered) {
  padding: 9px;
}

.contextmenu {
  margin: 0;
  z-index: 3000;
  position: fixed;
  list-style-type: none;
  padding: 5px 0;
  border-radius: 4px;
  font-size: 12px;
  color: var(--v3-tagsview-contextmenu-text-color);
  background-color: var(--v3-tagsview-contextmenu-bg-color);
  box-shadow: var(--v3-tagsview-contextmenu-box-shadow);
  li {
    margin: 0;
    padding: 7px 16px;
    cursor: pointer;
    &:hover {
      color: var(--v3-tagsview-contextmenu-hover-text-color);
      background-color: var(--v3-tagsview-contextmenu-hover-bg-color);
    }
  }
}
</style>
