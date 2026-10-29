import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e',fullyParallel:false,workers:1,retries:0,timeout:30000,
 reporter:'list',outputDir:'test-results',
 use:{baseURL:'http://127.0.0.1:3100',browserName:'chromium',headless:true,trace:'off',screenshot:'only-on-failure'},
 webServer:{command:'node tests/e2e-server.mjs',url:'http://127.0.0.1:3100/auth',reuseExistingServer:false,timeout:60000},
});
