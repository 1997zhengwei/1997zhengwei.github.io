export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const HALF_WIDTH=5.2;
export const COURSE_REVISION=2;
export const COURSES=[
 {id:'lagoon',name:'珊瑚海湾',tag:'环岛回旋 · 多层盘旋',shape:'coil',revision:2,color:'#ff2494',accent:'#ffe91b',water:'#16b9ed',sky:'#83eaff',seed:71},
 {id:'sunset',name:'落日疾驰',tag:'长直道 · 双发卡 · 蓄能超车',shape:'switchback',revision:3,color:'#9638e8',accent:'#ffbc27',water:'#12b8e8',sky:'#ffcca9',seed:182},
 {id:'reef',name:'蓝礁天桥',tag:'宽S弯 · 双层交叉 · 直线冲刺',shape:'skybridge',revision:3,color:'#0089f5',accent:'#f5ffff',water:'#24cbef',sky:'#81e1ff',seed:305}
];
const layouts={
 lagoon:[[0,74,70],[0,71,20],[44,67,0],[72,63,36],[40,58,72],[-18,53,65],[-59,49,21],[-43,44,-38],[11,39,-60],[68,34,-30],[96,29,26],[65,24,92],[6,19,114],[-61,14,76],[-91,10,5],[-60,6,-69],[0,3,-112]],
 sunset:[[0,81,75],[10,77,20],[52,73,-5],[84,68,27],[70,63,78],[15,58,99],[-40,53,60],[-57,48,1],[-20,43,-50],[42,38,-57],[96,33,-9],[115,28,54],[72,23,115],[4,18,122],[-70,13,80],[-105,8,3],[-61,4,-83],[0,3,-132]],
 reef:[[0,76,65],[0,73,15],[46,68,-13],[84,63,15],[68,59,64],[8,54,88],[-52,49,53],[-78,44,-5],[-31,39,-56],[34,34,-77],[84,29,-39],[105,24,23],[71,19,101],[1,14,120],[-72,10,76],[-112,6,-4],[-66,3,-84],[0,3,-122]]
};
const extensions={
 lagoon:[[65,38,-135],[126,34,-91],[145,30,-12],[108,26,70],[37,22,133],[-48,18,110],[-121,14,46],[-147,10,-37],[-102,6,-122],[-24,3,-181]],
 sunset:[[71,38,-143],[139,34,-104],[164,30,-24],[130,26,65],[56,22,133],[-31,18,126],[-120,14,62],[-159,10,-28],[-112,6,-119],[-22,3,-181]],
 reef:[[70,38,-135],[135,34,-88],[156,30,-4],[115,26,85],[37,22,141],[-48,18,117],[-130,14,48],[-160,10,-42],[-110,6,-133],[-21,3,-195]]
};
// The new layouts use long collinear sections, rather than another spiral.
const variedLayouts={
 sunset:[[-90,136,140],[-90,132,80],[-90,126,0],[-90,120,-80],[-90,115,-155],[-75,111,-193],[-45,107,-210],[-15,103,-193],[0,99,-155],[0,94,-85],[0,88,0],[0,82,80],[0,77,150],[15,72,188],[45,67,205],[75,62,188],[90,57,150],[90,51,75],[90,44,-10],[90,37,-90],[90,30,-160],[108,29,-198],[145,23,-219],[185,16,-225],[245,9,-240],[320,3,-255]],
 reef:[[-120,138,170],[-120,134,110],[-110,129,45],[-75,123,-20],[-10,117,-70],[45,111,-115],[70,105,-165],[70,99,-210],[55,93,-245],[25,87,-260],[-5,81,-245],[-20,75,-210],[-30,68,-130],[-25,60,-20],[0,52,70],[25,44,160],[45,37,205],[80,31,225],[115,25,210],[135,19,170],[135,15,100],[135,11,20],[135,7,-60],[135,4,-140],[160,3,-185]]
};
function routePoints(course){
 if(course.id!=='lagoon')return variedLayouts[course.id].map(([x,y,z])=>[x*.9,y,z*.9]);
 return[...layouts.lagoon.map(([x,y,z])=>[x,y*1.25+37,z]),...extensions.lagoon].map(([x,y,z])=>[-x*.7,y,z*.7]);
}
function spline(a,b,c,d,t){const t2=t*t,t3=t2*t;return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}
const trackCache=new Map();
export function buildTrack(id='lagoon'){
 if(trackCache.has(id))return trackCache.get(id);
 const course=COURSES.find(c=>c.id===id)||COURSES[0],points=routePoints(course),dense=[];
 for(let i=0;i<points.length-1;i++)for(let n=0;n<42;n++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)],t=n/42;dense.push({x:spline(a[0],b[0],c[0],d[0],t),y:spline(a[1],b[1],c[1],d[1],t),z:spline(a[2],b[2],c[2],d[2],t)});}
 const end=points.at(-1);dense.push({x:end[0],y:end[1],z:end[2]});let total=0;dense[0].s=0;for(let i=1;i<dense.length;i++){total+=distance(dense[i],dense[i-1]);dense[i].s=total;}
 const samples=[];let j=1;for(let s=0;s<total;s++){while(j<dense.length-1&&dense[j].s<s)j++;const a=dense[j-1],b=dense[j],t=(s-a.s)/(b.s-a.s);samples.push({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t),s});}samples.push({...dense.at(-1)});
 const track={...course,samples,length:total,width:HALF_WIDTH,gaps:[],pads:[],obstacles:[],boosts:[]},straight=course.id==='sunset',bridge=course.id==='reef';
 track.gaps=(straight?[.16,.51,.86]:bridge?[.22,.53,.84]:[.24,.5,.76]).map((f,i)=>({id:i,s:Math.round(total*f),end:Math.round(total*f)+9}));
 track.obstacles=(straight?[.12,.27,.43,.58,.73,.9]:[.1,.18,.32,.41,.57,.65,.83,.93]).map((f,i)=>({id:i,s:total*f,lane:i%2?2.7:-2.7,width:3.6,phase:i*1.8}));
 track.boosts=(straight?[.06,.4,.67,.92]:bridge?[.08,.43,.68,.9]:[.08,.3,.57,.86]).map((f,i)=>({s:total*f,end:total*f+(straight?22:13),lane:i%2?2.4:-2.4,width:2.5}));
 for(let s=42;s<total-70;s+=9){if(track.pads.some(p=>Math.abs(p.s-s)<180)||isGap(track,s,32))continue;let best=null;const candidates=[];
  const a=frameAt(track,s);for(let gain=38;gain<190&&s+gain<total-18;gain+=4){const b=frameAt(track,s+gain),chord=Math.hypot(b.x-a.x,b.z-a.z),drop=a.y-b.y,t=(16+Math.sqrt(16**2+30*Math.max(0,drop)))/15,speed=chord/t;
   if(drop<1||drop>20||chord<15||speed<12||speed>36||gain/chord<1.24||isGap(track,s+gain,9))continue;const value=gain-chord;
   candidates.push({id:track.pads.length,s,end:s+gain,gain,value,time:t,speed});
  }for(const candidate of candidates.sort((a,b)=>b.value-a.value).slice(0,12)){if(validFlight(track,candidate)){best=candidate;break;}}if(best)track.pads.push(best);
 }
 const xs=samples.map(p=>p.x),zs=samples.map(p=>p.z),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 track.resort=course.id==='lagoon'?{x:0,z:0,rx:83,rz:70}:{x:(minX+maxX)/2,z:(minZ+maxZ)/2,rx:(maxX-minX)*.58,rz:(maxZ-minZ)*.54};
 trackCache.set(course.id,track);return track;
}
export function pointAt(track,s){s=clamp(s,0,track.length);const i=Math.min(Math.floor(s),track.samples.length-2),a=track.samples[i],b=track.samples[i+1],t=clamp((s-a.s)/Math.max(.001,b.s-a.s),0,1);return{x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t)};}
export function frameAt(track,s,lane=0){const p=pointAt(track,s),a=pointAt(track,s-1.5),b=pointAt(track,s+1.5),len=Math.hypot(b.x-a.x,b.z-a.z)||1,tx=(b.x-a.x)/len,tz=(b.z-a.z)/len;return{x:p.x-tz*lane,y:p.y+troughHeight(lane),z:p.z+tx*lane,tx,tz,rx:-tz,rz:tx,slope:(b.y-a.y)/Math.max(.1,Math.hypot(b.x-a.x,b.z-a.z))};}
const TROUGH_RADIUS=5.6;
export const troughHeight=lane=>TROUGH_RADIUS-Math.sqrt(Math.max(.01,TROUGH_RADIUS*TROUGH_RADIUS-lane*lane));
export const troughSlope=lane=>lane/Math.sqrt(Math.max(.01,TROUGH_RADIUS*TROUGH_RADIUS-lane*lane));
export const isGap=(track,s,margin=0)=>track.gaps.some(g=>s>=g.s-margin&&s<=g.end+margin);
export function padNear(track,s){return track.pads.find(p=>s>=p.s&&s<=p.s+26)||null;}
export function landingSurface(track,x,z,previousY,y){
 let chosen=null;
 for(let i=0;i<track.samples.length-3;i+=3){const a=track.samples[i],b=track.samples[i+3],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=((x-a.x)*dx+(z-a.z)*dz)/Math.max(.01,l2),cx=a.x+dx*t,cz=a.z+dz*t;
  if(t<0||t>1)continue;
  const lane=((x-cx)*-dz+(z-cz)*dx)/Math.sqrt(Math.max(.01,l2)),s=mix(a.s,b.s,t);if(Math.hypot(x-cx,z-cz)>HALF_WIDTH-.25||isGap(track,s))continue;
  const height=mix(a.y,b.y,t)+troughHeight(lane)+.18;if(previousY<height-.02||y>height||chosen&&chosen.y>height)continue;chosen={s,lane:clamp(lane,-HALF_WIDTH+.3,HALF_WIDTH-.3),y:height};
 }return chosen;
}

