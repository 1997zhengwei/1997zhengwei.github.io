import {THREE,mesh,material} from './world.mjs?v=elastic-2';
// The bodies use the spring in physics.mjs. This light Verlet chain visualizes
// its slack, inertia and travelling recoil rather than drawing a rigid curve.
export function elasticRope(scene){
 const count=22,points=[],previous=[];let initialized=false,lastPulse=0;
 const core=mesh(scene,new THREE.BufferGeometry(),material('#7061a0',{roughness:.42}));core.castShadow=false;
 const trim=mesh(scene,new THREE.BufferGeometry(),material('#c5b5d9',{roughness:.38}));trim.castShadow=false;
 function reset(){initialized=false;lastPulse=0;}
 function update(from,to,length,pulse,dt){
  if(!initialized){points.length=previous.length=0;for(let i=0;i<=count;i++){const t=i/count,p=from.clone().lerp(to,t);p.y-=Math.sin(t*Math.PI)*.5;points.push(p);previous.push(p.clone());}initialized=true;}
  const distance=from.distanceTo(to),taut=Math.max(0,Math.min(1,(distance/length-.88)/.22));
  const segment=Math.max(distance,length*1.055)/count;
  const steps=dt?Math.max(1,Math.ceil(dt/(1/120))):0,h=steps?dt/steps:0;
  for(let n=0;n<steps;n++){
   for(let i=1;i<count;i++){const p=points[i],old=p.clone(),v=p.clone().sub(previous[i]).multiplyScalar(Math.pow(.97,h*60));p.add(v);p.y-=2.8*h*h;
    if(pulse>lastPulse+.1)p.y+=Math.sin(i/count*Math.PI*3)*.035*pulse;previous[i].copy(old);}
   for(let k=0;k<10;k++){
    points[0].copy(from);points[count].copy(to);
    for(let i=0;i<count;i++){const a=points[i],b=points[i+1],v=b.clone().sub(a),d=Math.max(.0001,v.length()),error=(d-segment)/d;v.multiplyScalar(error);
     if(i===0)b.sub(v);else if(i===count-1)a.add(v);else{a.addScaledVector(v,.5);b.addScaledVector(v,-.5);}}
   }
  }
  points[0].copy(from);points[count].copy(to);lastPulse=pulse;
  const path=new THREE.CatmullRomCurve3(points),geometry=new THREE.TubeGeometry(path,50,.043-taut*.008,6,false);core.geometry.dispose();core.geometry=geometry;
  const highlight=new THREE.CatmullRomCurve3(points.map(p=>p.clone().add(new THREE.Vector3(0,.012,.029))));trim.geometry.dispose();trim.geometry=new THREE.TubeGeometry(highlight,50,.009,4,false);
  core.material.color.set(taut>.7?'#8a699f':'#7061a0');
 }
 return {update,reset};
}
