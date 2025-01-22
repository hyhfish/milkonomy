import type { Router } from "vue-router"
import { usePermissionStore } from "@/pinia/stores/permission"
import { setRouteChange } from "@@/composables/useRouteListener"
import { useTitle } from "@@/composables/useTitle"
import NProgress from "nprogress"

NProgress.configure({ showSpinner: false })
const { setTitle } = useTitle()

export function registerNavigationGuard(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (_, _from) => {
    NProgress.start()
    usePermissionStore().setRoutes([])
  })

  // 全局后置钩子
  router.afterEach((to) => {
    setRouteChange(to)
    setTitle(to.meta.title)
    NProgress.done()
  })
}
