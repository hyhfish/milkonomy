/* eslint-disable perfectionist/sort-imports */

// core
import { pinia } from "@/pinia"
import { router } from "@/router"
import { installPlugins } from "@/plugins"
import App from "@/App.vue"

// css
import "normalize.css"
import "nprogress/nprogress.css"
import "element-plus/theme-chalk/dark/css-vars.css"
import "vxe-table/lib/style.css"
import "@@/assets/styles/index.scss"
import "virtual:uno.css"
import { useGameStore } from "./pinia/stores/game"

import locales from "@/locales"

import VueGtag from "vue-gtag"

// 创建应用实例
const app = createApp(App)

// 安装插件（全局组件、自定义指令等）
installPlugins(app)

// 国际化
app.use(locales)

// 安装 pinia 和 router
app.use(pinia).use(router)

// 定时获取数据
setInterval(() => {
  useGameStore().fetchData()
}, 120 * 1000)

app.use(VueGtag, {
  config: {
    id: "G-GC32DWCZVS"
  }
}, router)

useGameStore().fetchData().then(() => {
  router.isReady().then(() => {
    app.mount("#app")
  })
})
