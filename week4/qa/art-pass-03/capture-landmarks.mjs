import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url));
const week4=path.resolve(out,'../..');
const phase=process.argv[2]||'final';
if(phase==='before'){
  const root=path.resolve(week4,'..');
  const protectedFiles=JSON.parse(fs.readFileSync(path.join(week4,'qa/art-pass-02/preserved-hashes.json'),'utf8').replace(/^\uFEFF/,''));
  function protect(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())protect(p);else protectedFiles[path.relative(root,p).replaceAll('\\','/')]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}}
  protect(path.join(week4,'qa/art-pass-02'));protect(path.join(week4,'assets/art-pass-02'));
  for(const name of ['week4-map.js','week4-map.css','art-pass-02.css','submission-board.css'])protectedFiles['week4/'+name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(week4,name))).digest('hex');
  fs.writeFileSync(path.join(out,'preserved-hashes.json'),JSON.stringify(protectedFiles,null,2));
}
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
async function ready(){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));await Promise.all([...document.querySelectorAll('svg image')].map(async el=>{const im=new Image();im.src=el.href.baseVal;await im.decode();}));});await page.waitForTimeout(80);}
async function load(state){await page.goto('http://127.0.0.1:4174/week4/?state='+state);await page.waitForFunction(()=>window.__tidalRoute);await ready();}
async function shot(name){await page.screenshot({path:path.join(out,name)});}
try{
  if(phase==='before'){
    await load('valid');await shot('00-before-valid-1920x1080.png');
    await load('blocked');await shot('00-before-blocked-1920x1080.png');
  }else if(phase.startsWith('iteration')){
    await load('valid');await shot(phase+'-valid.png');await load('blocked');await shot(phase+'-blocked.png');
  }else{
    await load('valid');await shot('01-landmarks-valid-1920x1080.png');
    await load('blocked');await shot('02-landmarks-blocked-1920x1080.png');
    await load('valid');await page.locator('#confirm-route').click();await shot('03-landmarks-confirmed-1920x1080.png');
    await load('valid');await page.addStyleTag({content:'.game-stage{filter:grayscale(1)}'});await shot('04-landmarks-valid-grayscale.png');
    await load('blocked');await page.addStyleTag({content:'.game-stage{filter:grayscale(1)}'});await shot('05-landmarks-blocked-grayscale.png');
    await page.setViewportSize({width:960,height:540});await load('blocked');await shot('06-landmarks-halfscale-960x540.png');
    await page.setViewportSize({width:1920,height:1080});await load('valid');await page.addStyleTag({content:'.game-stage{filter:grayscale(1)} #chart text,.chart-instruction{opacity:0}'});await shot('09-label-free-grayscale.png');
    await page.setViewportSize({width:2400,height:1350});await page.goto('http://127.0.0.1:4174/week4/submission-board.html');await ready();await shot('08-submission-board-art-pass-03.png');
    await page.setViewportSize({width:1680,height:1330});await page.goto('http://127.0.0.1:4174/week4/qa/art-pass-03/before-after-comparison.html');await ready();await shot('07-before-after-comparison.png');
  }
  const report={phase,generatedAt:new Date().toISOString(),errors};fs.writeFileSync(path.join(out,'capture-'+phase+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
