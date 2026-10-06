import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}}),checks=[];
await page.goto('http://127.0.0.1:4174/');
for(const file of ['map-reveal-flow.webm','mailbag-to-sailing.webm']){
  await page.setContent(`<style>body{margin:0;background:#203e3d}video{display:block;width:1920px;height:1080px}</style><video muted controls preload="auto"></video>`);
  await page.locator('video').evaluate(async(v,url)=>{const b=await(await fetch(url)).blob();v.src=URL.createObjectURL(new Blob([b],{type:'video/webm'}));},`http://127.0.0.1:4174/qa/map-reveal/${file}`);
  await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
  let metadata=await page.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:Number.isFinite(v.duration)?v.duration:'stream'}));
  await page.locator('video').evaluate(async v=>{await v.play();});await page.waitForTimeout(300);await page.locator('video').evaluate(v=>v.pause());
  const played=await page.locator('video').evaluate(v=>v.currentTime>0&&!v.error);
  const targets=Number.isFinite(metadata.duration)?[metadata.duration*.45,metadata.duration*.65,metadata.duration*.9]:[1,2];
  for(const target of targets){const t=Number(target.toFixed(2));
    await page.locator('video').evaluate((v,t)=>new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=t;}),t);
    await page.locator('video').evaluate(v=>v.play());await page.waitForTimeout(150);await page.locator('video').evaluate(v=>v.pause());
    await page.screenshot({path:path.join(out,`video-${file.replace('.webm','')}-${t}.png`)});
    const position=await page.locator('video').evaluate(v=>v.currentTime);checks.push({file,seekTarget:t,position,passed:Math.abs(position-t)<.4});
  }
  checks.push({file,...metadata,played,passed:played&&metadata.width===1920&&metadata.height===1080});
}
fs.writeFileSync(path.join(out,'video-playback-report.json'),JSON.stringify({checks,passed:checks.every(x=>x.passed)},null,2));console.log(JSON.stringify(checks,null,2));await browser.close();if(checks.some(x=>!x.passed))process.exitCode=1;
