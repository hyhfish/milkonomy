<script setup lang="ts">
import { getActionConfigOf, getToolListOf } from "@/common/apis/player"
import { ACTION_LIST } from "@/pinia/stores/game"
import { usePlayerStore } from "@/pinia/stores/player"
import ItemIcon from "@@/components/ItemIcon/index.vue"

const playerStore = usePlayerStore()

const visible = ref(false)
const actionList = ref(ACTION_LIST.map(action => ({ action })))
function onDialog() {
  actionList.value = ACTION_LIST.map((action) => {
    return {
      action,
      ...getActionConfigOf(action)
    }
  })
  visible.value = true
}

function onConfirm() {
  try {
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
    <el-table :data="actionList">
      <el-table-column prop="name" width="54">
        <template #default="{ row }">
          <ItemIcon :hrid="`/actions/${row.action}`" />
        </template>
      </el-table-column>
      <el-table-column prop="action" label="职业" />
      <el-table-column label="工具">
        <template #default="{ row }">
          <el-select style="width:80px" v-model="row.toolHrid" placeholder="无" clearable>
            <el-option v-for="item in getToolListOf(row.action)" :key="item.hrid" :label="item.name" :value="item.hrid">
              <div style="display:flex;align-items:center;gap:10px;">
                <ItemIcon :hrid="item.hrid" />
                <div> {{ item.name }} </div>
              </div>
            </el-option>
            <template #label>
              <ItemIcon style="margin-top: 4px;" :hrid="row.toolHrid" />
            </template>
          </el-select>
          &nbsp;+&nbsp;
          <el-input-number v-model="row.toolEnhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" />
        </template>
      </el-table-column>
      <el-table-column label="装备">
        <template #default="{ row }">
          <el-select style="width:80px" v-model="row.toolHrid" placeholder="无" clearable>
            <el-option v-for="item in getToolListOf(row.action)" :key="item.hrid" :label="item.name" :value="item.hrid">
              <div style="display:flex;align-items:center;gap:10px;">
                <ItemIcon :hrid="item.hrid" />
                <div> {{ item.name }} </div>
              </div>
            </el-option>
            <template #label>
              <ItemIcon style="margin-top: 4px;" :hrid="row.toolHrid" />
            </template>
          </el-select>
          &nbsp;+&nbsp;
          <el-input-number v-model="row.toolEnhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" />
        </template>
      </el-table-column>
    </el-table>
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
