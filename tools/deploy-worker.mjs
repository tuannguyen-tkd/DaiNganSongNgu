import {spawn} from 'node:child_process';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const scrub=s=>s.replace(/(?:AIza[\w-]{20,}|sk-[\w-]{12,}|gh[pousr]_[\w]{15,}|cfat_[\w-]{15,})/g,'[REDACTED]');
async function wrangler(args,input){return new Promise((resolve,reject)=>{const p=spawn(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),...args],{cwd:root,env:process.env,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.on('error',reject);p.on('close',code=>code===0?resolve(out):reject(new Error(scrub(err||out).slice(-1800))));p.stdin.end(input||'')})}
if(!process.env.CLOUDFLARE_ACCOUNT_ID)throw new Error('Cần CLOUDFLARE_ACCOUNT_ID từ tài khoản Cloudflare. Không gửi token qua chat.');
const enabled=process.env.AI_ENABLED==='true';
const deployed=await wrangler(['deploy','--config','worker/wrangler.jsonc','--var','AI_ENABLED:'+enabled]);
const url=deployed.match(/https:\/\/dai-ngan-tutor\.[a-z0-9-]+\.workers\.dev\b/i)?.[0];
if(!url)throw new Error('Wrangler chưa trả URL workers.dev. Không ghi cấu hình URL giả.');
if(process.env.GEMINI_API_KEY)await wrangler(['secret','put','GEMINI_API_KEY','--config','worker/wrangler.jsonc'],process.env.GEMINI_API_KEY+'\n');
const deadline=Date.now()+60000;
let health;
for(;;){
 try{const status=await fetch(url+'/health?check='+Date.now(),{headers:{Origin:'https://tuannguyen-tkd.github.io'},signal:AbortSignal.timeout(10000)});if(status.ok){health=await status.json();if(!enabled||health.configured===true)break}}catch{}
 if(Date.now()>=deadline)throw new Error('Worker chưa xác nhận AI được bật và Gemini secret đã cấu hình. Giữ nguyên cấu hình web cũ.');
 await new Promise(resolve=>setTimeout(resolve,2000));
}
await fs.writeFile(path.join(root,'site/public-config.js'),'// Generated from a verified deployment. No secret values.\nwindow.DAI_NGAN_CONFIG=Object.freeze('+JSON.stringify({tutorEndpoint:url+'/api/tutor-chat',deployment:'worker-deployed',aiConfigured:health.configured===true})+');\n');
console.log('Worker: '+url+'; AI configured: '+String(health.configured===true));
console.log('Đã tự gán URL trong site/public-config.js. Xuất bản lại Pages để nhận cấu hình mới.');
