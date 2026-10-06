import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(out,'../..'), week4=path.join(root,'week4');
const checks=[],errors=[];
function check(name,passed,detail){checks.push({name,passed:!!passed,detail});}
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const protectedFiles=JSON.parse(fs.readFileSync(path.join(out,'preserved-hashes.json'),'utf8').replace(/^\uFEFF/,''));
const changed=Object.entries(protectedFiles).filter(([p,h])=>!fs.existsSync(path.join(root,p))||digest(path.join(root,p))!==h).map(([p])=>p);
check('Historical files and frozen JS/CSS retain their SHA-256 hashes',changed.length===0,{fileCount:Object.keys(protectedFiles).length,changed});
check('Original 36-check script is copied without changing assertions',digest(path.join(out,'week4-regression/regression-36.mjs'))===digest(path.join(week4,'qa/qa-week4.mjs')));
const beforeHTML=fs.readFileSync(path.join(week4,'qa/art-pass-03/source-before/index.html'),'utf8');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
function track(page){page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});}
async function snapshot(page,state,before=false){
  const url='http://127.0.0.1:4174/week4/?state='+state;
  if(before)await page.route(url,r=>r.fulfill({status:200,contentType:'text/html',body:beforeHTML}));
  await page.goto(url);await page.waitForFunction(()=>window.__tidalRoute);await page.evaluate(()=>document.fonts.ready);
  return page.evaluate(()=>{
    const svg=document.querySelector('#chart');
    const protectedSelectors=['.desk-heading','.ledger','#confirmation','#waypoints','.port-marker','.destination-marker','.endpoint-label','#recovery-ghost','#map-warning','.chart-caption','.compass','.map-legend','#route-underlay','#route-segments','#route-direction-marks','#segment-labels'];
    const dom=Object.fromEntries(protectedSelectors.map(s=>[s,[...document.querySelectorAll(s)].map(e=>e.outerHTML)]));
    const boxes=Object.fromEntries(['.game-stage','.chart-paper','.ledger','.desk-heading','#waypoint-1 .hit-area','#waypoint-2 .hit-area'].map(s=>[s,document.querySelector(s).getBoundingClientRect().toJSON()]));
    const obstacles=[...document.querySelectorAll('.obstacle')].map(el=>{
      const m=el.getCTM(),t=el.getCTM().inverse().multiply(svg.getCTM()),cs=getComputedStyle(el);
      let probes='';for(let y=0;y<=930;y+=20)for(let x=0;x<=1400;x+=20){const p=new DOMPoint(x,y).matrixTransform(t);probes+=(el.isPointInFill(p)||el.isPointInStroke(p))?'1':'0';}
      return{id:el.id,attrs:[...el.attributes].map(a=>[a.name,a.value]),matrix:[m.a,m.b,m.c,m.d,m.e,m.f],fill:cs.fill,stroke:cs.stroke,strokeWidth:cs.strokeWidth,probes};
    });
    return{dom,boxes,obstacles,state:window.__tidalRoute.getState()};
  });
}
try{
  for(const state of ['valid','blocked']){
    const old=await context.newPage(),current=await context.newPage();track(old);track(current);
    const [a,b]=await Promise.all([snapshot(old,state,true),snapshot(current,state)]);
    check(state+': header, ledger, dialog, labels, endpoints, routes and hitbox DOM unchanged',JSON.stringify(a.dom)===JSON.stringify(b.dom));
    check(state+': all frozen layout and hitbox bounds unchanged',JSON.stringify(a.boxes)===JSON.stringify(b.boxes));
    check(state+': obstacle data, transforms, stroke and global point probes unchanged',JSON.stringify(a.obstacles)===JSON.stringify(b.obstacles),{obstacleCount:b.obstacles.length,probesPerObstacle:3337});
    check(state+': route result and numeric state unchanged',JSON.stringify(a.state)===JSON.stringify(b.state));
    await old.close();await current.close();
  }
  const page=await context.newPage();track(page);await page.goto('http://127.0.0.1:4174/week4/?state=blocked');await page.waitForFunction(()=>window.__tidalRoute);
  const assets=await page.evaluate(async()=>{
    const els=[...document.querySelectorAll('image[href*="art-pass-03"]')];
    return Promise.all(els.map(async el=>{const i=new Image();i.src=el.href.baseVal;await i.decode();return{href:el.href.baseVal,pointer:getComputedStyle(el).pointerEvents,width:i.naturalWidth,height:i.naturalHeight};}));
  });
  check('All new location image references decode and ignore pointer events',assets.every(a=>a.width>0&&a.height>0&&a.pointer==='none'),assets);
  const xml=await page.evaluate(async()=>{
    const urls=[...new Set([...document.querySelectorAll('image[href*="art-pass-03"]')].map(e=>e.href.baseVal))];
    return Promise.all(urls.map(async href=>{const text=await(await fetch(href)).text();const doc=new DOMParser().parseFromString(text,'image/svg+xml');return{href,valid:!doc.querySelector('parsererror')&&doc.documentElement.getAttribute('viewBox')!==null};}));
  });
  check('Independent SVG assets parse successfully',xml.every(x=>x.valid),xml);
  const layers=await page.evaluate(()=>{const route=document.querySelector('#route-underlay');return[...document.querySelectorAll('image[href*="art-pass-03"]')].every(el=>!!(el.compareDocumentPosition(route)&Node.DOCUMENT_POSITION_FOLLOWING));});
  check('Every location asset is below the interactive route layer',layers);
  const signals=await page.evaluate(()=>({dash:getComputedStyle(document.querySelector('.route-segment.is-blocked')).strokeDasharray,hatch:getComputedStyle(document.querySelector('#fog-zone .hazard-hatch')).opacity,contourTag:document.querySelector('#fog-zone .hazard-hatch').tagName,warning:!document.querySelector('#map-warning').hasAttribute('hidden'),lock:document.querySelector('#confirm-route').disabled,reason:document.querySelector('#status-reason').textContent}));
  check('Blocked retains non-colour route, contour hatching, warning, reason and lock cues',signals.dash!=='none'&&parseFloat(signals.hatch)>=.5&&signals.contourTag==='path'&&signals.warning&&signals.lock&&signals.reason.includes('浅滩'),signals);
  await page.goto('http://127.0.0.1:4174/week4/?state=blocked&debug=1');await page.waitForFunction(()=>window.__tidalRoute);
  const debug=await page.evaluate(()=>[...document.querySelector('#debug-geometry').children].map(el=>({opacity:getComputedStyle(el).opacity,width:el.getBoundingClientRect().width,transform:el.getAttribute('transform')})));
  check('Debug proxies remain visible and transformed after visual separation',debug.length===5&&debug.every(d=>d.opacity==='1'&&d.width>0&&d.transform?.startsWith('matrix')),debug);
  check('No runtime or local request failures',errors.length===0,errors);
}finally{
  const report={generatedAt:new Date().toISOString(),passed:checks.every(c=>c.passed),checkCount:checks.length,checks,errors};
  fs.writeFileSync(path.join(out,'landmark-qa-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,count:checks.length,failures:checks.filter(c=>!c.passed)},null,2));
  await browser.close();if(!report.passed)process.exitCode=1;
}
