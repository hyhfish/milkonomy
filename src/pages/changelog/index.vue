<script lang="ts" setup>
interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

const { t } = useI18n()
const appVersion = __APP_VERSION__

// NOTE: Only user-facing feature changes are recorded here (no deploy/CI changes).
const entries: ChangelogEntry[] = [
  {
    version: "1.3.404",
    date: "2026-02-26",
    changes: [
      "打野工具：新增『到强化工具中查看』，跳转到强化计算并回填物品 + 强化等级"
    ]
  },
  {
    version: "1.3.403",
    date: "2026-02-26",
    changes: [
      "Dashboard 配置：新增『背部』栏位，并按技能限制可选披风"
    ]
  },
  {
    version: "1.3.391",
    date: "2026-02-26",
    changes: [
      "强化计算：新增税率/溢价开关"
    ]
  },
  {
    version: "1.3.390",
    date: "2026-02-26",
    changes: [
      "强化计算：制作材料支持使用『右价+』参与成本计算"
    ]
  },
  {
    version: "1.3.387",
    date: "2026-02-25",
    changes: [
      "打野工具：新增『排除护符』过滤，以及物品等级范围筛选"
    ]
  }
]

const activeVersions = ref<string[]>([entries[0]?.version].filter(Boolean) as string[])
</script>

<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="header">
          <span class="title">{{ t("更新日志") }}</span>
          <el-tag size="small" type="info">
            {{ t("当前版本") }}：v{{ appVersion }}
          </el-tag>
        </div>
      </template>

      <el-collapse v-model="activeVersions">
        <el-collapse-item v-for="entry in entries" :key="entry.version" :name="entry.version">
          <template #title>
            <div class="collapse-title">
              <span class="version">v{{ entry.version }}</span>
              <span class="date">{{ entry.date }}</span>
            </div>
          </template>
          <ul class="changes">
            <li v-for="(c, idx) in entry.changes" :key="idx">
              {{ c }}
            </li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title {
  font-weight: 600;
}

.collapse-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.version {
  font-weight: 600;
}

.date {
  opacity: 0.7;
  font-size: 12px;
}

.changes {
  margin: 0;
  padding-left: 18px;
}

.changes > li {
  line-height: 1.8;
}
</style>
