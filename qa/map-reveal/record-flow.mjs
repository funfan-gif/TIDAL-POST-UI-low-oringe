// Actual browser screenshots + MediaRecorder, so evidence needs no ffmpeg install.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'no-preference'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__qaPhases=[];addEventListener('DOMContentLoaded',()=>{const map=document.querySelector('.integrated-map');new MutationObserver(()=>window.__qaPhases.push({phase:map.dataset.mapPhase,time:performance.now()})).observe(map,{attributes:true,attributeFilter:['data-map-phase']});});});
await page.goto('http://127.0.0.1:4174/');await page.evaluate(()=>document.fonts.ready);
await page.locator('[data-action="open-mission"]').click();await page.locator('[data-action="mission-primary"]').click();await page.locator('[data-item="blue-envelope"]').click();
const recorder=await context.newPage();
await recorder.setContent('<canvas width="1920" height="1080"></canvas>');
await recorder.evaluate(()=>{
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
  const stream=canvas.captureStream(0),track=stream.getVideoTracks()[0],mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm;codecs=vp8';
  window.__recorders={};window.__frame=async base64=>{const b=await(await fetch('data:image/jpeg;base64,'+base64)).blob(),img=await createImageBitmap(b);ctx.drawImage(img,0,0,1920,1080);img.close();track.requestFrame();};
  window.__start=name=>{const chunks=[],record=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4500000});record.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};record.start(100);window.__recorders[name]={record,chunks};};
  window.__stop=name=>new Promise(resolve=>{const r=window.__recorders[name];r.record.onstop=async()=>{const data=new Uint8Array(await new Blob(r.chunks,{type:mime}).arrayBuffer());let encoded='';for(let i=0;i<data.length;i+=32768)encoded+=String.fromCharCode(...data.subarray(i,i+32768));resolve(btoa(encoded));};r.record.stop();});
});
let frames=0,acceptFrames=true;
await page.bringToFront();
await recorder.evaluate(()=>{window.__start('full');window.__start('reveal');});
const pumping=(async()=>{while(acceptFrames){const frame=await page.screenshot({type:'jpeg',quality:92});await recorder.evaluate(data=>window.__frame(data),frame.toString('base64'));frames++;await page.waitForTimeout(16);}})();
await page.waitForTimeout(300);await page.locator('#saveMailbagButton').click();await page.waitForTimeout(450);
await page.locator('#goMapButton').click();
await page.waitForFunction(()=>window.__tidalPost.getState().mapPhase==='MAP_READY');await page.waitForTimeout(450);
fs.writeFileSync(path.join(out,'map-reveal-flow.webm'),Buffer.from(await recorder.evaluate(()=>window.__stop('reveal')),'base64'));
await page.mouse.move(1900,1060);await page.evaluate(()=>document.activeElement.blur());
await page.screenshot({path:path.join(out,'15-natural-map-ready.png')});
async function point(p){return page.evaluate(p=>{const v=new DOMPoint(p.x,p.y).matrixTransform(document.querySelector('#chart').getScreenCTM());return{x:v.x,y:v.y};},p);}
async function drag(target){const from=await point((await page.evaluate(()=>window.__tidalRoute.getState())).waypoints[0]),to=await point(target);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:16});await page.mouse.up();await page.mouse.move(1900,1060);}
await page.waitForTimeout(400);await drag({x:485,y:665});await page.waitForTimeout(700);await drag({x:520,y:355});await page.waitForTimeout(500);
await page.locator('#confirm-route').click();await page.waitForTimeout(800);await page.locator('[data-action="start-sailing"]').click();await page.waitForTimeout(900);
await page.screenshot({path:path.join(out,'16-recorded-sailing.png')});
acceptFrames=false;await pumping;
fs.writeFileSync(path.join(out,'mailbag-to-sailing.webm'),Buffer.from(await recorder.evaluate(()=>window.__stop('full')),'base64'));
const phases=await page.evaluate(()=>window.__qaPhases),start=phases.find(x=>x.phase==='MAP_REVEALING'),end=phases.find(x=>x.phase==='MAP_READY');
const report={generatedAt:new Date().toISOString(),capture:'Actual root browser flow, browser screenshot frames encoded by native MediaRecorder; no animation seeking or skip',frames,phases,naturalRevealDurationMs:end.time-start.time,screen:await page.evaluate(()=>window.__tidalPost.getState().screen),errors,files:['map-reveal-flow.webm','mailbag-to-sailing.webm'].map(name=>({name,bytes:fs.statSync(path.join(out,name)).size}))};
fs.writeFileSync(path.join(out,'video-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(errors.length||report.screen!=='sailing'||report.naturalRevealDurationMs>2000)process.exitCode=1;
