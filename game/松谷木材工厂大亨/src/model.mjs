import * as T from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/geometries/RoundedBoxGeometry.js';

export const TAU=Math.PI*2;
export const point=(x,y,z)=>new T.Vector3(x,y,z);
export const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.76,...extra});
export const geoBox=new Map();
export function randomGen(seed){
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
export function mesh(parent,geo,material,x=0,y=0,z=0,cast=true){
  const m=new T.Mesh(geo,material);
  m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);
  return m;
}
export function box(parent,w,h,d,material,x=0,y=0,z=0,r=0,cast=true){
  const key=[w,h,d,r].join('/');
  let geo=geoBox.get(key);
  if(!geo){
    geo=r?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w*.44,h*.44,d*.44)):new T.BoxGeometry(w,h,d);
    geoBox.set(key,geo);
  }
  return mesh(parent,geo,material,x,y,z,cast);
}
export function group(parent,x=0,y=0,z=0){
  const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;
}
export function cylinder(parent,r1,r2,height,material,x=0,y=0,z=0,segments=14){
  return mesh(parent,new T.CylinderGeometry(r1,r2,height,segments),material,x,y,z);
}
function texture(size,paint){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;paint(canvas.getContext('2d'),size);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}
export function sign(parent,text,width,height,x,y,z,background='#244e43'){
  const map=texture(256,(c,n)=>{
    c.fillStyle=background;c.fillRect(0,0,n,n);
    c.strokeStyle='#f8d898';c.lineWidth=5;c.strokeRect(7,13,n-14,n-26);
    c.fillStyle='#ffedc7';c.font='900 49px Arial';c.textAlign='center';c.textBaseline='middle';
    c.fillText(text,n*.5,n*.52,n*.87);
  });
  return mesh(parent,new T.PlaneGeometry(width,height),mat('#fff',{map}),x,y,z,false);
}
export function plantMaterials(site){
  const belt=site?.belt??'#119ce0';
  return {
    grass:mat(site?.grass??'#80c338'),lightGrass:mat(site?.light??'#a3d47b'),road:mat('#6e758b'),trim:mat('#dce2ec'),
    pad:mat(site?.floor??'#abaebf'),sand:mat('#eac482'),yellow:mat('#ffc334',{roughness:.43}),steel:mat('#546680',{metalness:.27,roughness:.44}),
    chrome:mat('#e3eefb',{metalness:.23,roughness:.33}),dark:mat('#253247'),rubber:mat('#242735'),
    glass:mat('#4eb7da',{metalness:.15,roughness:.22}),glint:mat('#a8e5fa',{roughness:.30}),
    jade:mat(site?.machine??'#f34c2d',{roughness:.42}),forest:mat('#2b4666'),
    belt:mat(belt,{roughness:.48}),beltTop:mat(new T.Color(belt).lerp(new T.Color('#bfeaff'),.32),{roughness:.51}),
    cream:mat('#fff1d7'),clay:mat('#285d94'),roof:mat(site?.roof??'#4289c6',{roughness:.53}),wood:mat('#955536'),
    red:mat('#f54d42'),white:mat('#fffaf1'),water:mat('#19a4d7',{roughness:.28,metalness:.07})
  };
}
export function timberMaterials(){
  const grain=texture(256,(c,n)=>{
    const r=randomGen(517);
    c.fillStyle='#e9b779';c.fillRect(0,0,n,n);
    for(let i=0;i<480;i++){
      const x=r()*n,y=r()*n,l=r()*120+12;
      c.strokeStyle=i%3?'#8c552b36':'#fff1c792';c.lineWidth=.4+r()*1.25;
      c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+4,y+l*.3,x-5,y+l*.6,x+2,y+l);c.stroke();
    }
    for(let i=0;i<6;i++){
      const x=r()*n,y=r()*n;
      for(let k=0;k<5;k++){
        c.strokeStyle='#a6663450';c.lineWidth=1.1;c.beginPath();
        c.ellipse(x,y,2+k*1.15,5+k*4,-.18,0,TAU);c.stroke();
      }
    }
  });
  const bark=texture(256,(c,n)=>{
    const r=randomGen(782);
    c.fillStyle='#945734';c.fillRect(0,0,n,n);
    for(let i=0;i<33;i++){
      const x=(i+.4)*n/33,w=3+r()*6,s=(r()-.5)*14;
      c.fillStyle=['#ae7048','#c28451','#7b432b'][i%3];
      c.beginPath();c.moveTo(x,-10);c.bezierCurveTo(x-4,83,x+s,165,x-1,n+7);
      c.lineTo(x+w,n+7);c.bezierCurveTo(x+w+s*.48,183,x+w+4,85,x+w,-10);c.closePath();c.fill();
    }
    for(let i=0;i<150;i++){
      const x=r()*n;
      c.strokeStyle=['#482f246e','#b0724b98','#ebaf7684','#61362385'][i%4];
      c.lineWidth=r()*4+1;c.beginPath();c.moveTo(x,-10);
      for(let y=0;y<=n+10;y+=14)c.lineTo(x+r()*8-4,y);
      c.stroke();
    }
  });
  const rings=texture(256,(c,n)=>{
    c.fillStyle='#70422c';c.fillRect(0,0,n,n);
    c.fillStyle='#f5c891';c.beginPath();c.arc(128,128,119,0,TAU);c.fill();
    for(let k=1;k<16;k++){
      c.strokeStyle=k%2?'#a3653baa':'#bd84548a';c.lineWidth=k%3===0?2:1.25;
      c.beginPath();
      for(let a=0;a<=TAU+.08;a+=.07){
        const radius=k*7.1+2.1*Math.cos(a*4+k*.23)+1.7*Math.sin(a*7);
        c.lineTo(122+Math.cos(a)*radius,130+Math.sin(a)*radius);
      }
      c.closePath();c.stroke();
    }
    for(const [angle,reach] of [[.28,37],[1.12,19],[2.02,29],[3.10,15],[3.72,41],[4.98,26],[5.66,14]]){
      const x=Math.cos(angle),y=Math.sin(angle);
      c.strokeStyle='#875336d4';c.lineWidth=2.1;
      c.beginPath();c.moveTo(128+x*115,128+y*115);c.lineTo(128+x*(105-reach*.31),128+y*(105-reach*.31));
      c.lineTo(128+Math.cos(angle+.056)*(115-reach),128+Math.sin(angle+.056)*(115-reach));c.stroke();
    }
    c.fillStyle='#8f5636';c.beginPath();c.ellipse(122,130,4,3,.7,0,TAU);c.fill();
  });
  return {
    logGeo:new T.CylinderGeometry(.415,.454,3.44,20,2),
    logMat:[mat('#fff1de',{map:bark}),mat('#fff',{map:rings}),mat('#ffecd3',{map:rings})],
    boardGeo:new RoundedBoxGeometry(.73,.243,3.2,1,.039),
    boardMat:mat('#fff2ce',{map:grain,roughness:.79})
  };
}

