import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

// Run: node qa-week4.mjs <absolute runtime node_modules directory>
const require = createRequire(path.join(process.argv[2], 'package.json'));
const {chromium} = require('playwright');
const out = path.dirname(fileURLToPath(import.meta.url));
const base = 'http://127.0.0.1:4174/week4/';
const assertions = [], consoleErrors = [], networkFailures = [];
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context = await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
const page = await context.newPage();
page.on('pageerror',e=>consoleErrors.push(e.message));
page.on('requestfailed',req=>networkFailures.push({url:req.url(),error:req.failure()?.errorText}));
page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
function assert(name,passed,detail){assertions.push({name,passed:!!passed,detail});}
async function load(query=''){await page.goto(base+query);await page.waitForFunction(()=>window.__tidalRoute);await page.evaluate(()=>document.fonts.ready);}
async function state(){return page.evaluate(()=>window.__tidalRoute.getState());}
async function shot(name){await page.screenshot({path:path.join(out,name)});}
async function screenPoint(p){return page.evaluate(p=>{const m=document.querySelector('#chart').getScreenCTM();const v=new DOMPoint(p.x,p.y).matrixTransform(m);return{x:v.x,y:v.y};},p);}
async function drag(index,p){const before=await state();const a=await screenPoint(before.waypoints[index]);const b=await screenPoint(p);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:20});await page.mouse.up();await page.mouse.move(1900,1050);}
try {
await load('?state=valid');
let s=await state();assert('Valid preset: all three segments navigable',s.valid && s.segments.length===3,s);
assert('Distance from shared chart projection rounds to 2.4 nm',s.total.toFixed(1)==='2.4',s.total);
assert('Fixed Blue Tide target; Fog Reef has no destination control',await page.locator('[data-island]').count()===0 && await page.locator('.destination-label').textContent().then(t=>t.includes('固定目的地')));
assert('Confirm enabled on valid route',await page.locator('#confirm-route').isEnabled());
assert('No debug in submission state',!await page.locator('#debug-panel').isVisible() && !await page.locator('#debug-geometry').isVisible());
await shot('01-route-valid-1920x1080.png');
const hoverPoint=await screenPoint(s.waypoints[0]);await page.mouse.move(hoverPoint.x,hoverPoint.y);
assert('Waypoint hover exposes manipulation hint',await page.locator('#waypoint-1 .waypoint-tip').isVisible());
await drag(0,{x:485,y:665});s=await state();
assert('Real pointer drag W1 blocks W1-W2',!s.valid && s.segments[1].hazards.includes('fog') && !s.segments[0].blocked,s);
assert('Collision checks entire segment: W1 and W2 outside ellipse',await page.evaluate(()=>{const p=window.__tidalRoute.getState().waypoints;const el=document.querySelector('#fog-obstacle');return p.every(v=>!el.isPointInFill(new DOMPoint(v.x,v.y)));}));
assert('Drag changes bearing, distance and ledger together',s.total.toFixed(1)!=='2.4' && await page.locator('#total-distance').textContent()===s.total.toFixed(1));
assert('Blocked confirmation disabled',await page.locator('#confirm-route').isDisabled());
assert('Redundant blocked line, hatch, warning, explanation and ghost',await page.locator('.route-segment.is-blocked').count()>0 && await page.locator('#fog-zone.is-danger').count()===1 && await page.locator('#map-warning').isVisible() && await page.locator('#recovery-ghost').isVisible() && await page.locator('#route-status').textContent().then(t=>t.includes('4m 以下浅滩')&&t.includes('当前低潮')));
await page.locator('#confirm-route').dispatchEvent('click');
assert('Blocked route cannot confirm even through dispatched click',!(await state()).confirmed && !await page.locator('#confirmation').isVisible());
await drag(0,{x:520,y:355});
assert('W1 recovery restores safe solid line and enables confirmation',(await state()).valid && await page.locator('#confirm-route').isEnabled() && !await page.locator('#map-warning').isVisible());
await drag(1,{x:750,y:550});
assert('Real W2 drag independently triggers collision',!(await state()).valid);
await drag(1,{x:940,y:315});
assert('W2 recovery synchronizes map and ledger',(await state()).valid && await page.locator('#status-title').textContent()==='航线安全');
await drag(0,{x:140,y:730});
assert('Land crossing blocked with specific cause',!(await state()).valid && await page.locator('#status-reason').textContent().then(t=>t.includes('陆地')));
await page.locator('#reset-route').click();assert('Reset restores safe reference route',(await state()).valid && (await state()).waypoints[0].x===520);
await drag(1,{x:1065,y:737});
assert('Old wreck reef independently blocks route',!(await state()).valid && (await state()).segments.some(s=>s.hazards.includes('wreck')));
await page.locator('#reset-route').click();
await drag(0,{x:330,y:535});
assert('Lighthouse islet uses its transformed SVG collision geometry',!(await state()).valid && await page.locator('#status-reason').textContent().then(t=>t.includes('陆地')));
await page.locator('#reset-route').click();
await drag(1,{x:520,y:355});
assert('Coincident waypoints blocked with recoverable explanation',!(await state()).valid && (await state()).segments[1].tooShort);
await page.locator('#reset-route').click();
await page.locator('#waypoint-1').focus();const beforeKey=(await state()).waypoints[0].x;await page.keyboard.press('ArrowRight');
assert('Keyboard moves focused waypoint by 8 units',(await state()).waypoints[0].x===beforeKey+8);
await page.keyboard.press('Shift+ArrowLeft');assert('Shift arrow precision modifier', (await state()).waypoints[0].x===beforeKey-16);
await page.locator('#reset-route').click();await page.locator('#confirm-route').click();
assert('Confirm creates explicit successful modal and route data',(await state()).confirmed && await page.locator('#confirmation').isVisible() && await page.evaluate(()=>JSON.parse(sessionStorage.getItem('tidalPost.plannedRoute')).destination==='blue-tide-north-pier'));
await shot('03-route-confirmed-1920x1080.png');
await page.locator('#confirmation button').click();await drag(0,{x:535,y:350});
assert('Any adjustment revokes previous confirmation and saved sailing plan',!(await state()).confirmed && await page.evaluate(()=>sessionStorage.getItem('tidalPost.plannedRoute')===null));
await load('?state=blocked');s=await state();
assert('Blocked preset deterministic',!s.valid && s.waypoints[0].x===485 && s.segments[1].hazards.includes('fog'));
await shot('02-route-blocked-1920x1080.png');
const geometry=await page.evaluate(()=>{const within=['.chart-paper','.ledger','#confirm-route','.desk-heading'].map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {sel,x:r.x,y:r.y,right:r.right,bottom:r.bottom,inside:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};});const ledger=document.querySelector('.ledger');const overflowing=[...ledger.querySelectorAll('*')].filter(e=>!e.matches('.tide-line,.tide-line *')&&e.clientWidth>0&&(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)).map(e=>e.id||e.className);const footerFits=document.querySelector('.ledger-footnote').getBoundingClientRect().bottom<ledger.getBoundingClientRect().bottom-10;return{within,overflowing,footerFits,documentWidth:document.documentElement.scrollWidth};});
assert('1920x1080: scene bounds and ledger content fit',geometry.within.every(r=>r.inside)&&geometry.overflowing.length===0&&geometry.footerFits&&geometry.documentWidth===1920,geometry);
await page.addStyleTag({content:'.game-stage{filter:grayscale(1)}'});await shot('04-blocked-grayscale-1920x1080.png');
await load('?state=valid');await page.addStyleTag({content:'.game-stage{filter:grayscale(1)}'});await shot('05-valid-grayscale-1920x1080.png');
await page.setViewportSize({width:960,height:540});await load('?state=blocked');
await shot('06-blocked-half-scale-960x540.png');
const half=await page.locator('#waypoint-1').boundingBox();assert('50% game scale retains 34px pointer target',half.width>=33 && half.width<=36,half);
await drag(0,{x:520,y:355});assert('Pointer drag works under 50% scaled and rotated chart',(await state()).valid);
for(const viewport of [{width:1366,height:768},{width:1440,height:900}]){await page.setViewportSize(viewport);await load('?state=valid');const r=await page.locator('.game-stage').boundingBox();assert(`Letterbox fits ${viewport.width}x${viewport.height}`,r.x>=-1&&r.y>=-1&&r.x+r.width<=viewport.width+1&&r.y+r.height<=viewport.height+1,r);}
await page.setViewportSize({width:1920,height:1080});
await load('');await drag(0,{x:560,y:330});await page.reload();await page.waitForFunction(()=>window.__tidalRoute);assert('Route draft survives reload and return',Math.abs((await state()).waypoints[0].x-560)<.1,(await state()).waypoints);
await page.locator('#confirm-route').click();await page.locator('#confirmation button').click();await page.reload();await page.waitForFunction(()=>window.__tidalRoute);assert('Confirmed state survives reload',(await state()).confirmed);
await load('?state=blocked&debug=1');assert('Debug geometry and state opt-in only',await page.locator('#debug-panel').isVisible()&&await page.locator('#debug-geometry').isVisible());
await page.setViewportSize({width:2400,height:1350});await page.goto(base+'submission-board.html');await page.evaluate(()=>document.fonts.ready);await shot('07-submission-board-2400x1350.png');
assert('Board renders both full-resolution screenshots',await page.locator('.states img').evaluateAll(imgs=>imgs.length===2&&imgs.every(img=>img.complete&&img.naturalWidth===1920)));
assert('No route or board console errors',consoleErrors.length===0,consoleErrors);assert('No failed local resource requests',networkFailures.length===0,networkFailures);
} finally {
const report={generatedAt:new Date().toISOString(),baseCommit:'c70c3e7908927593aa0fff65173556b2c088711d',passed:assertions.every(a=>a.passed),assertions,consoleErrors,networkFailures};
fs.writeFileSync(path.join(out,'qa-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:report.passed,assertionCount:assertions.length,failures:assertions.filter(a=>!a.passed)},null,2));await browser.close();if(!report.passed)process.exitCode=1;
}
