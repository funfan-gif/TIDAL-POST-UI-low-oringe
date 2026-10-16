import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchBrowser} from '../../playwright-runtime.mjs';
const qa=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await launchBrowser();
const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'no-preference'});
const page=await context.newPage();
const checks=[];
const errors=[];
const check=(name,passed,detail='')=>{checks.push({name,passed:Boolean(passed),detail});console.log(`${passed?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`);};
page.on('pageerror',error=>errors.push(error.message));
page.on('requestfailed',request=>errors.push(`${request.failure()?.errorText||'failed'} ${request.url()}`));
const app=()=>page.evaluate(()=>window.__tidalPost.getState());
const route=()=>page.evaluate(()=>window.__tidalRoute?.getState());

await page.goto('http://127.0.0.1:4174/?qa=harbor-integration',{waitUntil:'networkidle'});
await page.evaluate(()=>sessionStorage.clear());
await page.reload({waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__tidalPost?.harbor());
check('prototype opens at the quiet Harbor event',(await app()).screen==='harbor'&&(await app()).harborEventPhase==='waiting');

await page.locator('[data-action="wait-letter"]').click();
await page.waitForTimeout(800);
await page.locator('[data-action="skip-letter"]').click();
await page.waitForFunction(()=>window.__tidalPost.getState().harborEventPhase==='revealed');
check('arrival can be skipped without losing the commission',(await page.locator('#harborTitle').textContent()).trim()==='蓝潮岛的回信');
await page.locator('.letter-accept').click();
check('letter acceptance opens TP-042 Mission',(await app()).screen==='mission');

await page.locator('[data-action="mission-primary"]').click();
let state=await app();
check('mission accepted and Mailbag opened',state.missionAccepted&&state.screen==='mailbag');
await page.locator('[data-item="blue-envelope"]').click();
check('blue envelope selected as draft',(await app()).selectedItem==='blue-envelope'&&!(await app()).mailbagSaved);
await page.locator('[data-action="save-mailbag"]').click();
check('mailbag saves required envelope',(await app()).mailbagSaved===true);

await page.locator('[data-action="go-map"]').click();
await page.waitForFunction(()=>window.__tidalPost.reveal()?.active===true);
check('first map entry still plays unroll reveal',(await app()).mapPhase==='MAP_REVEALING');
await page.waitForTimeout(300);
await page.keyboard.press('Enter');
await page.waitForFunction(()=>document.querySelector('[data-screen="map"]').dataset.mapPhase==='MAP_READY');
check('map reveal restores MAP_READY',(await app()).mapPhase==='MAP_READY');

check('map still exposes three destinations',(await page.locator('.map-port').count())>=3);
const before=await route();
await page.locator('#waypoint-1').focus();
await page.keyboard.press('ArrowDown');
const after=await route();
check('W1 remains keyboard-draggable',after.waypoints[0].y===before.waypoints[0].y+8,`${before.waypoints[0].y} → ${after.waypoints[0].y}`);
await page.locator('#reset-route').click();

await page.evaluate(()=>window.__tidalRoute.selectDestination('white-lantern-supply'));
let routeState=await route();
check('wrong destination remains independently address-invalid',routeState.destinationMatches===false&&typeof routeState.valid==='boolean',`match=${routeState.destinationMatches}; safe=${routeState.valid}`);
check('wrong address keeps confirmation locked',await page.locator('#confirm-route').isDisabled());
await page.evaluate(()=>window.__tidalRoute.selectDestination('blue-tide-north-pier'));
routeState=await route();
check('correct destination restores matching and safe states',routeState.destinationMatches&&routeState.valid);

await page.locator('#confirm-route').click();
await page.waitForFunction(()=>document.querySelector('#confirmation').open===true);
check('matching route can be confirmed',(await route()).confirmed===true);
await page.locator('#confirmation button[type="submit"]').click();
await page.evaluate(()=>window.__tidalRoute.selectDestination('east-tide-fishery'));
check('destination changes still invalidate confirmation',(await route()).confirmed===false);
await page.evaluate(()=>window.__tidalRoute.selectDestination('blue-tide-north-pier'));
await page.locator('#confirm-route').click();
await page.waitForFunction(()=>document.querySelector('#confirmation').open===true);

await page.locator('[data-action="start-sailing"]').click();
await page.waitForFunction(()=>window.__tidalPost.getState().screen==='sailing');
check('confirmed route opens Sailing HUD',(await app()).screen==='sailing');
await page.evaluate(()=>window.__tidalPost.sailing.control('throttle-up',true));
await page.waitForFunction(()=>window.__tidalPost.sailing.getState().readyToDeliver===true,null,{timeout:40000});
await page.evaluate(()=>{window.__tidalPost.sailing.control('throttle-up',false);window.__tidalPost.sailing.tryDeliver();});
await page.waitForFunction(()=>window.__tidalPost.getState().screen==='result',null,{timeout:5000});
state=await app();
check('TP-042 reaches delivery result',state.completed&&state.screen==='result');
await page.locator('[data-action="claim-reward"]').click();
state=await app();
check('reward is claimed once',state.rewardClaimed&&state.stamps===160,`stamps=${state.stamps}`);
await page.locator('[data-action="return-harbor"]').click();
state=await app();
check('completed flow returns to opened Harbor letter',state.screen==='harbor'&&state.completed&&state.harborEventPhase==='revealed');
check('diegetic Harbor postage token reflects the reward',(await page.locator('#harborStampBalance').textContent()).trim()==='160');
check('no runtime or asset errors',errors.length===0,errors.join(' | '));

await browser.close();
const report={generatedAt:new Date().toISOString(),checks,passed:checks.filter(item=>item.passed).length,failed:checks.filter(item=>!item.passed).length,errors};
fs.writeFileSync(path.join(qa,'integration-qa-report.json'),JSON.stringify(report,null,2));
console.log(`RESULT ${report.passed}/${checks.length} passed`);
if(report.failed||errors.length)process.exitCode=1;
