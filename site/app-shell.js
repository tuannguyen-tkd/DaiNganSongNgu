/* One persistent navigation tree, outside the original #app render target. */
const DN_NAV=[
 ['home','Trang chủ','home'],['vocab','Từ vựng','book'],['games','Luyện tập','pencil'],
 ['grammar','Cấu trúc và ngữ pháp','books'],['books','Kho sách Tiếng Anh','book'],
 ['evaluation','Góc tiến bộ','bars'],['ranking','Thành tích','cup'],['settings','Cài đặt','gear'],
 ['care','Chăm sóc rô-bốt','🤖'],['lessons','Mẫu câu giao tiếp','💬'],
 ['speaking','Luyện nói cùng rô-bốt','🎤'],['stories','Kể chuyện bản làng','📖'],['teacher','Góc giáo viên','👩‍🏫']
];
const DN_VISIBLE_NAV=[...DN_NAV.filter(([id])=>!['books','teacher','settings'].includes(id)),DN_NAV.find(([id])=>id==='settings')];
(function(){
 const side=document.getElementById('sb');
 // The home artwork still contains the old labels. Replace their click targets
 // with one account control shared by every page.
 for(const label of ['Học offline','Đăng nhập / chọn hồ sơ']){
  const index=hmHomeActions.findIndex(item=>item[0]===label);
  if(index!==-1)hmHomeActions.splice(index,1);
 }
 const account=document.createElement('button');
 account.id='dn-account';account.type='button';
 account.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.3"/><path d="M5.3 19.5c.7-3.6 3.1-5.4 6.7-5.4s6 1.8 6.7 5.4"/></svg><span></span>';
 document.getElementById('view').prepend(account);
 const accountMenu=document.createElement('div');
 accountMenu.id='dn-account-menu';accountMenu.hidden=true;
 accountMenu.innerHTML='<button type="button" data-account-action="profile">Hồ sơ và cài đặt</button><button type="button" data-account-action="logout">Đăng xuất</button>';
 account.after(accountMenu);
 function closeAccountMenu(){accountMenu.hidden=true;if(state.user)account.setAttribute('aria-expanded','false');else account.removeAttribute('aria-expanded')}
 account.addEventListener('click',()=>{if(!state.user){openAuth();return}accountMenu.hidden=!accountMenu.hidden;account.setAttribute('aria-expanded',String(!accountMenu.hidden))});
 accountMenu.addEventListener('click',e=>{const action=e.target.closest('[data-account-action]')?.dataset.accountAction;if(!action)return;closeAccountMenu();if(action==='profile')goto('settings');else logout()});
 document.addEventListener('click',e=>{if(!account.contains(e.target)&&!accountMenu.contains(e.target))closeAccountMenu()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!accountMenu.hidden){closeAccountMenu();account.focus()}});
 const icon=(name)=>{const item=SB_LINKS.find(x=>x[3]===name);return item?sbSvg(item[2],'dn-nav-icon',name):'<span class="dn-nav-emoji" aria-hidden="true">'+name+'</span>'};
 side.innerHTML=`<button type="button" class="dn-brand" aria-label="Đại Ngàn Song Ngữ – Trang chủ"><svg viewBox="0 0 260 195" aria-hidden="true"><image href="${esc(HM_HOME_URL)}" width="1672" height="941"/></svg></button><nav aria-label="Điều hướng Đại Ngàn Song Ngữ">${DN_VISIBLE_NAV.map(([id,label,art])=>`<button type="button" class="dn-nav-button" data-page="${id}" title="${label}">${icon(art)}<span>${label}</span></button>`).join('')}</nav><p class="dn-motto">Cùng nhau học tốt<br>vươn tới tương lai!</p>`;
 function navigate(page){if(document.getElementById('dn-speaking'))dnClose();goto(page)}
 side.querySelector('.dn-brand').addEventListener('click',()=>navigate('home'));
 side.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)navigate(b.dataset.page)});
 function watchImage(img){
  if(!img.dataset.dnImageObserved){
   img.dataset.dnImageObserved='1';
   const done=()=>img.classList.remove('dn-image-loading');
   img.addEventListener('load',done);
   img.addEventListener('error',done);
  }
  img.classList.toggle('dn-image-loading',!img.complete);
 }
 function watchImages(root){if(root.matches?.('img'))watchImage(root);root.querySelectorAll?.('img').forEach(watchImage)}
 const imageObserver=new MutationObserver(changes=>{for(const change of changes){if(change.type==='attributes')watchImage(change.target);else for(const node of change.addedNodes)if(node.nodeType===1)watchImages(node)}});
 imageObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset']});
 const generatedSidebars='aside.sidebar,aside.school500-sidebar,aside.pg-sidebar,aside.c3-sidebar,aside.sp5-sidebar,aside.vu-sidebar,aside.tp-sidebar,aside.st-sidebar,aside.gr-sidebar,aside.bk-sidebar,.sb-home-menu';
 function sync(){
  const user=state.user;
  closeAccountMenu();
  account.querySelector('span').textContent=user?user.name:'Đăng nhập';
  account.title=user?'Xem hồ sơ học tập':'Đăng nhập hoặc chọn hồ sơ học tập';
  account.setAttribute('aria-label',account.title);
  document.querySelectorAll('#app '+generatedSidebars.split(',').join(',#app ')).forEach(x=>x.remove());
  document.querySelectorAll('#dn-speaking .sp5-sidebar').forEach(x=>x.remove());
  watchImages(document.body);
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
