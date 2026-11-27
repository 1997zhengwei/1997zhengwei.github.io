import {THREE,box,rod,ring,mesh,material} from './world.mjs';
export const SLIDE_TYPES={
 waterslide:{name:'Wave slide',icon:'∿',color:'#79cdd5',hint:'Walk to the yellow steps. Climb up and ride the long wavy chute!'},
 spiralslide:{name:'Spiral slide',icon:'⟳',color:'#b2a0e4',hint:'Enter at the yellow steps, then spiral around the tower.'},
 jumpslide:{name:'Jump slide',icon:'↗',color:'#efaf80',hint:'Climb the yellow steps. The curved exit launches you into the air!'}
};
export function slidePoint(type,t){
 t=Math.max(0,Math.min(1,t));
 if(type==='spiralslide'){const a=t*Math.PI*2.5;return {x:Math.cos(a)*1.7,y:.25+4*(1-t),z:-Math.sin(a)*1.7};}
 if(type==='jumpslide')return {x:0,y:.2+3.4*(1-t)**2+.65*t**8,z:3-7*t};
 return {x:Math.sin(t*Math.PI*2)*.7,y:.2+3*(1-t)**1.6+.22*Math.sin(t*Math.PI*3)*(1-t),z:3-8*t};
}
export function slideEntry(type){const p=slidePoint(type,0);return {x:p.x,y:0,z:p.z+2.6};}
export function localToWorld(o,p){const c=Math.cos(o.rot),s=Math.sin(o.rot);return {x:o.x+p.x*c-p.z*s,y:p.y,z:o.z+p.x*s+p.z*c};}
export function slideBounds(type,rot=0){const origin={x:0,z:0,rot},pts=[slideEntry(type),...Array.from({length:49},(_,i)=>slidePoint(type,i/48))].map(p=>localToWorld(origin,p));return {minX:Math.min(...pts.map(p=>p.x))-.85,maxX:Math.max(...pts.map(p=>p.x))+.85,minZ:Math.min(...pts.map(p=>p.z))-.85,maxZ:Math.max(...pts.map(p=>p.z))+.85};}
export function trySlide(w,a,o,emit){if(!SLIDE_TYPES[o.type]||a.ride||a.cool||a.y>.25)return;const e=localToWorld(o,slideEntry(o.type));if(Math.hypot(a.x-e.x,a.z-e.z)<1){a.ride={id:o.id,time:0};a.bubble=0;a.loaded=null;a.vx=a.vy=a.vz=0;emit(w,'board',a,'Up the steps!');}}
export function updateSlide(w,a,dt,emit,touch,earn){
 if(!a.ride)return false;const o=w.objects.find(o=>o.id===a.ride.id);if(!o){a.ride=null;return false;}
 a.ride.time+=dt;const climb=1,rideTime=o.type==='spiralslide'?3.6:2.6,t=Math.max(0,(a.ride.time-climb)/rideTime);let p;
 if(a.ride.time<climb){const e=slideEntry(o.type),top=slidePoint(o.type,0),k=a.ride.time/climb;p={x:e.x+(top.x-e.x)*k,y:top.y*k,z:e.z+(top.z-e.z)*k};}
 else{p=slidePoint(o.type,t);a.say='Wheee!';a.react=.15;}
 const at=localToWorld(o,p);Object.assign(a,at);a.vx=a.vy=a.vz=0;const next=localToWorld(o,slidePoint(o.type,Math.min(1,t+.015))),prev=localToWorld(o,slidePoint(o.type,Math.max(0,t-.015)));a.heading=Math.atan2(next.x-prev.x,next.z-prev.z);
 if(t>=1){const dx=at.x-prev.x,dz=at.z-prev.z,d=Math.hypot(dx,dz)||1,speed=o.type==='jumpslide'?9:5;a.vx=dx/d*speed;a.vz=dz/d*speed;a.vy=o.type==='jumpslide'?7:1.2;a.ride=null;a.cool=1.7;touch(w,a,o.type,earn);emit(w,'slide',a,o.type==='jumpslide'?'Flying finish!':'One more ride!');}
 return true;
}
export function buildSlide(g,o){if(!SLIDE_TYPES[o.type])return;const color=SLIDE_TYPES[o.type].color,n=48,pts=Array.from({length:n+1},(_,i)=>slidePoint(o.type,i/n)),edges=[];
 for(let i=0;i<=n;i++){const p=pts[i],a=pts[Math.max(0,i-1)],b=pts[Math.min(n,i+1)],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;edges.push([{x:p.x-dz/len*.6,y:p.y,z:p.z+dx/len*.6},{x:p.x+dz/len*.6,y:p.y,z:p.z-dx/len*.6}]);}
 const positions=[];const put=p=>positions.push(p.x,p.y,p.z);for(let i=0;i<n;i++){const [a,b]=edges[i],[c,d]=edges[i+1];[a,c,b,b,c,d].forEach(put);for(let side=0;side<2;side++){const q=edges[i][side],r=edges[i+1][side];rod(g,[q.x,q.y+.18,q.z],[r.x,r.y+.18,r.z],.065,'#fff0bd');}if(i%12===0){const p=pts[i];rod(g,[p.x,0,p.z],[p.x,p.y-.05,p.z],.1,'#8f9d8e');}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();mesh(g,geo,material(color,{side:THREE.DoubleSide,roughness:.35}));
 const top=pts[0],entry=slideEntry(o.type);for(let i=0;i<8;i++){const h=top.y*(i+1)/8;box(g,[1.15,h,.38],i%2?'#edc477':'#d4a561',[top.x,h/2,entry.z-(i+.5)*2.6/8],.04);}
 for(const side of [-1,1])rod(g,[top.x+side*.64,.85,entry.z],[top.x+side*.64,top.y+.8,top.z],.05,'#efc983');
 ring(g,.64,.045,'#f7c16d',[entry.x,.06,entry.z+.1],Math.PI/2);
}
