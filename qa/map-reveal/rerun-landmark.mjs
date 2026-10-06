// Relocate final Art Pass QA outputs; retain its checks and frozen historical HTML.
// The integration explicitly changes root index/app/README, so protection uses
// this turn's 161-file manifest, including all of Week4 and all historic evidence.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const script=fs.readFileSync(path.resolve(out,'../../week4/qa/art-pass-03/landmark-qa.mjs'),'utf8')
  .replace("const week4=path.resolve(out,'../..'), root=path.resolve(week4,'..');","const root=path.resolve(out,'../..'), week4=path.join(root,'week4');")
  .replace("path.join(out,'regression-36.mjs')","path.join(out,'week4-regression/regression-36.mjs')")
  .replace("path.join(out,'source-before/index.html')","path.join(week4,'qa/art-pass-03/source-before/index.html')");
fs.writeFileSync(path.join(out,'landmark-regression.mjs'),script);
await import('./landmark-regression.mjs');
