<script lang="ts" setup>
import ItemIcon from "@@/components/ItemIcon/index.vue"
import axios from "axios"
import { ElLoading, type FormRules } from "element-plus"
import { useGameStoreOutside } from "@/pinia/stores/game"

const { t } = useI18n()
const gameStore = useGameStoreOutside()

// 获取当前语言
const { locale } = useI18n()

// 获取本地化的称号
function getLocalizedTitle(tombstone: Tombstone): string {
  if (locale.value === "en" && tombstone.title) {
    return tombstone.title
  }
  return tombstone.称号 || ""
}

// 获取本地化的描述
function getLocalizedDesc(tombstone: Tombstone): string {
  if (locale.value === "en" && tombstone.desc) {
    return tombstone.desc
  }
  return tombstone.描述 || ""
}

// Google Apps Script 提交地址（需要替换为实际地址）
const submitUrl = "https://script.google.com/macros/s/AKfycbzKlaR9m4tic60e4Jqk5Uxf2RLwZi6Rf9f1Z4KISGYLx_byEyDO9T-BJetfH4kb3N7UJA/exec"

// 上香API地址（需要替换为实际地址）
const incenseUrl = "https://script.google.com/macros/s/AKfycbww7_AIXJ725sY0lHHVj76BOcYkDfTMZnQqdGXf1FbyrASUyk4zse2o5Dcp-pjprcjDZA/exec"

// Google Sheets JSON 数据地址（需要替换为实际地址）
const jsonUrl = "https://opensheet.elk.sh/1VxVtRkvwiGEr5K7eKDwINk0Mncxn8dloffECjTQl3FQ/Sheet1"

// 墓碑类型定义
interface Tombstone {
  昵称: string
  原因?: "banned" | "gambling" | "quit" | "other"
  称号?: string
  描述?: string
  title?: string // 英文称号
  desc?: string // 英文描述
  时间: string
  图标?: string
  审核状态?: string
  上香?: number
  [key: string]: any
}

// 墓碑配置
const tombstoneConfig = {
  banned: {
    title: t("封弊者"),
    color: "#DC143C",
    borderColor: "#8B0000",
    bgGradient: "linear-gradient(135deg, #2c0a0a 0%, #1a0000 100%)",
    icon: "⚔️",
    shadowColor: "rgba(220, 20, 60, 0.3)"
  },
  gambling: {
    title: t("赌徒"),
    color: "#FFD700",
    borderColor: "#FFA500",
    bgGradient: "linear-gradient(135deg, #2c2410 0%, #1a1600 100%)",
    icon: "🎰",
    shadowColor: "rgba(255, 215, 0, 0.3)"
  },
  quit: {
    title: t("远行者"),
    color: "#87CEEB",
    borderColor: "#4169E1",
    bgGradient: "linear-gradient(135deg, #0a1a2c 0%, #000c1a 100%)",
    icon: "🌙",
    shadowColor: "rgba(135, 206, 235, 0.3)"
  },
  other: {
    title: t("逝者"),
    color: "#C0C0C0",
    borderColor: "#708090",
    bgGradient: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
    icon: "✨",
    shadowColor: "rgba(192, 192, 192, 0.3)"
  }
}

// 墓碑列表和加载状态
const tombstones = ref<Tombstone[]>([])
const tombstonesLoading = ref(false)

// 上香loading状态
const incenseLoading = ref(false)

// 表单相关
const refForm = ref()
const form = ref<Tombstone>({
  昵称: "",
  原因: undefined,
  称号: "",
  描述: "",
  时间: "",
  图标: ""
})
const dialogVisible = ref(false)
const dialogLoading = ref(false)
let loadingService: any

// 图标选择对话框
const iconDialogVisible = ref(false)
const iconSearch = ref("")

// 获取所有物品图标
const itemIcons = computed(() => {
  if (!gameStore.gameData) return []

  const items = Object.values(gameStore.gameData.itemDetailMap)
  return items
    .filter(item => item.hrid && item.name)
    .map(item => ({
      hrid: item.hrid,
      name: item.name,
      sortIndex: item.sortIndex || 0
    }))
    .sort((a, b) => a.sortIndex - b.sortIndex)
})