export function supportLayout(track){
 const posts=[],beams=[],clear=(p,s)=>!track.samples.some((q,i)=>i%3===0&&Math.abs(q.s-s)>24&&q.y<p.y-5&&Math.hypot(q.x-p.x,q.z-p.z)<HALF_WIDTH+2.2);
 for(let s=8;s<track.length;s+=32){if(isGap(track,s,5))continue;const p=pointAt(track,s);
  if(track.shape!=='skybridge'||clear(p,s)){posts.push({...p,s});continue;}
  const f=frameAt(track,s);
  for(const span of[12,16,20]){const pair=[-1,1].map(sign=>({x:p.x+f.rx*span*sign,y:p.y,z:p.z+f.rz*span*sign,s}));if(pair.every(q=>clear(q,s))){posts.push(...pair);beams.push({...p,span,rx:f.rx,rz:f.rz});break;}}
 }
 return{posts,beams};
}

function validFlight(track,pad){
 const dt=1/60;
 for(const offset of [0,6,12,18,26]){
  const a=frameAt(track,pad.s+offset),b=frameAt(track,pad.end),start=a.y+.25,drop=start-(b.y+.18),time=(16+Math.sqrt(256+30*Math.max(0,drop)))/15,vx=(b.x-a.x)/time,vz=(b.z-a.z)/time;let x=a.x,y=start,z=a.z,vy=16,valid=false;
  if(Math.hypot(vx,vz)>38)return false;
  for(let age=0;age<4;age+=dt){const old=y;vy-=15*dt;x+=vx*dt;z+=vz*dt;y+=vy*dt;if(vy<0){const hit=landingSurface(track,x,z,old,y);if(hit){valid=hit.s>pad.s+35&&Math.abs(hit.s-pad.end)<20;break;}}}
  if(!valid)return false;
 }
 return true;
}
