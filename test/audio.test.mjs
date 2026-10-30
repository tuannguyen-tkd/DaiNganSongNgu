import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorker} from '../worker/index.mjs';
const origin='https://tuannguyen-tkd.github.io';
function fixture(){
 const calls={voices:[],interactions:[],uploads:[],deletes:[],budget:[]};
 const client={
  voices:{list:async p=>{calls.voices.push(p);return {voices:[{id:p.language_code[0]==='en-US'?'us-female':'uk-female',language_code:p.language_code[0],gender:'female'}]}}},
  interactions:{create:async p=>{calls.interactions.push(p);return p.model.includes('tts')?{output_audio:{data:btoa('RIFFTEST'),mime_type:'audio/wav'}}:{output_text:'Hello my friend.'}}},
  files:{upload:async p=>{calls.uploads.push(p);return {name:'files/test',uri:'https://files.test/audio',mimeType:p.config.mimeType}},delete:async p=>{calls.deletes.push(p)}}
 };
 const env={ALLOWED_ORIGIN:origin,GEMINI_API_KEY:'unit-test-not-real',AI_ENABLED:'true',AUDIO_RATE:{limit:async()=>({success:true})},TUTOR_BUDGET:{idFromName:x=>{calls.budget.push(x);return x},get:()=>({fetch:async()=>new Response(null,{status:204})})}};
 return {calls,env,worker:createWorker({clientFactory:()=>client})};
}
function req(path,body,type){return new Request('https://worker.test'+path,{method:'POST',headers:{Origin:origin,'Content-Type':type,'CF-Connecting-IP':'192.0.2.4'},body})}
test('Gemini TTS uses a female English voice and returns audio without exposing the key',async()=>{
 const f=fixture(),r=await f.worker.fetch(req('/api/audio/tts',JSON.stringify({text:'Hello!',locale:'en-US'}),'application/json'),f.env);
 assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'audio/wav');assert.equal(await r.text(),'RIFFTEST');
 assert.equal(f.calls.interactions[0].model,'gemini-3.8-flash-lite-tts');assert.equal(f.calls.interactions[0].generation_config.speech_config[0].voice,'us-female');
 assert.deepEqual(f.calls.budget,['audio-v1']);
 assert(!JSON.stringify(f.calls.interactions).includes(f.env.GEMINI_API_KEY));
});
test('recorded audio is transcribed and its temporary Google file is deleted',async()=>{
 const f=fixture(),r=await f.worker.fetch(req('/api/audio/transcribe',new Uint8Array([1,2,3]),'audio/webm'),f.env);
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{transcript:'Hello my friend.'});
 assert.equal(f.calls.interactions[0].model,'gemini-3.5-transcribe');assert.equal(f.calls.interactions[0].generation_config.transcription_config.language_codes[0],'en-US');
 assert.deepEqual(f.calls.deletes,[{name:'files/test'}]);
});
test('audio endpoints reject wrong origin, private text and oversized recordings before Gemini',async()=>{
 const f=fixture();let r=req('/api/audio/tts',JSON.stringify({text:'a@example.com',locale:'en-US'}),'application/json');assert.equal((await f.worker.fetch(r,f.env)).status,400);
 r=req('/api/audio/transcribe',new Uint8Array(1000001),'audio/webm');assert.equal((await f.worker.fetch(r,f.env)).status,413);
 r=new Request('https://worker.test/api/audio/tts',{method:'POST',headers:{Origin:'https://other.test','Content-Type':'application/json'},body:JSON.stringify({text:'Hi',locale:'en-US'})});assert.equal((await f.worker.fetch(r,f.env)).status,403);
 assert.equal(f.calls.interactions.length,0);assert.equal(f.calls.uploads.length,0);
});
