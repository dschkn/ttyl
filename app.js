(()=>{
  'use strict';

  const THEME_KEY='ttyl.theme.v1';
  const MAX_THREAD_LENGTH=1000;
  const VELVET_COLORS=[
    {name:'cocoa',value:'#6b5b53'},
    {name:'wine',value:'#76535c'},
    {name:'ochre',value:'#8a6f4d'},
    {name:'sage',value:'#66715b'},
    {name:'petrol',value:'#506b67'},
    {name:'slate',value:'#596578'},
    {name:'plum',value:'#6c5d75'},
    {name:'rose',value:'#8a6b68'}
  ];

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
  let colorMenu=null;
  let linkPopover=null;
  let linkInput=null;
  let savedRange=null;
  let activeColor=null;

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
    article.innerHTML='<div class="thread-meta"><strong></strong><time>now</time></div><div class="thread-content"></div><div class="thread-actions"><button class="heart" type="button" aria-label="like">♡</button><span>0</span><button class="row-arrow" type="button" aria-label="open thread">↘</button></div>';
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
      <span class="size-control toolbar-popover-control">
        <button type="button" class="format-button size-button" aria-label="text size"><span class="size-mark">T<small>T</small></span></button>
        <span class="size-menu mini-popover" hidden>
          <button type="button" data-block="h2">large</button>
          <button type="button" data-block="h3">medium</button>
          <button type="button" data-block="p">regular</button>
        </span>
      </span>
      <span class="color-control toolbar-popover-control">
        <button type="button" class="format-button color-button" aria-label="text color"><span class="color-mark">A<i></i></span></button>
        <span class="color-menu mini-popover" hidden></span>
      </span>
      <span class="link-control toolbar-popover-control">
        <button type="button" class="format-button link-button" aria-label="add link">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 14.5 14.5 9.5M7.2 16.8l-1.4 1.4a3.4 3.4 0 0 1-4.8-4.8l4-4a3.4 3.4 0 0 1 4.8 0M16.8 7.2l1.4-1.4a3.4 3.4 0 1 1 4.8 4.8l-4 4a3.4 3.4 0 0 1-4.8 0"/></svg>
        </button>
        <span class="link-popover mini-popover" hidden>
          <label>insert link</label>
          <input type="url" inputmode="url" autocomplete="off" placeholder="https://boatbehind.online">
          <span class="link-actions"><button type="button" data-link-cancel>cancel</button><button type="button" data-link-apply>apply</button></span>
        </span>
      </span>`;

    imageTools.insertAdjacentElement('afterend',toolbar);
    sizeMenu=toolbar.querySelector('.size-menu');
    colorMenu=toolbar.querySelector('.color-menu');
    linkPopover=toolbar.querySelector('.link-popover');
    linkInput=linkPopover.querySelector('input');

    toolbar.querySelectorAll('[data-command]').forEach(button=>{
      button.addEventListener('mousedown',event=>{event.preventDefault();saveSelection()});
      button.addEventListener('click',()=>applyCommand(button.dataset.command));
    });

    const sizeButton=toolbar.querySelector('.size-button');
    sizeButton.addEventListener('mousedown',event=>{event.preventDefault();saveSelection()});
    sizeButton.addEventListener('click',()=>{
      closeToolbarPopovers(sizeMenu);
      sizeMenu.hidden=!sizeMenu.hidden;
    });

    sizeMenu.querySelectorAll('[data-block]').forEach(button=>{
      button.addEventListener('mousedown',event=>event.preventDefault());
      button.addEventListener('click',()=>{
        restoreSelection();
        document.execCommand('formatBlock',false,button.dataset.block);
        sizeMenu.hidden=true;
        syncSource();
      });
    });

    buildColorMenu(toolbar);
    setupLinkControl(toolbar);

    editor.addEventListener('mouseup',saveSelection);
    editor.addEventListener('keyup',saveSelection);
    editor.addEventListener('focus',()=>{if(!savedRange)saveSelection()});
    editor.addEventListener('input',()=>{syncSource();saveSelection()});
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

    document.addEventListener('pointerdown',event=>{
      if(!event.target.closest('.toolbar-popover-control'))closeToolbarPopovers();
    });

    syncSource();
  }

  function buildColorMenu(toolbar){
    colorMenu.innerHTML='<span class="palette-title">text color</span><span class="palette-grid"></span>';
    const grid=colorMenu.querySelector('.palette-grid');
    VELVET_COLORS.forEach(color=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='color-swatch';
      button.dataset.color=color.value;
      button.setAttribute('aria-label',color.name);
      button.title=color.name;
      button.style.background=color.value;
      grid.append(button);
      button.addEventListener('mousedown',event=>event.preventDefault());
      button.addEventListener('click',()=>applyColor(color.value,toolbar));
    });

    const colorButton=toolbar.querySelector('.color-button');
    colorButton.addEventListener('mousedown',event=>{event.preventDefault();saveSelection()});
    colorButton.addEventListener('click',()=>{
      closeToolbarPopovers(colorMenu);
      colorMenu.hidden=!colorMenu.hidden;
    });
  }

  function applyColor(color,toolbar){
    restoreSelection();
    activeColor=color;
    document.execCommand('styleWithCSS',false,true);
    document.execCommand('foreColor',false,color);
    toolbar.querySelector('.color-mark i').style.background=color;
    colorMenu.querySelectorAll('.color-swatch').forEach(button=>button.classList.toggle('active',button.dataset.color===color));
    colorMenu.hidden=true;
    syncSource();
    saveSelection();
  }

  function setupLinkControl(toolbar){
    const linkButton=toolbar.querySelector('.link-button');
    linkButton.addEventListener('mousedown',event=>{event.preventDefault();saveSelection()});
    linkButton.addEventListener('click',()=>{
      const selected=getSavedText().trim();
      closeToolbarPopovers(linkPopover);
      linkPopover.hidden=false;
      linkInput.value=looksLikeUrl(selected)?selected:'';
      requestAnimationFrame(()=>{
        linkInput.focus();
        linkInput.select();
      });
    });

    linkPopover.querySelector('[data-link-cancel]').addEventListener('click',()=>{
      linkPopover.hidden=true;
      restoreSelection();
    });

    linkPopover.querySelector('[data-link-apply]').addEventListener('click',applyLink);
    linkInput.addEventListener('keydown',event=>{
      if(event.key==='Enter'){event.preventDefault();applyLink()}
      if(event.key==='Escape'){
        event.preventDefault();
        linkPopover.hidden=true;
        restoreSelection();
      }
    });
  }

  function applyLink(){
    const url=normalizeUrl(linkInput.value);
    if(!url){
      linkInput.classList.add('invalid');
      setTimeout(()=>linkInput.classList.remove('invalid'),500);
      return;
    }

    restoreSelection();
    const selection=window.getSelection();
    const hasSelection=selection&&selection.rangeCount&&!selection.getRangeAt(0).collapsed&&isRangeInsideEditor(selection.getRangeAt(0));

    if(hasSelection){
      document.execCommand('createLink',false,url);
      const anchor=closestAnchor(selection.anchorNode);
      if(anchor){
        anchor.setAttribute('href',url);
        anchor.setAttribute('target','_blank');
        anchor.setAttribute('rel','noopener noreferrer');
      }
    }else{
      const safeUrl=escapeAttribute(url);
      document.execCommand('insertHTML',false,`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`);
    }

    linkPopover.hidden=true;
    linkInput.value='';
    syncSource();
    saveSelection();
  }

  function applyCommand(command){
    restoreSelection();
    document.execCommand(command,false,null);
    syncSource();
    saveSelection();
  }

  function saveSelection(){
    const selection=window.getSelection();
    if(!selection||!selection.rangeCount)return;
    const range=selection.getRangeAt(0);
    if(isRangeInsideEditor(range))savedRange=range.cloneRange();
  }

  function restoreSelection(){
    editor.focus();
    if(!savedRange)return;
    const selection=window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange.cloneRange());
  }

  function isRangeInsideEditor(range){
    const container=range.commonAncestorContainer.nodeType===Node.ELEMENT_NODE?range.commonAncestorContainer:range.commonAncestorContainer.parentElement;
    return container&&editor.contains(container);
  }

  function getSavedText(){
    return savedRange?savedRange.toString():'';
  }

  function closestAnchor(node){
    const element=node&&node.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
    return element?.closest?.('a')||null;
  }

  function looksLikeUrl(value){
    return /^(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})(\/|$)/i.test(value);
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

  function closeToolbarPopovers(except=null){
    [sizeMenu,colorMenu,linkPopover].forEach(menu=>{
      if(menu&&menu!==except)menu.hidden=true;
    });
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
    const allowed=new Set(['B','STRONG','I','EM','U','S','STRIKE','A','H2','H3','P','DIV','BR','SPAN','FONT']);

    [...template.content.querySelectorAll('*')].forEach(node=>{
      if(!allowed.has(node.tagName)){
        node.replaceWith(...node.childNodes);
        return;
      }

      if(node.tagName==='A'){
        const originalHref=node.getAttribute('href')||'';
        const safe=normalizeUrl(originalHref);
        [...node.attributes].forEach(attribute=>node.removeAttribute(attribute.name));
        if(!safe){node.replaceWith(...node.childNodes);return}
        node.setAttribute('href',safe);
        node.setAttribute('target','_blank');
        node.setAttribute('rel','noopener noreferrer');
        return;
      }

      if(node.tagName==='SPAN'||node.tagName==='FONT'){
        const rawColor=node.style?.color||node.getAttribute('color')||'';
        const safeColor=normalizeAllowedColor(rawColor);
        [...node.attributes].forEach(attribute=>node.removeAttribute(attribute.name));
        if(safeColor){
          const replacement=document.createElement('span');
          replacement.style.color=safeColor;
          replacement.append(...node.childNodes);
          node.replaceWith(replacement);
        }else{
          node.replaceWith(...node.childNodes);
        }
        return;
      }

      [...node.attributes].forEach(attribute=>node.removeAttribute(attribute.name));
    });

    return template.innerHTML;
  }

  function normalizeAllowedColor(value){
    if(!value)return'';
    const probe=document.createElement('span');
    probe.style.color=value;
    document.body.append(probe);
    const normalized=getComputedStyle(probe).color;
    probe.remove();

    return VELVET_COLORS.find(color=>{
      const test=document.createElement('span');
      test.style.color=color.value;
      document.body.append(test);
      const target=getComputedStyle(test).color;
      test.remove();
      return target===normalized;
    })?.value||'';
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
    savedRange=null;
    activeColor=null;
    threadCounter.textContent=`0/${MAX_THREAD_LENGTH}`;
    const colorIndicator=composer.querySelector('.color-mark i');
    if(colorIndicator)colorIndicator.removeAttribute('style');
    closeToolbarPopovers();
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
      .rich-editor a,.thread-content a{color:color-mix(in srgb,var(--text) 68%,var(--muted));text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.17em}
      .thread-content{max-width:92%;margin:9px 0 12px;font-size:18px;line-height:1.23;letter-spacing:-.018em;white-space:normal}
      .thread-content>div{margin:.15em 0 .55em}
      .composer footer{gap:8px}
      .composer-image-tools{flex:0 0 auto}
      .format-toolbar{position:relative;display:flex;align-items:center;gap:1px;flex:1;min-width:0;overflow:visible}
      .format-button{width:33px;height:34px;display:grid;place-items:center;border-radius:11px;font-size:18px;line-height:1;background:transparent;color:var(--text)}
      .format-button:active{background:var(--milk)}
      .format-button svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
      .size-mark{font-size:18px;font-weight:620;letter-spacing:-.08em}.size-mark small{font-size:10px;margin-left:-2px}
      .color-mark{position:relative;display:grid;place-items:center;width:22px;height:24px;font-size:17px;font-weight:640}
      .color-mark i{position:absolute;left:2px;right:2px;bottom:0;height:3px;border-radius:999px;background:var(--text)}
      .toolbar-popover-control{position:relative;display:inline-grid}
      .mini-popover{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);z-index:90;border:1px solid var(--line);border-radius:17px;background:color-mix(in srgb,var(--bg) 95%,transparent);backdrop-filter:blur(24px);box-shadow:0 18px 50px rgba(0,0,0,.12)}
      .size-menu{width:132px;padding:7px}
      .size-menu button{display:block;width:100%;padding:10px 11px;border-radius:11px;text-align:left;font-size:12px;text-transform:lowercase}
      .size-menu button:active{background:var(--milk)}
      .color-menu{width:154px;padding:11px}
      .palette-title{display:block;margin:0 0 9px 2px;color:var(--muted);font-size:10px;text-transform:lowercase}
      .palette-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
      .color-swatch{width:25px;height:25px;border-radius:50%;border:2px solid transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
      .color-swatch.active{outline:1px solid var(--text);outline-offset:3px}
      .link-popover{right:-8px;left:auto;transform:none;width:min(270px,72vw);padding:11px}
      .link-popover label{display:block;margin:0 0 8px 2px;color:var(--muted);font-size:10px;text-transform:lowercase}
      .link-popover input{width:100%;height:39px;border:1px solid var(--line);border-radius:12px;background:transparent;padding:0 11px;font-size:12px}
      .link-popover input:focus{border-color:var(--text);outline:none}
      .link-popover input.invalid{animation:ttyl-shake .25s linear 1;border-color:#9a443e}
      .link-actions{display:flex;justify-content:flex-end;gap:5px;margin-top:8px}
      .link-actions button{padding:7px 9px;border-radius:9px;font-size:10px;text-transform:lowercase}
      .link-actions button:last-child{background:var(--text);color:var(--bg)}
      .composer #thread-counter{flex:0 0 auto;font-variant-numeric:tabular-nums}
      @keyframes ttyl-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
      @media(max-width:390px){.format-toolbar{gap:0}.format-button{width:29px;height:32px;font-size:16px}.format-button svg{width:19px;height:19px}.size-menu{width:118px}.color-menu{width:146px}.composer footer{gap:4px}}
    `;
    document.head.append(style);
  }

  function escapeHtml(value){
    return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  function escapeAttribute(value){return escapeHtml(value)}
})();