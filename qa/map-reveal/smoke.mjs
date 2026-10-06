import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'no-preference'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
await page.goto('http://127.0.0.1:4174/');await page.evaluate(()=>document.fonts.ready);
await page.locator('[data-action="open-mission"]').click();await page.locator('[data-action="mission-primary"]').click();await page.locator('[data-item="blue-envelope"]').click();await page.locator('#saveMailbagButton').click();
await page.screenshot({path:path.join(out,'01-mailbag-before-map.png')});
await page.locator('#goMapButton').click();
await page.evaluate(()=>document.getAnimations().forEach(a=>{if(a.effect?.target?.closest?.('.integrated-map')){a.pause();a.currentTime=350;}}));
async function seek(time,name){await page.evaluate(t=>document.getAnimations().forEach(a=>{if(a.effect?.target?.closest?.('.integrated-map')){a.pause();a.currentTime=t;}}),time);await page.screenshot({path:path.join(out,name)});}
function timeAt(progress){let a=0,b=1;const bez=(t,p,q)=>3*(1-t)**2*t*p+3*(1-t)*t*t*q+t**3;for(let i=0;i<30;i++){let m=(a+b)/2;if(bez(m,.78,1)<progress)a=m;else b=m;}return 350+900*bez((a+b)/2,.25,.28);}
await seek(350,'02-map-roll-start.png');await seek(timeAt(.35),'03-map-unroll-35-percent.png');await seek(timeAt(.70),'04-map-unroll-70-percent.png');await seek(1330,'05-map-settle.png');
await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__tidalPost.getState().mapPhase==='MAP_READY');await page.locator('#waypoint-1').evaluate(e=>e.blur());await page.screenshot({path:path.join(out,'06-map-ready-final.png')});
console.log(JSON.stringify({errors,state:await page.evaluate(()=>window.__tidalPost.getState()),reveal:await page.evaluate(()=>window.__tidalPost.reveal())},null,2));
await browser.close();if(errors.length)process.exitCode=1;
