<script setup lang="ts">
import type { ActionConfigItem, PlayerEquipmentItem } from "@/pinia/stores/player"
import { getActionConfigActivated, getActionConfigOf, getEquipmentListOf, getSpecialEquipmentListOf, getSpecialEquipmentOf, getToolListOf, setActionConfigApi } from "@/common/apis/player"
import { DEFAULT_SEPCIAL_EQUIPMENT_LIST } from "@/common/config"
import { ACTION_LIST } from "@/pinia/stores/game"
import { usePlayerStore } from "@/pinia/stores/player"
import ItemIcon from "@@/components/ItemIcon/index.vue"

const playerStore = usePlayerStore()

const visible = ref(false)
const actionConfigActivated = ref(false)
const actionList = ref<ActionConfigItem[]>([])
const specialList = ref<PlayerEquipmentItem[]>([])
function onDialog() {
  actionConfigActivated.value = getActionConfigActivated()
  loadData(actionConfigActivated.value)
  visible.value = true
}

watch(() => actionConfigActivated.value, loadData, { immediate: true })

function loadData(activated: boolean) {
  actionList.value = structuredClone(ACTION_LIST.map((action) => {
    return {
      ...getActionConfigOf(action, activated)!
    }
  }))
  specialList.value = structuredClone(DEFAULT_SEPCIAL_EQUIPMENT_LIST.map((item) => {
    return {
      ...getSpecialEquipmentOf(item.type, activated)!
    }
  }))
}

function onConfirm() {
  try {
    // throw new Error("敬请期待")
    setActionConfigApi(actionList.value, specialList.value, actionConfigActivated.value)
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}
</script>

<template>
  <el-button @click="onDialog" :type="playerStore.actionConfigActivated ? 'success' : 'info'">
    自定义等级({{ playerStore.actionConfigActivated ? '已开启' : '已关闭' }})
  </el-button>
  <el-dialog v-model="visible" :show-close="false" width="80%">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="16">
        <el-card>
          <template #header>
            <span style="margin-right: 20px;">工具/装备</span>
            <el-switch v-model="actionConfigActivated" active-text="已开启" inactive-text="已关闭" inline-prompt />
          </template>
          <el-table :data="actionList">
            <el-table-column prop="name" width="54">
              <template #default="{ row }">
                <ItemIcon :hrid="`/actions/${row.action}`" />
              </template>
            </el-table-column>
            <el-table-column prop="action" label="职业" width="140" align="center" />
            <el-table-column label="技能等级" width="100" align="center">
              <template #default="{ row }">
                <el-input-number v-model="row.playerLevel" :min="1" style="width: 60px" :controls="false" :disabled="!actionConfigActivated" />
              </template>
            </el-table-column>
            <el-table-column label="房子等级" width="100" align="center">
              <template #default="{ row }">
                <el-input-number v-model="row.houseLevel" :min="0" :max="10" style="width: 60px" :controls="false" :disabled="!actionConfigActivated" />
              </template>
            </el-table-column>
            <el-table-column label="工具" align="center">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.tool.hrid" placeholder="无" clearable :disabled="!actionConfigActivated">
                  <el-option v-for="item in getToolListOf(row.action)" :key="item.hrid" :label="item.name" :value="item.hrid">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <ItemIcon :hrid="item.hrid" />
                      <div> {{ item.name }} </div>
                    </div>
                  </el-option>
                  <template #label>
                    <ItemIcon style="margin-top: 4px;" :hrid="row.tool.hrid" />
                  </template>
                </el-select>
                &nbsp;+&nbsp;
                <el-input-number v-model="row.tool.enhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" :disabled="!actionConfigActivated" />
              </template>
            </el-table-column>
            <el-table-column label="身体" align="center">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.body.hrid" placeholder="无" clearable :disabled="!actionConfigActivated">
                  <el-option v-for="item in getEquipmentListOf(row.action, 'body')" :key="item.hrid" :label="item.name" :value="item.hrid">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <ItemIcon :hrid="item.hrid" />
                      <div> {{ item.name }} </div>
                    </div>
                  </el-option>
                  <template #label>
                    <ItemIcon style="margin-top: 4px;" :hrid="row.body.hrid" />
                  </template>
                </el-select>
                &nbsp;+&nbsp;
                <el-input-number v-model="row.body.enhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" :disabled="!actionConfigActivated" />
              </template>
            </el-table-column>
            <el-table-column label="腿部" align="center">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.legs.hrid" placeholder="无" clearable :disabled="!actionConfigActivated">
                  <el-option v-for="item in getEquipmentListOf(row.action, 'legs')" :key="item.hrid" :label="item.name" :value="item.hrid">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <ItemIcon :hrid="item.hrid" />
                      <div> {{ item.name }} </div>
                    </div>
                  </el-option>
                  <template #label>
                    <ItemIcon style="margin-top: 4px;" :hrid="row.legs.hrid" />
                  </template>
                </el-select>
                &nbsp;+&nbsp;
                <el-input-number v-model="row.legs.enhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" :disabled="!actionConfigActivated" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="8">
        <el-card>
          <template #header>
            <div style="line-height: 32px;">
              其他
            </div>
          </template>
          <el-table :data="specialList">
            <el-table-column prop="type" label="部位" width="194" />
            <el-table-column label="装备">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.hrid" placeholder="无" clearable :disabled="!actionConfigActivated">
                  <el-option v-for="item in getSpecialEquipmentListOf(row.type)" :key="item.hrid" :label="item.name" :value="item.hrid">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <ItemIcon :hrid="item.hrid" />
                      <div> {{ item.name }} </div>
                    </div>
                  </el-option>
                  <template #label>
                    <ItemIcon style="margin-top: 4px;" :hrid="row.hrid" />
                  </template>
                </el-select>
                &nbsp;+&nbsp;
                <el-input-number v-model="row.enhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" :disabled="!actionConfigActivated" />
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
:deep(.el-select__wrapper) {
  height: 38px;
}
.config {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  .config-content {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }
  div {
    width: 120px;
  }
}
</style>
