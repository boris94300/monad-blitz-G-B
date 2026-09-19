import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e',timeout:60000,workers:1,
  use:{baseURL:process.env.E2E_BASE_URL||'http://localhost:3000',headless:true,screenshot:'only-on-failure',trace:'retain-on-failure',launchOptions:{args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']}}
});
