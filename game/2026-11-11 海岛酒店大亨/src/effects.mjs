import * as T from '../vendor/three.module.js';
import {VILLA_SPOTS} from './progression.mjs';
import {SPOTS,roomSpot} from './config.mjs';

function zoneTexture(){
 const c=document.createElement('canvas');c.width=256;c.height=128;const p=c.getContext('2d');
 p.lineCap='round';p.lineJoin='round';p.lineWidth=7;p.strokeStyle='#ffffff';
 for(const [x,y,sx,sy] of [[12,12,1,1],[244,12,-1,1],[12,116,1,-1],[244,116,-1,-1]]){
  p.beginPath();p.moveTo(x+sx*32,y);p.lineTo(x,y);p.lineTo(x,y+sy*26);p.stroke();
 }
 p.fillStyle='#ffffff';p.beginPath();p.moveTo(111,50);p.lineTo(128,62);p.lineTo(145,50);p.lineTo(145,65);p.lineTo(128,79);p.lineTo(111,65);p.closePath();p.fill();
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
}

export class HotelEffects{
 constructor(scene){
  this.root=new T.Group();scene.add(this.root);this.zones=new Map();this.zoneMap=zoneTexture();this.particles=[];
  this.bubbles=new T.InstancedMesh(new T.SphereGeometry(1,8,6),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.8,depthWrite:false}),96);
  this.bubbles.instanceMatrix.setUsage(T.DynamicDrawUsage);this.bubbles.frustumCulled=false;this.root.add(this.bubbles);
  this.coins=new T.InstancedMesh(new T.CylinderGeometry(.12,.12,.035,12),new T.MeshStandardMaterial({color:'#ffdb64',roughness:.4,metalness:.15}),32);
  this.coins.instanceMatrix.setUsage(T.DynamicDrawUsage);this.coins.frustumCulled=false;this.root.add(this.coins);
  this.dummy=new T.Object3D();this.bubbles.count=this.coins.count=0;this.foamClock=0;
 }
 zone(id,x,y,z,w=2.3,d=1.25){
  let zone=this.zones.get(id);
  if(!zone){zone=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:this.zoneMap,transparent:true,depthWrite:false,color:'#1ba9c0',opacity:.84}));zone.rotation.x=-Math.PI/2;this.root.add(zone);this.zones.set(id,zone);}
  zone.position.set(x,y,z);return zone;
 }
 emit(type,x,z,now){
  const count=type==='money'?8:type==='build'?16:12;
  for(let i=0;i<count;i++){
   const a=i*2.399,spread=type==='build'?2.4:1;
   this.particles.push({type,x:x+Math.cos(a)*.3,z:z+Math.sin(a)*.3,y:type==='money'?.8:.6,age:0,life:type==='money'?.85:1.1,vx:Math.cos(a)*spread,vz:Math.sin(a)*spread,seed:i});
  }
  if(this.particles.length>128)this.particles.splice(0,this.particles.length-128);
 }
 event(e){if(['money','clean','build'].includes(e.type))this.emit(e.type,e.x,e.z,e.time);}
 update(s,dt){
  const p=s.player;
  const jobs=[['front',SPOTS.reception,.31,2.5,1.35],['linen',SPOTS.supplies,.32,1.8,1.65],...s.rooms.filter(r=>r.built&&r.status==='dirty').map(r=>['room'+r.id,roomSpot(r),.46,2.5,1.15])];
  if(s.estate.villa)jobs.push(['villaLinen',VILLA_SPOTS.supplies,.32,1.8,1.65]);
  if(s.owned.pool)jobs.push(['pool',SPOTS.pool,.18,1.8,1.55]);if(s.owned.cafe)jobs.push(['cafe',SPOTS.cafe,.18,2.2,1.4]);
  for(const zone of this.zones.values())zone.visible=false;
  for(const [id,spot,y,w,d] of jobs){const zone=this.zone(id,spot.x,y,spot.z,w,d),dist=Math.hypot(p.x-spot.x,p.z-spot.z);zone.visible=dist<7;zone.material.color.set(dist<1.3?'#35b77c':'#28a6c0');zone.material.opacity=dist<1.3?.85+.1*Math.sin(s.time*4):.55;}
  this.foamClock+=dt;
  if(this.foamClock>.07){
   this.foamClock=0;
   for(const a of [p,...s.staff]){
    if(a.action==='clean')this.particles.push({type:'foam',x:a.x+.5+Math.sin(s.time*8)*.3,z:a.z-.55,y:.49,age:0,life:.65,vx:Math.sin(s.time*11)*.3,vz:Math.cos(s.time*13)*.3,seed:Math.floor(s.time*100)});
    if(a.action==='coffee')this.particles.push({type:'steam',x:a.x+.4,z:a.z+.6,y:1.85,age:0,life:.75,vx:.03,vz:.015,seed:Math.floor(s.time*100)});
   }
  }
  let bubbleIndex=0,coinIndex=0;
  for(const o of this.particles){
   o.age+=dt;const t=o.age/o.life;if(t>=1)continue;
   let x=o.x+o.vx*o.age,z=o.z+o.vz*o.age,y=o.y;
   if(o.type==='money'){
    const ease=t*t;x=x*(1-ease)+p.x*ease;z=z*(1-ease)+p.z*ease;y=.8+Math.sin(t*Math.PI)*1.8+t*.4;
    if(coinIndex>=32)continue;this.dummy.position.set(x,y,z);this.dummy.scale.setScalar(1);this.dummy.rotation.set(t*6,o.seed+t*8,.4);this.dummy.updateMatrix();this.coins.setMatrixAt(coinIndex++,this.dummy.matrix);
   }else{
    if(bubbleIndex>=96)continue;
    const scale=o.type==='steam'?.055*Math.sin(t*Math.PI):o.type==='foam'?.08*(1-t):.07*(1-t)*(o.type==='build'?1.5:1);
    y+=o.type==='steam'?t*.5:o.type==='foam'?t*.16:Math.sin(t*Math.PI)*1.5;
    this.dummy.position.set(x,y,z);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(scale,scale*(o.type==='foam'?.6:1),scale);this.dummy.updateMatrix();this.bubbles.setMatrixAt(bubbleIndex,this.dummy.matrix);this.bubbles.setColorAt(bubbleIndex,new T.Color(o.type==='build'?'#ffe59a':o.type==='clean'?'#b2fff1':'#ffffff'));bubbleIndex++;
   }
  }
  this.particles=this.particles.filter(o=>o.age<o.life);this.bubbles.count=bubbleIndex;this.coins.count=coinIndex;this.bubbles.instanceMatrix.needsUpdate=true;this.coins.instanceMatrix.needsUpdate=true;if(this.bubbles.instanceColor)this.bubbles.instanceColor.needsUpdate=true;
 }
}