// 获取所有聊天图标
const chatIcons = computed(() => {
  if (!gameStore.gameData?.chatIconDetailMap) return []

  const icons = Object.values(gameStore.gameData.chatIconDetailMap)
  return icons
    .filter((icon: any) => icon.hrid && icon.name)
    .map((icon: any) => ({
      hrid: icon.hrid,
      name: icon.name,
      sortIndex: icon.sortIndex || 0
    }))
    .sort((a, b) => a.sortIndex - b.sortIndex)
})

// 过滤后的物品图标
const filteredItemIcons = computed(() => {
  if (!iconSearch.value) return itemIcons.value

  const searchLower = iconSearch.value.toLowerCase()
  return itemIcons.value.filter(item =>
    t(item.name).toLowerCase().includes(searchLower)
    || item.hrid.toLowerCase().includes(searchLower)
  )
})

// 过滤后的聊天图标
const filteredChatIcons = computed(() => {
  if (!iconSearch.value) return chatIcons.value

  const searchLower = iconSearch.value.toLowerCase()
  return chatIcons.value.filter(item =>
    t(item.name).toLowerCase().includes(searchLower)
    || item.hrid.toLowerCase().includes(searchLower)
  )
})

// 打开图标选择对话框
function openIconDialog() {
  iconDialogVisible.value = true
  iconSearch.value = ""
}

// 选择图标
function selectIcon(hrid: string) {
  form.value.图标 = hrid
  iconDialogVisible.value = false
}

// 获取图标名称
function getIconName(hrid: string) {
  if (!gameStore.gameData) return ""
  const item = gameStore.gameData.itemDetailMap[hrid]
  if (item) return item.name
  if (gameStore.gameData.chatIconDetailMap) {
    const chatIcon = gameStore.gameData.chatIconDetailMap[hrid]
    if (chatIcon) return chatIcon.name
  }
  return ""
}

// 表单验证规则
const rules = reactive<FormRules>({
  昵称: [{ required: true, message: t("不能为空"), trigger: ["blur", "change"] }],
  原因: [{ required: true, message: t("不能为空"), trigger: ["blur", "change"] }],
  称号: [{ required: true, message: t("不能为空"), trigger: ["blur", "change"] }],
  描述: [{ required: true, message: t("不能为空"), trigger: ["blur", "change"] }],
  时间: [{ required: true, message: t("不能为空"), trigger: ["blur", "change"] }]
})

// 监听对话框加载状态
watch(dialogLoading, (val) => {
  if (val) {
    loadingService = ElLoading.service({
      lock: true,
      target: ".dialog"
    })
  } else {
    loadingService?.close()
  }
})

// 提交表单
function submit() {
  refForm.value.validate((valid: boolean) => {
    if (valid) {
      dialogLoading.value = true
      fetch(submitUrl, {
        redirect: "follow",
        method: "POST",
        body: JSON.stringify(form.value),
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        }
      })
        .then(() => {
          ElMessage.success(t("提交成功，请等待作者审核"))
          dialogVisible.value = false
          form.value = {
            昵称: "",
            原因: undefined,
            称号: "",
            描述: "",
            时间: "",
            图标: ""
          }
          loadData()
        })
        .catch((e) => {
          ElMessage.error(e.message || t("提交失败"))
        })
        .finally(() => {
          dialogLoading.value = false
        })
    }
  })
}

