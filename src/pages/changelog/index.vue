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
    version: "1.3.432",
    date: "2026-03-12",
    changes: [
      "Dashboard 配置：修复『其他Buff』中封印类卷轴不显示 buff 数值的问题",
      "Buff 计算：兼容迷宫封印改为卷轴后的新数据结构，封印增益会继续正确参与利润与 buff 汇总计算"
    ]
  },
  {
    version: "1.3.430",
    date: "2026-03-10",
    changes: [
      "贤者镜计算"
    ]
  },
  {
    version: "1.3.429",
    date: "2026-03-09",
    changes: [
      "英灵殿 / 埋骨地：切换 Google Apps Script 提交接口、上香接口与 Google Sheets 数据源",
      "英灵殿 / 埋骨地：统一两页的数据源配置，便于后续维护与迁移"
    ]
  },
  {
    version: "1.3.426",
    date: "2026-03-02",
    changes: [
      "打野工具：新增『超级打野』模式，并将原有 jungle / junglest 数据源整合到同一页面管理",
      "打野工具：支持数据源切换并记住上次选择，减少重复设置",
      "打野工具：新增期望耗时展示，便于预估任务完成时间",
      "打野工具：针对不同数据源动态区分手动价格卡片缓存，避免配置互相污染"
    ]
  },
  {
    version: "1.3.411",
    date: "2026-02-27",
    changes: [
      "强化工具：新增『成本指导价』功能，用于分析物品制作成本",
      "强化工具：支持从低级材料向上推导完整制作链路，并提供叶子材料汇总与完整链路两种视图",
      "强化工具：新增成本过滤、排序、单价分析、成本占比分析，以及展开/收起和仅显示无库存等交互"
    ]
  },
  {
    version: "1.3.410",
    date: "2026-02-27",
    changes: [
      "打野工具：新增装备筛选，支持按生活装备、战斗装备等维度快速过滤",
      "打野工具：新增生活装备细分筛选，支持工具 / 装备等子分类",
      "Dashboard / 打野工具：新增成交量（1h）显示，便于判断市场活跃度"
    ]
  },
  {
    version: "1.3.414",
    date: "2026-03-02",
    changes: [
      "强化工具：『装备成本』『强化消耗』全部价格项补齐档位上下调整（输入框 +/- 按市场价格档位跳价）",
      "中文翻译：更新迷宫新增物品的中文名称"
    ]
  },
  {
    version: "1.3.413",
    date: "2026-02-27",
    changes: [
      "强化计算 / 超级强化计算：修复『成品售价』价格档位步进异常，避免点击 - 直接跳到 -1，改为按市场档位逐级调整",
      "强化计算 / 超级强化计算：修复价格处于 -1 后无法回调的问题，点击 + 可恢复并继续按档位上调",
      "超级强化计算：档位步进判定增加容差处理，避免输入组件数值抖动导致档位判断错误"
    ]
  },
  {
    version: "1.3.412",
    date: "2026-02-27",
    changes: [
      "超级强化计算：为装备成本中的『初始物品价格』『逃逸价格』『白板价格』补齐价格档位步进（输入框 +/- 按市场档位跳价）",
      "超级强化计算：『强化消耗』中的每个材料价格与『保护』价格支持价格档位步进",
      "超级强化计算：移除上述价格项的下拉档位选择，统一使用与强化计算一致的价格档位调整交互"
    ]
  },
  {
    version: "1.3.411",
    date: "2026-02-27",
    changes: [
      "Dashboard 配置：封印改为可多选并支持叠加，展示方式与成就 Buff 一致（豆腐块勾选）",
      "Buff 规则：封印增益按行动范围生效（美食/采集/加工/效率/速度/经验/稀有发现）并参与利润计算",
      "成就 Buff：生效范围与封印规则统一，移除精英成就（战斗伤害增益）"
    ]
  },
  {
    version: "1.3.409",
    date: "2026-02-27",
    changes: [
      "Dashboard 配置：新增『成就Buff』勾选项，启用后会参与 Buff 汇总并影响利润计算",
      "Dashboard 配置：修复『成就Buff-启用』复选框与列标题未对齐的问题"
    ]
  },
  {
    version: "1.3.408",
    date: "2026-02-27",
    changes: [
      "Dashboard：首页利润计算新增『计算税率』开关（默认开启）",
      "Dashboard：利润排行/收藏夹新增『排除护符』过滤开关"
    ]
  },
  {
    version: "1.3.406",
    date: "2026-02-26",
    changes: [
      "强化工具：『成品售价』价格增加档位上下调整（按市场价格档位跳价）"
    ]
  },
  {
    version: "1.3.405",
    date: "2026-02-26",
    changes: [
      "强化工具：『装备成本』『强化消耗』新增买价下拉框（左价/左价-/右价/右价+），并移除『材料右价+』",
      "强化工具：保护道具的占位价格会跟随『强化消耗』买价选择联动更新",
      "强化工具：『成品售价』税率改为仅 0% / 2% 两档（默认 2%）"
    ]
  },
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
