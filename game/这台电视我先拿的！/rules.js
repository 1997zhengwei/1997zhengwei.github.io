import {duration,capacity,bulky,saving,maps,atTill,nearestTill,newStock,canMove,distance,pathTo,gateAt,reachesStand,goods} from './market.js';
import {cartStats} from './upgrades.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const bagValue=items=>items.reduce((n,k)=>n+saving(k),0);
export const comboWindow=2.8,listBonus=300,frenzyAt=10;
// How tall the pile in the cart is: a big screen counts as two layers.
export const stackHeight=items=>items.reduce((n,k)=>n+(bulky(k)?2:1),0);
export const comboRate=n=>Math.min(2,1+.25*(n-1));
const roster=[
  {name:'阿桃',speed:2.70,quota:3,dept:1,temper:.30},
  {name:'卷卷',speed:3.06,quota:4,dept:2,temper:.45},
  {name:'小麦',speed:2.52,quota:2,dept:0,temper:.22}
];
function shoppingList(stock,round){
  const kinds=[...new Set(stock.pickups.filter(p=>!p.flash).map(p=>p.kind))];
  const list=[];for(let i=0;list.length<3&&i<kinds.length*3;i++){const k=kinds[(round*5+i*7)%kinds.length];if(!list.includes(k))list.push(k);}
  return list;
}
export function newShop(round=0,map=maps[0],levels){
  const stock=newStock(round,map);
  stock.waves[0].available=true;
  const cart=cartStats(levels);
  return {phase:'ready',time:duration,elapsed:0,round,map,...stock,wave:0,
    name:'你',x:map.start[0],z:map.start[1],vx:0,vz:0,angle:-.48,stride:0,items:[],banked:[],paid:0,trips:0,
    cart,protection:cart.protection,loose:[],looseId:0,
    lost:[],skew:0,gateJam:0,jam:false,impactCooldown:0,sway:0,tilt:0,warned:false,fullAt:-Infinity,events:[],
    combo:0,lastPick:-9,itemBonuses:[],bestCombo:0,dashT:0,dashCD:0,rams:0,
    list:shoppingList(stock,round),listDone:[],listPaid:false,frenzy:false,
    rivals:roster.map((r,i)=>({...r,x:map.rivals[i][0],z:map.rivals[i][1],index:i,angle:i+.7,stride:i,pace:0,items:[],paid:0,trips:0,target:null,path:[],leg:0,wait:.6+i*.35,
      stun:0,dashT:0,ramCD:6+i*2}))};
}
export function rankings(s){
  const rows=[s,...s.rivals].map((a,i)=>({name:a.name,id:i,paid:a.paid}));
  rows.sort((a,b)=>b.paid-a.paid||a.id-b.id);
  return rows.map((r,i)=>({...r,rank:rows.findIndex(t=>t.paid===r.paid)+1}));
}
function setWave(s,index){
  if(s.wave>=0)s.waves[s.wave].available=false;
  s.wave=index;
  const p=s.waves[index];p.available=true;
  for(const r of s.rivals)if(!s.map.tills.includes(r.target))r.target=null;
  s.events.push({type:'sale',p});
}
// Anything knocked out of a cart lands nearby, free for whoever gets there first.
function spill(s,kind,x,z,mine=false){
  for(let k=0;k<10;k++){
    const a=Math.random()*Math.PI*2,d=.9+Math.random()*.9,nx=x+Math.cos(a)*d,nz=z+Math.sin(a)*d;
    if(canMove(nx,nz,s.map)){const item={id:++s.looseId,kind,x:nx,z:nz,fromX:x,fromZ:z,age:0,mine};s.loose.push(item);return item;}
  }
  const item={id:++s.looseId,kind,x,z,fromX:x,fromZ:z,age:0,mine};s.loose.push(item);return item;
}
function topItem(items){const i=items.findLastIndex(k=>!bulky(k));return i<0?items.length-1:i;}
function take(s,a,kind,src){
  a.items.push(kind);
  if(a!==s)return;
  let bonus=0;
  if(!src.mine){
    s.combo=s.elapsed-s.lastPick<=comboWindow?s.combo+1:1;s.lastPick=s.elapsed;s.bestCombo=Math.max(s.bestCombo,s.combo);
    bonus=Math.round(saving(kind)*(comboRate(s.combo)-1));
    if(s.combo>1)s.events.push({type:'combo',n:s.combo,bonus,x:src.x,z:src.z});
  }
  s.itemBonuses.push(bonus);
}
function collect(s,p,a){
  const limit=a===s?s.cart.capacity:capacity;
  if(!p.available||a.items.length>=limit)return;
  const who=a===s?'you':a.index;
  p.owner=who;p.available=false;p.restockAt=s.elapsed+17;
  take(s,a,p.kind,p);s.events.push({type:'pickup',kind:p.kind,who,x:p.x,z:p.z,flash:p.flash});
}
function grabLoose(s,item,a){
  const limit=a===s?s.cart.capacity:capacity;
  if(a.items.length>=limit)return false;
  s.loose.splice(s.loose.indexOf(item),1);take(s,a,item.kind,item);
  s.events.push({type:'pickup',kind:item.kind,who:a===s?'you':a.index,x:item.x,z:item.z,loose:item.id});return true;
}
function bank(s,a){
  if(!a.items.length||!atTill(a,s.map))return;
  const bag=a.items.splice(0),double=s.time<=frenzyAt;
  const comboBonus=a===s?s.itemBonuses.splice(0).reduce((sum,bonus)=>sum+bonus,0):0;
  const amount=(bagValue(bag)+comboBonus)*(double?2:1);
  a.paid+=amount;a.trips++;
  if(a===s){
    s.banked.push(...bag);s.skew=0;s.gateJam=0;s.jam=false;s.protection=s.cart.protection;s.tilt=0;
    for(const k of bag)if(s.list.includes(k)&&!s.listDone.includes(k)){s.listDone.push(k);s.events.push({type:'list',kind:k});}
    if(!s.listPaid&&s.listDone.length===s.list.length){s.listPaid=true;s.paid+=listBonus;s.events.push({type:'listDone',amount:listBonus});}
  }
  else {a.target=null;a.wait=.52;}
  s.events.push({type:'bank',who:a===s?'you':a.index,amount,x:a.x,z:a.z,items:bag,comboBonus,double});
}
function loseTop(s,why){
  if(!s.items.length)return;
  if(s.protection>0){s.protection--;s.events.push({type:'protect'});return;}
  const index=topItem(s.items);
  const [kind]=s.items.splice(index,1);s.itemBonuses.splice(index,1);s.lost.push(kind);
  const item=spill(s,kind,s.x,s.z,true);s.events.push({type:'drop',kind,why,id:item.id});
}
function bump(s,strong){
  if(s.impactCooldown>0)return;
  s.impactCooldown=1.15;s.sway=Math.max(.55,s.sway);
  s.tilt+=(Math.random()<.5?-1:1)*.35*Math.min(1,stackHeight(s.items)/5);
  if(!s.items.length||!strong){s.events.push({type:'bump'});return;}
  loseTop(s,'bump');
}
function planRival(s,r){
  r.target=null;
  const wide=r.items.some(bulky),till=nearestTill(r,s.map);
  let dest=null;
  const rushHome=r.items.length&&(r.items.length>=r.quota||bagValue(r.items)>990||s.time<distance(r,till)/r.speed+6);
  if(!rushHome){
    let best=-Infinity;
    for(const p of [...s.pickups,...s.loose]){
      if(p.available===false)continue;
      const d=distance(r,p);
      const zone=p.x< s.map.bounds.left*.44?1:p.x>s.map.bounds.right*.44?2:0;
      const competition=s.rivals.some(other=>other!==r&&other.target===p);
      const value=(saving(p.kind)/(2.5+d))*(zone===r.dept?1.52:1)*(competition?.59:1)*(p.id?1.4:1);
      if(value>best){best=value;dest=p;}
    }
  }
  if(!dest&&r.items.length)dest=till;
  if(!dest){r.wait=.36;r.pace=0;return;}
  r.target=dest;r.path=pathTo(r,dest,wide,s.map);r.leg=0;
  if(!r.path.length){r.target=null;r.wait=.4;}
}
function moveRivals(s,dt){
  for(const r of s.rivals){
    r.ramCD=Math.max(0,r.ramCD-dt);
    if(r.stun>0){r.stun-=dt;r.pace=0;r.angle+=dt*14;continue;}
    // A jealous shopper may charge a full cart that passes close by.
    if(r.dashT>0){
      r.dashT-=dt;const dx=s.x-r.x,dz=s.z-r.z,d=Math.hypot(dx,dz)||1,v=r.speed*2.3;
      const nx=r.x+dx/d*v*dt,nz=r.z+dz/d*v*dt;if(canMove(nx,r.z,s.map))r.x=nx;if(canMove(r.x,nz,s.map))r.z=nz;
      r.angle=Math.atan2(dx,-dz);r.pace=v;r.stride+=v*dt*5.3;
      if(d<1.05){r.dashT=0;r.wait=.6;s.events.push({type:'rammed',who:r.index,x:s.x,z:s.z});loseTop(s,'ram');s.tilt+=.4;}
      continue;
    }
    if(r.ramCD<=0&&s.phase==='play'&&s.items.length>=2&&distance(r,s)<2.7&&Math.random()<r.temper*dt*3){
      r.dashT=.55;r.ramCD=8+Math.random()*4;r.target=null;s.events.push({type:'charge',who:r.index});continue;
    }
    if(r.wait>0){r.wait-=dt;r.pace=0;continue;}
    if(r.target&&!s.map.tills.includes(r.target)&&r.items.length&&s.time<distance(r,nearestTill(r,s.map))/r.speed+5)r.target=null;
    const gone=r.target&&(r.target.id?!s.loose.includes(r.target):(!s.map.tills.includes(r.target)&&!r.target.available));
    if(!r.target||gone)planRival(s,r);
    if(!r.target)continue;
    while(r.leg<r.path.length&&distance(r,r.path[r.leg])<.15)r.leg++;
    const node=r.path[r.leg];
    if(node){
      const dx=node.x-r.x,dz=node.z-r.z,d=Math.hypot(dx,dz);
      const speed=r.speed*(r.items.some(bulky)?.89:1);
      const f=Math.min(1,speed*dt/d);
      const nx=r.x+dx*f,nz=r.z+dz*f;
      if(canMove(nx,r.z,s.map))r.x=nx;
      if(canMove(r.x,nz,s.map))r.z=nz;
      r.stride+=speed*dt*5.3;r.pace=speed;
      r.angle+=angleDiff(Math.atan2(dx,-dz),r.angle)*(1-Math.exp(-dt*9));
    }
    if(!s.map.tills.includes(r.target)&&distance(r,r.target)<.91){
      if(r.target.id)grabLoose(s,r.target,r);else collect(s,r.target,r);r.target=null;r.wait=.25;
    }
    bank(s,r);
    if(!node){r.target=null;r.wait=.16;}
  }
}
function movePlayer(s,dt,input,force){
  const dashing=s.dashT>0;
  const maxSpeed=(s.cart.maxSpeed-Math.min(.78,s.items.length*.1))*(dashing?1.75:1);
  const magnitude=Math.hypot(input.x,input.z)||1;
  const ix=dashing&&force<.1?Math.sin(s.angle):input.x/magnitude,iz=dashing&&force<.1?-Math.cos(s.angle):input.z/magnitude;
  const push=dashing?1:force;
  const blend=1-Math.exp(-dt*(push?s.cart.acceleration*(dashing?2:1):12));
  const ovx=s.vx,ovz=s.vz;
  s.vx+=(ix*maxSpeed*push-s.vx)*blend;s.vz+=(iz*maxSpeed*push-s.vz)*blend;
  const velocity=Math.hypot(s.vx,s.vz);
  if(velocity>.18){
    const turn=angleDiff(Math.atan2(s.vx,-s.vz),s.angle);
    s.angle+=turn*(1-Math.exp(-dt*9));
    s.sway+=((turn*velocity*.14)-s.sway)*Math.min(1,7*dt);
  }else s.sway*=Math.exp(-dt*6);
  // Swerving hard throws the pile sideways; tall piles go over.
  const height=stackHeight(s.items);
  const lateral=velocity>.3?((s.vx-ovx)*s.vz-(s.vz-ovz)*s.vx)/(velocity*dt):0;
  const lean=height>=4?clamp(lateral*.018*(height-3)/s.cart.grip,-2.5,2.5):0;
  s.tilt+=(lean-s.tilt)*(1-Math.exp(-dt*3.2));
  if(Math.abs(s.tilt)>.72&&!s.warned){s.warned=true;s.events.push({type:'wobble'});}
  if(Math.abs(s.tilt)<.4)s.warned=false;
  if(Math.abs(s.tilt)>1&&s.items.length){
    const n=height>=9?2:1;s.events.push({type:'topple',n});
    for(let i=0;i<n;i++)loseTop(s,'topple');
    s.tilt*=-.3;s.warned=false;
  }
  const nx=s.x+s.vx*dt,nz=s.z+s.vz*dt;
  const carryingTV=s.items.some(bulky);
  const gate=carryingTV&&gateAt(s.map,nx,nz);
  const approaching=gate&&Math.abs(nz-gate.z)<=Math.abs(s.z-gate.z)&&force>.12;
  const space=gate?gate.half-Math.abs(nx-gate.x):0;
  const width=s.items.includes('oled')?1.70:1.56;
  const span=Math.abs(Math.cos(s.angle+s.skew))*width+Math.abs(Math.sin(s.angle+s.skew))*.16;
  s.jam=approaching&&span>space;
  if(s.jam){
    if(s.gateJam===0){s.events.push({type:'jam'});bump(s,velocity>2.6&&s.items.length>1);}
    s.gateJam+=dt;
    // A sustained push at the centre gradually tips the TV through the gate.
    s.skew=Math.min(1.46,s.skew+dt*1.23);
  }else if(!gateAt(s.map,s.x,s.z,.25)){s.gateJam=0;s.skew*=Math.exp(-3*dt);}
  const oldX=s.x,oldZ=s.z;
  if(canMove(nx,s.z,s.map))s.x=nx;else{if(Math.abs(s.vx)>2.8)bump(s,stackHeight(s.items)>=5);s.vx*=-.2;}
  if(!s.jam&&canMove(s.x,nz,s.map))s.z=nz;else if(!s.jam){if(Math.abs(s.vz)>2.8)bump(s,stackHeight(s.items)>=5);s.vz*=-.2;}
  s.stride+=Math.hypot(s.x-oldX,s.z-oldZ)*5.3;
}
export function dash(s){
  if(s.phase!=='play'||s.dashCD>0)return false;
  s.dashT=.36;s.dashCD=2.4;s.events.push({type:'dash'});return true;
}
export function advanceShop(s,dt,input){
  s.events.length=0;
  const force=Math.min(1,Math.hypot(input.x,input.z));
  if(s.phase==='ready'&&(force>.10||input.start)){s.phase='play';s.events.push({type:'start'},{type:'sale',p:s.waves[0]});}
  if(s.phase!=='play'||dt<=0)return;
  dt=Math.min(dt,s.time);
  s.elapsed+=dt;s.time=Math.max(0,duration-s.elapsed);s.impactCooldown=Math.max(0,s.impactCooldown-dt);
  s.dashT=Math.max(0,s.dashT-dt);s.dashCD=Math.max(0,s.dashCD-dt);
  if(!s.frenzy&&s.time<=frenzyAt){s.frenzy=true;s.events.push({type:'frenzy'});}
  if(s.combo&&s.elapsed-s.lastPick>comboWindow){s.combo=0;s.events.push({type:'comboEnd'});}
  const next=s.wave+1;
  if(next<3&&s.elapsed>=[1.45,20,40][next])setWave(s,next);
  for(const p of s.pickups)if(!p.flash&&!p.available&&s.elapsed>=p.restockAt){
    p.available=true;p.owner=null;s.events.push({type:'restock'});
  }
  for(let i=s.loose.length-1;i>=0;i--){s.loose[i].age+=dt;if(s.loose[i].age>14){s.events.push({type:'vanish',id:s.loose[i].id});s.loose.splice(i,1);}}
  movePlayer(s,dt,input,force);
  for(const p of s.pickups){
    if(!p.available||!reachesStand(s,p,s.map))continue;
    if(s.items.length<s.cart.capacity)collect(s,p,s);
    else if(s.elapsed-s.fullAt>=2.2){
      s.fullAt=s.elapsed;s.events.push({type:'full'});
    }
  }
  for(const item of [...s.loose])if(item.age>(item.mine?1.1:.45)&&distance(s,item)<1.05)grabLoose(s,item,s);
  bank(s,s);moveRivals(s,dt);
  for(const r of s.rivals){
    const dx=r.x-s.x,dz=r.z-s.z,d=Math.hypot(dx,dz);
    if(s.dashT>0&&d<1.15&&r.stun<=0){
      r.stun=1.3;r.dashT=0;r.target=null;s.rams++;
      const has=r.items.length,kind=has?r.items.splice(topItem(r.items),1)[0]:null;
      if(kind)spill(s,kind,r.x,r.z);
      s.events.push({type:'ram',who:r.index,kind,x:r.x,z:r.z});
      const push=1.2;const nx=r.x+dx/(d||1)*push,nz=r.z+dz/(d||1)*push;if(canMove(nx,r.z,s.map))r.x=nx;if(canMove(r.x,nz,s.map))r.z=nz;
      continue;
    }
    if(d<.78&&d>.001){const push=Math.min(.78-d,dt*1.2),nx=r.x+dx/d*push,nz=r.z+dz/d*push;
      if(canMove(nx,r.z,s.map))r.x=nx;if(canMove(r.x,nz,s.map))r.z=nz;}
  }
  if(s.time<=.000001){s.time=0;s.phase='closed';s.events.push({type:'end'});}
}
export {goods};
