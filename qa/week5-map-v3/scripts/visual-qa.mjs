import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const here=path.dirname(fileURLToPath(import.meta.url));
const qa=path.resolve(here,'..');
const after=path.join(qa,'after');
fs.mkdirSync(after,{recursive:true});

const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const checks=[];
const errors=[];
const samples={};
const check=(name,passed,detail='')=>{checks.push({name,passed:Boolean(passed),detail});console.log(`${passed?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`);};

async function ready(page){
  await page.waitForFunction(()=>window.__tidalRoute&&window.__tidalPost);
  await page.evaluate(async()=>{
    await document.fonts.ready;
    const sources=[...document.images].map(image=>image.decode().catch(()=>{}));
    const svgSources=[...document.querySelectorAll('svg image')].map(async element=>{const image=new Image();image.src=element.href.baseVal;await image.decode().catch(()=>{});});
    await Promise.all([...sources,...svgSources]);
  });
  await page.waitForTimeout(180);
}
async function state(page){return page.evaluate(()=>({app:window.__tidalPost.getState(),route:window.__tidalRoute.getState()}));}
async function neutral(page){await page.mouse.move(1900,1060);await page.evaluate(()=>document.activeElement?.blur());await page.waitForTimeout(180);}
async function drag(page,index,target){
  const points=await page.evaluate(({index,target})=>{
    const chart=document.querySelector('#chart'),matrix=chart.getScreenCTM(),start=window.__tidalRoute.getState().waypoints[index];
    return [start,target].map(point=>{const result=new DOMPoint(point.x,point.y).matrixTransform(matrix);return{x:result.x,y:result.y};});
  },{index,target});
  await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();await page.mouse.move(points[1].x,points[1].y,{steps:18});await page.mouse.up();await page.waitForTimeout(180);
}

const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'no-preference'});
const page=await context.newPage();
page.on('pageerror',error=>errors.push(error.message));
page.on('requestfailed',request=>errors.push(`request ${request.failure()?.errorText||'failed'} ${request.url()}`));
await page.goto('http://127.0.0.1:4174/?capture=04-map',{waitUntil:'networkidle'});
await ready(page);
await neutral(page);
await page.screenshot({path:path.join(after,'01-map-default-1920x1080.png')});

const layout=await page.evaluate(()=>{
  const chart=document.querySelector('.chart-paper').getBoundingClientRect();
  const ledger=document.querySelector('.ledger').getBoundingClientRect();
  const action=document.querySelector('.ledger-actions').getBoundingClientRect();
  const foot=document.querySelector('.ledger-footnote').getBoundingClientRect();
  return {chart:{x:chart.x,y:chart.y,w:chart.width,h:chart.height},ledger:{x:ledger.x,y:ledger.y,w:ledger.width,h:ledger.height,scrollHeight:document.querySelector('.ledger').scrollHeight},actionBottom:action.bottom,footTop:foot.top};
});
samples.layout1920=layout;
check('1920×1080 map and ledger remain inside viewport',layout.chart.x>=0&&layout.chart.y>=0&&layout.ledger.x>=0&&layout.ledger.x+layout.ledger.w<=1920&&layout.ledger.y+layout.ledger.h<=1080,JSON.stringify(layout));
check('ledger content does not overlap footnote',layout.actionBottom<layout.footTop,`actions ${layout.actionBottom.toFixed(1)}, footnote ${layout.footTop.toFixed(1)}`);

const blue=page.locator('[data-port-id="blue-tide-north-pier"]');
const lighthouse=page.locator('[data-port-id="white-lantern-supply"]');
await lighthouse.locator('.port-hit').hover();await page.waitForTimeout(260);
await page.screenshot({path:path.join(after,'02-port-hover-1920x1080.png')});
const hoverStyle=await lighthouse.evaluate(node=>({ring:getComputedStyle(node.querySelector('.port-compass-ring')).opacity,label:getComputedStyle(node.querySelector('.port-name-tag')).opacity,selected:node.classList.contains('is-selected')}));
check('hover opens compass ring and label',Number(hoverStyle.ring)>.8&&Number(hoverStyle.label)>.8,JSON.stringify(hoverStyle));
check('hover and selected are distinct states',hoverStyle.selected===false,JSON.stringify(hoverStyle));

