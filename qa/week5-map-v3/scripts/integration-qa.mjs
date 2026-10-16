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

await page.goto('http://127.0.0.1:4174/',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__tidalPost);
check('prototype opens at Harbor',(await app()).screen==='harbor');

await page.locator('[data-action="open-mission"]').click();
check('Harbor opens TP-042 mission',(await app()).screen==='mission');
await page.locator('[data-action="mission-primary"]').click();
let state=await app();
check('mission accepted and Mailbag opened',state.missionAccepted&&state.screen==='mailbag');

await page.locator('[data-item="blue-envelope"]').click();
state=await app();
check('blue envelope selected as draft',state.selectedItem==='blue-envelope'&&!state.mailbagSaved);
await page.locator('[data-action="save-mailbag"]').click();
check('mailbag saves required envelope',(await app()).mailbagSaved===true);

await page.locator('[data-action="go-map"]').click();
await page.waitForFunction(()=>window.__tidalPost.reveal()?.active===true);
check('first map entry plays unroll reveal',(await app()).mapPhase==='MAP_REVEALING');
await page.waitForTimeout(300);await page.keyboard.press('Enter');
await page.waitForFunction(()=>document.querySelector('[data-screen="map"]').dataset.mapPhase==='MAP_READY');
check('map reveal skip restores interactive MAP_READY',(await app()).mapPhase==='MAP_READY');

const portCount=await page.locator('.map-port').count();
check('map exposes at least three selectable ports',portCount>=3,`${portCount} ports`);
const routeBefore=await route();
await page.locator('#waypoint-1').focus();await page.keyboard.press('ArrowDown');
const routeAfterKey=await route();
check('W1 remains keyboard-draggable',routeAfterKey.waypoints[0].y===routeBefore.waypoints[0].y+8,`${routeBefore.waypoints[0].y} → ${routeAfterKey.waypoints[0].y}`);
await page.locator('#reset-route').click();

await page.evaluate(()=>window.__tidalRoute.selectDestination('east-tide-fishery'));
let routeState=await route();
check('destination switching changes endpoint geometry',routeState.destination.id==='east-tide-fishery'&&routeState.segments.at(-1).b.x===1363,JSON.stringify(routeState.destination));
check('wrong address is independent from route danger',routeState.destinationMatches===false&&typeof routeState.valid==='boolean',`match=${routeState.destinationMatches}; safe=${routeState.valid}`);
check('wrong address locks route confirmation',await page.locator('#confirm-route').isDisabled());

await page.evaluate(()=>window.__tidalRoute.selectDestination('blue-tide-north-pier'));
routeState=await route();
check('correct TP-042 destination restores matching state',routeState.destinationMatches&&routeState.destination.id==='blue-tide-north-pier');
check('default northern route remains safe',routeState.valid===true);

await page.locator('#confirm-route').click();
await page.waitForFunction(()=>document.querySelector('#confirmation').open===true);
check('safe matching route can be confirmed',(await route()).confirmed===true);
await page.locator('#confirmation button[type="submit"]').click();
await page.evaluate(()=>window.__tidalRoute.selectDestination('white-lantern-supply'));
check('changing destination invalidates old confirmation',(await route()).confirmed===false);
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
check('completed flow returns to Harbor',state.screen==='harbor'&&state.completed);
check('no runtime or asset errors',errors.length===0,errors.join(' | '));

await browser.close();
const report={generatedAt:new Date().toISOString(),checks,passed:checks.filter(item=>item.passed).length,failed:checks.filter(item=>!item.passed).length,errors};
fs.writeFileSync(path.join(qa,'integration-qa-report.json'),JSON.stringify(report,null,2));
console.log(`RESULT ${report.passed}/${checks.length} passed`);
if(report.failed||errors.length)process.exitCode=1;