// 加载数据
function loadData() {
  tombstonesLoading.value = true
  axios.get(jsonUrl)
    .then(({ data }) => {
      // 过滤审核通过的数据并按上香数量降序排序
      tombstones.value = data
        .filter((item: any) => item.审核状态 === "1" || item.审核状态 === 1 || item.审核状态 === true)
        .map((item: any) => ({
          昵称: item.昵称,
          原因: item.原因,
          称号: item.称号,
          描述: item.描述,
          title: item.title, // 英文称号
          desc: item.desc, // 英文描述
          时间: item.时间,
          图标: item.图标,
          上香: item.上香 || 0
        }))
        .sort((a: Tombstone, b: Tombstone) => (b.上香 || 0) - (a.上香 || 0))
    })
    .catch((e) => {
      ElMessage.error(e.message || t("加载数据失败"))
      // 使用示例数据作为备用
      tombstones.value = [
        {
          昵称: "XiaoR",
          原因: "banned",
          称号: "青蛙王",
          描述: "邪恶青蛙，贤者饰品操盘者，500B最速达成传说",
          title: "Frog King",
          desc: "Evil Frog, Sage Accessory Manipulator, Legend: Fastest to reach 500B",
          时间: "2025-10-27",
          图标: "/chat_icons/frog",
          上香: 0
        },
        {
          昵称: "DouShaL",
          原因: "banned",
          称号: "奥本海默",
          描述: "核武理论持有者",
          title: "Oppenheimer",
          desc: "Nuclear Weapon Theory Holder",
          时间: "2025-10-27",
          图标: "/chat_icons/frog",
          上香: 0
        },
        {
          昵称: "luyh7",
          原因: "banned",
          称号: "Milkonomy",
          描述: "Milkonomy作者",
          title: "Milkonomy",
          desc: "Author of Milkonomy",
          时间: "2025-10-27",
          图标: "/chat_icons/frog",
          上香: 0
        }
      ]
    })
    .finally(() => {
      tombstonesLoading.value = false
    })
}

// 页面加载时获取数据
loadData()

// 背景音乐
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)

// 播放背景音乐
// onMounted(() => {
//   if (audioRef.value) {
//     audioRef.value.play().then(() => {
//       isPlaying.value = true
//     }).catch((e) => {
//       console.log("音频自动播放被浏览器阻止:", e)
//       isPlaying.value = false
//     })
//   }
// })

// 页面卸载时停止音乐
onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
})

// 切换音乐播放状态
function toggleMusic() {
  if (!audioRef.value) return

  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    audioRef.value.play().then(() => {
      isPlaying.value = true
    }).catch((e) => {
      console.error("播放失败:", e)
      ElMessage.error(t("音频播放失败"))
    })
  }
}

// 获取墓碑样式
function getTombstoneStyle(reason: string) {
  const config = tombstoneConfig[reason as keyof typeof tombstoneConfig]
  if (!config) return {}
  return {
    background: config.bgGradient,
    borderColor: config.borderColor
  }
}

// 获取墓碑配置
function getTombstoneConfig(reason: string) {
  return tombstoneConfig[reason as keyof typeof tombstoneConfig] || tombstoneConfig.other
}

// 打开提交对话框
function openDialog() {
  dialogVisible.value = true
  form.value = {
    昵称: "",
    原因: undefined,
    称号: "",
    描述: "",
    时间: "",
    图标: ""
  }
}

// 上香相关
const INCENSE_STORAGE_KEY = "valhalla_incense_date"

// 获取今天的日期字符串
function getTodayDateString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

// 检查今天是否已上香
function hasIncensedToday(): boolean {
  const lastIncenseDate = localStorage.getItem(INCENSE_STORAGE_KEY)
  return lastIncenseDate === getTodayDateString()
}

// 保存上香记录（记录今天的日期）
function saveIncenseRecord() {
  localStorage.setItem(INCENSE_STORAGE_KEY, getTodayDateString())
}

// 检查是否已上香（兼容旧版，现在统一检查今天是否上过香）
function hasIncensed(): boolean {
  return hasIncensedToday()
}