await neutral(page);
await page.screenshot({path:path.join(after,'03-port-selected-1920x1080.png')});
let current=await state(page);
check('blue-tide port is selected and address matches',current.route.selectedPortId==='blue-tide-north-pier'&&current.route.destinationMatches,current.route.selectedPortId);

await lighthouse.locator('.port-hit').click();await page.waitForTimeout(240);
await neutral(page);
await page.screenshot({path:path.join(after,'04-wrong-destination-1920x1080.png')});
current=await state(page);
samples.wrong=current.route;
check('click changes actual route destination',current.route.destination.id==='white-lantern-supply'&&current.route.segments.at(-1).b.x===385,JSON.stringify(current.route.destination));
check('wrong destination and route safety are separate states',current.route.destinationMatches===false&&typeof current.route.valid==='boolean',`match=${current.route.destinationMatches}, valid=${current.route.valid}`);
check('wrong destination cannot be confirmed',await page.locator('#confirm-route').isDisabled());
const wrongCopy=await page.locator('#destination-check').innerText();
check('wrong feedback is concise and does not reveal answer',wrongCopy.includes('邮址未匹配')&&!wrongCopy.includes('蓝潮岛'),wrongCopy.replaceAll('\n',' / '));

await blue.locator('.port-hit').click();await page.waitForTimeout(150);
await drag(page,0,{x:485,y:665});
current=await state(page);
await page.screenshot({path:path.join(after,'05-route-danger-1920x1080.png')});
check('fog shoal still blocks a crossing route',current.route.valid===false&&current.route.segments.some(segment=>segment.hazards.includes('fog')),JSON.stringify(current.route.segments.map(segment=>segment.hazards)));
await page.locator('#reset-route').click();await page.waitForTimeout(120);

const mailbagAsset=await page.evaluate(()=>{const image=document.querySelector('[data-item="blue-envelope"] img');return{src:image.getAttribute('src'),loaded:image.complete&&image.naturalWidth>0,width:image.naturalWidth,height:image.naturalHeight};});
check('mailbag uses a distinct envelope asset',mailbagAsset.loaded&&mailbagAsset.src.includes('blue-envelope-v3'),JSON.stringify(mailbagAsset));
check('no browser runtime errors',errors.length===0,errors.join(' | '));
await page.evaluate(()=>window.__tidalPost.navigate('mailbag'));
await page.waitForTimeout(180);
await page.screenshot({path:path.join(after,'08-mailbag-envelope-1920x1080.png')});

await context.close();

const small=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce'});
const smallPage=await small.newPage();
smallPage.on('pageerror',error=>errors.push(`1366 ${error.message}`));
await smallPage.goto('http://127.0.0.1:4174/?capture=04-map',{waitUntil:'networkidle'});await ready(smallPage);await neutral(smallPage);
await smallPage.screenshot({path:path.join(after,'06-map-default-1366x768.png')});
const smallLayout=await smallPage.evaluate(()=>{
  const stage=document.querySelector('.game-stage').getBoundingClientRect();
  const ledger=document.querySelector('.ledger').getBoundingClientRect();
  return{stage:{x:stage.x,y:stage.y,w:stage.width,h:stage.height},ledger:{x:ledger.x,y:ledger.y,right:ledger.right,bottom:ledger.bottom},overflowX:document.documentElement.scrollWidth>innerWidth,overflowY:document.documentElement.scrollHeight>innerHeight};
});
samples.layout1366=smallLayout;
check('1366×768 layout has no document overflow',!smallLayout.overflowX&&!smallLayout.overflowY,JSON.stringify(smallLayout));
check('1366×768 ledger remains visible',smallLayout.ledger.x>=0&&smallLayout.ledger.right<=1366&&smallLayout.ledger.bottom<=768,JSON.stringify(smallLayout.ledger));
const reduced=await smallPage.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches&&getComputedStyle(document.querySelector('.port-token')).transitionDuration==='0s');
check('reduced motion disables port transitions',reduced);
await small.close();

await browser.close();
const report={generatedAt:new Date().toISOString(),url:'http://127.0.0.1:4174/?capture=04-map',checks,passed:checks.filter(item=>item.passed).length,failed:checks.filter(item=>!item.passed).length,errors,samples};
fs.writeFileSync(path.join(qa,'visual-qa-report.json'),JSON.stringify(report,null,2));
console.log(`RESULT ${report.passed}/${checks.length} passed`);
if(report.failed||errors.length)process.exitCode=1;
