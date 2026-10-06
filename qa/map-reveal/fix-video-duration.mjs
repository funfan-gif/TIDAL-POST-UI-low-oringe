// Add the standard EBML Duration element to native MediaRecorder WebM files.
// This changes container metadata only; encoded browser frames remain intact.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
function vint(buf,pos,keep=false){const first=buf[pos];let n=1;while(n<=8&&!(first&(1<<(8-n))))n++;let value=keep?first:first&((1<<(8-n))-1);for(let i=1;i<n;i++)value=value*256+buf[pos+i];return{n,value};}
function element(buf,pos){const id=vint(buf,pos,true),size=vint(buf,pos+id.n),unknown=size.value===2**(7*size.n)-1||size.value>Number.MAX_SAFE_INTEGER;return {id:id.value,start:pos,header:id.n+size.n,data:pos+id.n+size.n,length:size.value,end:unknown?buf.length:pos+id.n+size.n+size.value,sizePos:pos+id.n,sizeBytes:size.n,unknown};}
function writeSize(value,n){const b=Buffer.alloc(n);for(let i=n-1;i>=0;i--){b[i]=value%256;value=Math.floor(value/256);}b[0]|=1<<(8-n);return b;}
const checks=[];
for(const file of ['map-reveal-flow.webm','mailbag-to-sailing.webm']){
  let buf=fs.readFileSync(path.join(out,file));let ebml=element(buf,0),segment=element(buf,ebml.end),pos=segment.data,info,clusters=[];
  while(pos<buf.length){const el=element(buf,pos);if(el.id===0x1549a966)info=el;if(el.id===0x1f43b675){if(el.unknown){let childPos=el.data;while(childPos<buf.length){const child=element(buf,childPos);if(child.id===0x1f43b675)break;if(child.end<=childPos||child.end>buf.length)throw Error('Invalid cluster child');childPos=child.end;}el.end=childPos;}clusters.push(el);}if(el.end<=pos||el.end>buf.length)throw Error('Invalid WebM element');pos=el.end;}
  let scale=1000000,hasDuration=false;
  for(pos=info.data;pos<info.end;){const el=element(buf,pos);if(el.id===0x2ad7b1){scale=0;for(let i=el.data;i<el.end;i++)scale=scale*256+buf[i];}if(el.id===0x4489)hasDuration=true;pos=el.end;}
  let first=Infinity,last=0,frames=0;
  for(const cluster of clusters){let time=0;for(pos=cluster.data;pos<cluster.end;){const el=element(buf,pos);if(el.id===0xe7){time=0;for(let i=el.data;i<el.end;i++)time=time*256+buf[i];}if(el.id===0xa3){const track=vint(buf,el.data),stamp=time+buf.readInt16BE(el.data+track.n);first=Math.min(first,stamp);last=Math.max(last,stamp);frames++;}pos=el.end;}}
  const duration=last+34;
  if(!hasDuration){const addition=Buffer.alloc(11);addition[0]=0x44;addition[1]=0x89;addition[2]=0x88;addition.writeDoubleBE(duration,3);const header=Buffer.from(buf.subarray(info.start,info.data));writeSize(info.length+addition.length,info.sizeBytes).copy(header,info.sizePos-info.start);buf=Buffer.concat([buf.subarray(0,info.start),header,buf.subarray(info.data,info.end),addition,buf.subarray(info.end)]);fs.writeFileSync(path.join(out,file),buf);}
  checks.push({file,frames,firstTimestamp:first,lastTimestamp:last,durationMs:duration*scale/1000000,metadataAdded:!hasDuration});
}
fs.writeFileSync(path.join(out,'video-container-report.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
