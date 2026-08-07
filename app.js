(()=>{
  'use strict';

  const THEME_KEY='ttyl.theme.v1';
  const MAX_THREAD_LENGTH=1000;
  const welcome=document.querySelector('#welcome-screen');
  const login=document.querySelector('#login-screen');
  const shell=document.querySelector('#app-shell');
  const title=document.querySelector('#screen-title');
  const subhead=document.querySelector('#screen-subhead');
  const compose=document.querySelector('#compose-button');
  const composer=document.querySelector('#composer');
  const threadSource=document.querySelector('#thread-input');
  const threadCounter=document.querySelector('#thread-counter');
  const feed=document.querySelector('#thread-feed');
  const themeValue=document.querySelector('#theme-value');
  const themeColor=document.querySelector('#theme-color');
  let currentUser='dschkn';
  let editor=null;
  let sizeMenu=null;

  installComposerStyles();
  upgradeComposer();
  setTheme(localStorage.getItem(THEME_KEY)||'light');

  document.querySelector('#open-login').addEventListener('click',()=>switchAuth(login));
  document.querySelector('#back-welcome').addEventListener('click',()=>switchAuth(welcome));
  document.querySelector('#login-form').addEventListener('submit',event=>{
    event.preventDefault();
    const username=document.querySelector('#username').value.trim().toLocaleLowerCase();
    const password=document.querySelector('#password').value;
    const message=document.querySelector('#form-message');
    if(!username){message.textContent='enter a username.';return}
    if(!password){message.textContent='enter a password.';return}
    currentUser=username;
    document.querySelector('#profile-name').textContent=username;
    message.textContent='';
    welcome.classList.remove('active');
    login.classList.remove('active');
    shell.hidden=false;
    openScreen('threads');
  });

  document.querySelectorAll('.nav-item').forEach(button=>button.addEventListener('click',()=>openScreen(button.dataset.target)));
  document.querySelectorAll('.chat-list-row').forEach(button=>button.addEventListener('click',()=>{
    document.querySelector('#chat-name').textContent=button.dataset.chat.toLocaleLowerCase();
    openScreen('chat');
  }));
  document.querySelector('#chat-back').addEventListener('click',()=>openScreen('chats'));

  document.querySelector('#message-form').addEventListener('submit',event=>{
    event.preventDefault();
    const input=document.querySelector('#message-input');
    const text=input.value.trim();
    if(!text)return;
    const row=document.createElement('div');
    row.className='message outgoing';
    const body=document.createElement('p');
    body.textContent=text;
    const time=document.createElement('time');
    time.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    row.append(body,time);
    document.querySelector('#messages').append(row);
    input.value='';
    row.scrollIntoView({behavior:'smooth',block:'end'});
  });

  document.querySelectorAll('.heart').forEach(bindHeart);

  compose.addEventListener('click',()=>{
    composer.hidden=false;
    setTimeout(()=>editor.focus(),20);
  });
  document.querySelector('#close-composer').addEventListener('click',closeComposer);

  document.querySelector('#publish-thread').addEventListener('click',()=>{
    syncSource();
    const text=threadSource.value.trim();
    if(!text)return;
    const article=document.createElement('article');
    article.className='thread-row';
    article.innerHTML='<div class="thread-meta"><strong></strong><time>now</time></div><p class="thread-content"></p><div class="thread-actions"><button class="heart" type="button" aria-label="like">♡</button><span>0</span><button class="row-arrow" type="button" aria-label="open thread">↘</button></div>';
    article.querySelector('strong').textContent=currentUser;
    article.querySelector('.thread-content').innerHTML=sanitizeRichText(editor.innerHTML);
    bindHeart(article.querySelector('.heart'));
    feed.prepend(article);
    closeComposer();
    openScreen('threads');
  });

  document.querySelector('#theme-toggle').addEventListener('click',()=>{
    const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
    setTheme(next);
    localStorage.setItem(THEME_KEY,next);
  });
  document.querySelector('#logout').addEventListener('click',()=>{
    shell.hidden=true;
    document.querySelector('#login-form').reset();
    switchAuth(welcome);
  });

  function upgradeComposer(){
    threadSource.classList.add('rich-source');
    threadSource.setAttribute('aria-hidden','true');
    threadSource.tabIndex=-1;

    editor=document.createElement('div');
    editor.id='thread-rich-editor';
    editor.className='rich-editor';
    editor.contentEditable='true';
    editor.setAttribute('role','textbox');
    editor.setAttribute('aria-multiline','true');
    editor.dataset.placeholder="what's on your mind?";
    threadSource.insertAdjacentElement('afterend',editor);

    const footer=composer.querySelector('footer');
    const imageTools=footer.querySelector('.composer-image-tools');
    const toolbar=document.createElement('div');
    toolbar.className='format-toolbar';
    toolbar.setAttribute('aria-label','text formatting');
    toolbar.innerHTML=`
      <button type="button" class="format-button" data-command="bold" aria-label="bold"><b>B</b></button>
      <button type="button" class="format-button" data-command="italic" aria-label="italic"><i>I</i></button>
      <button type="button" class="format-button" data-command="underline" aria-label="underline"><u>U</u></button>
      <button type="button" class="format-button" data-command="strikeThrough" aria-label="strikethrough"><s>S</s></button>
      <span class="size-control">
        <button type="button" class="format-button size-button" aria-label="text size"><span class="size-mark">T<small>T</small></span></button>
        <span class="size-menu" hidden>
          <button type="button" data-block="h2">large</button>
          <button type="button" data-block="h3">medium</button>
          <button type="button" data-block="p">regular</button>
        </span>
      </span>
      <button type="button" class="format-button link-button" aria-label="add link">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 14.5 14.5 9.5M7.2 16.8l-1.4 1.4a3.4 3.4 0 0 1-4.8-4.8l4-4a3.4 3.4 0 0 1 4.8 0M16.8 7.2l1.4-1.4a3.4 3.4 0 1 1 4.8 4.8l-4 4a3.4 3.4 0 0 1-4.8 0"/></svg>
      </button>`;
    imageTools.insertAdjacentElement('afterend',toolbar);
    sizeMenu=toolbar.querySelector('.size-menu');

    toolbar.querySelectorAll('[data-command]').forEach(button=>{
      button.addEventListener('mousedown',event=>event.preventDefault());
      button.addEventListener('click',()=>applyCommand(button.dataset.command));
    });

    const sizeButton=toolbar.querySelector('.size-button');
    sizeButton.addEventListener('mousedown',event=>event.preventDefault());
    sizeButton.addEventListener('click',()=>{sizeMenu.hidden=!sizeMenu.hidden});

    sizeMenu.querySelectorAll('[data-block]').forEach(button=>{
      button.addEventListener('mousedown',event=>event.preventDefault());
      button.addEventListener('click',()=>{
        editor.focus();
        document.execCommand('formatBlock',false,button.dataset.block);
        sizeMenu.hidden=true;
        syncSource();
      });
    });

    const linkButton=toolbar.querySelector('.link-button');
    linkButton.addEventListener('mousedown',event=>event.preventDefault());
    linkButton.addEventListener('click',addLink);

    editor.addEventListener('input',syncSource);
    editor.addEventListener('beforeinput',event=>{
      if(!event.inputType.startsWith('insert'))return;
      const selectionLength=window.getSelection()?.toString().length||0;
      const currentLength=plainText().length-selectionLength;
      const incoming=typeof event.data==='string'?event.data.length:1;
      if(currentLength+incoming>MAX_THREAD_LENGTH)event.preventDefault();
    });
    editor.addEventListener('paste',event=>{
      event.preventDefault();
      const pasted=event.clipboardData?.getData('text/plain')||'';
      const selectionLength=window.getSelection()?.toString().length||0;
      const available=MAX_THREAD_LENGTH-(plainText().length-selectionLength);
      if(available<=0)return;
      document.execCommand('insertText',false,pasted.slice(0,available));
    });

    document.addEventListener('click',event=>{
      if(!event.target.closest('.size-control')&&sizeMenu)sizeMenu.hidden=true;
    });
    syncSource();
  }

  function applyCommand(command){
    editor.focus();
    document.execCommand(command,false,null);
    syncSource();
  }

  function addLink(){
    editor.focus();
    const selection=window.getSelection();
    const selected=selection?.toString().trim()||'';
    const raw=window.prompt('link','https://');
    if(!raw)return;
    const url=normalizeUrl(raw);
    if(!url)return;
    if(selected){
      document.execCommand('createLink',false,url);
    }else{
      document.execCommand('insertHTML',false,`<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`);
    }
    syncSource();
  }

  function normalizeUrl(value){
    let candidate=value.trim();
    if(!candidate)return'';
    if(!/^https?:\/\//i.test(candidate))candidate=`https://${candidate}`;
    try{
      const url=new URL(candidate);
      return /^https?:$/.test(url.protocol)?url.href:'';
    }catch{return''}
  }

  function syncSource(){
    const text=plainText().slice(0,MAX_THREAD_LENGTH);
    threadSource.value=text;
    threadCounter.textContent=`${text.length}/${MAX_THREAD_LENGTH}`;
  }

  function plainText(){
    return (editor.innerText||'').replace(/\n{3,}/g,'\n\n');
  }

  function sanitizeRichText(html){
    const template=document.createElement('template');
    template.innerHTML=html;
    const allowed=new Set(['B','STRONG','I','EM','U','S','STRIKE','A','H2','H3','P','DIV','BR']);

    [...template.content.querySelectorAll('*')].forEach(node=>{
      if(!allowed.has(node.tagName)){
        node.replaceWith(...node.childNodes);
        return;
      }
      const originalHref=node.tagName==='A'?(node.getAttribute('href')||''):'';
      [...node.attributes].forEach(attribute=>node.removeAttribute(attribute.name));
      if(node.tagName==='A'){
        const safe=normalizeUrl(originalHref);
        if(!safe){node.replaceWith(...node.childNodes);return}
        node.setAttribute('href',safe);
        node.setAttribute('target','_blank');
        node.setAttribute('rel','noopener noreferrer');
      }
    });
    return template.innerHTML;
  }

  function bindHeart(button){
    button.addEventListener('click',()=>{
      button.classList.toggle('liked');
      button.textContent=button.classList.contains('liked')?'♥':'♡';
    });
  }

  function switchAuth(target){
    [welcome,login].forEach(screen=>screen.classList.toggle('active',screen===target));
  }

  function openScreen(name){
    document.querySelectorAll('.screen').forEach(screen=>screen.classList.toggle('active',screen.dataset.screen===name));
    document.querySelectorAll('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.target===name || (name==='chat'&&button.dataset.target==='chats')));
    const labels={threads:'ttyl',chats:'chats',chat:'',profile:'profile',settings:'settings'};
    title.textContent=labels[name]??'ttyl';
    subhead.textContent=name==='threads'?'friday, 7 august':'';
    compose.hidden=name!=='threads';
    document.querySelector('.bottom-nav').hidden=name==='chat';
    if(name==='chat'){
      title.textContent='';
      subhead.textContent='';
    }
  }

  function closeComposer(){
    composer.hidden=true;
    editor.innerHTML='';
    threadSource.value='';
    threadCounter.textContent=`0/${MAX_THREAD_LENGTH}`;
    if(sizeMenu)sizeMenu.hidden=true;
  }

  function setTheme(value){
    document.documentElement.dataset.theme=value;
    if(themeValue)themeValue.textContent=`${value} ↘`;
    themeColor.content=value==='dark'?'#090909':'#f7f6f2';
  }

  function installComposerStyles(){
    const style=document.createElement('style');
    style.textContent=`
      .rich-source{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
      .rich-editor{flex:1;min-height:36svh;width:100%;border:0;background:transparent;overflow:auto;padding:26px 0 18px;font-size:24px;line-height:1.22;letter-spacing:-.03em;white-space:pre-wrap;word-break:break-word}
      .rich-editor:empty:before{content:attr(data-placeholder);color:var(--muted);pointer-events:none}
      .rich-editor:focus{outline:none}
      .rich-editor h2,.thread-content h2{margin:.1em 0 .4em;font-size:1.65em;line-height:1.02;letter-spacing:-.055em;font-weight:680}
      .rich-editor h3,.thread-content h3{margin:.15em 0 .45em;font-size:1.25em;line-height:1.08;letter-spacing:-.035em;font-weight:620}
      .rich-editor p,.thread-content p{margin:.2em 0 .65em}
      .rich-editor a,.thread-content a{color:inherit;text-decoration:underline;text-underline-offset:.16em}
      .thread-content{max-width:92%;margin:9px 0 12px;font-size:18px;line-height:1.23;letter-spacing:-.018em;white-space:normal}
      .composer footer{gap:10px}
      .composer-image-tools{flex:0 0 auto}
      .format-toolbar{position:relative;display:flex;align-items:center;gap:3px;flex:1;min-width:0;overflow:visible}
      .format-button{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;font-size:19px;line-height:1;background:transparent;color:var(--text)}
      .format-button:active{background:var(--milk)}
      .format-button svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
      .size-mark{font-size:18px;font-weight:620;letter-spacing:-.08em}.size-mark small{font-size:10px;margin-left:-2px}
      .size-control{position:relative;display:inline-grid}
      .size-menu{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);z-index:90;width:132px;padding:7px;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(24px);box-shadow:0 18px 50px rgba(0,0,0,.12)}
      .size-menu button{display:block;width:100%;padding:10px 11px;border-radius:11px;text-align:left;font-size:12px;text-transform:lowercase}
      .size-menu button:active{background:var(--milk)}
      .composer #thread-counter{flex:0 0 auto;font-variant-numeric:tabular-nums}
      @media(max-width:390px){.format-toolbar{gap:0}.format-button{width:31px;height:32px;font-size:17px}.format-button svg{width:20px;height:20px}.size-menu{width:120px}}
    `;
    document.head.append(style);
  }

  function escapeHtml(value){
    return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  function escapeAttribute(value){return escapeHtml(value)}
})();
