import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"
import { publicRoutes } from "./routes/public"

// 条件导入私有路由
// 在构建时，Vite会根据环境变量进行条件编译和tree shaking
const privateRoutes: RouteRecordRaw[] = import.meta.env.VITE_BUILD_MODE === "private"
  ? (() => {
      try {
      // 这里使用同步导入，因为这是构建时决定的
        const { privateRoutes } = require("./routes/private")
        return privateRoutes || []
      } catch {
        console.warn("Private routes not found, using empty array")
        return []
      }
    })()
  : []

/**
 * @name 常驻路由
 * @description 根据构建模式组合不同的路由配置
 */
export const constantRoutes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...privateRoutes
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