export function vehicle(parent,p,color,type){
  const g=group(parent),paint=mat(color,{roughness:.40}),fork=type==='fork';
  const cab=group(g,0,0,fork?0:2.13);
  if(fork){
    box(g,1.34,.43,1.74,paint,0,.49,-.14,.10);
    box(g,1.17,.53,.84,paint,0,.82,-.48,.10);
    box(g,1.24,.16,.22,p.dark,0,.52,-.99,.04);
    for(const x of [-.61,.61]){
      tire(g,p,x,.52,.29);tire(g,p,x,-.69,.23);
      for(const z of [-.76,.41]) box(g,.088,1.21,.087,p.dark,x,1.4,z,.014);
      box(g,.119,1.86,.12,p.steel,x*.64,1.15,.84,.021);
    }
    box(g,1.39,.118,1.30,paint,0,2.04,-.17,.055);
    box(g,1.11,.024,.86,p.yellow,0,2.105,-.19,.010);
    box(g,.58,.15,.44,p.dark,0,1.04,-.18,.059);
    box(g,.95,.09,.59,p.steel,0,.83,.24,.022);
    box(g,.12,.33,.12,p.steel,0,1.12,.41,.019);
    const steering=mesh(g,new T.TorusGeometry(.19,.031,8,18),p.dark,0,1.31,.41);
    steering.rotation.x=Math.PI*.28;
    const lift=group(g,0,.43,.93);
    box(lift,1.04,.42,.095,p.dark,0,.14,0,.024);
    for(const x of [-.32,.32])box(lift,.14,.074,1.28,p.chrome,x,-.007,.61,.018);
    cylinder(g,.10,.11,.14,p.yellow,-.37,2.15,-.50,12);
    return {g,lift};
  }
  box(g,1.99,.30,6.67,p.dark,0,.63,-.19,.08);
  const wheels=[];
  box(cab,2.01,1.13,1.9,paint,0,1.06,0,.17);
  box(cab,1.85,.81,1.26,paint,0,1.88,-.10,.109);
  box(cab,1.57,.64,.079,p.glass,0,1.91,.55,.062).rotation.x=-.13;
  box(cab,.042,.64,.081,p.dark,0,1.91,.58,.012).rotation.x=-.13;
  box(cab,1.77,.13,1.34,p.white,0,2.34,-.105,.05);
  for(const x of [-.46,.46])box(cab,.41,.06,.018,p.glint,x,2.10,.568,.006,false).rotation.x=-.13;
  box(cab,2.12,.17,.24,p.chrome,0,.66,.97,.043);
  box(cab,1.17,.37,.06,p.dark,0,1.06,.96,.029);
  for(let i=0;i<4;i++)box(cab,.97,.024,.014,p.chrome,0,.96+i*.066,1.0,.005);
  for(const side of [-1,1]){
    const x=side*.96;
    box(cab,.043,.53,.73,p.glass,x,1.89,-.015,.02);
    box(cab,.101,.36,.15,p.dark,side*1.13,1.80,.40,.025);
    box(cab,.255,.194,.078,p.white,side*.76,1.13,.956,.03);
    box(cab,.194,.076,.045,p.yellow,side*.76,.934,.969,.015);
    box(cab,.036,.12,1.46,p.white,x*1.04,1.43,-.01,.018);
    box(cab,.31,.10,.67,p.dark,side*.93,.71,-.06,.018);
    box(cab,.044,.053,.24,p.chrome,x*1.06,1.51,-.14,.013);
    for(const z of [-2.51,-1.56,2.14])wheels.push(tire(g,p,x,z));
  }
  box(g,2.03,.21,4.8,p.steel,0,.91,-.88,.059);
  for(const side of [-1,1]){
    box(g,.13,.21,4.76,p.cream,side*.98,1.01,-.83,.019);
    box(g,.025,.087,4.44,paint,side*1.049,.986,-.84,.007,false);
    for(const z of [-2.95,-1.63,-.27,1.35])
      box(g,.108,type==='logs'?1.27:.72,.13,p.dark,side*.92,type==='logs'?1.55:1.31,z,.018);
  }
  box(g,2.08,.115,.16,p.yellow,0,.77,-3.28,.021);
  for(const x of [-.79,.79])box(g,.225,.13,.08,p.red,x,.91,-3.32,.019);
  return {g,cargo:group(g,0,1.03,-.89),wheels};
}

