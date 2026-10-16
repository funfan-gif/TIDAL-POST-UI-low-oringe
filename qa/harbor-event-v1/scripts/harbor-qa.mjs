import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launchBrowser} from '../../playwright-runtime.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const qa=path.resolve(here,'..');
const after=path.join(qa,'after');
fs.mkdirSync(after,{recursive:true});

const browser=await launchBrowser();
const checks=[];
const errors=[];
const check=(name,passed,detail='')=>{checks.push({name,passed:Boolean(passed),detail});console.log(`${passed?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`);};
const visible=async(locator)=>locator.evaluate(node=>{const style=getComputedStyle(node);const rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>.05&&rect.width>0&&rect.height>0;});

const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'no-preference'});
const page=await context.newPage();
page.on('pageerror',error=>errors.push(error.message));
page.on('requestfailed',request=>errors.push(`${request.failure()?.errorText||'failed'} ${request.url()}`));
await page.goto('http://127.0.0.1:4174/?qa=harbor-event',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__tidalPost?.harbor());
await page.evaluate(()=>sessionStorage.clear());
await page.reload({waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__tidalPost?.harbor());
await page.waitForTimeout(300);

const initial=await page.evaluate(()=>({
  screen:window.__tidalPost.getState().screen,
  phase:window.__tidalPost.harbor().phase,
  topbar:getComputedStyle(document.querySelector('.topbar')).display,
  footer:getComputedStyle(document.querySelector('.bottombar')).display,
  dashboardCards:document.querySelectorAll('[data-screen="harbor"] .mission-card,[data-screen="harbor"] .voyage-log').length,
  buttons:[...document.querySelectorAll('[data-screen="harbor"] button')].filter(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return !node.disabled&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>.05&&r.width>0&&r.height>0}).map(node=>node.textContent.trim()),
  overflow:[document.documentElement.scrollWidth,innerWidth,document.documentElement.scrollHeight,innerHeight]
}));
check('Harbor opens as an event scene',initial.screen==='harbor'&&initial.phase==='waiting');
check('dashboard chrome is removed on Harbor',initial.topbar==='none'&&initial.footer==='none'&&initial.dashboardCards===0);
check('waiting state exposes one action only',initial.buttons.length===1&&initial.buttons[0].includes('等待来信'),initial.buttons.join(' / '));
check('1920×1080 waiting state has no overflow',initial.overflow[0]===initial.overflow[1]&&initial.overflow[2]===initial.overflow[3],initial.overflow.join('×'));
await page.screenshot({path:path.join(after,'01-waiting-harbor-1920x1080.png')});

await page.locator('[data-action="wait-letter"]').focus();
check('waiting action has keyboard focus',await page.evaluate(()=>document.activeElement?.matches('[data-action="wait-letter"]')));
const started=Date.now();
await page.keyboard.press('Enter');
check('activating wait begins the arrival state',(await page.locator('#harborEvent').getAttribute('data-phase'))==='arriving');

await page.waitForTimeout(1300);
check('spirit gull becomes visible during phase 1',await visible(page.locator('.spirit-gull')));
await page.screenshot({path:path.join(after,'02-spirit-gull-arrival.png')});

await page.waitForTimeout(1550);
check('core envelope becomes visible during phase 2',await visible(page.locator('.harbor-envelope')));
await page.screenshot({path:path.join(after,'03-envelope-delivery.png')});

await page.waitForTimeout(1450);
await page.screenshot({path:path.join(after,'04-seal-confirmation.png')});

await page.waitForTimeout(1350);
check('letter begins unfolding before the final state',await visible(page.locator('.spirit-letter')));
await page.screenshot({path:path.join(after,'05-letter-unfolding.png')});

