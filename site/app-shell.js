/* One persistent navigation tree, outside the original #app render target. */
const DN_NAV=[
 ['home','Trang chủ','home'],['vocab','Từ vựng','book'],['games','Luyện tập','pencil'],
 ['grammar','Cấu trúc và ngữ pháp','books'],['books','Kho sách Tiếng Anh','book'],
 ['evaluation','Góc tiến bộ','bars'],['ranking','Thành tích','cup'],['settings','Cài đặt','gear'],
 ['care','Chăm sóc rô-bốt','🤖'],['lessons','Mẫu câu giao tiếp','💬'],
 ['speaking','Luyện nói cùng rô-bốt','🎤'],['stories','Kể chuyện bản làng','📖'],['teacher','Góc giáo viên','👩‍🏫']
];
(function(){
 const side=document.getElementById('sb');
 const icon=(name)=>{const item=SB_LINKS.find(x=>x[3]===name);return item?sbSvg(item[2],'dn-nav-icon',name):'<span class="dn-nav-emoji" aria-hidden="true">'+name+'</span>'};
 side.innerHTML=`<button type="button" class="dn-brand" aria-label="Đại Ngàn Song Ngữ – Trang chủ"><svg viewBox="0 0 260 195" aria-hidden="true"><image href="${esc(HM_HOME_URL)}" width="1672" height="941"/></svg></button><nav aria-label="Điều hướng Đại Ngàn Song Ngữ">${DN_NAV.map(([id,label,art])=>`<button type="button" class="dn-nav-button" data-page="${id}" title="${label}">${icon(art)}<span>${label}</span></button>`).join('')}</nav><p class="dn-motto">Cùng nhau học tốt<br>vươn tới tương lai!</p>`;
 function navigate(page){if(document.getElementById('dn-speaking'))dnClose();goto(page)}
 side.querySelector('.dn-brand').addEventListener('click',()=>navigate('home'));
 side.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)navigate(b.dataset.page)});
 const generatedSidebars='aside.sidebar,aside.school500-sidebar,aside.pg-sidebar,aside.c3-sidebar,aside.sp5-sidebar,aside.vu-sidebar,aside.tp-sidebar,aside.st-sidebar,aside.gr-sidebar,aside.bk-sidebar,.sb-home-menu';
 function sync(){
  document.querySelectorAll('#app '+generatedSidebars.split(',').join(',#app ')).forEach(x=>x.remove());
  document.querySelectorAll('#dn-speaking .sp5-sidebar').forEach(x=>x.remove());
  const active=document.getElementById('dn-speaking')?'speaking':state.page==='quiz'?'games':state.page==='subjects'?'vocab':state.page;
  for(const b of side.querySelectorAll('[data-page]')){const on=b.dataset.page===active;b.classList.toggle('dn-active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')}
  document.body.classList.toggle('dn-speaking-open',!!document.getElementById('dn-speaking'));
  for(const button of document.querySelectorAll('.hm-home .hm-hotspot'))if(parseFloat(button.style.left)<16&&DN_NAV.some(x=>x[1]===button.getAttribute('aria-label'))){button.hidden=true;button.disabled=true;button.tabIndex=-1}
  // Keep the original renderers and all right-hand content, including legacy dialogs.
 }
 sbMount=sync;
 const oldRender=render;render=function(...args){const result=oldRender.apply(this,args);sync();return result};
 const oldOpen=dnOpen;dnOpen=function(...args){const result=oldOpen.apply(this,args);sync();return result};
 const oldClose=dnClose;dnClose=function(...args){const result=oldClose.apply(this,args);sync();return result};
 sync();
})();
