import {createRequire} from 'node:module';

// Resolve Playwright from this checkout. Set PLAYWRIGHT_EXECUTABLE_PATH only
// when the machine needs a browser executable other than Playwright Chromium.
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');

export function launchBrowser(){
  const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  return chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
}
