import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..'),assets=path.join(root,'week4/submission-assets');
fs.mkdirSync(assets,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'no-preference'});
const page=await context.newPage(),checks=[],errors=[],samples=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
function check(name,passed,detail){checks.push({name,passed:!!passed,detail});console.log((passed?'PASS ':'FAIL ')+name);}
const state=()=>page.evaluate(()=>window.__tidalPost.getState());
async function shot(name){await page.screenshot({path:path.join(assets,name)});}
async function neutral(){await page.mouse.move(1900,1060);await page.evaluate(()=>document.activeElement?.blur());await page.waitForTimeout(200);}
async function drag(target){const points=await page.evaluate(target=>{const chart=document.querySelector('#chart'),m=chart.getScreenCTM(),start=window.__tidalRoute.getState().waypoints[0];return [start,target].map(p=>{const q=new DOMPoint(p.x,p.y).matrixTransform(m);return{x:q.x,y:q.y};});},target);await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();await page.mouse.move(points[1].x,points[1].y,{steps:16});await page.mouse.up();}
async function captureAt(t,name){
  await page.waitForFunction(t=>window.__tidalPost.reveal().elapsed>=t,t);
  const sample=await page.evaluate(()=>{const paper=document.querySelector('.chart-paper'),carrier=document.querySelector('.paper-roll-carrier'),clip=getComputedStyle(paper).clipPath,match=clip.match(/inset\(0px ([\d.]+)%/);return{elapsed:window.__tidalPost.reveal().elapsed,progress:1-Number(match[1])/100,rollX:new DOMMatrix(getComputedStyle(carrier).transform).m41,mask:getComputedStyle(paper).maskImage,inert:document.querySelector('.game-stage').inert};});
  samples.push(sample);await shot(name);
}
try{
  await page.addInitScript(()=>{window.__phases=[];addEventListener('DOMContentLoaded',()=>{const map=document.querySelector('.integrated-map');new MutationObserver(()=>window.__phases.push({phase:map.dataset.mapPhase,time:performance.now()})).observe(map,{attributes:true,attributeFilter:['data-map-phase']});});});
  await page.goto('http://127.0.0.1:4174/');await page.evaluate(()=>document.fonts.ready);
  await page.locator('[data-action="open-mission"]').click();await page.locator('[data-action="mission-primary"]').click();await page.locator('[data-item="blue-envelope"]').click();await page.locator('#saveMailbagButton').click();await page.waitForTimeout(400);await shot('01-mailbag-saved.png');
  check('Saved mailbag permits map entry',(await state()).mailbagSaved&&await page.locator('#goMapButton').isEnabled());
  await page.locator('#goMapButton').click();
  await captureAt(1500,'roll-early.png');await captureAt(3100,'02-map-unroll.png');await captureAt(4500,'roll-late.png');
  check('Wear mask remains active throughout the unroll',samples.every(s=>s.mask.includes('paper-edge-mask.svg')));
  check('Roll and material mask stay aligned; route input is locked',samples.every(s=>Math.abs(s.rollX-s.progress*1400)<.05&&s.inert),samples);
  await page.waitForFunction(()=>window.__tidalPost.getState().mapPhase==='MAP_READY');
  const phases=await page.evaluate(()=>window.__phases),duration=phases.find(x=>x.phase==='MAP_READY').time-phases.find(x=>x.phase==='MAP_REVEALING').time;
  check('Natural full reveal stays within 5–6 seconds',duration>=5000&&duration<=6000,{duration,phases});
  check('Completed reveal cleans temporary objects and restores controls',await page.evaluate(()=>!document.querySelector('.map-reveal-origin')&&!document.querySelector('.game-stage').inert&&document.activeElement.id==='waypoint-1'));
  await neutral();await shot('03-map-ready.png');
  const original=await context.newPage();await original.goto('http://127.0.0.1:4174/week4/?state=valid');await original.evaluate(()=>document.fonts.ready);await original.mouse.move(1900,1060);await original.evaluate(()=>document.activeElement?.blur());await original.waitForTimeout(200);await original.screenshot({path:path.join(out,'screenshots/standalone-worn-map.png')});await original.close();
  await drag({x:485,y:665});await neutral();await shot('04-map-blocked.png');
  check('Actual pointer input triggers dangerous route and disables confirmation',!(await state()).routePlan.valid&&await page.locator('#confirm-route').isDisabled());
  await page.evaluate(()=>window.__tidalPost.actions['start-sailing']());check('Dangerous route cannot start sailing',(await state()).screen==='map');
  await drag({x:520,y:355});await neutral();await shot('map-recovered.png');check('Moving the waypoint back restores a safe route',(await state()).routePlan.valid);
  await page.locator('#confirm-route').click();await page.waitForTimeout(250);await shot('05-map-confirmed.png');check('Confirmation saves a valid route',(await state()).routePlan.confirmed);
  await page.locator('[data-action="start-sailing"]').click();await page.waitForFunction(()=>window.__tidalPost.getState().sailing.elapsed>0);await page.waitForTimeout(500);await shot('06-sailing.png');check('Confirmed map enters the existing sailing engine',(await state()).screen==='sailing');
  const doc=await context.newPage();await doc.goto('http://127.0.0.1:4174/week4/submission-board.html');await doc.evaluate(()=>document.fonts.ready);await doc.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));await doc.emulateMedia({media:'print'});
  const layout=await doc.locator('.sheet').evaluateAll(pages=>pages.map(p=>{const r=p.getBoundingClientRect(),footer=p.querySelector('footer').getBoundingClientRect();const notes=[...p.querySelectorAll('.notes p')].map(n=>n.getBoundingClientRect());return{height:r.height,footerBottom:footer.bottom-r.top,notesBelowFooter:notes.some(n=>n.bottom>footer.top-2),overflow:p.scrollHeight>p.clientHeight+1};}));
  check('Six printable pages have no clipped notes or overflow',layout.length===6&&layout.every(p=>!p.overflow&&!p.notesBelowFooter&&p.footerBottom<p.height),layout);
  await doc.pdf({path:path.join(root,'week4/submission-board.pdf'),printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});await doc.close();
  const demoContext=await browser.newContext({viewport:{width:1600,height:1100},reducedMotion:'no-preference'});
  const demo=await demoContext.newPage(),requests=[];demo.on('pageerror',e=>errors.push('Teacher: '+e.message));
  await demo.route('**/*',async r=>{const url=r.request().url();if(url.startsWith('http')){requests.push(url);await r.abort();}else await r.continue();});
  await demo.goto('file:///'+path.join(root,'teacher-demo.html').replaceAll('\\','/'));
  await demo.locator('#play').waitFor({state:'visible'});await demo.waitForFunction(()=>!document.querySelector('#play').disabled);
  check('Standalone teacher HTML starts offline at the mailbag',(await demo.evaluate(()=>window.__teacherDemo.state())).screen==='mailbag');
  await demo.screenshot({path:path.join(out,'screenshots/teacher-demo-start.png')});
  await demo.locator('#play').click();await demo.waitForFunction(()=>window.__teacherDemo.state()?.screen==='map'&&window.__teacherDemo.state().mapPhase==='MAP_REVEALING');
  await demo.waitForTimeout(3000);await demo.screenshot({path:path.join(out,'screenshots/teacher-demo-unrolling.png')});
  await demo.waitForFunction(()=>window.__teacherDemo.state()?.screen==='map'&&window.__teacherDemo.state().routePlan?.valid===false);
  check('Teacher autoplay demonstrates real collision and disabled confirm',await demo.frameLocator('#prototype').locator('#confirm-route').isDisabled());
  await demo.waitForFunction(()=>window.__teacherDemo.lastRun?.complete,{},{timeout:20000});
  check('Teacher autoplay completes save, reveal, failure/recovery, confirm and sailing',await demo.evaluate(()=>window.__teacherDemo.lastRun.screen==='sailing'&&window.__teacherDemo.lastRun.mailbagSaved&&window.__teacherDemo.lastRun.confirmed));
  await demo.screenshot({path:path.join(out,'screenshots/teacher-demo-sailing.png')});
  check('Single-file teacher demo makes no external resource requests',requests.length===0,requests);
  await demo.locator('#restart').click();await demo.waitForFunction(()=>!document.querySelector('#play').disabled&&window.__teacherDemo.state().screen==='mailbag');
  check('Teacher restart resets to an unsaved blue envelope',!(await demo.evaluate(()=>window.__teacherDemo.state())).mailbagSaved);
  await demoContext.close();
}catch(e){errors.push(e.stack);check('Capture and export finish',false,e.message);}
finally{check('No runtime or missing-resource errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'delivery-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),passed:checks.filter(x=>x.passed).length,total:checks.length,samples,checks,errors},null,2));console.log(JSON.stringify({passed:checks.filter(x=>x.passed).length,total:checks.length,errors},null,2));await browser.close();if(checks.some(x=>!x.passed))process.exitCode=1;}
