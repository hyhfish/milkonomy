<script setup lang="ts">
import type { ActionConfig, ActionConfigItem, PlayerEquipmentItem } from "@/pinia/stores/player"
import type { Action, Equipment } from "~/game"
import ItemIcon from "@@/components/ItemIcon/index.vue"
import { Plus } from "@element-plus/icons-vue"
import { ElMessageBox } from "element-plus"
import { getEquipmentListOf, getSpecialEquipmentListOf, getTeaListOf, getToolListOf, setActionConfigApi } from "@/common/apis/player"
import { useTheme } from "@/common/composables/useTheme"
import { DEFAULT_SEPCIAL_EQUIPMENT_LIST } from "@/common/config"
import { ACTION_LIST } from "@/pinia/stores/game"
import { defaultActionConfig, usePlayerStore } from "@/pinia/stores/player"

defineProps<{
  actions?: Action[]
  equipments?: Equipment[]
}>()
const playerStore = usePlayerStore()
const visible = ref(false)
const actionList = ref<ActionConfigItem[]>([])
const specialList = ref<PlayerEquipmentItem[]>([])
const name = ref("")
const color = ref("")
const currentIndex = ref(0)
function onDialog(config: ActionConfig, index: number) {
  const defaultConfig = defaultActionConfig("", "")
  actionList.value = structuredClone(ACTION_LIST.map((action) => {
    const map = config.actionConfigMap.get(action) ?? defaultConfig.actionConfigMap.get(action)!
    // 如果当前配置没有某些字段，则使用默认配置的字段值
    const defaultMap = defaultConfig.actionConfigMap.get(action)!
    for (const key in defaultMap) {
      const defaultValue = defaultMap[key as keyof ActionConfigItem]
      if (defaultValue !== undefined && map[key as keyof ActionConfigItem] === undefined) {
        map[key as keyof ActionConfigItem] = defaultValue as never
      }
    }
    return {
      ...toRaw(map)
    }
  }))

  specialList.value = structuredClone(DEFAULT_SEPCIAL_EQUIPMENT_LIST.map((item) => {
    return {
      ...toRaw(config.specialEquimentMap.get(item.type) ?? defaultConfig.specialEquimentMap.get(item.type)!)
    }
  }))

  name.value = config.name!
  color.value = config.color!
  visible.value = true
  currentIndex.value = index
}

function onSelect(config: ActionConfig, index: number) {
  // 如果选择的是用户当前config，则弹窗修改，否则切换到所选config
  if (index === playerStore.presetIndex) {
    onDialog(config, index)
  } else {
    playerStore.switchTo(index)
  }
}

function onAdd() {
  const index = playerStore.presets.length
  onDialog(defaultActionConfig(t("{0}新预设", [index]), "#90ee90"), index)
}

function constructActionConfig() {
  const config = {
    actionConfigMap: new Map<Action, ActionConfigItem>(),
    specialEquimentMap: new Map<Equipment, PlayerEquipmentItem>(),
    name: name.value,
    color: color.value
  }

  for (const item of actionList.value) {
    config.actionConfigMap.set(item.action, toRaw(item))
  }

  for (const item of specialList.value) {
    config.specialEquimentMap.set(item.type, toRaw(item))
  }
  return config
}

