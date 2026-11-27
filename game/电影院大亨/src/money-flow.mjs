import {T} from './geometry.mjs';

// Transaction-driven banknotes: visual feedback only, never an income source.
export class MoneyFlow{
 constructor(scene){
  this.notes=[];this.dummy=new T.Object3D();
  const c=document.createElement('canvas');c.width=128;c.height=80;const q=c.getContext('2d');q.fillStyle='#80d32c';q.fillRect(0,0,128,80);q.strokeStyle='#267c25';q.lineWidth=5;q.strokeRect(7,7,114,66);q.fillStyle='#caf77d';q.beginPath();q.ellipse(64,40,22,28,0,0,Math.PI*2);q.fill();q.fillStyle='#2a8a2b';q.font='900 42px Nunito,sans-serif';q.textAlign='center';q.textBaseline='middle';q.fillText('$',64,42);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const edge=new T.MeshStandardMaterial({color:'#71bd2f',roughness:1}),face=new T.MeshBasicMaterial({map,toneMapped:false});
  this.mesh=new T.InstancedMesh(new T.BoxGeometry(.65,.045,.42),[edge,edge,face,face,edge,edge],96);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);
 }
 emit(e){if(e.type!=='cash')return;for(let j=0;j<3;j++){if(this.notes.length>=96)this.notes.shift();const x=e.x+(j-1)*.25,z=e.z+1.15,startY=e.kind==='show'?2.8:1.75;this.notes.push({x,z,startY,targetX:e.x+(j-1)*.08,targetZ:e.z-.75,age:-j*.055,duration:.72+j*.06,spin:j*1.2});}}
 update(dt){this.notes=this.notes.filter(n=>(n.age+=dt)<n.duration);let count=0;for(const n of this.notes){if(n.age<0)continue;const t=n.age/n.duration,ease=1-(1-t)*(1-t);this.dummy.position.set(T.MathUtils.lerp(n.x,n.targetX,ease),n.startY+(2.05-n.startY)*t+Math.sin(t*Math.PI)*1.7,T.MathUtils.lerp(n.z,n.targetZ,ease));this.dummy.rotation.set(Math.sin(t*Math.PI)*.55,n.spin+t*3.2,.15*Math.sin(t*6));this.dummy.scale.setScalar(1-t*.4);this.dummy.updateMatrix();this.mesh.setMatrixAt(count++,this.dummy.matrix);}this.mesh.count=count;this.mesh.instanceMatrix.needsUpdate=true;}
}
