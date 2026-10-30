/* Gemini audio stays behind the existing Worker. No provider key reaches this page. */
(function(){
 const endpoint=()=>String(window.DAI_NGAN_CONFIG?.tutorEndpoint||'').replace(/\/api\/tutor-chat$/,'');
 const audioURL=path=>{const base=endpoint();if(!/^https:\/\/[^/]+$/.test(base))throw new Error('Âm thanh trực tuyến chưa được cấu hình.');return base+path};
 let playback=null,playbackURL=null,request=null,sequence=0;
 function stop(){sequence++;request?.abort();request=null;if(playback){playback.pause();playback.src='';playback=null}if(playbackURL){URL.revokeObjectURL(playbackURL);playbackURL=null}}
 function selectedLocale(){let value='';try{value=localStorage.getItem('voice-uri')||''}catch{}return value==='google-uk'?'en-GB':'en-US'}
 function split(text){const pieces=[];let remaining=String(text||'').trim();while(remaining){if(remaining.length<=500){pieces.push(remaining);break}let cut=remaining.lastIndexOf(' ',500);if(cut<250)cut=500;pieces.push(remaining.slice(0,cut).trim());remaining=remaining.slice(cut).trim()}return pieces}
 async function playText(text,rate=.85,callbacks={}){
  stop();const id=sequence,parts=split(text);if(!parts.length)return;
  const speed=Number.isFinite(Number(rate))?Math.max(.5,Math.min(1.2,Number(rate))):.85;
  try{callbacks.start?.();for(const part of parts){if(id!==sequence)return;
    const controller=new AbortController();request=controller;
    const response=await fetch(audioURL('/api/audio/tts'),{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:part,locale:selectedLocale()}),signal:controller.signal});
    if(!response.ok){let message='Chưa phát được giọng đọc.';try{message=(await response.json()).error?.message||message}catch{}throw new Error(message)}
    const blob=await response.blob();if(id!==sequence)return;
    playbackURL=URL.createObjectURL(blob);const audio=new Audio(playbackURL);playback=audio;audio.playbackRate=speed;
    await new Promise((resolve,reject)=>{audio.onended=resolve;audio.onerror=()=>reject(new Error('Không phát được tệp âm thanh.'));audio.play().catch(reject)});
    if(playbackURL){URL.revokeObjectURL(playbackURL);playbackURL=null}playback=null;
  }if(id===sequence)callbacks.end?.()}
  catch(e){if(id===sequence&&e.name!=='AbortError')callbacks.error?.(e)}
 }
 say=function(text,rateOverride=null){playText(text,rateOverride===null?dtSavedRate():rateOverride,{error:e=>notify(e.message,false)})};
 stopSpeech=stop;
 careSpeak=function(text){say(text,.76)};
 dnCancelVoice=function(){const s=dnSession;if(s){s.voice++;clearTimeout(s.voiceTimer)}stop()};
 dnSpeak=function(text,rate=.85,lang='en-US',pose='idle'){
  if(!dnSession)return;dnStopMic();dnCancelVoice();const s=dnSession,token=s.voice;
  playText(text,rate,{start:()=>{if(dnSession===s&&token===s.voice)dnPose(pose==='happy'?'happy':'speaking')},end:()=>{if(dnSession===s&&token===s.voice)dnPose(pose)},error:e=>{if(dnSession===s&&token===s.voice){dnPose(pose);dnStatus(e.message)}}});
 };
 cgCancelVoice=function(){cg.voiceToken++;clearTimeout(cg.speechTimer);stop()};
 cgSpeak=function(text,rate=.85,after=null,rest='idle'){
  cgStopMic();cgCancelVoice();const token=cg.voiceToken,person=cgIdentity();
  const current=()=>token===cg.voiceToken&&person===cgIdentity()&&state.page==='care';
  playText(text,rate,{start:()=>{if(current()){cgSetAudioNote('');cgSetPose(rest==='happy'?'happy':'talking')}},end:()=>{if(current()){cgSetPose(rest);after?.()}},error:e=>{if(current()){cgSetAudioNote(e.message);cgSetPose(rest);after?.()}}});
 };
 const oldPgStop=pgStop;pgStop=function(){oldPgStop();stop()};stopListening=pgStop;
 const oldRelease=releaseRobotAudio;releaseRobotAudio=function(){oldRelease();stop()};
 dtPopulateVoices=function(){const select=document.getElementById('voice-choice');if(!select)return;
  select.replaceChildren(new Option('English · Mỹ · nữ','google-us'),new Option('English · Anh · nữ','google-uk'));
  let value='';try{value=localStorage.getItem('voice-uri')||''}catch{}select.value=value==='google-uk'?'google-uk':'google-us';
  select.disabled=false;const note=document.getElementById('voice-availability');if(note)note.textContent='Giọng đọc Gemini cần kết nối Internet.';
  const preview=document.getElementById('voice-preview');if(preview)preview.disabled=false;
 };
 dtPopulateVoices();
 const previousRender=render;render=function(...args){const result=previousRender.apply(this,args);dtPopulateVoices();return result};
 class APIRecognition{
  constructor(){this.lang='en-US';this.continuous=false;this.interimResults=false;this.maxAlternatives=1;this.onstart=null;this.onresult=null;this.onerror=null;this.onend=null;this.onspeechend=null;this.stream=null;this.recorder=null;this.timer=null;this.controller=null;this.cancelled=false;this.stopping=false}
  async start(){if(this.stream||this.recorder)return;this.cancelled=false;this.stopping=false;
   try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});if(this.cancelled){stream.getTracks().forEach(t=>t.stop());return}this.stream=stream;
    const types=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'];const mime=types.find(t=>MediaRecorder.isTypeSupported?.(t));
    const rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);this.recorder=rec;const chunks=[];
    rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    rec.onerror=()=>this.fail('audio-capture');
    rec.onstop=async()=>{clearTimeout(this.timer);stream.getTracks().forEach(t=>t.stop());this.stream=null;this.recorder=null;if(this.cancelled)return;
     const blob=new Blob(chunks,{type:rec.mimeType||chunks[0]?.type||'audio/webm'});if(!blob.size){this.fail('no-speech');return}
     try{this.controller=new AbortController();const type=blob.type.split(';')[0];const response=await fetch(audioURL('/api/audio/transcribe'),{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',headers:{'Content-Type':type},body:blob,signal:this.controller.signal});
      if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error?.code==='NO_SPEECH'?'no-speech':'network')}
      const data=await response.json();if(this.cancelled)return;const transcript=String(data.transcript||'').trim();if(!transcript)throw new Error('no-speech');
      this.onresult?.({results:[[{transcript,confidence:1}]]});this.onend?.();
     }catch(e){if(!this.cancelled)this.fail(e.message==='no-speech'?'no-speech':'network')}
    };
    rec.start();this.onstart?.();this.timer=setTimeout(()=>this.stop(),9000);
    if(this.stopping)this.stop();
   }catch(e){if(!this.cancelled)this.fail(e.name==='NotAllowedError'?'not-allowed':'audio-capture')}
  }
  stop(){if(this.cancelled)return;if(this.controller){this.abort();this.onend?.();return}if(!this.recorder){this.stopping=true;return}if(this.recorder.state!=='inactive'){clearTimeout(this.timer);this.recorder.stop()}}
  abort(){this.cancelled=true;clearTimeout(this.timer);this.controller?.abort();try{if(this.recorder?.state!=='inactive')this.recorder?.stop()}catch{}this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.recorder=null}
  fail(code){this.abort();this.onerror?.({error:code});this.onend?.()}
 }
 window.DNRecognition=APIRecognition;
 window.addEventListener('pagehide',stop);
})();
