import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'node:path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV == "production" ? "./" : "/",
  plugins: [
    vue(),
    vueDevTools(),
    viteStaticCopy({
      targets: [
        {
          src: "ap-sgtpuzzles/build-emscripten/help",
          dest: "help"
        },
        {
          src: "ap-sgtpuzzles/build-emscripten/*.{wasm,js}",
          dest: "res/wasm"
        },
        {
          src: "ap-sgtpuzzles/build-emscripten/unfinished/*.{wasm,js}",
          dest: "res/wasm"
        },
        {
          src: "ap-sgtpuzzles/build-emscripten/xsheep-puzzles/*.{wasm,js}",
          dest: "res/wasm",
          //rename: (name, extension) => `$xs-{name}.${extension}`
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      '~bootstrap-icons': path.resolve(__dirname, 'node_modules/bootstrap-icons'),
    },
  }
})
