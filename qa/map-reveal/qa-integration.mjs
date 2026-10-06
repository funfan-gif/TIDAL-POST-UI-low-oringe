import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const assertions=[],errors=[],networkFailures=[],evidence={};
function check(name,pass,detail){assertions.push({name,passed:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);}
async function game(options={}){
  const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'no-preference',...options});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
  page.on('requestfailed',r=>networkFailures.push(r.url()+' '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)networkFailures.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:4174/');await page.evaluate(()=>document.fonts.ready);
  return {context,page};
}
const state=p=>p.evaluate(()=>window.__tidalPost.getState());
const route=p=>p.evaluate(()=>window.__tidalRoute.getState());
const reveal=p=>p.evaluate(()=>window.__tidalPost.reveal());
const ready=p=>p.waitForFunction(()=>window.__tidalPost.getState().mapPhase!=='MAP_REVEALING'&&window.__tidalPost.getState().screen==='map');
async function shot(p,name){
  await p.waitForFunction(()=>{const screen=document.querySelector('.screen.is-active'),flash=document.querySelector('#screenFlash');return (!screen||getComputedStyle(screen).opacity==='1')&&(!flash||parseFloat(getComputedStyle(flash).opacity)<.01);});
  if(await p.locator('#confirmation').isVisible())await p.waitForTimeout(220);
  await p.screenshot({path:path.join(out,name)});
}
async function neutral(p){await p.mouse.move(1900,1060);await p.evaluate(()=>document.activeElement?.blur());await p.waitForTimeout(200);}
async function bag(p){await p.locator('[data-action="open-mission"]').click();await p.locator('[data-action="mission-primary"]').click();await p.locator('[data-item="blue-envelope"]').click();await p.locator('#saveMailbagButton').click();}
async function enter(p){await p.locator('#goMapButton').click();}
async function seek(p,t){await p.evaluate(t=>document.getAnimations().forEach(a=>{if(a.effect?.target?.closest?.('.integrated-map')){a.pause();a.currentTime=t;}}),t);}
function timeAt(progress){let a=0,b=1;const bez=(t,p,q)=>3*(1-t)**2*t*p+3*(1-t)*t*t*q+t**3;for(let i=0;i<30;i++){let m=(a+b)/2;if(bez(m,.78,1)<progress)a=m;else b=m;}return 350+900*bez((a+b)/2,.25,.28);}
async function point(p,v){return p.evaluate(v=>{const m=document.querySelector('#chart').getScreenCTM();const q=new DOMPoint(v.x,v.y).matrixTransform(m);return{x:q.x,y:q.y};},v);}
async function drag(p,index,v){const a=await point(p,(await route(p)).waypoints[index]),b=await point(p,v);await p.mouse.move(a.x,a.y);await p.mouse.down();await p.mouse.move(b.x,b.y,{steps:16});await p.mouse.up();await p.mouse.move(1900,1060);}
async function clean(p){return p.evaluate(()=>({rolls:document.querySelectorAll('.map-reveal-origin,.map-reveal-clock,.map-reveal-skip,.map-continuity').length,inert:document.querySelector('.integrated-map .game-stage').inert,clip:getComputedStyle(document.querySelector('.chart-paper')).clipPath,willChange:getComputedStyle(document.querySelector('.chart-paper')).willChange,ledger:getComputedStyle(document.querySelector('.ledger')).opacity,focused:document.activeElement.id,animations:document.getAnimations().filter(a=>a.effect?.target?.closest?.('.integrated-map')&&a.effect.target.classList.contains('map-reveal-clock')).length}));}
try {
  const {page:p,context}=await game();
  check('Root contains exactly six screens, no iframe and no old island picker',await p.locator('.screen').count()===6&&await p.locator('iframe,[data-island]').count()===0);
  await p.locator('[data-action="open-mission"]').click();await p.locator('[data-action="mission-back"]').click();
  check('Mission return leads to Harbor',(await state(p)).screen==='harbor');
  await p.locator('[data-action="open-mission"]').click();await p.locator('[data-action="mission-primary"]').click();
  check('Unsaved mailbag locks map entry',await p.locator('#goMapButton').isDisabled());
  await p.locator('[data-item="shell-postcard"]').click();await p.locator('#saveMailbagButton').click();
  check('Wrong mail fails save and cannot enter map',!(await state(p)).mailbagSaved&&await p.locator('#goMapButton').isDisabled()&&await p.locator('#toast').textContent().then(s=>s.includes('保存失败')));
  await p.locator('[data-item="blue-envelope"]').click();await p.locator('#saveMailbagButton').click();
  check('Blue envelope recovery saves the task mailbag',(await state(p)).mailbagSaved&&(await state(p)).selectedItem==='blue-envelope');
  await p.locator('[data-action="view-mission-from-bag"]').click();await p.keyboard.press('Escape');
  check('Mailbag → Mission → Escape preserves saved mailbag',(await state(p)).screen==='mailbag'&&(await state(p)).mailbagSaved);
  await shot(p,'01-mailbag-before-map.png');await enter(p);await seek(p,100);
  check('First formal entry uses 1720ms full roll and MAP_REVEALING',(await reveal(p)).mode==='full'&&(await reveal(p)).duration===1720&&(await state(p)).mapPhase==='MAP_REVEALING');
  const before=(await route(p)).waypoints;await p.locator('#confirm-route').dispatchEvent('click');await p.locator('#reset-route').dispatchEvent('click');
  await p.keyboard.press('Enter');await p.keyboard.press('Escape');await p.keyboard.press(' ');
  const lockedPoint=await point(p,before[0]);await p.mouse.click(lockedPoint.x,lockedPoint.y);
  check('Before 200ms clicks and skip keys do not reveal or confirm',(await reveal(p)).active&&!(await route(p)).confirmed);
  check('Reveal locks route, reset and keyboard mutation',JSON.stringify((await route(p)).waypoints)===JSON.stringify(before)&&await p.locator('.game-stage').evaluate(e=>e.inert));
  await seek(p,350);await shot(p,'02-map-roll-start.png');
  const transform=await p.locator('#chart').evaluate(e=>{const m=e.getScreenCTM();return [m.a,m.b,m.c,m.d,m.e,m.f].join(',');});
  await seek(p,timeAt(.35));await shot(p,'03-map-unroll-35-percent.png');
  const mask35=await p.locator('.chart-paper').evaluate(e=>getComputedStyle(e).clipPath);
  await seek(p,timeAt(.70));await shot(p,'04-map-unroll-70-percent.png');
  check('Chart transform stays unchanged at 0%, 35% and 70%',transform===await p.locator('#chart').evaluate(e=>{const m=e.getScreenCTM();return [m.a,m.b,m.c,m.d,m.e,m.f].join(',');}));
  check('Mask reveals 35% of unscaled final chart',mask35.includes('65%'),mask35);
  check('Single roll has curved caps, inner crease and separate cast shadow',await p.locator('.paper-roll-cap').count()===2&&await p.locator('.paper-roll-shadow,.paper-roll-crease').count()===2);
  await seek(p,1330);await shot(p,'05-map-settle.png');
  await p.evaluate(()=>document.getAnimations().forEach(a=>{if(a.effect?.target?.closest?.('.integrated-map'))a.play();}));await ready(p);
  let c=await clean(p);check('Natural completion removes temporary roll and restores focus/input',c.rolls===0&&!c.inert&&c.clip.startsWith('polygon(')&&c.willChange==='auto'&&c.ledger==='1'&&c.focused==='waypoint-1',c);
  await neutral(p);await shot(p,'06-map-ready-final.png');
  const finalRoute=await route(p);check('Ready route matches original reference geometry and 2.4nm distance',finalRoute.valid&&finalRoute.total.toFixed(1)==='2.4'&&finalRoute.waypoints[0].x===520&&finalRoute.waypoints[1].x===940);
  check('Valid but unconfirmed route cannot enter Sailing',!(await state(p)).routePlan.confirmed);await p.evaluate(()=>window.__tidalPost.actions['start-sailing']());check('Unconfirmed sailing guard enforces Map',(await state(p)).screen==='map');
  // Match both states with the same neutral cursor and no focus; source remains unmodified.
  const source=await context.newPage();await source.goto('http://127.0.0.1:4174/week4/?state=valid');await source.evaluate(()=>document.fonts.ready);await neutral(source);await shot(source,'source-neutral.png');
  const integratedGeometry=await p.locator('#chart').evaluate(e=>{const m=e.getScreenCTM();return {viewBox:e.getAttribute('viewBox'),matrix:[m.a,m.b,m.c,m.d,m.e,m.f],proxy:[...e.querySelectorAll('.obstacle')].map(el=>el.outerHTML),paperClip:getComputedStyle(e.closest('.chart-paper')).clipPath};});
  const sourceGeometry=await source.locator('#chart').evaluate(e=>{const m=e.getScreenCTM();return {viewBox:e.getAttribute('viewBox'),matrix:[m.a,m.b,m.c,m.d,m.e,m.f],proxy:[...e.querySelectorAll('.obstacle')].map(el=>el.outerHTML),paperClip:getComputedStyle(e.closest('.chart-paper')).clipPath};});
  check('Final SVG viewBox, screen matrix and collision proxies match Week4',JSON.stringify(integratedGeometry)===JSON.stringify(sourceGeometry),integratedGeometry);
  await source.close();
  await drag(p,0,{x:485,y:665});let r=await route(p);
  check('Real W1 drag blocks the segment through Fog Reef',!r.valid&&r.segments[1].hazards.includes('fog')&&!(await state(p)).routePlan.valid,r);
  check('Blocked state locks confirm and shows hatch, warning and recovery ghost',await p.locator('#confirm-route').isDisabled()&&await p.locator('#map-warning').isVisible()&&await p.locator('#fog-zone.is-danger').count()===1&&await p.locator('#recovery-ghost').isVisible());
  await p.locator('#confirm-route').dispatchEvent('click');await p.evaluate(()=>window.__tidalPost.actions['start-sailing']());
  check('Blocked plan cannot confirm or sail',(await state(p)).screen==='map'&&!(await route(p)).confirmed&&!await p.locator('#confirmation').isVisible());
  await neutral(p);await shot(p,'07-route-blocked-after-reveal.png');await drag(p,0,{x:520,y:355});
  check('Moving W1 around north passage restores valid plan',(await route(p)).valid&&await p.locator('#confirm-route').isEnabled()&&(await state(p)).routePlan.valid);
  await p.locator('#waypoint-1').focus();await p.keyboard.press('ArrowRight');
  check('Keyboard moves W1 by original 8 chart units',(await route(p)).waypoints[0].x===528);
  await p.locator('#confirm-route').click();
  check('Confirm records a valid plan in Root state',(await state(p)).routePlan.confirmed&&(await state(p)).mapPhase==='MAP_CONFIRMED');
  check('Confirmation keeps Blue envelope ×1 and Blue Tide north pier',await p.locator('#confirmation').textContent().then(t=>t.includes('蓝色信封 ×1')&&t.includes('蓝潮岛 · 北侧码头')));
  await shot(p,'08-route-confirmed.png');await p.locator('#confirmation button').click();
  await drag(p,0,{x:535,y:350});check('Editing a confirmed plan revokes confirmation and saved sailing plan',!(await state(p)).routePlan.confirmed&&await p.evaluate(()=>sessionStorage.getItem('tidalPost.plannedRoute')===null));
  await p.locator('[data-action="map-back"]').click();check('Map return preserves saved Blue envelope',(await state(p)).screen==='mailbag'&&(await state(p)).mailbagSaved&&(await state(p)).selectedItem==='blue-envelope');
  await enter(p);const returnMode=await reveal(p);await ready(p);
  check('Returning uses only 180ms quick fade',returnMode.mode==='quick'&&returnMode.duration===180,returnMode);
  check('Edited W1/W2 survive returning',Math.abs((await route(p)).waypoints[0].x-535)<.1&&(await route(p)).waypoints[1].x===940);
  await neutral(p);await shot(p,'10-return-map-no-replay.png');await p.reload();await ready(p);
  check('Reload preserves saved mail and draft without replay',Math.abs((await route(p)).waypoints[0].x-535)<.1&&(await state(p)).mailbagSaved&&!(await reveal(p)).active);
  await p.locator('#reset-route').click();await p.locator('#confirm-route').click();await p.locator('[data-action="start-sailing"]').click();
  await p.waitForFunction(()=>window.__tidalPost.getState().sailing.elapsed>0);
  check('Confirmed map enters original Canvas Sailing in same root document',(await state(p)).screen==='sailing'&&p.url()==='http://127.0.0.1:4174/'&&await p.locator('#sailingCanvas').isVisible());
  await shot(p,'09-sailing-after-map.png');
  await p.keyboard.press('e');check('Early delivery is rejected by actual sailing engine',(await state(p)).screen==='sailing'&&!(await state(p)).sailing.delivered);
  await p.keyboard.press('m');check('Sailing map control still works',await p.locator('#sailingMapOverlay').isVisible());await p.keyboard.press('m');
  await p.keyboard.press('Escape');const paused=(await state(p)).sailing;await p.waitForTimeout(250);check('Sailing pause stops motion',paused.paused&&Math.abs((await state(p)).sailing.x-paused.x)<.01);await p.keyboard.press('Escape');
  await p.keyboard.down('w');await p.waitForFunction(()=>window.__tidalPost.getState().sailing.readyToDeliver,{},{timeout:35000});await p.keyboard.up('w');
  evidence.arrival=await state(p);check('Real keyboard sailing reaches delivery circle',evidence.arrival.sailing.readyToDeliver&&evidence.arrival.sailing.distance<=72,evidence.arrival.sailing);
  await p.keyboard.press('e');await p.waitForFunction(()=>window.__tidalPost.getState().screen==='result');
  check('Actual delivery opens Result with planned distance',(await state(p)).completed&&await p.locator('#resultRouteDistance').textContent()==='2.4 海里');
  await shot(p,'12-delivery-result.png');await p.locator('#claimRewardButton').click();await p.locator('#claimRewardButton').dispatchEvent('click');
  check('Reward is credited exactly once',(await state(p)).stamps===160&&(await state(p)).rewardClaimed);
  await p.locator('#returnHarborButton').click();check('Reward return completes Harbor flow',(await state(p)).screen==='harbor'&&(await state(p)).completed);
  // Return to the completed receipt through the existing navigation API to exercise its reset action.
  await p.evaluate(()=>window.__tidalPost.navigate('result'));await p.locator('#continueButton').click();
  check('New mission resets reveal flag, bag and plan',(await state(p)).missionRound===2&&!(await state(p)).mapRevealSeen&&!(await state(p)).mailbagSaved&&(await state(p)).routePlan===null);
  await p.locator('[data-action="mission-primary"]').click();await p.locator('[data-item="blue-envelope"]').click();await p.locator('#saveMailbagButton').click();await enter(p);await seek(p,500);
  check('New mission permits full roll again',(await reveal(p)).mode==='full');await p.keyboard.press('Enter');await ready(p);check('New mission route resets to original safe waypoints',(await route(p)).waypoints[0].x===520&&(await route(p)).valid);
  await context.close();
  for(const key of ['mouse','Enter',' ','Escape']){
    const {page:q,context:c}=await game();await bag(q);await enter(q);await seek(q,500);
    if(key==='mouse')await q.mouse.click(1650,900);else await q.keyboard.press(key);
    await ready(q);const s=await clean(q);
    check(`Skip ${key===' '?'Space':key} fully restores map, focus and controls`,s.rolls===0&&!s.inert&&s.clip.startsWith('polygon(')&&s.ledger==='1'&&s.focused==='waypoint-1'&&!(await route(q)).confirmed,s);
    check(`Skip ${key===' '?'Space':key} has no leftover animation or accidental action`,(await state(q)).screen==='map'&&!(await reveal(q)).active&&s.animations===0);
    await c.close();
  }
  const reduced=await game({reducedMotion:'reduce'});await bag(reduced.page);await enter(reduced.page);
  const rm=await reveal(reduced.page);check('Reduced motion uses 150ms fade, no traveling roll',rm.mode==='reduced'&&rm.duration===150&&await reduced.page.locator('.map-reveal-origin').count()===0,rm);
  await ready(reduced.page);await neutral(reduced.page);await shot(reduced.page,'11-reduced-motion.png');await drag(reduced.page,0,{x:485,y:665});await drag(reduced.page,0,{x:520,y:355});await reduced.page.locator('#confirm-route').click();
  check('Reduced motion retains route validation, confirmation and sailing gate',(await route(reduced.page)).valid&&(await state(reduced.page)).routePlan.confirmed);await reduced.context.close();
  for(const viewport of [{width:1920,height:1080},{width:1366,height:768}]){
    const {page:q,context:c}=await game({viewport});await bag(q);await enter(q);await seek(q,timeAt(.70));
    const bounds=await q.locator('.game-stage').boundingBox();const matrix=await q.locator('#chart').evaluate(e=>{const m=e.getScreenCTM();return [m.a,m.b,m.c,m.d,m.e,m.f].join(',');});
    check(`${viewport.width}×${viewport.height} scene fits during roll`,bounds.x>=-1&&bounds.y>=-1&&bounds.x+bounds.width<=viewport.width+1&&bounds.y+bounds.height<=viewport.height+1,bounds);
    await q.keyboard.press('Escape');await ready(q);check(`${viewport.width}×${viewport.height} reveal leaves chart coordinate transform unchanged`,matrix===await q.locator('#chart').evaluate(e=>{const m=e.getScreenCTM();return [m.a,m.b,m.c,m.d,m.e,m.f].join(',');}));
    await drag(q,0,{x:485,y:665});await drag(q,0,{x:520,y:355});check(`${viewport.width}×${viewport.height} real pointer collision and recovery works`,(await route(q)).valid);
    if(viewport.width===1366){await neutral(q);await shot(q,'14-map-ready-1366x768.png');}
    await c.close();
  }
  const preserved=JSON.parse(fs.readFileSync(path.join(out,'preserved-hashes.json'),'utf8'));
  const changed=Object.entries(preserved).filter(([f,h])=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')!==h).map(([f])=>f);
  check('All 161 protected Week4, old QA, assets and original sailing/styles files remain byte-identical',changed.length===0,{protected:Object.keys(preserved).length,changed});
} catch(e){errors.push(e.stack);check('Test run completes',false,e.message);}
finally {
  check('Browser has no runtime/console errors',errors.length===0,errors);check('Browser has no failed or missing resources',networkFailures.length===0,networkFailures);
  const report={testedAt:new Date().toISOString(),browser:'Microsoft Edge / Playwright',assertions,passed:assertions.filter(a=>a.passed).length,total:assertions.length,errors,networkFailures,evidence};
  fs.writeFileSync(path.join(out,'qa-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total,failed:assertions.filter(a=>!a.passed).map(a=>a.name),errors},null,2));await browser.close();if(report.passed!==report.total)process.exitCode=1;
}