function onConfirm() {
  try {
    const config = constructActionConfig()
    setActionConfigApi(config, currentIndex.value)

    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

const menuVisible = ref(false)
const top = ref(0)
const left = ref(0)
const menuPreset = ref<ActionConfig>()
const menuIndex = ref(0)

function openMenu(preset: ActionConfig, index: number, e: MouseEvent) {
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
  menuIndex.value = index
  // 更新当前正在右键操作的标签页
  menuPreset.value = preset
}

/** 关闭右键菜单面板 */
function closeMenu() {
  menuVisible.value = false
}

watch(menuVisible, (value) => {
  value ? document.body.addEventListener("click", closeMenu) : document.body.removeEventListener("click", closeMenu)
})

function onCopy() {
  onDialog(menuPreset.value!, playerStore.presets.length)
}

function onRemove() {
  ElMessageBox.confirm(t("确定删除该预设吗？"), "", {
    confirmButtonText: t("确定"),
    cancelButtonText: t("取消"),
    type: "warning"
  }).then(() => {
    playerStore.removePreset(menuIndex.value)
  }).catch(() => {
    // 取消删除
  })
}

const { t } = useI18n()
const { activeThemeName } = useTheme()

// 弹窗手动复制导入
function onImport() {
  ElMessageBox.prompt(t("请粘贴导出的预设配置"), t("导入"), {
    confirmButtonText: t("确定"),
    cancelButtonText: t("取消"),
    inputPattern: /^\s*\{.*\}\s*$/,
    inputErrorMessage: t("请输入正确的JSON格式")
  }).then(({ value }) => {
    try {
      const obj = JSON.parse(value)
      if (!obj.name || !obj.color || !obj.actionConfigMap || !obj.specialEquimentMap) {
        throw new Error(t("无效的预设配置"))
      }
      const config: ActionConfig = {
        name: obj.name,
        color: obj.color,
        actionConfigMap: new Map<Action, ActionConfigItem>(obj.actionConfigMap),
        specialEquimentMap: new Map<Equipment, PlayerEquipmentItem>(obj.specialEquimentMap)
      }
      onDialog(config, currentIndex.value)
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (e) {
      ElMessage.error(t("无效的预设配置"))
    }
  }).catch(() => {
    // 取消导入
  })
}

// 复制到剪贴板
function onExport() {
  const config = constructActionConfig()
  const json = JSON.stringify({
    name: config.name,
    color: config.color,
    actionConfigMap: Array.from(config.actionConfigMap.entries()),
    specialEquimentMap: Array.from(config.specialEquimentMap.entries())
  })
  navigator.clipboard.writeText(json).then(() => {
    ElMessage.success(t("已复制到剪贴板"))
  }).catch(() => {
    ElMessage.error(t("复制失败，请检查浏览器权限设置"))
  })
}
</script>

<template>
  <ul v-show="menuVisible" class="contextmenu" :style="{ left: `${left}px`, top: `${top}px` }">
    <li @click="onCopy" v-if="!playerStore.isOverflow()">
      复制
    </li>
    <li v-if="playerStore.presets.length > 1" @click="onRemove">
      删除
    </li>
  </ul>

  <div class="flex items-center  p-1 pl-2 pr-2" style="border:1px solid var(--el-border-color);border-radius: 4px;">
    <div>{{ t('预设') }}:</div>
    <!-- 长按打开右键菜单 -->
    <el-button
      v-for="(preset, index) in playerStore.presets"
      class="ml-1 w-32px"
      :plain="playerStore.presetIndex !== index"
      color="#16ab1b"
      :dark="activeThemeName.includes('dark')"
      :key="index"
      @click="onSelect(preset, index)"
      @contextmenu.prevent="openMenu(preset, index, $event)"
    >
      {{ preset.name?.substring(0, 1) }}
    </el-button>
    <el-button
      v-if="!playerStore.isOverflow()"
      class="ml-1 w-24px" size="small" :icon="Plus" plain
      @click="onAdd"
    />
  </div>
  <el-dialog v-model="visible" :show-close="false" width="80%">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="16">
        <el-card>
          <template #header>
            <div class="flex flex-wrap items-baseline ">
              <!-- <div class="mr-3 mb-2">
                {{ t('预设颜色') }}:
              </div>

              <el-color-picker
                class="mr-5"
                v-model="color"
                :predefine="[
                  '#ff4500',
                  '#ff8c00',
                  '#ffd700',
                  '#90ee90',
                  '#00ced1',
                  '#1e90ff',
                  '#c71585']"
              /> -->

              <div class=" mr-3 mb-2">
                {{ t('预设名称') }}:
              </div>
              <el-input class=" w-300px" :maxlength="20" v-model="name" />
              <el-button type="success" plain class="ml-4" @click="onImport">
                {{ t('导入') }}
              </el-button>
              <el-button type="success" plain class="ml-4" @click="onExport">
                {{ t('导出') }}
              </el-button>
            </div>
          </template>
          <el-table :data="actionList.filter(item => actions ? actions.includes(item.action) : true)">
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
                <el-input-number v-model="row.playerLevel" :min="1" style="width: 60px" :controls="false" />
              </template>
            </el-table-column>
            <el-table-column :label="t('房子等级')" width="85" align="center">
              <template #default="{ row }">
                <el-input-number v-model="row.houseLevel" :min="0" :max="10" style="width: 60px" :controls="false" />
              </template>
            </el-table-column>
            <el-table-column :label="t('工具')" align="center" min-width="105">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.tool.hrid" :placeholder="t('无')" clearable>
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
                <el-input-number v-model="row.tool.enhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" />
              </template>
            </el-table-column>
            <el-table-column :label="t('身体')" align="center" min-width="105">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.body.hrid" :placeholder="t('无')" clearable>
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
                <el-input-number v-model="row.body.enhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" />
              </template>
            </el-table-column>
            <el-table-column :label="t('腿部')" align="center" min-width="105">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.legs.hrid" :placeholder="t('无')" clearable>
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
                <el-input-number v-model="row.legs.enhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" />
              </template>
            </el-table-column>
            <el-table-column :label="t('护符')" align="center" min-width="105">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.charm.hrid" :placeholder="t('无')" clearable>
                  <el-option v-for="item in getEquipmentListOf(row.action, 'charm').sort((a, b) => a.itemLevel - b.itemLevel)" :key="item.hrid" :label="item.name" :value="item.hrid">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <ItemIcon :hrid="item.hrid" />
                      <div> {{ item.name }} </div>
                    </div>
                  </el-option>
                  <template #label>
                    <ItemIcon style="margin-top: 4px;" :hrid="row.charm.hrid" />
                  </template>
                </el-select>
                &nbsp;+&nbsp;
                <el-input-number v-model="row.charm.enhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" />
              </template>
            </el-table-column>
            <el-table-column :label="t('茶')" align="center" min-width="155">
              <template #default="{ row }">
                <el-checkbox-group v-model="row.tea" size="large" :max="3">
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
          <el-table :data="specialList.filter(item => equipments ? equipments.includes(item.type) : true)">
            <el-table-column prop="type" :label="t('部位')" width="194">
              <template #default="{ row }">
                {{ t(row.type.replace(/_/g, ' ').replace(/\b\w+\b/g, (word:any) => word.substring(0, 1).toUpperCase() + word.substring(1))) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('装备')">
              <template #default="{ row }">
                <el-select style="width:80px" v-model="row.hrid" :placeholder="t('无')" clearable>
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
                <el-input-number v-model="row.enhanceLevel" :min="0" :max="20" style="width: 60px" :controls="false" />
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
