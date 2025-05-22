<script setup lang="ts">
import type { ActionConfigItem, PlayerEquipmentItem } from "@/pinia/stores/player"
import { getActionConfigActivated, getActionConfigOf, getEquipmentListOf, getSpecialEquipmentListOf, getSpecialEquipmentOf, getTeaListOf, getToolListOf, setActionConfigApi } from "@/common/apis/player"
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
    setActionConfigApi(actionList.value, specialList.value, actionConfigActivated.value)
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}
const { t } = useI18n()
</script>

<template>
  <el-button @click="onDialog" :type="playerStore.actionConfigActivated ? 'success' : 'info'">
    {{ t('我的等级/装备') }}({{ playerStore.actionConfigActivated ? t('已开启') : t('已关闭') }})
  </el-button>
  <el-dialog v-model="visible" :show-close="false" width="80%">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="16">
        <el-card>
          <template #header>
            <span style="margin-right: 20px;">{{ t('动作') }}</span>
            <el-switch v-model="actionConfigActivated" :active-text="t('已开启')" :inactive-text="t('已关闭')" inline-prompt />
          </template>
          <el-table :data="actionList">
            <el-table-column prop="name" width="54">
              <template #default="{ row }">
                <ItemIcon :hrid="`/actions/${row.action}`" />
              </template>
            </el-table-column>
            <el-table-column :label="t('Action')" width="125" align="center">
              <template #default="{ row }">
                {{ t(row.action) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('技能等级')" width="85" align="center">
              <template #default="{ row }">
                <el-input-number v-model.number="row.playerLevel" :min="1" style="width: 60px" :controls="false" :disabled="!actionConfigActivated" />
              </template>
            </el-table-column>
            <el-table-column :label="t('房子等级')" width="85" align="center">
              <template #default="{ row }">
                <el-input-number v-model.number="row.houseLevel" :min="0" :max="10" style="width: 60px" :controls="false" :disabled="!actionConfigActivated" />
              </template>
            </el-table-column>
            <el-table-column :label="t('工具')" align="center" min-width="105">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.tool.hrid" :placeholder="t('无')" clearable :disabled="!actionConfigActivated">
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
            <el-table-column :label="t('身体')" align="center" min-width="105">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.body.hrid" :placeholder="t('无')" clearable :disabled="!actionConfigActivated">
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
            <el-table-column :label="t('腿部')" align="center" min-width="105">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.legs.hrid" :placeholder="t('无')" clearable :disabled="!actionConfigActivated">
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
            <el-table-column :label="t('茶')" align="center" min-width="155">
              <template #default="{ row }">
                <el-checkbox-group v-model="row.tea" size="large" :disabled="!actionConfigActivated" :max="3">
                  <el-checkbox v-for="tea in getTeaListOf(row.action)" :key="tea.hrid" :value="tea.hrid" border>
                    <ItemIcon :hrid="tea.hrid" />
                  </el-checkbox>
                </el-checkbox-group>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="8">
        <el-card>
          <template #header>
            <div style="line-height: 32px;">
              {{ t('其他') }}
            </div>
          </template>
          <el-table :data="specialList">
            <el-table-column prop="type" :label="t('部位')" width="194">
              <template #default="{ row }">
                {{ t(row.type.replace(/_/g, ' ').replace(/\b\w+\b/g, (word:any) => word.substring(0, 1).toUpperCase() + word.substring(1))) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('装备')">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.hrid" :placeholder="t('无')" clearable :disabled="!actionConfigActivated">
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
          {{ t('保存') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-select__wrapper) {
  height: 38px;
}
:deep(.el-checkbox.is-bordered) {
  margin-right: 3px;
  position: relative;
  padding: 5px !important;
  height: 40px;
  width: 40px;
}
:deep(.el-checkbox__label) {
  padding: 0;
}
:deep(.el-checkbox__input) {
  position: absolute;
  width: 35px;
  height: 100%;
}
:deep(.el-checkbox__inner) {
  position: absolute;
  // 右下角
  right: 0;
  bottom: 0;
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
