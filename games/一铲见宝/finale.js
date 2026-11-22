import {T,paint,block,cyl,put,facetedGem} from './models.js';
import {gemSpec} from './workshop.js';

// The ending room: a velvet wall with sixteen gold plinths, one per quarry,
// each showing the gems dug out of that wall, under a slow rain of coins.
export function treasury(stage,levels,saved){
  // Everything is laid out around (0.37, 7.4) and then shrunk to fit a phone screen.
  const root=new T.Group();stage.add(root);
  root.scale.setScalar(.76);root.position.set(-.08-.37*.76,7.55-7.4*.76,0);
  const velvet=paint('#3b2f66',.9),deep=paint('#2a2150',.9),gold=paint('#e3b84c',.28,.62),
    goldDark=paint('#a87a2a',.4,.5),socket=paint('#5a4f86',.8),
    shine=new T.MeshBasicMaterial({color:'#fff3a6',toneMapped:false});
  block(root,13.6,14.2,.5,velvet,.37,7.4,-1.4,.12);
  for(let i=0;i<9;i++)block(root,.08,13.6,.04,deep,.37-6.3+i*1.575,7.4,-1.12,.01);
  block(root,14.4,.5,.7,gold,.37,14.6,-1.1,.12);block(root,14.4,.5,.7,gold,.37,.2,-1.1,.12);
  for(const x of [-6.8,7.54])block(root,.5,14.8,.7,gold,x,7.4,-1.1,.12);
  // Crest on top of the frame.
  const crest=new T.Group();root.add(crest);crest.position.set(.37,15.35,-.9);
  cyl(crest,.7,.7,.25,gold,0,0,0,6).rotation.x=Math.PI/2;
  cyl(crest,.45,.45,.3,goldDark,0,0,.05,6).rotation.x=Math.PI/2;
  const shows=[],vacancies=[];let found=0,total=0,clearedCount=0;
  const pitch=3.05;
  levels.forEach((level,i)=>{
    const col=i%4,row=Math.floor(i/4),x=.37+(col-1.5)*pitch,y=12.2-row*pitch;
    block(root,2.2,.28,1.1,gold,x,y-1.02,-.5,.06);
    block(root,1.7,.2,.9,goldDark,x,y-1.24,-.55,.05);
    const count=level.gems?.length||1,cleared=!!saved[i]?.cleared;
    total+=count;if(cleared)clearedCount++;
    const missing=[];
    for(let k=0;k<count;k++){
      const gx=x+(count>1?(k-.5)*.86:0);
      if(!cleared&&!saved[i]?.collected?.includes(k)){
        missing.push(gx-x);
        const hole=cyl(root,.34,.34,.12,socket,gx,y-.2,-.75,20);hole.rotation.x=Math.PI/2;continue;
      }
      const spec=gemSpec(level,i,k);
      const material=new T.MeshPhysicalMaterial({color:'#ffffff',vertexColors:true,metalness:.3,roughness:.12,clearcoat:1,
        clearcoatRoughness:.06,emissive:spec.crystal,emissiveIntensity:.22,flatShading:true,side:T.DoubleSide});
      const gem=put(root,facetedGem(spec.cut,spec.colors),material,gx,y-.15,.1);
      gem.scale.setScalar(count>1?.4:.55);gem.rotation.x=.2;gem.userData.phase=i*.7+k;
      shows.push(gem);found++;
    }
    if(missing.length)vacancies.push({index:i,offset:missing.length===1?missing[0]/pitch:0});
    for(let s=0;s<3;s++){
      const lit=(saved[i]?.stars||0)>s;
      const star=cyl(root,.15,.15,.07,lit?shine:socket,x-.4+s*.4,y-1.02,.1,5);star.rotation.x=Math.PI/2;star.rotation.y=Math.PI/2;
    }
  });
  // Coin rain.
  const coins=new T.InstancedMesh(new T.CylinderGeometry(.17,.17,.045,18),paint('#ffcf3e',.25,.7,{emissive:'#7a5208',emissiveIntensity:.25}),70);
  coins.frustumCulled=false;stage.add(coins);
  const drops=Array.from({length:70},()=>({x:(Math.random()-.5)*13,y:16+Math.random()*14,z:.8+Math.random()*1.6,
    v:1.6+Math.random()*1.6,spin:new T.Vector3(Math.random(),Math.random(),Math.random()).normalize(),a:Math.random()*6}));
  const stamp=new T.Object3D();
  let time=0;
  function animate(dt){
    time+=dt;
    for(const gem of shows){gem.rotation.y+=dt*.9;gem.position.y+=Math.sin(time*2+gem.userData.phase)*.0015;}
    crest.rotation.z=Math.sin(time*.8)*.08;
    drops.forEach((d,i)=>{
      d.y-=d.v*dt;d.a+=dt*5;if(d.y<-2){d.y=16+Math.random()*4;d.x=(Math.random()-.5)*13;}
      stamp.position.set(d.x+.37,d.y,d.z);stamp.quaternion.setFromAxisAngle(d.spin,d.a);stamp.updateMatrix();coins.setMatrixAt(i,stamp.matrix);
    });
    coins.instanceMatrix.needsUpdate=true;
  }
  // Match the touch grid to the physical shelves, including their gold bases.
  const left=.37-2*pitch,top=12.2+pitch/2-.40;
  const topLeft=root.localToWorld(new T.Vector3(left,top,0));
  const bottomRight=root.localToWorld(new T.Vector3(left+4*pitch,top-4*pitch,0));
  return {animate,found,total,clearedCount,vacancies,topLeft,bottomRight};
}
