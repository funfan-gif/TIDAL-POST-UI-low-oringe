import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');
const commit=execFileSync('git',['-c',`safe.directory=${root.replaceAll('\\','/')}`,'-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const base='https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/';
const url=file=>base+file+'?release='+commit;
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const committed=file=>execFileSync('git',['-c',`safe.directory=${root.replaceAll('\\','/')}`,'-C',root,'show',`HEAD:${file}`],{maxBuffer:30*1024*1024});
const checks=[],errors=[];
function check(name,passed,detail){checks.push({name,passed:!!passed,detail});console.log((passed?'PASS ':'FAIL ')+name);}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
  const expected=hash(committed('map-reveal.js'));
  let ready=false;
  for(let attempt=0;attempt<10;attempt++){
    try{const response=await fetch(url('map-reveal.js'),{signal:AbortSignal.timeout(20000)});if(response.ok&&hash(Buffer.from(await response.arrayBuffer()))===expected){ready=true;break;}}catch(e){console.log('Deployment check: '+e.message);}
    console.log('Waiting for GitHub Pages to serve the new commit');await sleep(20000);
  }
  check('GitHub Pages serves the new 5.5-second segmented reveal',ready,{commit});
  if(!ready)throw Error('GitHub Pages did not serve the new version within the bounded deployment wait');
  for(const file of ['index.html','map-reveal.js','paper-wear.css','week4/assets/art-pass-04/paper-edge-mask.svg','teacher-demo.html','week4/submission-board.pdf']){
    const response=await fetch(url(file),{signal:AbortSignal.timeout(40000)}),bytes=Buffer.from(await response.arrayBuffer());
    check('Published file matches committed version: '+file,response.ok&&hash(bytes)===hash(committed(file)),{status:response.status,bytes:bytes.length});
  }
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'no-preference'});
  const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url(''),{waitUntil:'load',timeout:60000});await page.evaluate(()=>document.fonts.ready);
  await page.locator('[data-action="open-mission"]').click();await page.locator('[data-action="mission-primary"]').click();await page.locator('[data-item="blue-envelope"]').click();await page.locator('#saveMailbagButton').click();await page.locator('#goMapButton').click();
  await page.waitForFunction(()=>window.__tidalPost.reveal().elapsed>=3000);
  check('Online saved-mail flow plays the full worn-map reveal',await page.evaluate(()=>window.__tidalPost.reveal().duration===5500&&window.__tidalPost.reveal().mode==='full'&&getComputedStyle(document.querySelector('.chart-paper')).maskImage.includes('paper-edge-mask.svg')));
  await page.screenshot({path:path.join(out,'screenshots/live-map-unrolling.png')});
  await page.waitForFunction(()=>window.__tidalPost.getState().mapPhase==='MAP_READY');
  async function drag(target){const pts=await page.evaluate(target=>{const m=document.querySelector('#chart').getScreenCTM();return[window.__tidalRoute.getState().waypoints[0],target].map(p=>{const q=new DOMPoint(p.x,p.y).matrixTransform(m);return{x:q.x,y:q.y};});},target);await page.mouse.move(pts[0].x,pts[0].y);await page.mouse.down();await page.mouse.move(pts[1].x,pts[1].y,{steps:16});await page.mouse.up();}
  await drag({x:485,y:665});check('Online core map rejects the dangerous route',await page.locator('#confirm-route').isDisabled()&&await page.locator('#map-warning').isVisible());
  await drag({x:520,y:355});await page.locator('#confirm-route').click();await page.locator('[data-action="start-sailing"]').click();await page.waitForFunction(()=>window.__tidalPost.getState().screen==='sailing'&&window.__tidalPost.getState().sailing.elapsed>0);
  check('Online valid route confirms and enters real Sailing',await page.evaluate(()=>window.__tidalPost.getState().routePlan.confirmed));
  await page.screenshot({path:path.join(out,'screenshots/live-sailing.png')});
  const demo=await context.newPage();demo.on('pageerror',e=>errors.push('Teacher: '+e.message));
  await demo.goto(url('teacher-demo.html'),{timeout:60000});await demo.waitForFunction(()=>window.__teacherDemo&& !document.querySelector('#play').disabled);
  await demo.locator('#play').click();await demo.waitForFunction(()=>window.__teacherDemo.lastRun?.complete,{},{timeout:30000});
  check('Published teacher demo completes its actual save-to-sailing flow',await demo.evaluate(()=>window.__teacherDemo.lastRun.screen==='sailing'&&window.__teacherDemo.lastRun.mailbagSaved&&window.__teacherDemo.lastRun.confirmed));
  await demo.screenshot({path:path.join(out,'screenshots/live-teacher-demo.png')});
  check('Published prototype has no runtime errors',errors.length===0,errors);
}catch(e){errors.push(e.stack);check('Live deployment verification finishes',false,e.message);}
finally{await browser?.close();const report={verifiedAt:new Date().toISOString(),commit,base,passed:checks.filter(c=>c.passed).length,total:checks.length,checks,errors};fs.writeFileSync(path.join(out,'live-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({commit,passed:report.passed,total:report.total,errors},null,2));if(report.passed!==report.total)process.exitCode=1;}
