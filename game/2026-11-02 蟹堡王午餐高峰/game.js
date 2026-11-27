/* Rendering is decorative; rules.js owns every hit, order and reward. */
(() => {'use strict';
const R=RushRules,$=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d'),images={};
const names=['kitchen','chef-ready','chef-flip','chef-cheer','chef-miss','patrick-wait','patrick-served','squidward-wait','squidward-served','burger','patty'];
let state=R.fresh(),time=0,last=performance.now(),held=null,owner=null,paused=false,ready=false,reactionAt=0,particles=[],sound=false,audio=null,best=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{best=Number(localStorage.getItem('krusty-rush-best'))||0;sound=localStorage.getItem('krusty-rush-sound')==='1'}catch{}
const say=text=>$('banner').textContent=text;
function tone(win){if(!sound)return;try{audio ||= new AudioContext();audio.resume();[0,.09,.18].forEach((delay,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=(win?440:190)*(win?[1,1.25,1.5][i]:[1,.9,.7][i]);g.gain.setValueAtTime(.0001,audio.currentTime+delay);g.gain.exponentialRampToValueAtTime(.055,audio.currentTime+delay+.01);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+delay+.18);o.connect(g);g.connect(audio.destination);o.start(audio.currentTime+delay);o.stop(audio.currentTime+delay+.2);})}catch{}}
function soundUI(){$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');$('sound').textContent=sound?'♫':'♪'}
soundUI();
function modal(tag,title,text,action){$('modalTag').textContent=tag;$('modalTitle').textContent=title;$('modalText').textContent=text;$('primary').textContent=action;$('primary').hidden=!action;$('overlay').hidden=false;}
function sync(){const o=R.orders[Math.min(state.index,5)];$('served').textContent=`${state.index} / 6`;$('score').textContent=String(state.score).padStart(4,'0');$('lives').textContent='♥ '.repeat(state.lives)+'♡ '.repeat(3-state.lives);$('lives').setAttribute('aria-label',`${state.lives} chances`);$('combo').textContent=state.combo?`×${state.combo}`:'—';$('orderNo').textContent=`TICKET ${String(Math.min(state.index+1,6)).padStart(2,'0')}`;$('customer').textContent=`${o.name}'s ${o.count===2?'double':'classic'}`;$('recipe').textContent=state.phase==='won'?'All six orders served!':`${state.stack}/${o.count} patties · ${o.amp?'moving':'stationary'} plate`;$('flip').disabled=!ready||paused||state.phase!=='ready';$('action').textContent=state.phase==='ready'?'HOLD TO AIM':state.phase==='flight'?'FLIPPING…':state.phase==='reaction'?(state.last.hit?'ORDER UP!':'TRY AGAIN'):'SHIFT COMPLETE';$('tickets').innerHTML=R.orders.map((_,i)=>`<i class="${i<state.index?'done':i===state.index?'current':''}">${i<state.index?'✓':i+1}</i>`).join('');$('tickets').setAttribute('aria-label',`${state.index} of six orders served`);}
function begin(){state=R.fresh();time=0;held=null;owner=null;paused=false;particles=[];last=performance.now();$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');say('Hold to aim. Release over the plate!');sync();}
function pause(){if(!ready||paused||['won','lost'].includes(state.phase))return;paused=true;held=null;owner=null;modal('TAKE A BREATHER','Kitchen paused','Your order is safe. Resume when you are ready.','Resume cooking');$('pause').textContent='▶';$('pause').setAttribute('aria-label','Resume game');sync();}
function resume(){paused=false;last=performance.now();$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');sync();}
function update(now){const dt=Math.max(0,(now-last)/1000);last=now;if(!ready||paused||['won','lost'].includes(state.phase))return;
 // A hidden tab is paused via visibilitychange; active time is independent of frame rate.
 time+=dt;
 if(state.phase==='flight'&&time-state.shot.at>=R.C.flight){const result=R.resolve(state);reactionAt=time;const text=result.hit?(result.perfect?'PERFECT!':'Nice catch!')+` +${result.points}`+(result.served?' · Order served!':' · One more patty!'):(result.d<0?'Too short — hold a little longer.':'Too far — release a little sooner.');say(text);tone(result.hit);if(result.hit&&!reduced)for(let i=0;i<22;i++)particles.push({x:state.shot.plate,y:335,vx:(Math.random()-.5)*230,vy:-80-Math.random()*180,at:time,color:['#ffde75','#fff4c8','#70d9b1','#e99568'][i%4]});sync();}
 if(state.phase==='reaction'&&time-reactionAt>=1.25){R.advance(state);sync();if(['won','lost'].includes(state.phase)){best=Math.max(best,state.score);try{localStorage.setItem('krusty-rush-best',best)}catch{}modal(state.phase==='won'?'LUNCH SERVICE COMPLETE':'ANOTHER SHIFT, ANOTHER CHANCE',state.phase==='won'?'A delicious shift!':'Keep flipping!',`${state.index}/6 orders · ${state.score} tips · ${state.perfects} perfect flips. Best streak ×${state.bestCombo}. Best score ${best}.`,'Play another shift');}else{const o=R.orders[state.index];say(state.stack?'Stack one more patty to finish the double!':o.amp?'Moving plate! Aim at the outlined landing plate.':o.count===2?'Double order! Land two patties on the same plate.':'Fresh order! Match the arc to the plate.');}}
 particles=particles.filter(p=>time-p.at<1);
}
function start(input){if(!ready||paused||state.phase!=='ready'||held!==null)return;update(performance.now());held=performance.now();owner=input;if(sound){try{audio ||= new AudioContext();audio.resume()}catch{}}$('action').textContent='RELEASE TO FLIP';}
function release(input){if(held===null||owner!==input)return;const now=performance.now(),q=R.charge((now-held)/1000);update(now);held=null;owner=null;if(paused)return;R.launch(state,q,time);sync();}
const button=$('flip');button.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();button.setPointerCapture(e.pointerId);start(e.pointerId)});button.addEventListener('pointerup',e=>{e.preventDefault();release(e.pointerId)});button.addEventListener('pointercancel',()=>{held=null;owner=null;sync()});button.addEventListener('lostpointercapture',()=>{if(typeof owner==='number'){held=null;owner=null;sync()}});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&(document.activeElement===button||document.activeElement===document.body||document.activeElement===canvas)){e.preventDefault();start('keyboard')}if(e.code==='Escape')paused?resume():pause()});document.addEventListener('keyup',e=>{if(e.code==='Space'&&owner==='keyboard'){e.preventDefault();release('keyboard')}});
$('pause').onclick=()=>paused?resume():pause();$('sound').onclick=()=>{sound=!sound;try{localStorage.setItem('krusty-rush-sound',sound?'1':'0')}catch{}soundUI();if(sound)tone(true)};$('primary').onclick=()=>{if(!ready){location.reload();return}paused?resume():begin()};
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
function round(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function ellipse(x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function text(s,x,y,size,color,align='center'){ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`bold ${size}px Trebuchet MS, sans-serif`;ctx.fillText(s,x,y)}
function character(name,x,foot,size,bob=0){if(!images[name])return;ctx.save();ctx.translate(x,foot+bob);ctx.drawImage(images[name],-size/2,-size*980/1024,size,size);ctx.restore()}
function prop(name,x,y,w,h,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(images[name],-w/2,-h/2,w,h);ctx.restore()}
function plate(x,y,ghost=false){ctx.save();if(ghost){ctx.globalAlpha=.65;ctx.setLineDash([5,5]);ctx.strokeStyle='#ffef9b';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,43,12,0,0,Math.PI*2);ctx.stroke();ctx.restore();return}ellipse(x,y+8,48,13,'#153d3c38');ellipse(x,y,46,12,'#d7e1d5');ellipse(x,y-3,43,11,'#fffbe9');ellipse(x,y-3,31,6,'#d7e6d6');ctx.strokeStyle='#7da99b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y-3,33,7,0,0,Math.PI*2);ctx.stroke();ctx.restore()}
function draw(now){update(now);ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,600,520);if(!ready)return;
 ctx.drawImage(images.kitchen,0,0,600,450);ctx.fillStyle='#fcebc322';ctx.fillRect(0,0,600,400);
 // Soft window light and a stable back wall, with the gameplay plane in front.
 const light=ctx.createRadialGradient(285,75,5,285,75,360);light.addColorStop(0,'#fff8cc66');light.addColorStop(1,'#fff8cc00');ctx.fillStyle=light;ctx.fillRect(0,0,600,440);
 const o=R.orders[Math.min(state.index,5)],react=state.phase==='reaction',served=react&&state.last.served;
 ellipse(125,412,79,12,'#214e453b');ellipse(463,319,64,10,'#214e4530');
 let chef=state.phase==='flight'?'flip':react?(state.last.hit?'cheer':'miss'):'ready';const bob=reduced?0:Math.sin(time*2.1)*1.5;character(`chef-${chef}`,120,411,280,react&&state.last.hit&&!reduced?-Math.sin(Math.min(1,(time-reactionAt)/.5)*Math.PI)*13:bob);
 character(`${o.who}-${served?'served':'wait'}`,465,320,o.who==='patrick'?247:264,served&&!reduced?-Math.sin(Math.min(1,(time-reactionAt)/.6)*Math.PI)*7:0);
 if(served){const p=R.clamp((time-reactionAt)/.55),ease=1-(1-p)**3;prop('burger',state.shot.plate+(465-state.shot.plate)*ease,328+(235-328)*ease,72,70);}
 // Counter, edge highlights, cabinet panels and cooking surface.
 const wood=ctx.createLinearGradient(0,365,0,520);wood.addColorStop(0,'#d7a96c');wood.addColorStop(.12,'#ab7148');wood.addColorStop(.13,'#735443');wood.addColorStop(1,'#345451');round(0,369,600,151,0,wood);ctx.fillStyle='#f6d09a';ctx.fillRect(0,370,600,4);ctx.fillStyle='#ffffff0d';for(let i=0;i<5;i++)ctx.fillRect(i*130+10,414,113,96);ctx.fillStyle='#142e312e';ctx.fillRect(0,405,600,4);
 round(32,365,202,34,11,'#253b3c');round(38,359,190,29,8,'#465252');for(let i=0;i<9;i++)round(48+i*20,363,6,18,2,'#172e30');round(39,391,187,14,5,'#a5b3a3');for(let i=0;i<3;i++){ellipse(75+i*55,398,6,6,'#274647');ellipse(74+i*55,396,2,2,'#ffdc90')}
 const tx=state.shot&&(state.phase==='reaction')?state.shot.plate:R.target(Math.min(state.index,5),time);plate(tx,365);
 for(let i=0;i<state.stack&&!served;i++)prop('patty',tx,350-i*10,66,32);
 const q=held===null?0:R.charge((now-held)/1000),forecast=R.target(Math.min(state.index,5),time+R.C.flight),land=R.landing(q),near=Math.abs(land-forecast)<=R.C.tolerance;
 if(state.phase==='ready'){
   if(o.amp)plate(forecast,365,true);
   if(held!==null){ctx.save();ctx.setLineDash([3,9]);ctx.lineWidth=3;ctx.strokeStyle=near?'#fcf7ae':'#fff6dbbb';ctx.beginPath();for(let i=0;i<=30;i++){const p=R.trajectory(land,i/30);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.stroke();ctx.restore();ellipse(land,350,9,4,near?'#fff5a5':'#fef8e0');text(near?'RELEASE!':'AIM',land,325,14,near?'#315943':'#4d6657');}
   prop('patty',155,350,64,35);
 }
 if(state.phase==='flight'){const p=R.clamp((time-state.shot.at)/R.C.flight),pos=R.trajectory(state.shot.x,p);ellipse(pos.x,362,18+8*p,4,'#173a3b25');prop('patty',pos.x,pos.y,64,35,reduced?0:p*Math.PI*2);}
 if(react&&!state.last.hit){const p=R.clamp((time-reactionAt)/.6);ctx.globalAlpha=1-p;prop('patty',state.shot.x,350+p*90,64,35,p*2);ctx.globalAlpha=1;}
 if(!reduced){for(let i=0;i<4;i++){const u=(time*.38+i*.25)%1;ctx.globalAlpha=(1-u)*.25;ctx.strokeStyle='#fff9db';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(65+i*35,351-u*50);ctx.bezierCurveTo(52+i*35,338-u*50,81+i*35,333-u*50,68+i*35,319-u*50);ctx.stroke();}ctx.globalAlpha=1;}
 for(const p of particles){const a=time-p.at;ctx.globalAlpha=1-a;ctx.save();ctx.translate(p.x+p.vx*a,p.y+p.vy*a+180*a*a);ctx.rotate(a*5);round(-3,-3,6,6,2,p.color);ctx.restore();}ctx.globalAlpha=1;
 // Meter uses the same future plate position and tolerance as the collision rule.
 $('safeZone').style.left=`${R.clamp((forecast-R.C.tolerance-R.C.min)/R.C.range)*100}%`;$('safeZone').style.width=`${R.C.tolerance*2/R.C.range*100}%`;$('sweetZone').style.left=`${(forecast-R.C.perfect-R.C.min)/R.C.range*100}%`;$('sweetZone').style.width=`${R.C.perfect*2/R.C.range*100}%`;$('needle').style.left=`${q*100}%`;$('powerText').textContent=`${Math.round(q*100)}%`;$('hint').textContent=held!==null?(near?'Release now — plate is in range!':'Keep holding to move the landing point'):'Light green = catch · dark green = perfect';
}
function frame(now){draw(now);requestAnimationFrame(frame)}
Promise.all(names.map(name=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images[name]=image;resolve()};image.onerror=()=>reject(new Error(name));image.src=`assets/${name}.png`;}))).then(()=>{ready=true;begin();requestAnimationFrame(frame)}).catch(()=>modal('ASSET LOADING INTERRUPTED','The kitchen needs a moment','An image could not load. Check the connection, then try again.','Reload kitchen'));
})();