await page.waitForFunction(()=>document.querySelector('#harborEvent').dataset.phase==='revealed',null,{timeout:3000});
const elapsed=await page.evaluate(()=>window.__tidalPost.harbor().elapsedMs);
check('normal arrival completes in the required 5–8 second rhythm',elapsed>=6100&&elapsed<=7600,`${elapsed}ms`);
const final=await page.evaluate(()=>({
  title:document.querySelector('#harborTitle')?.textContent.trim(),
  recipient:document.querySelector('.letter-facts-event dd')?.textContent.trim(),
  objective:document.querySelector('.harbor-objective strong')?.textContent.trim(),
  focused:document.activeElement?.className,
  letterOpacity:getComputedStyle(document.querySelector('.spirit-letter')).opacity
}));
check('final artifact communicates the undead commission',final.title==='蓝潮岛的回信'&&final.recipient.includes('艾琳')&&final.objective.includes('亡灵委托'));
check('final action receives focus',String(final.focused).includes('letter-accept'));
check('letter is fully visible',Number(final.letterOpacity)>.98,final.letterOpacity);
await page.screenshot({path:path.join(after,'06-final-letter-1920x1080.png')});

await page.locator('.letter-accept').click();
check('accepting the letter preserves the existing Mission transition',(await page.evaluate(()=>window.__tidalPost.getState().screen))==='mission');
check('standard chrome returns after the diegetic event',await page.evaluate(()=>getComputedStyle(document.querySelector('.topbar')).display!=='none'&&getComputedStyle(document.querySelector('.bottombar')).display!=='none'));
await page.locator('[data-action="mission-back"]').click();
check('return flow keeps the opened letter state',(await page.evaluate(()=>window.__tidalPost.getState().harborEventPhase))==='revealed');

const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'no-preference'});
const mobile=await mobileContext.newPage();
mobile.on('pageerror',error=>errors.push(`mobile ${error.message}`));
await mobile.goto('http://127.0.0.1:4174/?capture=01-harbor-letter',{waitUntil:'networkidle'});
await mobile.waitForFunction(()=>window.__tidalPost);
await mobile.waitForTimeout(250);
const mobileLayout=await mobile.evaluate(()=>({
  overflow:[document.documentElement.scrollWidth,innerWidth],
  letter:document.querySelector('.spirit-letter').getBoundingClientRect().toJSON(),
  action:document.querySelector('.letter-accept').getBoundingClientRect().toJSON()
}));
check('390×844 layout avoids horizontal overflow',mobileLayout.overflow[0]===mobileLayout.overflow[1],mobileLayout.overflow.join(' / '));
check('mobile letter action remains on-screen',mobileLayout.action.left>=0&&mobileLayout.action.right<=390&&mobileLayout.action.top>=0&&mobileLayout.action.bottom<=844,JSON.stringify(mobileLayout.action));
await mobile.screenshot({path:path.join(after,'07-final-letter-390x844.png')});
await mobileContext.close();

const reducedContext=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce'});
const reduced=await reducedContext.newPage();
reduced.on('pageerror',error=>errors.push(`reduced ${error.message}`));
await reduced.goto('http://127.0.0.1:4174/?qa=reduced-harbor',{waitUntil:'networkidle'});
await reduced.evaluate(()=>sessionStorage.clear());
await reduced.reload({waitUntil:'networkidle'});
await reduced.waitForFunction(()=>window.__tidalPost?.harbor());
const reducedStarted=Date.now();
await reduced.locator('[data-action="wait-letter"]').click();
await reduced.waitForFunction(()=>document.querySelector('#harborEvent').dataset.phase==='revealed',null,{timeout:1500});
const reducedElapsed=Date.now()-reducedStarted;
check('reduced-motion mode reveals without a long cinematic',reducedElapsed<1000,`${reducedElapsed}ms`);
await reduced.screenshot({path:path.join(after,'08-reduced-motion-1366x768.png')});
await reducedContext.close();

check('no runtime or asset errors occurred',errors.length===0,errors.join(' | '));
await context.close();
await browser.close();

const report={generatedAt:new Date().toISOString(),durationMs:elapsed,checks,passed:checks.filter(item=>item.passed).length,failed:checks.filter(item=>!item.passed).length,errors};
fs.writeFileSync(path.join(qa,'harbor-qa-report.json'),JSON.stringify(report,null,2));
console.log(`RESULT ${report.passed}/${checks.length} passed`);
if(report.failed||errors.length)process.exitCode=1;