function tire(g,p,x,z,size=.435){
  const wheel=group(g,x,size+.09,z);
  cylinder(wheel,size,size,.32,p.rubber).rotation.z=Math.PI/2;
  cylinder(wheel,size*.59,size*.59,.34,p.chrome).rotation.z=Math.PI/2;
  cylinder(wheel,size*.25,size*.25,.049,p.dark,Math.sign(x)*.18).rotation.z=Math.PI/2;
  box(wheel,.021,size*.11,size*.29,p.steel,Math.sign(x)*.177,size*.40,0,.006,false);
  return wheel;
}

export function worker(parent,p,x,z,shirt,hat,features={}){
  const g=group(parent,x,.14,z),skin=mat(features.skin??'#f6bc85'),outfit=mat(shirt),helmet=mat(hat,{roughness:.43});
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const leg=group(g,side*.115,features.seated?.59:.51,0);
    if(features.seated){
      box(leg,.16,.146,.31,p.steel,0,0,.124,.038);
      box(leg,.155,.25,.165,p.steel,0,-.11,.256,.036);
      box(leg,.175,.108,.22,p.dark,0,-.251,.31,.032);
    }else{
      box(leg,.16,.37,.19,p.steel,0,-.12,0,.044);
      box(leg,.175,.14,.25,p.dark,0,-.32,.065,.04);
    }
    legs.push(leg);
    const arm=group(g,side*.255,.92,.05);
    arm.rotation.z=side*.17;
    if(features.seated)arm.rotation.set(-.98,side*.31,side*-.13);
    box(arm,.165,.35,.165,outfit,0,-.14,0,.053);
    mesh(arm,new T.SphereGeometry(.074,10,8),skin,side*.016,-.33,.01);arms.push(arm);
  }
  box(g,.46,.45,.29,outfit,0,.825,0,.098);
  box(g,.36,.21,.044,features.vest==='blue'?p.belt:p.yellow,0,.89,.15,.038);
  for(const a of [-.123,.123])box(g,.037,.31,.035,p.white,a,.86,.175,.012);
  box(g,.458,.057,.296,p.dark,0,.687,0,.02);
  const head=mesh(g,new T.SphereGeometry(.18,17,13),skin,0,1.187,.025);head.scale.y=1.06;
  for(const a of [-.074,.074]){
    mesh(g,new T.SphereGeometry(.032,10,8),p.white,a,1.192,.179,false);
    mesh(g,new T.SphereGeometry(.018,8,7),p.dark,a,1.192,.202,false);
    mesh(g,new T.SphereGeometry(.047,10,8),skin,a*2.31,1.16,.041);
  }
  if(features.glasses){
    for(const a of [-.075,.075])box(g,.127,.073,.032,p.glass,a,1.192,.213,.022);
    box(g,.061,.027,.026,p.dark,0,1.201,.214,.008);
  }
  mesh(g,new T.SphereGeometry(.037,10,8),skin,0,1.15,.204);
  box(g,.073,.022,.02,p.wood,0,1.106,.186,.008);
  const top=mesh(g,new T.SphereGeometry(.221,17,12,0,TAU,0,Math.PI*.53),helmet,0,1.28,.023);top.scale.y=.79;
  cylinder(g,.225,.225,.051,helmet,0,1.277,.064).scale.z=1.14;
  box(g,.041,.055,.32,p.white,0,1.437,.032,.012);
  if(features.earmuffs){
    for(const a of [-.213,.213])box(g,.075,.19,.124,p.forest,a,1.212,.028,.032);
  }
  return {g,legs,arms,x,z};
}
