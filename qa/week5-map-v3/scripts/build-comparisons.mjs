import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const qa=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const before='http://127.0.0.1:4174/qa/week5-map-v3/before/01-original-full-map.png';
const after='http://127.0.0.1:4174/qa/week5-map-v3/after/01-map-default-1920x1080.png';
const out=path.join(qa,'compare');fs.mkdirSync(out,{recursive:true});
const regions=[
  {name:'03-title-before-after',title:'A · 海图题签',x:44,y:116,w:410,h:158},
  {name:'04-north-channel-before-after',title:'B · 北航道',x:470,y:285,w:590,h:220},
  {name:'05-blue-port-before-after',title:'C · 蓝潮岛港口',x:965,y:228,w:470,h:300},
  {name:'06-fog-reef-before-after',title:'D · 雾礁浅滩',x:515,y:505,w:520,h:300},
  {name:'07-wreck-before-after',title:'E · 旧沉船残骸',x:895,y:690,w:470,h:280}
];
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
for(const region of regions){
  const viewport={width:region.w*2+56,height:region.h+78};
  const context=await browser.newContext({viewport,deviceScaleFactor:1});const page=await context.newPage();
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#284f50;font-family:"Microsoft YaHei",sans-serif}
    header{height:54px;color:#f3e5c5;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-size:18px;letter-spacing:.08em}
    header small{font:italic 12px Georgia,serif;color:#b9d1c7;letter-spacing:.04em}
    main{display:flex;gap:16px;padding:0 12px 12px}.shot{width:${region.w}px;height:${region.h}px;position:relative;border:2px solid #d7c79d;box-shadow:0 7px 15px #102b354d;background-repeat:no-repeat;background-size:1920px 1080px;background-position:-${region.x}px -${region.y}px}
    .before{background-image:url("${before}")}.after{background-image:url("${after}")}.tag{position:absolute;left:9px;top:9px;padding:5px 10px;background:#f4ead9e8;color:#315e57;border:1px solid #788e77;font-size:13px;font-weight:700;box-shadow:0 2px 4px #173f4230}.after .tag{background:#315e57e8;color:#f4ead9;border-color:#c9a35d}
  </style><header><strong>${region.title}</strong><small>同视角 · 1920 × 1080 实际运行画面</small></header><main><div class="shot before"><span class="tag">改前</span></div><div class="shot after"><span class="tag">改后</span></div></main>`);
  await page.waitForFunction(()=>[...document.querySelectorAll('.shot')].every(node=>getComputedStyle(node).backgroundImage.includes('http')));
  await page.waitForTimeout(500);await page.screenshot({path:path.join(out,`${region.name}.png`)});await context.close();
}
await browser.close();
fs.writeFileSync(path.join(out,'comparison-manifest.json'),JSON.stringify(regions,null,2));
console.log(`Created ${regions.length} same-view before/after comparisons.`);
