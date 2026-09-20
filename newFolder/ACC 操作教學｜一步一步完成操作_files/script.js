/* ACC tutorial: local-only exercises. No form data or notifications are sent. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const all = selector => Array.from(document.querySelectorAll(selector));
  const assets = new URL('.', document.currentScript.src);
  const sections = all('main > section[data-section]');
  const labels = ['開始','收到通知','找到表單','辨識標題','判斷附件','處理表單','經理與施工處長','小測驗','完成'];
  const sampleURL = 'https://example.com/acc/attachment.pdf';
  let branch = '', branchDone = {yes:false,no:false};
  let notified = '', sentComment = '', managerSubmitted = false, directorConfirmed = false;
  let coDone = [false,false,false], quizIndex = 0, quizCorrect = [];
  let scrollScheduled = false;
  const questions = [
    {q:'沒有收到 Email 時，應該怎麼確認待辦？',a:['等通知寄來再處理','每天登入「我目前的表單」查看','只查看垃圾信件匣'],c:1,why:'Email 可能延遲或進入垃圾信件匣，請每天登入「我目前的表單」。'},
    {q:'標題中的「1150020002」代表什麼？',a:['收文日期','來文編號','承辦人姓名'],c:1,why:'來文編號是對方公文的字號；收文日期是另一個欄位。'},
    {q:'有附件時，如何開啟「描述」內的附件網址？',a:['只看表單標題即可','在備註輸入網址就會下載','複製完整網址，貼到瀏覽器網址列並開啟'],c:2,why:'先複製描述欄的完整網址，再開啟瀏覽器貼上。'},
    {q:'來文預覽的文字模糊時，可以先嘗試什麼？',a:['點設定選單，關閉「向量檢視」','刪除來文重新上傳','直接略過來文'],c:0,why:'關閉「向量檢視」後再查看，也可切換為一般捲動模式。'},
    {q:'選好「已簽核」並填完內容，還要做什麼？',a:['直接離開頁面','等系統自行送出','按下「提交區段」'],c:2,why:'填寫或簽核不等於提交；必須按「提交區段」，流程才會前進。'},
    {q:'經理如何確保承辦人收到 Email 通知？',a:['只在下拉選單選姓名','在註解輸入 @承辦人及交辦事項，並送出','只修改到期日'],c:1,why:'單純選取姓名不會寄信；經理必須在註解 @承辦人並送出。漏掉可補送。'},
    {q:'需要加會其他單位時，流程何時回到原經理？',a:['選取單位後立即返回','被指派人提交後','隔天自動返回'],c:1,why:'系統有 3 個加會區塊；被指派人提交前，流程不會回到原經理。'},
    {q:'施工處長最終選「否」時，後續如何處理？',a:['承辦人辦理正式回覆；到期前 3 天建立追蹤表單，提醒填寫並提送','不需回覆，直接結案','只等 Email，不必再操作'],c:0,why:'最終由施工處長裁定。選「否」須依來文辦理回覆及發文結案，並留意追蹤表單。'}
  ];
  function message(id,text){$(id).textContent=text;}
  function show(id,visible=true){$(id).hidden=!visible;}
  function reveal(id){show(id);const el=$(id),screen=el.closest('.laptop-screen');if(screen)screen.scrollBy({top:el.getBoundingClientRect().top-screen.getBoundingClientRect().top-25,behavior:'smooth'});}
  function progress(id){const index=sections.findIndex(s=>s.id===id);if(index<0)return;const total=sections.length-1;const percent=index/total*100;$('progress-bar').style.width=percent+'%';$('progress-bar').parentElement.setAttribute('aria-valuenow',Math.round(percent));message('progress-current',labels[index]);message('progress-count',index+' / '+total);all('[data-rail]').forEach(item=>{const itemIndex=sections.findIndex(s=>s.id===item.dataset.rail);item.classList.toggle('active',item.dataset.rail===id);item.classList.toggle('done',itemIndex<index);if(item.dataset.rail===id)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});}
  function scrollToId(id){if(!$(id))return;closeLaptop();progress(id);$(id).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
  function syncProgress(){scrollScheduled=false;if($('image-dialog').open)return;let current=sections[0];const marker=Math.max(165,innerHeight*.3);sections.forEach(s=>{if(s.getBoundingClientRect().top<=marker)current=s;});if(scrollY+innerHeight>=document.documentElement.scrollHeight-2)current=sections[sections.length-1];progress(current.id);}
  function scheduleProgress(){if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(syncProgress);}}
  addEventListener('scroll',scheduleProgress,{passive:true});addEventListener('resize',scheduleProgress);
  all('[data-next],[data-scroll-to],[data-rail]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.scrollTo==='step-01'&&!hasSeenGuide()){startGuide(button);return;}scrollToId(button.dataset.next||button.dataset.scrollTo||button.dataset.rail);}));
  // Existing welcome image fallback, without hiding lazy-loading images.
  all('[data-asset]').forEach(placeholder=>{const img=placeholder.nextElementSibling;if(!img||img.tagName!=='IMG')return;placeholder.hidden=true;const sync=()=>{const ok=img.naturalWidth>0;placeholder.hidden=ok;img.classList.toggle('asset-error',!ok);};img.addEventListener('load',sync);img.addEventListener('error',sync);if(img.complete)sync();});
  // Move the existing laptop into a native modal: controls and exercise state
  // stay intact, and a placeholder keeps the lesson's page position stable.
  let expandedLaptop = null;
  function restoreLaptop() {
    if (!expandedLaptop) return;
    const state = expandedLaptop;
    expandedLaptop = null;
    const screen = state.laptop.querySelector('.laptop-screen');
    const fraction = screen.scrollTop / Math.max(1, screen.scrollHeight - screen.clientHeight);
    state.placeholder.replaceWith(state.laptop);
    document.documentElement.classList.remove('laptop-modal-open');
    screen.scrollTop = fraction * Math.max(0, screen.scrollHeight - screen.clientHeight);
    state.trigger.focus({preventScroll:true});
    scheduleProgress();
  }
  function closeLaptop() {
    if ($('image-dialog').open) $('image-dialog').close();
    restoreLaptop();
  }
  function enlargeLaptop(trigger) {
    if (expandedLaptop) return;
    const laptop = trigger.closest('.laptop');
    if (!laptop) return;
    const screen = laptop.querySelector('.laptop-screen');
    const fraction = screen.scrollTop / Math.max(1, screen.scrollHeight - screen.clientHeight);
    const placeholder = document.createElement('div');
    placeholder.className = 'laptop-placeholder';
    placeholder.style.height = laptop.getBoundingClientRect().height + 'px';
    placeholder.setAttribute('aria-hidden','true');
    const section = laptop.closest('[data-section]');
    const heading = section.querySelector('h2').textContent;
    message('image-dialog-title',heading + ' · 放大筆電');
    expandedLaptop = {laptop,placeholder,trigger};
    laptop.replaceWith(placeholder);
    $('expanded-laptop-host').append(laptop);
    document.documentElement.classList.add('laptop-modal-open');
    $('image-dialog').showModal();
    screen.scrollTop = fraction * Math.max(0, screen.scrollHeight - screen.clientHeight);
    const figure = trigger.closest('figure');
    if (figure) screen.scrollTop += figure.getBoundingClientRect().top - screen.getBoundingClientRect().top - 18;
    $('close-laptop').focus({preventScroll:true});
  }
  all('[data-enlarge], .laptop-zoom').forEach(button=>button.addEventListener('click',()=>enlargeLaptop(button)));
  $('close-laptop').addEventListener('click',closeLaptop);
  $('image-dialog').addEventListener('cancel',event=>{event.preventDefault();closeLaptop();});
  $('image-dialog').addEventListener('close',restoreLaptop);
  $('image-dialog').addEventListener('click',event=>{
    if (event.target !== $('image-dialog')) return;
    const r = event.target.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeLaptop();
  });
  $('email-view-form').addEventListener('click',()=>{
    show('email-next-hint');
    $('email-next').classList.add('next-highlight');
    $('email-view-form').classList.add('email-viewed');
    const screen=$('email-next').closest('.laptop-screen');
    screen.scrollTo({top:screen.scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    $('email-next').focus({preventScroll:true});
  });
  const titleParts={date:'收文日期：1150302，表示民國 115 年 3 月 2 日，協助掌握收文日期與時限起點。',number:'來文編號：1150020002，為對方公文的字號，便於日後精準檢索。',sender:'來文單位：中興工程，讓您知道這份來文由哪個單位發出。',subject:'關鍵詞：Y3車站接地網工程設計圖，先掌握來文主旨，再開啟全文閱讀。',attachment:'有／無附件：「有.pdf」提示有附件，請再查看表單內的描述與參考資訊。'};
  all('[data-title-part]').forEach(b=>b.addEventListener('click',()=>{all('[data-title-part]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));message('title-explanation',titleParts[b.dataset.titlePart]);}));
  all('[data-title-answer]').forEach(b=>b.addEventListener('click',()=>{all('[data-title-answer]').forEach(x=>x.classList.remove('correct','incorrect'));const ok=b.dataset.titleAnswer==='correct';b.classList.add(ok?'correct':'incorrect');message('title-feedback',ok?'答對了！1150020002 是來文編號，可用來檢索原公文。':'再想一想：1150302 是日期；中興工程是來文單位。');}));
  function syncBranch(){const done=Boolean(branch&&branchDone[branch]);$('branch-next').disabled=!done;message('branch-status',done?'已完成此情境的開啟練習，可切換另一種情境或前往下一步。':'請完成所選情境的開啟練習，再前往下一步。');}
  all('[data-choice]').forEach(b=>b.addEventListener('click',()=>{branch=b.dataset.choice;all('[data-choice]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));show('branch-yes',branch==='yes');show('branch-no',branch==='no');syncBranch();}));
  $('description-target').addEventListener('click',()=>reveal('url-exercise'));
  $('copy-url').addEventListener('click',async()=>{const field=$('attachment-url');field.select();try{await navigator.clipboard.writeText(sampleURL);message('copy-status','已複製教學範例網址。接著開啟瀏覽器練習。');}catch{message('copy-status','網址已選取，請按 Ctrl+C（Mac：⌘C）複製，或使用下方「模擬貼上」。');}});
  $('open-browser-demo').addEventListener('click',()=>{reveal('browser-demo');$('browser-address').focus({preventScroll:true});});
  $('paste-demo').addEventListener('click',()=>{$('browser-address').value=sampleURL;message('browser-result','已模擬貼上。實際操作時可按 Ctrl+V（Mac：⌘V），再按 Enter。');});
  $('browser-form').addEventListener('submit',e=>{e.preventDefault();if($('browser-address').value.trim()!==sampleURL){message('browser-result','請貼上上方完整的教學範例網址，再試一次。');return;}message('browser-result','✓ 附件已在模擬瀏覽器開啟。實際操作時，請確認文件可正常開啟並閱讀內容。');$('browser-result').classList.add('success-card');branchDone.yes=true;syncBranch();});
  $('reference-target').addEventListener('click',()=>{reveal('document-viewer');$('document-viewer').classList.remove('opening');void $('document-viewer').offsetWidth;$('document-viewer').classList.add('opening');branchDone.no=true;syncBranch();});
  $('show-viewer-help').addEventListener('click',()=>{const visible=$('viewer-help').hidden;show('viewer-help',visible);$('show-viewer-help').setAttribute('aria-expanded',String(visible));if(visible)reveal('viewer-help');});
  $('assigned-target').addEventListener('click',()=>{reveal('assigned-practice');$('handling-note').focus({preventScroll:true});});
  $('submission-form').addEventListener('input',()=>{$('submission-next').disabled=true;all('#submission-form [required]').forEach(f=>f.setCustomValidity(''));message('submission-status','內容已變更，請重新按「提交區段」，流程才會繼續。');});
  $('submission-form').addEventListener('submit',e=>{e.preventDefault();all('#submission-form [required]').forEach(f=>f.setCustomValidity(f.value.trim()?'':'請完成此必填欄位。'));if(!$('submission-form').reportValidity())return;$('submission-next').disabled=false;message('submission-status','✓ 模擬提交成功！您的區段已完成，流程前往經理。');});
  function invalidateManager(text='內容已變更，請確認後重新提交經理區段。'){managerSubmitted=false;directorConfirmed=false;$('go-director').disabled=true;$('manager-next').disabled=true;message('manager-status',text);message('director-status','請先完成經理區段，再確認最終裁定。');}
  function syncCo(){const pending=coDone.filter(v=>!v).length;const assigned=all('[data-co-unit]').filter(s=>s.value).length;message('co-overview',pending?`共有 ${assigned} 個加會單位；尚有 ${pending} 個區塊未提交。被指派人提交前，流程不會回到原經理。`:'✓ 三個加會區塊均已完成；需要加會的區塊已模擬回到原經理，可提交經理區段。');all('[data-co-unit]').forEach((select,i)=>{select.disabled=!notified;const button=document.querySelector(`[data-co-submit="${i+1}"]`);button.disabled=!notified||coDone[i];button.textContent=select.value?'模擬被指派人提交':'提交此加會區塊（不需加會）';});}
  function resetCo(){coDone=[false,false,false];all('[data-co-unit]').forEach((s,i)=>{message('co-status-'+(i+1),s.value?'已模擬通知 '+s.value+'；等待對方編輯與提交。':'不需加會，請直接提交此區塊。');});syncCo();}
  all('[data-co-unit]').forEach((select,i)=>select.addEventListener('change',()=>{coDone[i]=false;message('co-status-'+(i+1),select.value?'已模擬通知 '+select.value+'；等待對方編輯與提交。':'不需加會，請直接提交此區塊。');invalidateManager();syncCo();}));
  all('[data-co-submit]').forEach((button,i)=>button.addEventListener('click',()=>{if(!notified)return;coDone[i]=true;const value=$('co-unit-'+(i+1)).value;message('co-status-'+(i+1),value?'✓ '+value+' 已模擬提交，流程回到原經理。':'✓ 已提交此區塊，無須加會，流程前往下一階段。');invalidateManager();syncCo();}));
  function setScenario(needs){if(!notified){message('manager-status','請先選取承辦人，開啟註解並 @ 同仁送出通知，再練習加會。');return;}all('[data-co-unit]').forEach(s=>s.value='');if(needs)$('co-unit-1').selectedIndex=1;$('scenario-yes').setAttribute('aria-pressed',String(needs));$('scenario-no').setAttribute('aria-pressed',String(!needs));invalidateManager();resetCo();}
  $('scenario-yes').addEventListener('click',()=>setScenario(true));$('scenario-no').addEventListener('click',()=>setScenario(false));
  $('assignee').addEventListener('change',()=>{notified='';sentComment='';$('comment-toggle').disabled=!$('assignee').value;show('email-demo',false);message('comment-status','選取姓名尚未寄送通知；請在註解 @ 目前承辦人並送出。');invalidateManager();resetCo();syncReminder();});
  $('comment-toggle').addEventListener('click',()=>{const visible=$('comment-panel').hidden;show('comment-panel',visible);$('comment-toggle').setAttribute('aria-expanded',String(visible));if(visible)$('manager-comment').focus({preventScroll:true});});
  $('insert-mention').addEventListener('click',()=>{if(!$('assignee').value)return;$('manager-comment').value='@'+$('assignee').value+' ';$('manager-comment').dispatchEvent(new Event('input',{bubbles:true}));$('manager-comment').focus({preventScroll:true});});
  $('manager-comment').addEventListener('input',()=>{if($('manager-comment').value!==sentComment){notified='';show('email-demo',false);invalidateManager('註解已變更，請確認 @承辦人 與交辦事項後重新送出。');syncCo();}});
  $('send-comment').addEventListener('click',()=>{const person=$('assignee').value,text=$('manager-comment').value.trim();const mention='@'+person;const normalized=text.replace(/@\s+/g,'@');if(!person||!normalized.includes(mention)||normalized.replace(mention,'').trim().length<2){message('comment-status','請輸入 @'+(person||'承辦人姓名')+'，並寫下交辦重點事項後送出。');return;}notified=person;sentComment=$('manager-comment').value;message('comment-status','✓ 註解已模擬送出；系統立即寄送 Email 通知 '+person+'。');message('email-recipient','收件人：'+person+'（教學模擬，未實際寄信）');show('email-demo');invalidateManager('通知完成。請完成三個加會區塊，再提交經理區段。');syncCo();});
  $('due-date').addEventListener('change',()=>{invalidateManager();syncReminder();});$('manager-decision').addEventListener('change',()=>invalidateManager());
  $('manager-form').addEventListener('submit',e=>{e.preventDefault();if(!$('manager-form').reportValidity())return;if(notified!==$('assignee').value||!notified){message('manager-status','尚未通知承辦人：請點開註解，輸入 @承辦人及交辦事項並送出。');return;}if(coDone.some(done=>!done)){message('manager-status','請先完成三個加會區塊；已指派的區塊必須等被指派人提交後回到原經理。');return;}managerSubmitted=true;$('go-director').disabled=false;message('manager-status','✓ 經理區段已模擬提交，接著由施工處長做最終裁定。');syncReminder();});
  function roleTab(role,focus=false){const manager=role==='manager';show('manager-panel',manager);show('director-panel',!manager);['manager','director'].forEach(name=>{const active=name===role;$(name+'-tab').setAttribute('aria-selected',String(active));$(name+'-tab').tabIndex=active?0:-1;});if(focus)$(role+'-tab').focus({preventScroll:true});}
  ['manager','director'].forEach(role=>{$(role+'-tab').addEventListener('click',()=>roleTab(role));$(role+'-tab').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();roleTab(e.key==='Home'?'manager':e.key==='End'?'director':role==='manager'?'director':'manager',true);}});});
  $('go-director').addEventListener('click',()=>{roleTab('director',true);$('manager-panel').closest('.laptop-screen').scrollTo({top:0,behavior:'smooth'});});
  function reminderDate(){const value=$('due-date').value;if(!value)return '請先設定到期日';const date=new Date(value+'T12:00:00');date.setDate(date.getDate()-3);return date.getFullYear()+' / '+String(date.getMonth()+1).padStart(2,'0')+' / '+String(date.getDate()).padStart(2,'0');}
  function syncReminder(){message('reminder-date',reminderDate());message('reminder-recipient','到期前 3 天（'+reminderDate()+'），提醒 '+($('assignee').value||'承辦人')+' 填寫並提送。');}
  $('director-decision').addEventListener('change',()=>{const no=$('director-decision').value==='no';show('director-no',no);show('director-yes',!no);show('reminder-preview',false);directorConfirmed=false;$('manager-next').disabled=true;message('director-status','判定已變更，請重新確認施工處長裁定。');});
  $('play-reminder').addEventListener('click',()=>{syncReminder();show('reminder-preview');$('reminder-preview').classList.remove('replay');void $('reminder-preview').offsetWidth;$('reminder-preview').classList.add('replay');});
  $('director-form').addEventListener('submit',e=>{e.preventDefault();if(!managerSubmitted){message('director-status','請先回「經理」頁籤，完成指派、@通知與加會提交。');return;}directorConfirmed=true;$('manager-next').disabled=false;message('director-status',$('director-decision').value==='no'?'✓ 已確認「否」：承辦人須辦理正式回覆，並於收到追蹤表單後填寫、提送。':'✓ 已確認「是」：純屬告知或無須公文回覆之通知。');});
  function quizMascot(wrong){const img=$('quiz-mascot');img.onerror=()=>{img.onerror=null;img.src=new URL('mascot-thinking.png',assets).href;};img.src=new URL(wrong?'mascot-wrong.png':'mascot-correct.png',assets).href;img.alt=wrong?'小助手提醒再想一想':'小助手鼓勵答對了';message('mascot-message',wrong?'再想一想，你可以的！':'一起完成練習！');}
  function renderQuiz(){const q=questions[quizIndex];message('quiz-current','QUESTION '+String(quizIndex+1).padStart(2,'0')+' / '+questions.length);message('quiz-score',quizCorrect.filter(Boolean).length+' / '+questions.length+' 答對');$('quiz-question').replaceChildren();const heading=document.createElement('h3');heading.textContent=q.q;$('quiz-question').append(heading);q.a.forEach((text,index)=>{const b=document.createElement('button');b.type='button';b.className='answer-button';b.dataset.answerIndex=index;const badge=document.createElement('span');badge.textContent=String.fromCharCode(65+index);b.append(badge,document.createTextNode(text));b.addEventListener('click',()=>{const ok=index===q.c;all('#quiz-question button').forEach(x=>x.classList.remove('incorrect'));b.classList.add(ok?'correct':'incorrect');quizMascot(!ok);message('quiz-feedback',(ok?'答對了！':'再想一想：')+q.why);if(ok){quizCorrect[quizIndex]=true;all('#quiz-question button').forEach(x=>x.disabled=true);message('quiz-score',quizCorrect.filter(Boolean).length+' / '+questions.length+' 答對');$('quiz-advance').disabled=false;if(quizIndex===questions.length-1){show('quiz-advance',false);show('quiz-next');}}});$('quiz-question').append(b);});message('quiz-feedback','');$('quiz-advance').disabled=true;show('quiz-advance');show('quiz-next',false);}
  $('quiz-advance').addEventListener('click',()=>{if(!quizCorrect[quizIndex]||quizIndex>=questions.length-1)return;quizIndex++;renderQuiz();});
  function resetAll(){show('email-next-hint',false);$('email-next').classList.remove('next-highlight');$('email-view-form').classList.remove('email-viewed');all('form:not([method="dialog"])').forEach(f=>f.reset());all('input,textarea,select').forEach(f=>f.setCustomValidity(''));branch='';branchDone={yes:false,no:false};notified='';sentComment='';managerSubmitted=false;directorConfirmed=false;coDone=[false,false,false];quizIndex=0;quizCorrect=[];all('[data-choice]').forEach(b=>b.setAttribute('aria-pressed','false'));all('[data-title-part]').forEach(b=>b.setAttribute('aria-pressed','false'));all('[data-title-answer]').forEach(b=>b.classList.remove('correct','incorrect'));message('title-explanation','點選一段標題，看看它代表什麼。');message('title-feedback','');['branch-yes','branch-no','url-exercise','browser-demo','document-viewer','viewer-help','assigned-practice','comment-panel','email-demo','reminder-preview','director-yes'].forEach(id=>show(id,false));show('director-no');$('show-viewer-help').setAttribute('aria-expanded','false');$('comment-toggle').setAttribute('aria-expanded','false');$('comment-toggle').disabled=true;$('submission-next').disabled=true;$('branch-next').disabled=true;$('go-director').disabled=true;$('manager-next').disabled=true;message('branch-status','請先選擇有附件或無附件，完成對應的開啟練習。');message('submission-status','此處為教學練習，不會送出至 ACC。');['copy-status','browser-result','comment-status'].forEach(id=>message(id,''));$('browser-result').classList.remove('success-card');$('scenario-yes').setAttribute('aria-pressed','false');$('scenario-no').setAttribute('aria-pressed','true');invalidateManager('請完成承辦人指派、@註解通知與加會確認。');resetCo();syncReminder();roleTab('manager');quizMascot(false);renderQuiz();all('.laptop-screen').forEach(s=>s.scrollTop=0);closeLaptop();}
  function restartTutorial() {
    if ($('welcome-guide').open) finishGuide(false);
    closeLaptop();
    resetAll();
    const returnToStart = () => { window.scrollTo({top:0,left:0,behavior:'instant'}); progress('welcome'); };
    returnToStart();
    $('welcome').querySelector('[data-scroll-to]').focus({preventScroll:true});
    requestAnimationFrame(returnToStart);
  }
  all('[data-action="restart"]').forEach(b=>b.addEventListener('click',restartTutorial));
  const guideKey = 'acc-tutorial-guide-v1';
  let guideStep = 0, guideTrigger = null, guideSeen = false;
  function hasSeenGuide() { try { return guideSeen || localStorage.getItem(guideKey)==='seen'; } catch { return guideSeen; } }
  const guideSteps = [
    {selector:'#step-01 .lesson-intro', title:'① 先讀說明，知道這一步要做什麼', desktop:'先閱讀左側的文字與提醒，掌握操作目的，再移到右側的筆電畫面練習。', mobile:'先閱讀上方的文字與提醒，掌握這一步的操作目的，再往下查看筆電畫面。'},
    {selector:'#step-01 .laptop-screen', title:'② 到筆電畫面，跟著操作', desktop:'右側筆電會顯示實際系統截圖與練習。畫面內可以捲動，依提示點選或填寫，完成後按「下一步」。', mobile:'下方筆電會顯示實際系統截圖與練習。畫面內可以捲動，依提示操作，完成後按「下一步」。'},
    {selector:'#step-01 .laptop-zoom', title:'③ 看不清楚？放大整台筆電', desktop:'點「放大筆電」或截圖的「放大查看」，就能在頁面中央放大操作。按「縮小返回」、Esc 或點背景即可返回，填寫內容會保留。', mobile:'點「放大筆電」或「放大查看」，即可放大操作。點「縮小返回」或背景即可返回，填寫內容會保留。'}
  ];
  function positionGuide(scroll=false) {
    if (!$('welcome-guide').open) return;
    const mobile=innerWidth<=820, info=guideSteps[guideStep];
    const target=document.querySelector(mobile&&guideStep===0?'#step-01 .lesson-intro .section-lead':info.selector);
    if(scroll) window.scrollTo({top:Math.max(0,window.scrollY+target.getBoundingClientRect().top-(mobile?165:Math.max(165,(innerHeight-target.offsetHeight)/2))),behavior:'instant'});
    const r=target.getBoundingClientRect(), spotlight=$('guide-spotlight'), bubble=$('guide-bubble');
    const left=Math.max(6,r.left-8),top=Math.max(6,r.top-8);
    Object.assign(spotlight.style,{left:left+'px',top:top+'px',width:Math.max(0,Math.min(innerWidth-6,r.right+8)-left)+'px',height:Math.max(0,Math.min(innerHeight-6,r.bottom+8)-top)+'px'});
    message('guide-count','認識畫面 '+(guideStep+1)+' / 3');message('guide-title',info.title);message('guide-description',mobile?info.mobile:info.desktop);
    $('guide-back').hidden=guideStep===0;message('guide-next',guideStep===2?'開始練習 →':'知道了，下一個 →');
    bubble.classList.toggle('guide-mobile',mobile);
    if(mobile){bubble.style.left='12px';bubble.style.top=Math.max(12,innerHeight-bubble.offsetHeight-20)+'px';bubble.dataset.side='bottom';}
    else {const onRight=r.left+r.width/2<innerWidth/2;const x=onRight?r.right+28:r.left-bubble.offsetWidth-28;bubble.style.left=Math.max(16,Math.min(innerWidth-bubble.offsetWidth-16,x))+'px';bubble.style.top=Math.max(95,Math.min(innerHeight-bubble.offsetHeight-20,r.top+r.height/2-bubble.offsetHeight/2))+'px';bubble.dataset.side=onRight?'right':'left';}
  }
  function startGuide(trigger) {
    closeLaptop();guideStep=0;guideTrigger=trigger||$('show-guide');
    $('welcome-guide').showModal();document.documentElement.classList.add('guide-open');
    positionGuide(true);$('guide-next').focus({preventScroll:true});
  }
  function finishGuide(goToLesson=true) {
    guideSeen=true;try{localStorage.setItem(guideKey,'seen');}catch{}
    $('welcome-guide').close();document.documentElement.classList.remove('guide-open');
    if(goToLesson){$('step-01').scrollIntoView({behavior:'instant',block:'start'});progress('step-01');}
    if(guideTrigger)guideTrigger.focus({preventScroll:true});
  }
  $('show-guide').addEventListener('click',event=>startGuide(event.currentTarget));
  $('guide-next').addEventListener('click',()=>{if(guideStep===2){finishGuide();return;}guideStep++;positionGuide(true);});
  $('guide-back').addEventListener('click',()=>{guideStep=Math.max(0,guideStep-1);positionGuide(true);});
  $('guide-skip').addEventListener('click',()=>finishGuide());
  $('welcome-guide').addEventListener('cancel',event=>{event.preventDefault();finishGuide();});
  addEventListener('resize',()=>positionGuide(true));
  addEventListener('scroll',()=>positionGuide(),{passive:true});
  resetAll();scheduleProgress();
})();
