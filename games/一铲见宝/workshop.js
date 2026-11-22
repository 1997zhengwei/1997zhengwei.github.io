import {T,paint,put,block,cyl,circle,facetedGem,rng} from './models.js';
import {binX,binZ} from './masonry.js';
import {rayTexture,glowTexture} from './fx.js';

function flatStrip(root,color,points,z){
  const shape=new T.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
  return put(root,new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color,side:T.DoubleSide}),0,0,z,false);
}
function bankTexture(level,index){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const c=canvas.getContext('2d'), random=rng(6041+index), [, ,sand,layer]=level.ground;
  c.fillStyle=sand;c.fillRect(0,0,512,256);
  function stratum(top,h,color){
    c.beginPath();for(let x=0;x<=512;x+=4){
      const y=top+Math.sin(x*Math.PI/128+.4)*3+Math.sin(x*Math.PI/64)*1.5;x?c.lineTo(x,y):c.moveTo(x,y);
    }
    for(let x=512;x>=0;x-=4)c.lineTo(x,top+h+Math.sin(x*Math.PI/128+.4)*3+Math.sin(x*Math.PI/64)*1.5);
    c.closePath();c.fillStyle=color;c.fill();
  }
  stratum(8,5,layer);c.globalAlpha=.45;stratum(67,10,layer);stratum(119,3,layer);stratum(173,15,layer);c.globalAlpha=1;
  for(let i=0;i<3700;i++){
    const x=random()*512,y=random()*256,w=.4+random()**3*3.4;c.globalAlpha=.12+random()*.20;
    c.fillStyle=i%3?sand:'#9e7d59';if(i%4===0)c.fillStyle='#fffbe0';
    c.beginPath();c.ellipse(x,y,w,w*.45,random()*.5,0,Math.PI*2);c.fill();
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(2.7,2.55);
  return texture;
}
// Flat, layered scenery behind the quarry. Each site gets its own skyline so the
// eight walls read as eight trips, not one yard with a new paint job.
const themes={
  desert:{far:'#f1cf9f',near:'#e6ad72',cloud:'#fff4e2'},
  jade:{far:'#b5e0c9',near:'#87c5af',cloud:'#e5f7ee'},
  castle:{far:'#c6d7ee',near:'#97bcc9',cloud:'#eef5ff'},
  sea:{far:'#bfe4d0',near:'#8fcfb4',cloud:'#f1fbff'},
  farm:{far:'#f1d7a4',near:'#b9cf7f',cloud:'#fff0da'},
  night:{far:'#b7b6dc',near:'#8f98c4',cloud:'#e6e4fb'},
  mountain:{far:'#bcdccf',near:'#8fc0ad',cloud:'#f0faf4'},
  snow:{far:'#dbeaf5',near:'#b9d3e4',cloud:'#ffffff'},
  volcano:{far:'#d9a98e',near:'#b98a6c',cloud:'#f6e2d2'},
  city:{far:'#c7cbe6',near:'#a7b9c9',cloud:'#f4f2ff'},
  bamboo:{far:'#b8dcb4',near:'#8cc18a',cloud:'#f0fbea'},
  vault:{far:'#9a96cf',near:'#7d82b4',cloud:'#e2dcf8'},
};
function shapeMesh(root,color,points,z,opacity=1){
  const shape=new T.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
  const mat=new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:opacity<1,opacity,depthWrite:opacity>=1});
  return put(root,new T.ShapeGeometry(shape),mat,0,0,z,false);
}
function disc(root,color,x,y,r,z,opacity=1){
  const mat=new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1});
  return put(root,new T.CircleGeometry(r,48),mat,x,y,z,false);
}
function halo(root,color,x,y,size,z,opacity){
  const mat=new T.SpriteMaterial({map:glowTexture([[0,'rgba(255,255,255,1)'],[.35,'rgba(255,255,255,.45)'],[1,'rgba(255,255,255,0)']]),
    color,transparent:true,opacity,depthWrite:false});
  mat.userData.disposeMap=true;
  const s=new T.Sprite(mat);s.position.set(x,y,z);s.scale.setScalar(size);root.add(s);return s;
}
function ridge(root,color,z,base,amp,random,freq=.68,phase=0){
  const points=[[-34,-1]];
  for(let x=-34;x<=34;x+=1.2)points.push([x,base+amp*Math.sin(x*freq+phase)+amp*.45*Math.sin(x*freq*2.3+phase*2)+random()*amp*.5]);
  points.push([34,-1]);return shapeMesh(root,color,points,z);
}
function backdrop(root,level,random){
  const kind=level.scenery||'jade',theme=themes[kind],anim=[];
  let time=0;
  // Sky light: a sun for daytime sites, a sunset disc on the farm, a crescent at night.
  if(kind==='night'||kind==='vault'){
    disc(root,'#fff8dc',-3.4,13.6,1.05,-14);
    disc(root,new T.Color(level.sky).lerp(new T.Color('#9aa6dc'),.4),-2.95,13.95,.95,-13.9);
    halo(root,'#fff4c8',-3.4,13.6,5.2,-14.2,.55);
    const count=46,pos=new Float32Array(count*3),phase=[];
    for(let i=0;i<count;i++){pos.set([-12+random()*26,7+random()*11,-15],i*3);phase.push(random()*6);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
    const dots=new T.Points(geo,new T.PointsMaterial({color:'#fffbe6',size:.11,transparent:true,opacity:.9,depthWrite:false}));
    root.add(dots);
    anim.push(()=>{dots.material.opacity=.65+.3*Math.sin(time*2.1);});
    if(kind==='vault')for(const [x,phase] of [[-6,0],[9,2]]){
      const beam=shapeMesh(root,'#fff2b0',[[-.25,0],[.25,0],[1.6,13],[-1.6,13]],0,.18);
      beam.position.set(x,0,-12.5);beam.material.blending=T.AdditiveBlending;
      anim.push(()=>{beam.rotation.z=Math.sin(time*.45+phase)*.5;});
    }
  }else if(kind==='farm'){
    halo(root,'#ffb36b',5.2,5.2,9,-14.2,.7);disc(root,'#ffd290',5.2,5.2,1.7,-14);disc(root,'#fff0c0',5.2,5.2,1.25,-13.95);
  }else{
    halo(root,'#fff6d2',-6.4,12.9,6,-14.2,.75);disc(root,'#fffbe6',-6.4,12.9,.95,-14);
  }
  // Two rolling bands always; theme silhouettes sit between them.
  ridge(root,theme.far,-8,kind==='desert'?1.4:1.15,kind==='desert'?.7:.42,random,kind==='desert'?.31:.68,.4);
  if(kind==='desert'){
    for(const [x,w,h] of [[-9,3.2,2.7],[7.5,4.2,2.2],[13,2.4,3.1]])
      shapeMesh(root,'#e9b47d',[[x-w/2,0],[x-w/2+.5,h],[x+w/2-.6,h],[x+w/2,0]],-7.5);
    for(const [x,s] of [[-6.3,1],[9.6,.8],[3.6,.7]]){
      const c='#5b9b70';
      shapeMesh(root,c,[[x-.12*s,0],[x-.12*s,1.5*s],[x+.12*s,1.5*s],[x+.12*s,0]],-5.2);
      shapeMesh(root,c,[[x-.12*s,.7*s],[x-.45*s,.7*s],[x-.45*s,1.15*s],[x-.3*s,1.15*s],[x-.3*s,.85*s],[x-.12*s,.85*s]],-5.2);
      shapeMesh(root,c,[[x+.12*s,.55*s],[x+.42*s,.55*s],[x+.42*s,1.0*s],[x+.28*s,1.0*s],[x+.28*s,.7*s],[x+.12*s,.7*s]],-5.2);
    }
  }else if(kind==='jade'){
    for(const [x,s] of [[-7.4,1],[-5.9,.8],[8.4,1.1],[10.1,.75],[4.2,.7]]){
      shapeMesh(root,'#6b8d6e',[[x-.07*s,0],[x-.07*s,1.1*s],[x+.07*s,1.1*s],[x+.07*s,0]],-6);
      disc(root,'#4fa77f',x,1.35*s,.55*s,-6.02);disc(root,'#73c294',x-.12*s,1.48*s,.36*s,-6.01);
    }
    const p=[[11.5,0],[11.5,2.2],[11.1,2.2],[12,2.9],[12.9,2.2],[12.5,2.2],[12.5,0]];
    shapeMesh(root,'#79aa98',p,-7.6);shapeMesh(root,'#79aa98',[[10.9,1.4],[12,1.95],[13.1,1.4]],-7.6);
  }else if(kind==='castle'){
    const c='#a9bfdc';
    for(const [x,w,h] of [[-9.5,1.1,3.6],[-7.9,1.6,2.4],[-6.6,.9,4.3],[9.2,1.2,3.9],[10.8,2,2.6],[12.6,1,3.3]]){
      shapeMesh(root,c,[[x-w/2,0],[x-w/2,h],[x+w/2,h],[x+w/2,0]],-7.4);
      shapeMesh(root,'#8ea6cb',[[x-w/2-.15,h],[x,h+w*.9],[x+w/2+.15,h]],-7.4);
    }
  }else if(kind==='sea'){
    shapeMesh(root,'#58c5df',[[-34,-1],[-34,1.05],[34,1.05],[34,-1]],-6.4);
    shapeMesh(root,'#a5ecf2',[[-34,.98],[-34,1.1],[34,1.1],[34,.98]],-6.39);
    shapeMesh(root,'#7cb59a',[[7.2,1.05],[8.4,1.9],[9.8,2.2],[11.4,1.6],[12.6,1.05]],-6.6);
    shapeMesh(root,'#f6f1e2',[[10.7,1.9],[10.75,3.4],[11.05,3.4],[11.1,1.9]],-6.55);
    shapeMesh(root,'#e65a4c',[[10.65,3.4],[10.9,3.85],[11.15,3.4]],-6.55);
    const beacon=halo(root,'#fff2a6',10.9,3.55,1.2,-6.5,.6);
    const glints=Array.from({length:16},()=>{
      const x=-14+random()*28,y=-.6+random()*1.5,w=.25+random()*.5;
      const g=shapeMesh(root,'#e9fdff',[[x,y],[x+w,y],[x+w,y+.04],[x,y+.04]],-6.35,.0);
      g.userData={phase:random()*6,speed:.15+random()*.2};return g;
    });
    anim.push(()=>{
      beacon.material.opacity=.35+.35*Math.max(0,Math.sin(time*2.2));
      for(const g of glints){g.material.opacity=Math.max(0,Math.sin(time*1.6+g.userData.phase))*.8;g.position.x=Math.sin(time*g.userData.speed+g.userData.phase)*.6;}
    });
  }else if(kind==='mountain'){
    for(const [x,w,h,c] of [[-10,6,5.2,'#a7cdbf'],[-5.5,5,3.8,'#93c0b0'],[9,7,5.8,'#a7cdbf'],[13.5,5,4.2,'#93c0b0']]){
      shapeMesh(root,c,[[x-w/2,0],[x-w*.12,h*.82],[x,h],[x+w*.18,h*.78],[x+w/2,0]],-7.6);
      shapeMesh(root,'#eef8f2',[[x-w*.12,h*.82],[x,h],[x+w*.18,h*.78],[x+w*.05,h*.7]],-7.55);
    }
    for(const [x,s] of [[-7.5,1],[10.5,.9],[6.6,.7]]){
      shapeMesh(root,'#4f8a6e',[[x-.6*s,.3],[x,2.1*s],[x+.6*s,.3]],-5.3);
      shapeMesh(root,'#5f9c7c',[[x-.45*s,1.1*s],[x,2.6*s],[x+.45*s,1.1*s]],-5.29);
    }
  }else if(kind==='snow'){
    for(const [x,w,h] of [[-9,7,5],[0,6,3.4],[10,8,5.6]]){
      shapeMesh(root,'#c9dbea',[[x-w/2,0],[x,h],[x+w/2,0]],-7.6);
      shapeMesh(root,'#ffffff',[[x-w*.16,h*.68],[x,h],[x+w*.16,h*.68],[x+w*.05,h*.6],[x-w*.04,h*.66]],-7.55);
    }
    const count=60,pos=new Float32Array(count*3),drift=[];
    for(let i=0;i<count;i++){pos.set([-12+random()*26,random()*16,-4-random()*3],i*3);drift.push(.4+random()*.6);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
    const flakes=new T.Points(geo,new T.PointsMaterial({color:'#ffffff',size:.09,transparent:true,opacity:.9,depthWrite:false}));
    root.add(flakes);
    anim.push(dt=>{
      for(let i=0;i<count;i++){
        let y=pos[i*3+1]-dt*drift[i];if(y<-.5)y+=16;pos[i*3+1]=y;pos[i*3]+=Math.sin(time*1.3+i)*dt*.12;
      }
      geo.attributes.position.needsUpdate=true;
    });
  }else if(kind==='volcano'){
    shapeMesh(root,'#a8746a',[[6,0],[9.4,4.6],[11,4.8],[14.6,0]],-8.2);
    shapeMesh(root,'#ff8a3a',[[9.6,4.5],[10.8,4.6],[10.5,3.6],[9.9,3.6]],-8.15);
    const puffs=Array.from({length:6},(_,i)=>{const p=halo(root,'#8d7a76',10.2,5,1,-8.3,0);p.userData={t:i/6};return p;});
    anim.push(dt=>{
      for(const p of puffs){
        const u=p.userData;u.t=(u.t+dt*.09)%1;
        p.position.set(10.2+u.t*2.2,5+u.t*5.5,-8.3);p.scale.setScalar(1+u.t*3.2);p.material.opacity=.55*Math.sin(Math.PI*u.t);
      }
    });
  }else if(kind==='city'){
    for(const [x,w,h,c] of [[-11,2.2,3.6,'#aab3d6'],[-8.6,1.8,2.6,'#9ca6cc'],[-6.8,2.4,4.4,'#aab3d6'],[8,2,3,'#9ca6cc'],[10.2,2.6,4.8,'#aab3d6'],[12.8,1.8,2.8,'#9ca6cc']]){
      shapeMesh(root,c,[[x-w/2,0],[x-w/2,h],[x,h+w*.45],[x+w/2,h],[x+w/2,0]],-7.4);
      for(let y=.8;y<h-.4;y+=.9)for(let k=-1;k<=1;k+=2)shapeMesh(root,'#fff2c4',[[x+k*w*.22-.12,y],[x+k*w*.22+.12,y],[x+k*w*.22+.12,y+.35],[x+k*w*.22-.12,y+.35]],-7.39);
    }
    const balloon=new T.Group();balloon.position.set(-5,9.5,-9);root.add(balloon);
    disc(balloon,'#ff8a6a',0,0,.75,0);shapeMesh(balloon,'#ffd36a',[[-.45,.2],[.45,.2],[0,-.75]],.01);
    shapeMesh(balloon,'#8a5a46',[[-.18,-.95],[.18,-.95],[.18,-1.2],[-.18,-1.2]],0);
    anim.push(()=>{balloon.position.set(-5+Math.sin(time*.12)*3,9.5+Math.sin(time*.5)*.3,-9);});
  }else if(kind==='bamboo'){
    for(let i=0;i<14;i++){
      const x=(i<7?-13+i*1.1:6.5+(i-7)*1.1)+random()*.4,h=4+random()*3,c=i%2?'#7fb77a':'#94c78c';
      shapeMesh(root,c,[[x-.12,0],[x-.12,h],[x+.12,h],[x+.12,0]],-6.8-(i%2)*.4);
      for(let y=1;y<h;y+=1.1)shapeMesh(root,'#6ea869',[[x-.16,y],[x+.16,y],[x+.16,y+.08],[x-.16,y+.08]],-6.79-(i%2)*.4);
      shapeMesh(root,'#86c27e',[[x,h-.4],[x+.9,h+.2],[x+.2,h-.2]],-6.78-(i%2)*.4);
    }
  }else if(kind==='farm'){
    for(const [x,s] of [[-8.6,1],[9.4,.85],[12.4,.65]]){
      shapeMesh(root,'#c78a5c',[[x-.38*s,0],[x-.2*s,2.3*s],[x+.2*s,2.3*s],[x+.38*s,0]],-7.2);
      shapeMesh(root,'#a2603e',[[x-.3*s,2.3*s],[x,2.75*s],[x+.3*s,2.3*s]],-7.2);
      const hub=new T.Group();hub.position.set(x,2.35*s,-7.1);root.add(hub);
      for(let i=0;i<4;i++){
        const blade=shapeMesh(hub,'#f6e6c4',[[-.07*s,.15*s],[-.12*s,1.45*s],[.12*s,1.45*s],[.07*s,.15*s]],0);blade.rotation.z=i*Math.PI/2;
      }
      anim.push(dt=>{hub.rotation.z-=dt*(.6+s*.2);});
    }
  }
  ridge(root,theme.near,-5.5,.6,.36,random,.68,1);
  // Clouds drift slowly and wrap round.
  const clouds=[];
  for(let i=0;i<8;i++){
    const x=-17+i*4.7+random(),y=4.7+random()*9;
    const points=[[x,y],[x+.32,y+.10],[x+.77,y+.12],[x+1.06,y+.33],[x+1.45,y+.38],[x+1.77,y+.20],[x+2.09,y+.19],[x+2.41,y],[x+2.17,y-.06],[x+.22,y-.06]];
    const c=shapeMesh(root,theme.cloud,points,-11);c.userData={x,speed:.12+random()*.18};clouds.push(c);
  }
  anim.push(()=>{
    for(const c of clouds){const u=c.userData,at=((u.x+time*u.speed+20)%42+42)%42-20;c.position.x=at-u.x;}
  });
  return {animate(dt){time+=dt;for(const f of anim)f(dt);}};
}
export function workshop(root,level,index){
  const random=rng(497+index), [turf,edge]=level.ground;
  const dark=paint('#24384c',.56,.19), frame=paint('#33749a',.38,.36), steel=paint('#b8d4db',.32,.4),
    amber=paint('#ffb42c',.39,.17), belt=paint('#344d60',.68,.13);
  const dirt=bankTexture(level,index);
  const earth=put(root,new T.PlaneGeometry(60,28),new T.MeshBasicMaterial({map:dirt}),0,-14.83,2.39,false);
  earth.material.userData.disposeMap=true;
  earth.material.color.set('#fffbeb');earth.material.map.repeat.y=3.2;
  block(root,60,.30,4.05,paint(turf,.95),0,-.69,.40,.04);
  block(root,60,.16,4.05,paint(edge,.92),0,-.89,.4,.03);
  block(root,60,.12,5,paint(turf,.94),0,-.01,-2.98,.025);
  const sod=paint('#9ee347',.8),blades=new T.InstancedMesh(new T.ConeGeometry(.098,.22,3),sod,96);
  const tuft=new T.Object3D();root.add(blades);
  for(let i=0;i<96;i++){
    tuft.position.set(-9+i*.19,-.84,2.43);tuft.rotation.z=Math.PI+Math.sin(i*2)*.35;
    tuft.scale.setScalar(.75+random()*.63);tuft.updateMatrix();blades.setMatrixAt(i,tuft.matrix);
  }
  // Surface chute feeds a cutaway sorter visible beneath the turf.
  const pipe=paint('#ffbf25',.32,.18),sorter=paint('#ffd33d',.38,.18), windowMat=paint('#33c7cf',.26,.22);
  block(root,1.66,.67,.32,sorter,-3.69,-1.52,2.68,.09);
  block(root,1.31,.24,.05,dark,-3.69,-1.50,2.86,.06);
  block(root,1.12,.13,.06,windowMat,-3.69,-1.50,2.90,.035);
  const path=new T.CatmullRomCurve3([new T.Vector3(-2.92,-1.60,2.70),new T.Vector3(-2.57,-1.60,2.70),new T.Vector3(-2.42,-1.45,2.70),new T.Vector3(-2.42,-1.00,2.70),new T.Vector3(-2.19,-.89,2.70)]);
  put(root,new T.TubeGeometry(path,18,.105,8,false),pipe);
  const scenery=backdrop(root,level,random);
  const railX=.96,railW=9.72;
  block(root,railW,.64,3.18,frame,railX,-.30,1.02,.075);
  block(root,railW-.22,.16,3.12,belt,railX,.087,1.02,.055);
  block(root,railW-.18,.38,.10,dark,railX,-.30,2.64,.045);
  // Single instanced tread slides left and wraps behind the intake.
  const bars=new T.InstancedMesh(new T.BoxGeometry(.055,.035,2.95),paint('#6c8c99',.5),36);
  root.add(bars);bars.frustumCulled=false;
  const stamp=new T.Object3D();
  let travel=0;
  function advance(dt){
    travel=(travel+dt*1.64)%railW;
    for(let i=0;i<36;i++){
      stamp.position.set(railX-railW/2+(railW+i*railW/36-travel)%railW,.183,1.02);
      stamp.updateMatrix();bars.setMatrixAt(i,stamp.matrix);
    }
    bars.instanceMatrix.needsUpdate=true;
  }
  advance(0);
  for(let i=0;i<15;i++){
    const x=-3.49+i*.63;
    cyl(root,.129,.129,.055,steel,x,-.30,2.73,14).rotation.x=Math.PI/2;
    cyl(root,.065,.065,.061,dark,x,-.30,2.76,8).rotation.x=Math.PI/2;
  }
  const hopper=new T.Group();root.add(hopper);hopper.position.set(binX,-.32,binZ);
  block(hopper,1.86,.82,1.10,dark,0,-.18,0,.09);
  block(hopper,1.73,.10,.92,belt,0,.18,0,.035);
  for(const x of [-.83,.83])block(hopper,.13,.18,1.05,amber,x,.22,0,.023);
  block(hopper,1.79,.13,.12,amber,0,.24,.53,.026);
  for(let i=0;i<4;i++){
    const mark=block(hopper,.12,.11,.018,dark,-.57+i*.36,.235,.60,.005);mark.rotation.z=-.52;
  }
  // Twin crusher rollers turn bricks into pay. They spin up whenever something drops in.
  const rollers=[-.26,.26].map(x=>{
    const g=new T.Group();hopper.add(g);g.position.set(x,.3,0);
    const drum=cyl(g,.15,.15,.84,steel,0,0,0,16);drum.rotation.x=Math.PI/2;
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,tooth=block(g,.07,.07,.8,dark,Math.cos(a)*.15,Math.sin(a)*.15,0,.012);tooth.rotation.z=a;
    }
    return g;
  });
  const pitRing=circle(hopper,.24,.022,paint('#ffce56',.33,.22,{emissive:'#ffb83f',emissiveIntensity:.42}),.05,.252,0);
  pitRing.rotation.x=Math.PI/2;
  let churn=0;
  return {pitRing,scenery,advance(dt,crush=0){
    advance(dt);scenery.animate(dt);
    churn+=((crush?1:0)-churn)*(1-Math.exp(-(crush?10:2)*dt));
    rollers[0].rotation.z-=dt*(1.2+churn*11);rollers[1].rotation.z+=dt*(1.2+churn*11);
  }};
}
// A gem spec may override the cut, the facet palette and the glow (two-gem walls use this).
export function gemSpec(level,index,k=0){
  const g=level.gems?.[k]||{};
  return {cut:g.cut??level.cut??index,colors:g.colors||level.colors,crystal:g.crystal||level.crystal,light:g.light||level.light,name:g.name||level.gem};
}
export function crystalModel(root,level,index,k=0){
  const spec=gemSpec(level,index,k);
  const gemRoot=new T.Group();root.add(gemRoot);
  const material=new T.MeshPhysicalMaterial({
    color:'#ffffff',vertexColors:true,metalness:.32,roughness:.13,clearcoat:1,clearcoatRoughness:.07,
    emissive:spec.crystal,emissiveIntensity:.18,flatShading:true,side:T.DoubleSide,
  });
  const jewel=put(gemRoot,facetedGem(spec.cut,spec.colors),material);
  jewel.rotation.x=.19;
  const shine=new T.Shape();
  shine.moveTo(0,.21);shine.lineTo(.046,.038);shine.lineTo(.16,0);shine.lineTo(.042,-.035);
  shine.lineTo(0,-.21);shine.lineTo(-.039,-.035);shine.lineTo(-.16,0);shine.lineTo(-.042,.038);shine.closePath();
  const highlight=new T.ShapeGeometry(shine);
  const stars=Array.from({length:6},()=>put(gemRoot,highlight,new T.MeshBasicMaterial({
    color:'#fff7d4',side:T.DoubleSide,transparent:true,opacity:0,depthWrite:false
  }),0,0,0,false));
  // Sunburst behind the gem. The gem joins the transparent pass so it draws over the rays.
  material.transparent=true;jewel.renderOrder=3;
  const rays=new T.Mesh(new T.PlaneGeometry(3.4,3.4),new T.MeshBasicMaterial({map:rayTexture(),color:new T.Color(spec.light).lerp(new T.Color('#fff7d6'),.35),transparent:true,opacity:0,
    depthWrite:false,depthTest:false,toneMapped:false}));
  rays.material.userData.disposeMap=true;rays.renderOrder=1;gemRoot.add(rays);
  return {gemRoot,jewel,stars,rays};
}
