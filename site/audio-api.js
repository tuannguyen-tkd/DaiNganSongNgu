/* Gemini audio stays behind the existing Worker. No provider key reaches this page. */
(function(){
 const endpoint=()=>String(window.DAI_NGAN_CONFIG?.tutorEndpoint||'').replace(/\/api\/tutor-chat$/,'');
 const audioURL=path=>{const base=endpoint();if(!/^https:\/\/[^/]+$/.test(base))throw new Error('Âm thanh trực tuyến chưa được cấu hình.');return base+path};
 const today=()=>new Date().toISOString().slice(0,10);
 let quotaDay='';try{quotaDay=localStorage.getItem('dn-tts-quota-day')||''}catch{}
 let context=null,source=null,request=null,sequence=0,fallbackActive=false,statusNode=null;
 function status(message,bad=false){statusNode?.remove();statusNode=document.createElement('div');statusNode.className='toast '+(bad?'bad':'');statusNode.setAttribute('role','status');statusNode.textContent=message;document.body.append(statusNode)}
 function clearStatus(){statusNode?.remove();statusNode=null}
 function unlock(){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;context??=new AudioContext();if(context.state==='suspended')context.resume().catch(()=>{})}
 document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',unlock,{capture:true});
 function stop(){sequence++;request?.abort();request=null;try{source?.stop()}catch{}source=null;if(fallbackActive)window.speechSynthesis?.cancel();fallbackActive=false;clearStatus()}
 async function browserSpeak(parts,rate,locale,id){
  const voice=dtPreferredVoice(locale);if(!voice)throw new Error('Gemini đã hết lượt và trình duyệt này chưa có giọng Google US/UK English.');
  fallbackActive=true;status('API âm thanh đã tới hạn mức. Đang dùng giọng Google trên trình duyệt.');
  for(const part of parts){if(id!==sequence)return;await new Promise((resolve,reject)=>{const u=new SpeechSynthesisUtterance(part);u.voice=voice;u.lang=voice.lang;u.rate=rate;u.onend=resolve;u.onerror=e=>reject(new Error('Giọng đọc trên trình duyệt chưa phát được: '+(e.error||'lỗi không rõ')));window.speechSynthesis.speak(u)})}
  fallbackActive=false;
 }
 function selectedLocale(){let value='';try{value=localStorage.getItem('voice-uri')||''}catch{}return value==='google-uk'?'en-GB':'en-US'}
 function split(text){const pieces=[];let remaining=String(text||'').trim();while(remaining){if(remaining.length<=500){pieces.push(remaining);break}let cut=remaining.lastIndexOf(' ',500);if(cut<250)cut=500;pieces.push(remaining.slice(0,cut).trim());remaining=remaining.slice(cut).trim()}return pieces}
 async function playText(text,rate=.85,callbacks={}){
  stop();unlock();const id=sequence,parts=split(text);if(!parts.length)return;status('Đang tải giọng đọc…');
  const speed=Number.isFinite(Number(rate))?Math.max(.5,Math.min(1.2,Number(rate))):.85;
  const button=document.activeElement?.matches?.('button.speak, button[onclick*="say("], #voice-preview, #dn-sample, #dn-question-audio, #dn-slow')?document.activeElement:null;
  if(button)button.setAttribute('aria-busy','true');
  let index=0;try{callbacks.start?.();if(quotaDay===today()){await browserSpeak(parts,speed,selectedLocale(),id);if(id===sequence)callbacks.end?.();return}for(;index<parts.length;index++){const part=parts[index];if(id!==sequence)return;
    const controller=new AbortController();request=controller;
    const timeout=setTimeout(()=>controller.abort(),25000);
    let response;try{response=await fetch(audioURL('/api/audio/tts'),{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',priority:'high',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:part,locale:selectedLocale()}),signal:controller.signal})}finally{clearTimeout(timeout)}
    if(!response.ok){let message='Chưa phát được giọng đọc.',code='';try{const data=(await response.json()).error||{};message=data.message||message;code=data.code||''}catch{}const problem=new Error(message);problem.status=response.status;problem.code=code;throw problem}
    const bytes=await response.arrayBuffer();if(id!==sequence)return;if(!context)throw new Error('Thiết bị chưa hỗ trợ phát âm thanh.');
    if(context.state==='suspended')await context.resume();
    const decoded=await context.decodeAudioData(bytes);if(id!==sequence)return;
    const node=context.createBufferSource();source=node;node.buffer=decoded;node.playbackRate.value=speed;node.connect(context.destination);status('Đang phát giọng đọc…');
    await new Promise(resolve=>{node.onended=resolve;node.start()});source=null;
  }if(id===sequence)callbacks.end?.()}
  catch(e){if(id===sequence){try{if(e.code==='AI_LIMIT'||e.code==='DAILY_LIMIT'){quotaDay=today();try{localStorage.setItem('dn-tts-quota-day',quotaDay)}catch{}}if(e.status===429||e.status===503||e.name==='AbortError'||e instanceof TypeError){await browserSpeak(parts.slice(index),speed,selectedLocale(),id);if(id===sequence)callbacks.end?.()}else throw e}catch(fallbackError){if(id===sequence){status(fallbackError.message,true);callbacks.error?.(fallbackError)}}}}
  finally{if(button?.isConnected)button.removeAttribute('aria-busy');if(id===sequence&&!statusNode?.classList.contains('bad'))clearStatus();else if(id===sequence)setTimeout(clearStatus,9000)}
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
  select.disabled=false;const note=document.getElementById('voice-availability');if(note)note.textContent='Ưu tiên giọng Gemini qua Internet; khi hết lượt sẽ dùng giọng Google trên trình duyệt nếu có.';
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
