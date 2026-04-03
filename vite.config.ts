import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages 项目页地址为 /<仓库名>/，必须与 Vite base 一致，否则打包后的 /assets/* 会 404
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = repoName ? `/${repoName}/` : '/'

export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
