// Reproducible laboratory sample; no claim about field Core Web Vitals.
import {chromium} from '@playwright/test';
const origin=process.env.LAB_ORIGIN||'http://localhost:3300';
if(new URL(origin).hostname!=='localhost')throw Error('Use local test server; remote measurement needs an explicit separate setup.');
const browser=await chromium.launch({headless:true});
try{
 for(const width of [375,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.addInitScript(()=>{
   window.lab={lcp:0,cls:0};
   new PerformanceObserver(l=>{for(const e of l.getEntries())window.lab.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
   new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.lab.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
  });
  for(const path of ['/','/experiencias','/experiencias/cocina']){
   await page.goto(origin+path,{waitUntil:'networkidle'});
   const result=await page.evaluate(()=>({lcp_ms:Math.round(window.lab.lcp),cls:window.lab.cls,ttfb_ms:Math.round(performance.getEntriesByType('navigation')[0].responseStart),transfer_bytes:performance.getEntriesByType('resource').reduce((s,e)=>s+e.transferSize,0),overflow:document.documentElement.scrollWidth>innerWidth+1,images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length}));
   console.log(JSON.stringify({width,path,...result}));
   if(path==='/experiencias/cocina'&&width===375)await page.screenshot({path:'/tmp/fdp-mobile.png',fullPage:true});
  }
  await page.close();
 }
}finally{await browser.close();}
