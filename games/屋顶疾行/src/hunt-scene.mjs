import * as T from '../vendor/three.module.js';
import {Runner} from './human-runner.mjs';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {labelTexture} from './materials.mjs';

export class HuntVisuals{
 constructor(scene){
  this.scene=scene;this.group=new T.Group();scene.scene.add(this.group);
  this.actors=['#8c3340','#414b66','#3b665e'].map((color,i)=>{const actor=new Runner(scene.textures);actor.applyLook('noir');actor.clothes.Cloth_hoodie.color.set(color);actor.pack.visible=false;this.group.add(actor.root);
   const label=new T.Sprite(new T.SpriteMaterial({map:labelTexture('追逐者 '+(i+1),{w:256,h:64,font:'700 34px Arial',color:'#ffe8da',background:'#752d3fd0'}),transparent:true,depthWrite:false}));label.scale.set(.82,.20,1);this.group.add(label);return {actor,label};});
  this.chest=new T.Group();this.group.add(this.chest);const gold=new T.MeshStandardMaterial({color:'#ffc857',metalness:.72,roughness:.26}),wood=new T.MeshStandardMaterial({color:'#684229',map:scene.textures.wood,roughness:.72});
  const add=(w,h,d,m,x,y,z,parent=this.chest)=>{const mesh=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,.04),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  add(1.25,.6,.83,wood,0,.34,0);for(const x of[-.47,.47])add(.11,.64,.88,gold,x,.36,0);add(1.3,.09,.88,gold,0,.09,0);
  this.lid=new T.Group();this.lid.position.set(0,.64,.42);this.chest.add(this.lid);add(1.3,.25,.88,wood,0,.09,-.42,this.lid);for(const x of[-.47,.47])add(.12,.29,.92,gold,x,.1,-.42,this.lid);add(.18,.23,.05,gold,0,.62,-.46);
  this.gem=new T.Mesh(new T.OctahedronGeometry(.21,0),new T.MeshStandardMaterial({color:'#fff0a3',emissive:'#ffb72c',emissiveIntensity:1.2,metalness:.5,roughness:.2}));this.gem.position.y=1.22;this.chest.add(this.gem);
  const ring=new T.Mesh(new T.RingGeometry(.88,1.02,48),new T.MeshBasicMaterial({color:'#ffdf83',side:T.DoubleSide,transparent:true,opacity:.65,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.06;this.chest.add(ring);
  this.beam=new T.Mesh(new T.CylinderGeometry(.17,.36,14,16,1,true),new T.MeshBasicMaterial({color:'#ffe398',transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false}));this.beam.position.y=7.6;this.chest.add(this.beam);
  const light=new T.PointLight('#ffd36c',3,5,2);light.position.y=1.2;this.chest.add(light);this.group.visible=false;
 }
 update(w,view,time){const h=w.hunt,play=['race','pause','map'].includes(view);this.group.visible=!!h&&play;if(!h)return;
  this.chest.position.set(h.treasure.x,h.treasure.y+.03,h.treasure.z);this.lid.rotation.x=h.status==='won'?-1.0:0;this.gem.position.y=1.25+Math.sin(time*2.6)*.08;this.gem.rotation.y=time*1.2;this.beam.material.opacity=.12+Math.sin(time*2)*.025;
  for(let i=0;i<this.actors.length;i++){const {actor,label}=this.actors[i],bot=h.pursuers[i],p=bot.state.player;actor.setWorld({...p,mode:w.elapsed<h.headStart||w.elapsed<bot.stunnedUntil?'idle':p.mode,speed:w.elapsed<h.headStart?0:p.speed},w.elapsed);label.position.set(p.x,p.y+2.18,p.z);const dist=Math.hypot(w.player.x-p.x,w.player.z-p.z);label.visible=dist>3.5&&dist<36&&view!=='map';actor.root.visible=view!=='map';}
 }
}
