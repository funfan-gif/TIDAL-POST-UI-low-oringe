import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire('C:/Users/jk666/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
for(const url of ['http://127.0.0.1:4174/week4/?state=valid','http://127.0.0.1:4174/?capture=04-map']) {
  await page.goto(url);await page.evaluate(()=>document.fonts.ready);await page.mouse.move(1900,1050);
  console.log(url,await page.locator('#confirm-route').evaluate(e=>({background:getComputedStyle(e).background,html:e.outerHTML,rules:[...document.styleSheets].flatMap(s=>[...s.cssRules].filter(r=>r.selectorText&&e.matches(r.selectorText)&&r.style.background).map(r=>r.cssText))})));
  await page.screenshot({path:fileURLToPath(new URL(url.includes('week4')?'source-neutral.png':'integrated-neutral.png',import.meta.url))});
}
await browser.close();
