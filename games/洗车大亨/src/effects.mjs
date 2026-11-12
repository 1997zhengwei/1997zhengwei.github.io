import * as T from '../vendor/three.module.js';
const up=new T.Vector3(0,1,0),dummy=new T.Object3D();
export class Effects{
constructor(scene){
  this.items=[];this.max=640;this.positions=new Float32Array(this.max*3);this.colors=new Float32Array(this.max*3);this.geom=new T.BufferGeometry();this.geom.setAttribute('position',new T.BufferAttribute(this.positions,3).setUsage(T.DynamicDrawUsage));this.geom.setAttribute('color',new T.BufferAttribute(this.colors,3).setUsage(T.DynamicDrawUsage));
  const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d'),gr=ctx.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.6,'rgba(255,255,255,.8)');gr.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,32,32);
  this.points=new T.Points(this.geom,new T.PointsMaterial({size:.16,vertexColors:true,map:new T.CanvasTexture(c),transparent:true,depthWrite:false,sizeAttenuation:true}));this.points.frustumCulled=false;scene.add(this.points);this.sprayTimer=0;
  this.beam=new T.Mesh(new T.CylinderGeometry(.045,.12,1,10,1,true),new T.MeshBasicMaterial({color:'#c6f8ff',transparent:true,opacity:.48,depthWrite:false,side:T.DoubleSide}));scene.add(this.beam);this.beam.visible=false;
  const ringGeometry=new T.TorusGeometry(1,.035,6,56);this.ripples=Array.from({length:10},()=>{const mesh=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:'#ffdc87',transparent:true,opacity:0,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.visible=false;scene.add(mesh);return {mesh,life:0,duration:1};});
  this.papers=[];this.confetti=new T.InstancedMesh(new T.PlaneGeometry(.12,.2),new T.MeshBasicMaterial({side:T.DoubleSide,transparent:true,opacity:.9,depthWrite:false}),90);this.confetti.instanceMatrix.setUsage(T.DynamicDrawUsage);this.confetti.frustumCulled=false;this.confetti.count=0;scene.add(this.confetti);
}
emit(pos,color,count=3,power=1){for(let i=0;i<count;i++){if(this.items.length>=this.max)this.items.shift();this.items.push({x:pos.x,y:pos.y,z:pos.z,vx:(Math.random()-.5)*power*2,vy:(Math.random()*2+.5)*power,vz:(Math.random()-.5)*power*2,life:.4+Math.random()*.5,color:new T.Color(color)});}}
burst(pos,kind='finish',color='#ffdb84'){
  const premium=kind==='vip'||kind==='arrival',count=premium?70:kind==='phase'?18:35;
  this.emit(pos,color,count,premium?1.7:1.05);this.emit(pos,'#e8ffff',Math.floor(count/3),1.4);
  for(let i=0;i<(premium?2:1);i++){const ripple=this.ripples.find(r=>r.life<=0)||this.ripples[0];ripple.life=ripple.duration=premium?1.6+i*.25:1;ripple.mesh.position.set(pos.x,.32+i*.008,pos.z);ripple.mesh.material.color.set(i?'#a9eeef':color);ripple.mesh.visible=true;}
  if(premium)for(let i=0;i<(kind==='vip'?55:22);i++){if(this.papers.length>=90)this.papers.shift();this.papers.push({x:pos.x,y:pos.y+.7,z:pos.z,vx:(Math.random()-.5)*4,vy:2.5+Math.random()*3,vz:(Math.random()-.5)*4,life:1.6+Math.random(),angle:Math.random()*6,spin:(Math.random()-.5)*12,color:new T.Color(['#ffd36b','#9beedc','#e1ceff','#fff4ce'][i%4])});}
}
spray(from,to,phase,dt,color){this.beam.visible=true;const dir=new T.Vector3().subVectors(to,from),len=dir.length();this.beam.position.copy(from).add(to).multiplyScalar(.5);this.beam.quaternion.setFromUnitVectors(up,dir.normalize());const size=phase===0?1.7:phase===3?1.3:1;this.beam.scale.set(size,len,size);this.beam.material.color.set(color||(phase===0?'#f3def1':phase===1?'#9be5f3':'#ffe49a'));this.sprayTimer+=dt;while(this.sprayTimer>.025){this.sprayTimer-=.025;this.emit(to,color||(phase===0?'#f8ebfa':phase===1?'#d1faff':'#ffe090'),phase===1?7:4,.8);}}
update(dt){
  let n=0;this.items=this.items.filter(p=>{p.life-=dt;if(p.life<=0)return false;p.vy-=dt*7;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.3){p.y=.3;p.vy=Math.abs(p.vy)*.2;}this.positions.set([p.x,p.y,p.z],n*3);this.colors.set([p.color.r,p.color.g,p.color.b],n*3);n++;return true;});this.geom.setDrawRange(0,n);this.geom.attributes.position.needsUpdate=this.geom.attributes.color.needsUpdate=true;
  for(const r of this.ripples){r.life=Math.max(0,r.life-dt);r.mesh.visible=r.life>0;if(r.life){const p=1-r.life/r.duration;r.mesh.scale.setScalar(.7+p*3.3);r.mesh.material.opacity=(1-p)*.55;}}
  n=0;this.papers=this.papers.filter(p=>{p.life-=dt;if(p.life<=0)return false;p.vy-=dt*4;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.angle+=dt*p.spin;dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.angle,p.angle*.7,p.angle*.4);dummy.scale.setScalar(Math.min(1,p.life*2));dummy.updateMatrix();this.confetti.setMatrixAt(n,dummy.matrix);this.confetti.setColorAt(n,p.color);n++;return true;});this.confetti.count=n;this.confetti.instanceMatrix.needsUpdate=true;if(this.confetti.instanceColor)this.confetti.instanceColor.needsUpdate=true;
}
}
