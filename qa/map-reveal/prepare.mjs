import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');
fs.mkdirSync(path.join(out,'source-before'),{recursive:true});
for(const name of ['index.html','app.js','styles.css','motion.css','sailing.js','README.md'])fs.copyFileSync(path.join(root,name),path.join(out,'source-before',name));
const hashes={};
function protect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())protect(p);else hashes[path.relative(root,p).replaceAll('\\','/')]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}}
protect(path.join(root,'week4'));protect(path.join(root,'assets'));
for(const e of fs.readdirSync(path.join(root,'qa'),{withFileTypes:true}))if(e.isDirectory()&&e.name!=='map-reveal')protect(path.join(root,'qa',e.name));
for(const name of ['styles.css','motion.css','sailing.js'])hashes[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
fs.writeFileSync(path.join(out,'preserved-hashes.json'),JSON.stringify(hashes,null,2));
fs.mkdirSync(path.join(out,'week4-regression'),{recursive:true});
fs.copyFileSync(path.join(root,'week4/qa/qa-week4.mjs'),path.join(out,'week4-regression/regression-36.mjs'));
console.log(JSON.stringify({protectedFiles:Object.keys(hashes).length}));
