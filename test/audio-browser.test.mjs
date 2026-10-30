import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../site/audio-api.js',import.meta.url),'utf8');
function browser(voice){
 const spoken=[],notices=[];let requests=0;
 const speechSynthesis={speak:u=>{spoken.push(u.text);queueMicrotask(()=>u.onend?.())},cancel:()=>{}};
 const window={DAI_NGAN_CONFIG:{tutorEndpoint:'https://worker.example/api/tutor-chat'},speechSynthesis,addEventListener:()=>{}};
 const document={addEventListener:()=>{},getElementById:()=>null,activeElement:null,body:{append:()=>{}},createElement:()=>({className:'',setAttribute:()=>{},remove:()=>{},classList:{contains:()=>false}})};
 const scope={window,document,render:()=>{},pgStop:()=>{},releaseRobotAudio:()=>{},dtPreferredVoice:()=>voice,dtSavedRate:()=>.85,notify:m=>notices.push(m),setTimeout,clearTimeout,AbortController,Response,fetch:async()=>{requests++;return Response.json({error:{message:'Dịch vụ âm thanh đã tới hạn mức.'}},{status:429})},SpeechSynthesisUtterance:class{constructor(text){this.text=text}}};
 vm.createContext(scope);new vm.Script(source).runInContext(scope);
 return {scope,spoken,notices,get requests(){return requests}};
}
test('browser uses the selected Google voice immediately when available',async()=>{
 const b=browser({name:'Google US English',lang:'en-US'});b.scope.say('Hello, my friend.');await new Promise(r=>setTimeout(r,30));assert.deepEqual(b.spoken,['Hello, my friend.']);assert.equal(b.requests,0);assert.deepEqual(b.notices,[]);
});
test('browser reports quota and absent Google voice clearly',async()=>{
 const b=browser(null);b.scope.say('Hello!');await new Promise(r=>setTimeout(r,30));assert.equal(b.spoken.length,0);assert.match(b.notices.join(' '),/Gemini đã hết lượt/);
});
test('successful API audio starts playback through an unlocked AudioContext',async()=>{
 const b=browser(null);let starts=0;
 b.scope.window.AudioContext=class{state='running';destination={};decodeAudioData=async()=>({});createBufferSource(){return {playbackRate:{value:1},connect:()=>{},stop:()=>{},start(){starts++;queueMicrotask(()=>this.onended?.())}}}};
 b.scope.fetch=async()=>new Response(new Uint8Array([1,2,3]),{status:200,headers:{'Content-Type':'audio/wav'}});
 b.scope.say('Hello!');await new Promise(r=>setTimeout(r,30));assert.equal(starts,1);assert.equal(b.spoken.length,0);assert.deepEqual(b.notices,[]);
});
