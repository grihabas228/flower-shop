import { defineConfig } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'https://flower-shop-drab-eight.vercel.app',
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        browserName: 'chromium',
        isMobile: true,
      },
    },
  ],
})
