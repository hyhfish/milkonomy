<script setup lang="ts">
import Calculator from "@/calculator"
import { getItemDetailOf, getPriceOf } from "@/common/apis/game"
import { getManualPriceOf, setPriceApi } from "@/common/apis/price"
import ItemIcon from "@@/components/ItemIcon/index.vue"
import * as Format from "@@/utils/format"

const props = defineProps<{
  modelValue: boolean
  data?: Calculator
}>()

const emit = defineEmits(["update:modelValue"])
const visible: Ref<boolean> = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit("update:modelValue", val)
  }
})

const currentProductPriceConfigList = ref<Calculator["productPriceConfigList"]>([])
const currentIngredientPriceConfigList = ref<Calculator["ingredientPriceConfigList"]>([])

watch(() => props.data, (row) => {
  currentIngredientPriceConfigList.value = []
  currentProductPriceConfigList.value = []
  if (row) {
    currentIngredientPriceConfigList.value = getPriceConfigList(row, "ingredient")
    currentProductPriceConfigList.value = getPriceConfigList(row, "product")
  }
}, { immediate: true })

function getPriceConfigList(row: Calculator, type: "product" | "ingredient") {
  return row[`${type}ListWithPrice`].map((item, i) => {
    const priceConfig = row[`${type}PriceConfigList`][i]
    const hasManualPrice = getManualPriceOf(item.hrid)?.[type === "ingredient" ? "ask" : "bid"]?.manual
    const manualPrice = getManualPriceOf(item.hrid)?.[type === "ingredient" ? "ask" : "bid"]?.manualPrice
    const price = priceConfig?.immutable ? priceConfig.price! : hasManualPrice ? manualPrice! : item.marketPrice

    return {
      hrid: item.hrid,
      price,
      manual: priceConfig?.manual || hasManualPrice || false,
      immutable: priceConfig?.immutable
    }
  })
}

function onConfirm() {
  try {
    setPriceApi(props.data!, currentIngredientPriceConfigList.value, currentProductPriceConfigList.value)
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}
</script>

<template>
  <el-dialog v-model="visible" :show-close="false" width="80%">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="12">
        <el-card>
          <el-table :data="currentIngredientPriceConfigList">
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
                <div v-if="row.hrid === Calculator.COIN_HRID">
                  {{ Format.price(row.price) }}
                </div>
                <div v-else>
                  {{ Format.price(getPriceOf(row.hrid).ask) }} / {{ Format.price(getPriceOf(row.hrid).bid) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="自定义价格">
              <template #default="{ row }">
                <el-checkbox style="margin-right: 10px;" v-show="row.hrid !== Calculator.COIN_HRID" v-model="row.manual" />
                <el-input-number v-show="row.manual" v-model="row.price" :controls="false" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="12">
        <el-card>
          <el-table :data="currentProductPriceConfigList">
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
                <div v-if="row.hrid === Calculator.COIN_HRID">
                  {{ Format.price(row.price) }}
                </div>
                <div v-else>
                  {{ Format.price(getPriceOf(row.hrid).ask) }} / {{ Format.price(getPriceOf(row.hrid).bid) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="自定义价格">
              <template #default="{ row }">
                <el-checkbox style="margin-right: 10px;" v-show="row.hrid !== Calculator.COIN_HRID" v-model="row.manual" />
                <el-input-number v-show="row.manual" v-model="row.price" :controls="false" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    <template #footer>
      <div style="text-align: center;">
        <el-button type="primary" @click="onConfirm">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>

</style>