// 上香功能
function offerIncense(tombstone: Tombstone) {
  // 用户点击上香时尝试播放背景音乐（这是用户交互，浏览器通常允许播放）
  try {
    if (audioRef.value && !isPlaying.value) {
      audioRef.value.play()
        .then(() => {
          isPlaying.value = true
        })
        .catch((e) => {
          // 如果播放被阻止，记录并继续上香流程
          console.warn("尝试播放音频失败:", e)
        })
    }
  } catch (e) {
    console.warn("触发播放时出错:", e)
  }

  if (hasIncensedToday()) {
    ElMessage.warning(t("您今天已经上过香了"))
    return
  }

  if (incenseLoading.value) {
    return
  }

  // 设置loading状态
  incenseLoading.value = true

  // 发送上香请求
  fetch(incenseUrl, {
    redirect: "follow",
    method: "POST",
    body: JSON.stringify({ 昵称: tombstone.昵称 }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    }
  })
    .then(response => response.json())
    .then((data) => {
      if (data.success) {
        // 保存上香记录（记录今天的日期）
        saveIncenseRecord()
        // 本地更新上香数
        tombstone.上香 = (Number(tombstone.上香) || 0) + 1
        ElMessage.success(t("上香成功"))
      } else {
        ElMessage.error(data.message || t("上香失败"))
      }
    })
    .catch((e) => {
      ElMessage.error(e.message || t("上香失败"))
    })
    .finally(() => {
      incenseLoading.value = false
    })
}

// Tooltip位置处理
function handleTooltipPosition(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const tooltip = target.querySelector(".message-tooltip") as HTMLElement
  if (!tooltip) return

  // 获取元素距离视口顶部的距离
  const rect = target.getBoundingClientRect()
  const spaceAbove = rect.top

  // 如果上方空间不足300px，则向下显示
  if (spaceAbove < 300) {
    tooltip.classList.add("tooltip-bottom")
  } else {
    tooltip.classList.remove("tooltip-bottom")
  }
}
</script>

