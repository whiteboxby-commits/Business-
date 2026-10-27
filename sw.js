/* Business · service worker: кэш, push-уведомления, клик по уведомлению */
const CACHE='business-v1';
const SHELL=['/','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))));
});
/* push: {title, body, chat, call} */
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(x){d={title:'Business',body:e.data&&e.data.text()}}
  const call=!!d.call;
  e.waitUntil((async()=>{
    const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    if(cs.some(c=>c.visibilityState==='visible'&&c.focused))return; /* приложение открыто: уведомит само */
    await self.registration.showNotification(d.title||'Business',{
      body:d.body||'Новое сообщение',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',
      tag:call?'call':(d.chat||'business'),renotify:true,requireInteraction:call,
      vibrate:call?[500,250,500,250,500]:[120],data:{chat:d.chat||'',call:call}});
  })());
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const chat=(e.notification.data||{}).chat||'';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs){if('focus' in c){c.postMessage({type:'open-chat',chat});return c.focus()}}
    return self.clients.openWindow('/?chat='+encodeURIComponent(chat));
  }));
});
