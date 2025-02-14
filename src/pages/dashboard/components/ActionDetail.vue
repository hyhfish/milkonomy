<script setup lang="ts">
import type Calculator from "@/calculator"
import { EnhanceCalculator } from "@/calculator/enhance"
import { WorkflowCalculator } from "@/calculator/workflow"
import ItemIcon from "@@/components/ItemIcon/index.vue"
import * as Format from "@@/utils/format"
import ActionDetailCard from "./ActionDetailCard.vue"

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
const simple = ref(true)
</script>

<template>
  <el-dialog v-model="visible" :show-close="false" width="80%">
    <el-checkbox style="margin:auto" v-if="data instanceof WorkflowCalculator" v-model="simple">
      简易模式
    </el-checkbox>
    <template v-if="data">
      <el-row :gutter="10" style="padding: 0 20px">
        <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
          <div style="font-size:12px;color:#999;margin-bottom:10px">
            如果当前市场价格 {{ '<' }} 显示价格，则价格为<span class="green">绿色</span>，反之为<span class="red">红色</span>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="4" :xl="4" />
        <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
          <div style="font-size:12px;color:#999;margin-bottom:10px">
            如果当前市场价格 > 显示价格，则价格为<span class="green">绿色</span>，反之为<span class="red">红色</span>
          </div>
        </el-col>
      </el-row>
      <el-row v-if="!(data instanceof WorkflowCalculator)" :gutter="10" style="padding: 0 20px">
        <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
          <ActionDetailCard :data="data" type="ingredient" :simple="false" />
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="4" :xl="4">
          <div class="param-wrapper">
            <div class="tea">
              <ItemIcon v-if="data?.gourmetTea" hrid="/items/gourmet_tea" />
              <ItemIcon v-if="data?.efficiencyTea" hrid="/items/efficiency_tea" />
              <ItemIcon v-if="data?.artisanTea" hrid="/items/artisan_tea" />
              <ItemIcon v-if="data.catalyticTea" hrid="/items/catalytic_tea" />
              <ItemIcon v-if="data.blessedTea" hrid="/items/blessed_tea" />
            </div>
            <div v-if="data?.successRate! < 1">
              成功率：{{ data?.result.successRateFormat }}
            </div>
            <div>效率：{{ data?.result.efficiencyFormat }}</div>
            <div>时间：{{ data?.result.timeCostFormat }}</div>
            <el-icon class="transition" :size="36">
              <DArrowRight />
            </el-icon>
          </div>
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
          <ActionDetailCard :data="data" type="product" :simple="false" />
        </el-col>
      </el-row>

      <template v-else>
        <el-row v-for="(calculator, i) in (simple ? [data] : data.calculatorList)" :key="i" :gutter="10" align="middle" style="padding: 10px 20px">
          <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
            <ActionDetailCard :data="calculator" type="ingredient" :simple="simple" :work-multiplier="simple ? 1 : data.workMultiplier[i]" />
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="4" :xl="4">
            <div class="param-wrapper">
              <template v-if="!simple">
                <div class="tea">
                  <ItemIcon v-if="calculator?.gourmetTea" hrid="/items/gourmet_tea" />
                  <ItemIcon v-if="calculator?.efficiencyTea" hrid="/items/efficiency_tea" />
                  <ItemIcon v-if="calculator?.artisanTea" hrid="/items/artisan_tea" />
                  <ItemIcon v-if="calculator.catalyticTea" hrid="/items/catalytic_tea" />
                  <ItemIcon v-if="calculator.blessedTea" hrid="/items/blessed_tea" />
                </div>
                <div v-if="calculator?.successRate! < 1">
                  成功率：{{ calculator?.result.successRateFormat }}
                </div>
                <div>效率：{{ calculator?.result.efficiencyFormat }}</div>
                <div>时间：{{ calculator?.result.timeCostFormat }}</div>
                <div>时间占比：{{ Format.percent(data.workMultiplier![i]!) }}</div>
                <div v-if="calculator instanceof EnhanceCalculator">
                  强化平均耗时：{{ Format.costTime(1 / calculator.ingredientList[0].count * calculator.timeCost) }}
                </div>
              </template>

              <el-icon class="transition" :size="36">
                <DArrowRight />
              </el-icon>
            </div>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
            <ActionDetailCard :data="calculator" type="product" :simple="simple" :work-multiplier="simple ? 1 : data.workMultiplier[i]" />
          </el-col>
        </el-row>
        <el-row v-if="!simple" :gutter="10" style="padding:0 20px">
          <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
            <div class="footer-wrapper">
              总成本：{{ data.result.costPHFormat }} / h
            </div>
          </el-col>
          <el-col :xs="24" :sm="24" :md="24" :lg="4" :xl="4" />
          <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
            <div class="footer-wrapper">
              总收入：{{ data.result.incomePHFormat }}/ h
            </div>
          </el-col>
        </el-row>
      </template>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
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
  .tea {
    display: flex;
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
.footer-wrapper {
  margin: 15px 0 0 15px;
}

.red {
  color: #f56c6c;
}
.green {
  color: #67c23a;
}

:deep(.el-table .el-table__cell) {
  padding: 3px 0;
  border-bottom: none;
}
</style>