<template>
  <div class="valhalla-container">
    <div class="valhalla-header">
      <h1 class="valhalla-title">
        <span class="title-icon">⚰️</span>
        {{ t('英灵殿') }}
        <span class="title-icon">⚰️</span>
      </h1>
      <p class="valhalla-subtitle">
        {{ t('纪念那些曾经在游戏中奋战，如今已离开的玩家们') }}
      </p>

      <!-- 音乐控制器 -->
      <div class="music-player">
        <div class="music-info">
          <span class="music-icon">🎵</span>
          <span class="music-name"> BGM </span>
        </div>
        <div class="music-controls">
          <el-button
            :type="isPlaying ? 'success' : 'info'"
            size="small"
            circle
            @click="toggleMusic"
          >
            <span class="control-icon">{{ isPlaying ? '⏸' : '▶' }}</span>
          </el-button>
          <audio
            ref="audioRef"
            loop
            preload="auto"
            src="/media/lanlianha.mp3"
          />
        </div>
      </div>

      <el-button
        type="primary"
        style="margin-top: 20px;"
        @click="openDialog"
      >
        {{ t('提名入殿') }}
      </el-button>
    </div>

    <div v-loading="tombstonesLoading" class="tombstones-grid">
      <div
        v-for="(tombstone, index) in tombstones"
        :key="index"
        class="tombstone-card"
        :style="getTombstoneStyle(tombstone.原因!)"
      >
        <!-- 墓碑主体 -->
        <div class="tombstone-body">
          <!-- 个人专属称号 - 在图标上方 -->
          <div v-if="getLocalizedTitle(tombstone)" class="tombstone-custom-title">
            「{{ getLocalizedTitle(tombstone) }}」
          </div>

          <!-- 物品图标位置 -->
          <div class="tombstone-icon">
            <ItemIcon
              v-if="tombstone.图标"
              :hrid="tombstone.图标"
              :size="64"
            />
            <div v-else class="empty-icon">
              <span>💀</span>
            </div>
          </div>

          <!-- 昵称 -->
          <div class="tombstone-nickname">
            {{ tombstone.昵称 }}
          </div>

          <!-- 分割线 -->
          <div class="tombstone-divider" />

          <!-- 日期 -->
          <div class="tombstone-date">
            {{ tombstone.时间 }}
          </div>

          <!-- 墓志铭 -->
          <div v-if="getLocalizedDesc(tombstone)" class="tombstone-message" @mouseenter="handleTooltipPosition">
            <span class="message-text">"{{ getLocalizedDesc(tombstone) }}"</span>
            <div class="message-tooltip">
              <p v-for="(paragraph, idx) in getLocalizedDesc(tombstone).split('\n').filter(p => p.trim())" :key="idx">
                {{ paragraph }}
              </p>
            </div>
          </div>

          <!-- 上香区域 -->
          <div class="incense-section">
            <div class="incense-count">
              <span v-if="tombstone.上香 && tombstone.上香 > 0">
                {{ tombstone.上香 }}&nbsp;🕯️
              </span>
            </div>
            <el-button
              v-if="!hasIncensed()"
              :disabled="hasIncensed() || incenseLoading"
              :loading="incenseLoading"
              size="small"
              @click="offerIncense(tombstone)"
            >
              <span class="incense-icon">🕯️</span>
              {{ hasIncensed() ? t('已上香') : t('上香') }}
            </el-button>
          </div>
        </div>

        <!-- 右下角：原因称号和emoji -->
        <div class="tombstone-corner">
          <span class="tombstone-emoji">{{ getTombstoneConfig(tombstone.原因!).icon }}</span>
          <div
            class="tombstone-reason"
            :style="{ color: getTombstoneConfig(tombstone.原因!).color }"
          >
            {{ getTombstoneConfig(tombstone.原因!).title }}
          </div>
        </div>
      </div>
    </div>

    <!-- 说明文字 -->
    <div class="valhalla-footer">
      <el-alert
        type="info"
        :closable="false"
        show-icon
      >
        <template #title>
          <div class="footer-text">
            <p>{{ t('这里纪念着因各种原因离开游戏的玩家：') }}</p>
            <p>
              <span :style="{ color: tombstoneConfig.banned.color }">{{ tombstoneConfig.banned.icon }} {{ t('封弊者') }}</span> -
              {{ t('因违反游戏规则被封禁') }} |
              <span :style="{ color: tombstoneConfig.gambling.color }">{{ tombstoneConfig.gambling.icon }} {{ t('赌徒') }}</span> -
              {{ t('因赌博飞升而退坑') }} |
              <span :style="{ color: tombstoneConfig.quit.color }">{{ tombstoneConfig.quit.icon }} {{ t('远行者') }}</span> -
              {{ t('因生活原因主动退坑') }}
            </p>
            <p style="margin-top: 12px; color: #ffd700;">
              🕯️ {{ t('上香规则：每天可以上香一次，可选择为任意一位玩家上香') }}
            </p>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 提交对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="t('提名入殿')"
      width="600px"
      class="dialog"
    >
      <el-form
        ref="refForm"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item :label="t('昵称')" prop="昵称">
          <el-input
            v-model="form.昵称"
            :placeholder="t('请输入游戏昵称')"
          />
        </el-form-item>

        <el-form-item :label="t('原因')" prop="原因">
          <el-select
            v-model="form.原因"
            :placeholder="t('请选择退坑原因')"
            style="width: 100%"
          >
            <el-option :label="t('封弊者 - 被封禁')" value="banned" />
            <el-option :label="t('赌徒 - 赌博飞升')" value="gambling" />
            <el-option :label="t('远行者 - 主动退坑')" value="quit" />
            <el-option :label="t('逝者 - 其他原因')" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('专属称号')" prop="称号">
          <el-input
            v-model="form.称号"
            :placeholder="t('如：青蛙王')"
          />
        </el-form-item>

        <el-form-item :label="t('描述')" prop="描述">
          <el-input
            v-model="form.描述"
            type="textarea"
            :rows="3"
            :placeholder="t('请输入墓志铭或入殿理由')"
          />
        </el-form-item>

        <el-form-item :label="t('时间')" prop="时间">
          <el-input
            v-model="form.时间"
            :placeholder="t('如：2025-10-27')"
          />
        </el-form-item>

        <el-form-item :label="t('图标')" prop="图标">
          <div style="display: flex; gap: 8px; align-items: center;">
            <el-button @click="openIconDialog" style="flex-shrink: 0;">
              {{ t('选择图标') }}
            </el-button>
            <div v-if="form.图标" style="display: flex; align-items: center; gap: 8px;">
              <ItemIcon :hrid="form.图标" :width="30" :height="30" />
              <span style="color: #606266; font-size: 14px;">{{ t(getIconName(form.图标)) }}</span>
              <el-button size="small" @click="form.图标 = ''">
                {{ t('清除') }}
              </el-button>
            </div>
            <span v-else style="color: #909399; font-size: 12px;">{{ t('未选择') }}</span>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('取消') }}</el-button>
          <el-button
            type="primary"
            :loading="dialogLoading"
            @click="submit"
          >
            {{ t('提交') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 图标选择对话框 -->
    <el-dialog
      v-model="iconDialogVisible"
      :title="t('选择图标')"
      width="800px"
    >
      <el-input
        v-model="iconSearch"
        :placeholder="t('搜索')"
        style="margin-bottom: 16px;"
      />
      <div style="max-height: 500px; overflow-y: auto;">
        <!-- 聊天图标 -->
        <div v-if="filteredChatIcons.length > 0">
          <div style="font-size: 14px; color: #606266; font-weight: 600; margin-bottom: 8px; padding-left: 4px;">
            💬 {{ t('聊天图标') }} ({{ filteredChatIcons.length }})
          </div>
          <div style="display: flex; flex-wrap: wrap; margin-bottom: 20px;">
            <el-button
              v-for="item in filteredChatIcons"
              :key="item.hrid"
              style="width: 50px; height: 50px; margin: 2px; padding: 4px;"
              :type="form.图标 === item.hrid ? 'primary' : 'default'"
              @click="selectIcon(item.hrid)"
            >
              <ItemIcon :hrid="item.hrid" :width="36" :height="36" />
            </el-button>
          </div>
        </div>

        <!-- 物品图标 -->
        <div v-if="filteredItemIcons.length > 0">
          <div style="font-size: 14px; color: #606266; font-weight: 600; margin-bottom: 8px; padding-left: 4px;">
            🎒 {{ t('物品图标') }} ({{ filteredItemIcons.length }})
          </div>
          <div style="display: flex; flex-wrap: wrap; margin-bottom: 20px;">
            <el-button
              v-for="item in filteredItemIcons"
              :key="item.hrid"
              style="width: 50px; height: 50px; margin: 2px; padding: 4px;"
              :type="form.图标 === item.hrid ? 'primary' : 'default'"
              @click="selectIcon(item.hrid)"
            >
              <ItemIcon :hrid="item.hrid" :width="36" :height="36" />
            </el-button>
          </div>
        </div>

        <!-- 无结果提示 -->
        <div v-if="filteredItemIcons.length === 0 && filteredChatIcons.length === 0" style="text-align: center; padding: 40px; color: #909399;">
          {{ t('未找到匹配的图标') }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.valhalla-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.valhalla-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.valhalla-title {
  font-size: 42px;
  font-weight: bold;
  color: #e0e0e0;
  margin-bottom: 16px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);

  .title-icon {
    margin: 0 16px;
    display: inline-block;
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.valhalla-subtitle {
  font-size: 16px;
  color: #b0b0b0;
  font-style: italic;
}

.music-player {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .music-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .music-icon {
      font-size: 20px;
      animation: musicNote 2s ease-in-out infinite;
    }

    .music-name {
      font-size: 14px;
      color: #e0e0e0;
      font-weight: 500;
    }
  }

  .music-controls {
    display: flex;
    align-items: center;

    .control-icon {
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    audio {
      display: none;
    }
  }
}

@keyframes musicNote {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-3px) rotate(-5deg);
  }
  75% {
    transform: translateY(-3px) rotate(5deg);
  }
}

.tombstones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 32px 24px;
  margin-bottom: 40px;
  overflow: visible;

  @media (min-width: 1400px) {
    grid-template-columns: repeat(5, 1fr);
  }

  @media (min-width: 1200px) and (max-width: 1399px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (min-width: 992px) and (max-width: 1199px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 768px) and (max-width: 991px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 767px) {
    grid-template-columns: repeat(1, 1fr);
  }
}

.tombstone-card {
  border: 3px solid;
  border-radius: 20px 20px 8px 8px;
  padding: 16px;
  padding-bottom: 28px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: visible;
  z-index: 1;

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
    z-index: 10;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
    opacity: 0.5;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
    pointer-events: none;
    z-index: 0;
  }
}

// 右下角：原因称号和emoji
.tombstone-corner {
  position: absolute;
  bottom: 4px;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 1;

  .tombstone-emoji {
    font-size: 28px;
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.tombstone-body {
  text-align: center;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: visible;
  position: relative;
  z-index: 2;
}

.tombstone-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);

  .empty-icon {
    font-size: 40px;
    opacity: 0.6;
  }
}

.tombstone-custom-title {
  font-size: 22px;
  color: #ffd700;
  margin-bottom: 12px;
  font-weight: 700;
  text-shadow:
    0 0 15px rgba(255, 215, 0, 0.6),
    0 0 30px rgba(255, 215, 0, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.9);
  letter-spacing: 2px;
  font-style: italic;
  position: relative;
  display: inline-block;

  // &::before,
  // &::after {
  //   content: "✦";
  //   position: absolute;
  //   top: 50%;
  //   transform: translateY(-50%);
  //   font-size: 14px;
  //   opacity: 0.8;
  //   animation: sparkle 2s ease-in-out infinite;
  // }

  &::before {
    left: -24px;
  }

  &::after {
    right: -24px;
    animation-delay: 1s;
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0.7;
    transform: translateY(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-50%) scale(1.3);
  }
}

.tombstone-nickname {
  font-size: 18px;
  color: #e0e0e0;
  margin-bottom: 8px;
  font-weight: 600;
}

.tombstone-reason {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-align: right;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.tombstone-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  margin: 12px 0;
}

.tombstone-date {
  font-size: 13px;
  color: #a0a0a0;
  margin-bottom: 10px;
  font-family: monospace;
}

.tombstone-message {
  font-size: 13px;
  color: #c0c0c0;
  font-style: italic;
  line-height: 1.5;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 12px;
  position: relative;
  cursor: help;

  .message-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .message-tooltip {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%) scale(0.9);
    background: linear-gradient(135deg, rgba(45, 45, 63, 0.98) 0%, rgba(26, 26, 46, 0.98) 100%);
    color: #e8e8e8;
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.6;
    white-space: normal;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    text-align: left;
    min-width: 200px;
    max-width: 400px;
    width: max-content;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    z-index: 9999;
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.7),
      0 0 0 1px rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

    p {
      margin: 0 0 6px 0;

      &:last-child {
        margin-bottom: 0;
      }
    }

    &::before {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: rgba(45, 45, 63, 0.98);
    }

    // 向下显示的样式
    &.tooltip-bottom {
      bottom: auto;
      top: calc(100% + 12px);

      &::before {
        top: auto;
        bottom: 100%;
        border-top-color: transparent;
        border-bottom-color: rgba(45, 45, 63, 0.98);
      }
    }
  }

  &:hover .message-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) scale(1);
  }
}

.incense-section {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 68px; // 确保所有卡片的上香区域高度一致

  .incense-icon {
    margin-right: 4px;
    font-size: 16px;
  }

  .incense-count {
    font-size: 12px;
    color: #ffd700;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
    height: 20px; // 固定高度，即使没有上香数也占位
    line-height: 20px;
  }

  .el-button {
    // 确保按钮始终在固定位置
    margin-top: auto;
  }
}

.valhalla-footer {
  margin-top: 40px;

  .footer-text {
    line-height: 1.8;
    font-size: 14px;

    p {
      margin: 8px 0;
    }

    span {
      font-weight: bold;
      margin: 0 8px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .valhalla-title {
    font-size: 32px;

    .title-icon {
      margin: 0 8px;
    }
  }

  .tombstone-card {
    padding: 14px;
  }

  .tombstone-icon {
    width: 70px;
    height: 70px;

    .empty-icon {
      font-size: 36px;
    }
  }

  .tombstone-custom-title {
    font-size: 18px;

    &::before,
    &::after {
      font-size: 12px;
      left: -20px;
    }

    &::after {
      right: -20px;
    }
  }

  .tombstone-nickname {
    font-size: 16px;
  }

  .tombstone-reason {
    font-size: 10px;
  }
}
</style>
