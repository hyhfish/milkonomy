/// <reference types="vitest/config" />

import { resolve } from "node:path"
import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import UnoCSS from "unocss/vite"
import AutoImport from "unplugin-auto-import/vite"
import SvgComponent from "unplugin-svg-component/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import Components from "unplugin-vue-components/vite"
import { defineConfig, loadEnv } from "vite"
import svgLoader from "vite-svg-loader"

// Configuring Vite: https://cn.vite.dev/config
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "") as ImportMetaEnv
  const { VITE_PUBLIC_PATH, VITE_BUILD_MODE } = env

  return {
    // 开发或打包构建时用到的公共基础路径
    base: VITE_PUBLIC_PATH,
    resolve: {
      alias: {
        // @ 符号指向 src 目录
        "@": resolve(__dirname, "src"),
        // @@ 符号指向 src/common 通用目录
        "@@": resolve(__dirname, "src/common"),
        // ~ 符号指向 types 类型目录
        "~": resolve(__dirname, "types")
      }
    },
    // 开发环境服务器配置
    server: {
      // 是否监听所有地址
      host: true,
      // 端口号
      port: 3333,
      // 端口被占用时，是否直接退出
      strictPort: false,
      // 是否自动打开浏览器
      open: true,
      // 反向代理
      proxy: {
        "/api/v1": {
          target: "https://mock.mengxuegu.com/mock/63218b5fb4c53348ed2bc212",
          // 是否为 WebSocket
          ws: false,
          // 是否允许跨域
          changeOrigin: true
        }
      },
      // 是否允许跨域
      cors: true,
      // 预热常用文件，提高初始页面加载速度
      warmup: {
        clientFiles: [
          "./src/layouts/**/*.*",
          "./src/pinia/**/*.*",
          "./src/router/**/*.*"
        ]
      }
    },
    // 构建配置
    build: {
      // 自定义底层的 Rollup 打包配置
      rollupOptions: {
        output: {
          /**
           * @name 分块策略
           * @description 1. 注意这些包名必须存在，否则打包会报错
           * @description 2. 如果你不想自定义 chunk 分割策略，可以直接移除这段配置
           */
          manualChunks: (id) => {
            // 公开版本中不打包私有页面
            if (VITE_BUILD_MODE === "public") {
              if (id.includes("/pages/enhancest/")
                || id.includes("/pages/junglest/")
                || id.includes("/pages/jungle/")
                || id.includes("/pages/inherit/")
                || id.includes("/pages/decompose/")
                || id.includes("/pages/manualchemy/")
                || id.includes("/pages/demo/")
                || id.includes("/pages/enhanposer/enhanposest")) {
                return undefined // 不打包这些文件
              }
            }

            // 基础分块策略
            if (id.includes("node_modules")) {
              if (id.includes("vue") || id.includes("vue-router") || id.includes("pinia")) {
                return "vue"
              }
              if (id.includes("element-plus") || id.includes("@element-plus/icons-vue")) {
                return "element"
              }
            }
          }
        }
      },
      // 是否开启 gzip 压缩大小报告，禁用时能略微提高构建性能
      reportCompressedSize: true,
      // 单个 chunk 文件的大小超过 2048kB 时发出警告
      chunkSizeWarningLimit: 2048
    },
    // 混淆器
    esbuild:
      mode === "production"
        ? {
            // 打包构建时移除 console.log
            pure: ["console.log"],
            // 打包构建时移除 debugger
            drop: ["debugger"],
            // 打包构建时移除所有注释
            legalComments: "none"
          }
        : undefined,
    // 插件配置
    plugins: [
      vue(),
      // 支持 JSX、TSX 语法
      vueJsx(),
      // 条件构建插件 - 在公开版本中排除私有文件
      VITE_BUILD_MODE === "public" && {
        name: "exclude-private-files",
        resolveId(id: string) {
          // 在公开版本构建中排除私有路由文件
          if (id.includes("routes/private")) {
            return `${id}?excluded`
          }
          return null
        },
        load(id: string) {
          // 在公开版本构建中，如果遇到私有页面文件，返回空模块
          if (id.includes("?excluded")) {
            return "export const privateRoutes = [];" // 返回空的私有路由
          }
          if (id.includes("/pages/enhancest/")
            || id.includes("/pages/junglest/")
            || id.includes("/pages/jungle/")
            || id.includes("/pages/inherit/")
            || id.includes("/pages/decompose/")
            || id.includes("/pages/manualchemy/")
            || id.includes("/pages/demo/")
            || id.includes("/pages/enhanposer/enhanposest")) {
            return "export default function() { return null; }" // 返回空组件
          }
          return null
        },
        generateBundle(_options: any, bundle: any) {
          // 在生成bundle时移除私有文件
          if (VITE_BUILD_MODE === "public") {
            Object.keys(bundle).forEach((fileName) => {
              const chunk = bundle[fileName]
              if (chunk.type === "chunk") {
                // 检查是否包含私有页面代码
                if (chunk.code.includes("/pages/enhancest/")
                  || chunk.code.includes("/pages/junglest/")
                  || chunk.code.includes("/pages/jungle/")
                  || chunk.code.includes("/pages/inherit/")
                  || chunk.code.includes("/pages/decompose/")
                  || chunk.code.includes("/pages/manualchemy/")
                  || chunk.code.includes("/pages/demo/")) {
                  // 替换私有页面导入为空函数
                  chunk.code = chunk.code.replace(
                    /import\([^)]*\/pages\/(enhancest|junglest|jungle|inherit|decompose|manualchemy|demo)\/[^)]*\)/g,
                    "Promise.resolve(() => null)"
                  )
                }
              }
            })
          }
        }
      },
      // 支持将 SVG 文件导入为 Vue 组件
      svgLoader({
        defaultImport: "url",
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  // @see https://github.com/svg/svgo/issues/1128
                  removeViewBox: false
                }
              }
            }
          ]
        }
      }),
      // 自动生成 SvgIcon 组件和 SVG 雪碧图
      SvgComponent({
        iconDir: [resolve(__dirname, "src/common/assets/icons")],
        preserveColor: resolve(__dirname, "src/common/assets/icons/preserve-color"),
        dts: true,
        dtsDir: resolve(__dirname, "types/auto")
      }),
      // 原子化 CSS
      UnoCSS(),
      // 自动按需导入 API
      AutoImport({
        imports: ["vue", "vue-router", "pinia", "vue-i18n"],
        dts: "types/auto/auto-imports.d.ts",
        resolvers: [ElementPlusResolver()]
      }),
      // 自动按需导入组件
      Components({
        dts: "types/auto/components.d.ts",
        resolvers: [ElementPlusResolver()]
      })
    ].filter(Boolean),
    // Configuring Vitest: https://cn.vitest.dev/config
    test: {
      include: ["tests/**/*.test.{ts,js}"],
      environment: "happy-dom",
      server: {
        deps: {
          inline: ["element-plus"]
        }
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  }
})
