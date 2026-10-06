import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url));
const phase=process.argv[2]||'final';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function load(state){await page.goto('http://127.0.0.1:4174/week4/?state='+state);await page.waitForFunction(()=>window.__tidalRoute);await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>[...document.images].every(i=>i.complete));}
async function shot(name){await page.screenshot({path:path.join(out,name)});}
try{
if(phase==='before'){
  await load('valid');await shot('00-before-valid.png');
  await load('blocked');await shot('00-before-blocked.png');
}else if(phase==='mid'){
  await load('valid');await shot('iteration-01-valid-1920x1080.png');
  await load('blocked');await shot('iteration-01-blocked-1920x1080.png');
}else{
  await load('valid');await shot('01-after-valid-1920x1080.png');
  await load('blocked');await shot('02-after-blocked-1920x1080.png');
  await page.setViewportSize({width:960,height:540});await load('valid');await shot('03-after-valid-50percent.png');
  await load('blocked');await shot('04-after-blocked-50percent.png');
  await page.setViewportSize({width:1920,height:1080});await load('valid');await page.addStyleTag({content:'.game-stage{filter:grayscale(1)}'});await shot('05-grayscale-valid.png');
  await load('blocked');await page.addStyleTag({content:'.game-stage{filter:grayscale(1)}'});await shot('06-grayscale-blocked.png');
  await page.setViewportSize({width:2400,height:1350});await page.goto('http://127.0.0.1:4174/week4/submission-board.html');await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>[...document.images].every(i=>i.complete));await shot('07-submission-board-art-pass-02.png');
}
console.log(JSON.stringify({phase,errors}));
}finally{await browser.close();}
