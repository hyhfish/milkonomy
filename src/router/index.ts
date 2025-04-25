import type { RouteRecordRaw } from "vue-router"
import locale from "@/locales"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { createRouter } from "vue-router"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")
const { t } = locale.global
/**
 * @name 常驻路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: t("首页"),
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },

  {
    path: "/",
    component: Layouts,
    redirect: "/enhancer",
    children: [
      {
        path: "enhancer",
        component: () => import("@/pages/enhancer/index.vue"),
        name: "Enhancer",
        meta: {
          title: "强化计算",
          elIcon: "MagicStick"
        }
      }
    ]
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/enhanposer",
    meta: {
      hidden: true
    },
    children: [
      {
        path: "enhanposer",
        component: () => import("@/pages/enhanposer/index.vue"),
        name: "Enhanposer",
        meta: {
          title: "强化分解",
          svgIcon: "dashboard"
        }
      }
    ]
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/manualchemy",
    meta: {
      hidden: true
    },
    children: [
      {
        path: "manualchemy",
        component: () => import("@/pages/manualchemy/index.vue"),
        name: "Manualchemy",
        meta: {
          title: "制作炼金",
          svgIcon: "dashboard"
        }
      }
    ]
  },

  {
    path: "/",
    component: Layouts,
    redirect: "/sponsor",
    children: [
      {
        path: "sponsor",
        component: () => import("@/pages/sponsor/index.vue"),
        name: "Sponsor",
        meta: {
          title: t("打赏"),
          elIcon: "Coin",
          affix: true
        }
      }
    ]
  },
  {
    path: "/demo",
    component: Layouts,
    redirect: "/demo/unocss",
    name: "Demo",
    meta: {
      title: "示例集合",
      elIcon: "DataBoard",
      hidden: true
    },
    children: [
      {
        path: "unocss",
        component: () => import("@/pages/demo/unocss/index.vue"),
        name: "UnoCSS",
        meta: {
          title: "UnoCSS"
        }
      },
      {
        path: "level2",
        component: () => import("@/pages/demo/level2/index.vue"),
        redirect: "/demo/level2/level3",
        name: "Level2",
        meta: {
          title: "二级路由",
          alwaysShow: true
        },
        children: [
          {
            path: "level3",
            component: () => import("@/pages/demo/level2/level3/index.vue"),
            name: "Level3",
            meta: {
              title: "三级路由",
              keepAlive: true
            }
          }
        ]
      },
      {
        path: "composable-demo",
        redirect: "/demo/composable-demo/use-fetch-select",
        name: "ComposableDemo",
        meta: {
          title: "组合式函数"
        },
        children: [
          {
            path: "use-fetch-select",
            component: () => import("@/pages/demo/composable-demo/use-fetch-select.vue"),
            name: "UseFetchSelect",
            meta: {
              title: "useFetchSelect"
            }
          },
          {
            path: "use-fullscreen-loading",
            component: () => import("@/pages/demo/composable-demo/use-fullscreen-loading.vue"),
            name: "UseFullscreenLoading",
            meta: {
              title: "useFullscreenLoading"
            }
          },
          {
            path: "use-watermark",
            component: () => import("@/pages/demo/composable-demo/use-watermark.vue"),
            name: "UseWatermark",
            meta: {
              title: "useWatermark"
            }
          }
        ]
      }
    ]
  },
  {
    path: "/link",
    meta: {
      title: t("相关链接"),
      elIcon: "Link"
    },
    children: [
      {
        path: "https://www.milkywayidle.com/",
        component: () => {},
        name: "Link1",
        meta: {
          title: "Milky Way Idle"
        }
      },
      {
        path: "https://test-ctmd6jnzo6t9.feishu.cn/docx/KG9ddER6Eo2uPoxJFkicsvbEnCe",
        component: () => {},
        name: "Link4",
        meta: {
          title: "牛牛手册(攻略/插件)"
        }
      },
      {
        path: "https://github.com/holychikenz/MWIApi",
        component: () => {},
        name: "Link2",
        meta: {
          title: "MWI Api"
        }
      },
      {
        path: "https://docs.google.com/spreadsheets/d/13yBy3oQkH5N4y7UJ0Pkux2A8O5xM1ZsVTNAg6qgLEcM/edit?gid=2017655058#gid=2017655058",
        component: () => {},
        name: "Link3",
        meta: {
          title: "MWI Data"
        }
      }
    ]
  }
]

/**
 * @name 动态路由
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = []

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
