(()=>{
  'use strict';

  const THEME_KEY='ttyl.theme.v1';
  const welcome=document.querySelector('#welcome-screen');
  const login=document.querySelector('#login-screen');
  const shell=document.querySelector('#app-shell');
  const title=document.querySelector('#screen-title');
  const subhead=document.querySelector('#screen-subhead');
  const compose=document.querySelector('#compose-button');
  const composer=document.querySelector('#composer');
  const threadInput=document.querySelector('#thread-input');
  const threadCounter=document.querySelector('#thread-counter');
  const feed=document.querySelector('#thread-feed');
  const themeValue=document.querySelector('#theme-value');
  const themeColor=document.querySelector('#theme-color');
  let currentUser='dschkn';

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

  document.querySelectorAll('.nav-item').forEach(button=>{
    button.addEventListener('click',()=>openScreen(button.dataset.target));
  });

  document.querySelectorAll('.chat-list-row').forEach(button=>{
    button.addEventListener('click',()=>{
      document.querySelector('#chat-name').textContent=button.dataset.chat.toLocaleLowerCase();
      openScreen('chat');
    });
  });

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

  document.querySelectorAll('.heart').forEach(button=>{
    button.addEventListener('click',()=>{
      button.classList.toggle('liked');
      button.textContent=button.classList.contains('liked')?'♥':'♡';
    });
  });

  compose.addEventListener('click',()=>{
    composer.hidden=false;
    setTimeout(()=>threadInput.focus(),20);
  });
  document.querySelector('#close-composer').addEventListener('click',closeComposer);
  threadInput.addEventListener('input',()=>threadCounter.textContent=`${threadInput.value.length}/1000`);
  document.querySelector('#publish-thread').addEventListener('click',()=>{
    const text=threadInput.value.trim();
    if(!text)return;
    const article=document.createElement('article');
    article.className='thread-row';
    article.innerHTML=`<div class="thread-meta"><strong></strong><time>now</time></div><p></p><div class="thread-actions"><button class="heart" type="button" aria-label="like">♡</button><span>0</span><button class="row-arrow" type="button" aria-label="open thread">↘</button></div>`;
    article.querySelector('strong').textContent=currentUser;
    article.querySelector('p').textContent=text;
    const heart=article.querySelector('.heart');
    heart.addEventListener('click',()=>{heart.classList.toggle('liked');heart.textContent=heart.classList.contains('liked')?'♥':'♡'});
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
    threadInput.value='';
    threadCounter.textContent='0/1000';
  }

  function setTheme(value){
    document.documentElement.dataset.theme=value;
    if(themeValue)themeValue.textContent=`${value} ↘`;
    themeColor.content=value==='dark'?'#090909':'#f7f6f2';
  }
})();
