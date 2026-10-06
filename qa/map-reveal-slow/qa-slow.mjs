import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const checks=[],errors=[],samples=[];
function check(name,passed,detail){checks.push({name,passed:!!passed,detail});console.log((passed?'PASS ':'FAIL ')+name);}
async function game(reducedMotion='no-preference'){
  const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{
    window.__qaPhases=[];
    addEventListener('DOMContentLoaded',()=>{
      const map=document.querySelector('.integrated-map');
      new MutationObserver(()=>window.__qaPhases.push({phase:map.dataset.mapPhase,time:performance.now()})).observe(map,{attributes:true,attributeFilter:['data-map-phase']});
    });
  });
  await page.goto('http://127.0.0.1:4174/');await page.evaluate(()=>document.fonts.ready);
  await page.locator('[data-action="open-mission"]').click();
  await page.locator('[data-action="mission-primary"]').click();
  await page.locator('[data-item="blue-envelope"]').click();
  await page.locator('#saveMailbagButton').click();
  await page.locator('#goMapButton').click();
  return {page,context};
}
const ready=p=>p.waitForFunction(()=>window.__tidalPost.getState().mapPhase==='MAP_READY');
async function sample(p,target,name){
  await p.waitForFunction(t=>window.__tidalPost.reveal().elapsed>=t,target);
  const detail=await p.evaluate(()=>{
    const paper=document.querySelector('.chart-paper'),carrier=document.querySelector('.paper-roll-carrier');
    const clip=getComputedStyle(paper).clipPath,match=clip.match(/inset\(0px ([\d.]+)%/);
    const m=document.querySelector('#chart').getScreenCTM();
    return {elapsed:window.__tidalPost.reveal().elapsed,clip,revealed:match?1-Number(match[1])/100:null,
      rollX:new DOMMatrix(getComputedStyle(carrier).transform).m41,
      matrix:[m.a,m.b,m.c,m.d,m.e,m.f],inert:document.querySelector('.game-stage').inert,
      ledgerOpacity:getComputedStyle(document.querySelector('.ledger')).opacity};
  });
  await p.screenshot({path:path.join(out,name)});samples.push(detail);return detail;
}
async function neutral(p){await p.mouse.move(1900,1060);await p.evaluate(()=>document.activeElement?.blur());await p.waitForTimeout(200);}
try{
  const {page:p,context}=await game();
  const state=await p.evaluate(()=>window.__tidalPost.reveal());
  check('First saved-mail entry uses 5500ms full reveal',state.mode==='full'&&state.duration===5500,state);
  const early=await sample(p,1500,'01-natural-unroll-early.png');
  check('After 1.5 seconds only the early part is unfolded',early.revealed>0&&early.revealed<.30,early);
  await p.locator('#confirm-route').dispatchEvent('click');
  check('Route confirmation stays locked while unfolding',!(await p.evaluate(()=>window.__tidalRoute.getState())).confirmed&&early.inert);
  const middle=await sample(p,3000,'02-natural-unroll-middle.png');
  check('At 3 seconds the roll is visibly in the middle',middle.revealed>.45&&middle.revealed<.80,middle);
  const late=await sample(p,4500,'03-natural-unroll-late.png');
  check('At 4.5 seconds the roll is still present near the far edge',late.revealed>.85&&late.revealed<1,late);
  check('Roll and paper mask travel together without scaling',samples.every(s=>Math.abs(s.rollX-s.revealed*1400)<.05)&&samples.every(s=>JSON.stringify(s.matrix)===JSON.stringify(early.matrix)),samples);
  check('Planning ledger waits until the paper has unfolded',samples.every(s=>s.ledgerOpacity==='0'&&s.inert));
  await ready(p);
  const phases=await p.evaluate(()=>window.__qaPhases),start=phases.find(x=>x.phase==='MAP_REVEALING'),end=phases.find(x=>x.phase==='MAP_READY');
  const duration=end.time-start.time;
  check('Actual natural playback lasts between 5 and 6 seconds',duration>=5000&&duration<=6000,{duration,phases});
  const clean=await p.evaluate(()=>({temporary:document.querySelectorAll('.map-reveal-origin,.map-reveal-clock,.map-reveal-skip,.map-continuity').length,
    inert:document.querySelector('.game-stage').inert,clip:getComputedStyle(document.querySelector('.chart-paper')).clipPath,
    ledger:getComputedStyle(document.querySelector('.ledger')).opacity,focus:document.activeElement.id}));
  check('Completion restores paper edge, controls and W1 focus',clean.temporary===0&&!clean.inert&&clean.clip.startsWith('polygon(')&&clean.ledger==='1'&&clean.focus==='waypoint-1',clean);
  await neutral(p);await p.screenshot({path:path.join(out,'06-map-ready-final.png')});
  const source=await context.newPage();await source.goto('http://127.0.0.1:4174/week4/?state=valid');await source.evaluate(()=>document.fonts.ready);await neutral(source);
  await source.screenshot({path:path.join(out,'source-neutral.png')});await source.close();
  await p.locator('[data-action="map-back"]').click();await p.locator('#goMapButton').click();await ready(p);
  const quick=await p.evaluate(()=>window.__tidalPost.reveal());
  check('Returning to the map still uses 180ms fade',quick.mode==='quick'&&quick.duration===180,quick);
  await context.close();
  for(const key of ['Enter',' ','Escape','click']){
    const {page,context}=await game();
    await page.waitForFunction(()=>window.__tidalPost.reveal().elapsed>=700);
    if(key==='click')await page.mouse.click(1900,1060);else await page.keyboard.press(key);
    await ready(page);
    check('Skip '+key+' clears roll and restores input',await page.evaluate(()=>!document.querySelector('.game-stage').inert&&!document.querySelector('.map-reveal-origin')&&document.activeElement.id==='waypoint-1'));
    await context.close();
  }
  const reduced=await game('reduce');await ready(reduced.page);
  const reducedState=await reduced.page.evaluate(()=>window.__tidalPost.reveal());
  check('Reduced motion stays a 150ms fade',reducedState.mode==='reduced'&&reducedState.duration===150&&!await reduced.page.locator('.map-reveal-origin').count(),reducedState);
  await reduced.context.close();
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'preserved-hashes.json'),'utf8'));
  const changed=Object.entries(manifest).filter(([file,hash])=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')!==hash).map(([file])=>file);
  check('All 161 protected original files remain unchanged',changed.length===0,{count:Object.keys(manifest).length,changed});
  check('Browser playback has no runtime or missing-resource errors',errors.length===0,errors);
}finally{
  await browser.close();
  const report={generatedAt:new Date().toISOString(),capture:'Natural playback; no timeline seek, pause or speed override',passed:checks.filter(c=>c.passed).length,total:checks.length,samples,checks,errors};
  fs.writeFileSync(path.join(out,'qa-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,total:report.total}));
  if(report.passed!==report.total||errors.length)process.exitCode=1;
}
