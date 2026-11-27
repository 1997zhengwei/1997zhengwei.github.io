import * as T from './vendor/three.module.js';
export {T};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const ease=t=>1-(1-t)**3;
export const mix=(x,y,t)=>x+(y-x)*t;

export const paint=(color,roughness=.61,metalness=0,props={})=>new T.MeshStandardMaterial({color,roughness,metalness,...props});
export function put(root,geo,mat,x=0,y=0,z=0,shadow=true){
  const m=new T.Mesh(geo,mat);
  m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;root.add(m);return m;
}
export function round(w,h,d,r=.075){
  r=Math.min(r,w*.24,h*.24,d*.26);
  const s=new T.Shape(),x=w/2-r,y=h/2-r;
  s.moveTo(-x,-y);s.lineTo(x,-y);s.lineTo(x,y);s.lineTo(-x,y);s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,curveSegments:3});
  g.translate(0,0,-(d-2*r)/2);return g;
}
export function block(root,w,h,d,m,x,y,z,r){
  return put(root,round(w,h,d,r),m,x,y,z);
}
export function cyl(root,r1,r2,h,m,x,y,z,segments=24){
  return put(root,new T.CylinderGeometry(r1,r2,h,segments),m,x,y,z);
}
export function circle(root,r,t,m,x,y,z){
  return put(root,new T.TorusGeometry(r,t,8,40),m,x,y,z,false);
}
export function facetedGem(index,palette){
  const cuts=[
    {sides:8,rings:[[.61,.64],[1.03,.20],[1.03,.11],[.40,-.55]],tip:-1.03,depth:.84,
      colors:['#7f173e','#ae1843','#ec3257','#ff5e72','#ff949f','#ffdde0']},
    {sides:8,rings:[[.53,.74],[.72,.57],[.94,.28],[.94,-.05],[.67,-.44],[.39,-.68]],tip:-.81,depth:.72,
      colors:['#075452','#087862','#0ea782','#42d7a7','#93f1c9','#ddffdd']},
    {sides:6,rings:[[.12,1.17],[.62,.67],[.77,.19],[.76,-.25],[.41,-.69]],tip:-1.06,depth:.91,
      colors:['#4c347f','#633ca2','#9053ce','#b67dee','#dbaaff','#f7dcff']},
    {sides:10,rings:[[.51,.60],[1.04,.18],[.97,.02],[.48,-.54]],tip:-1.07,depth:.88,
      colors:['#124285','#1765a6','#1186da','#35baf2','#88e1ff','#e7fbff']},
    {sides:6,rings:[[.29,.92],[.62,.68],[.76,.23],[.69,-.44],[.33,-.78]],tip:-1.03,depth:.94,
      colors:['#875128','#ab6420','#e99526','#fabb49','#ffe084','#fff5c2']},
    {sides:12,rings:[[.38,.73],[.77,.52],[.95,.11],[.89,-.24],[.54,-.52]],tip:-.74,depth:.88,
      colors:['#986699','#ca82ac','#e6aec9','#b4e6e0','#ffdad7','#fff4e7']},
    {sides:8,rings:[[.53,.76],[.87,.47],[.96,.04],[.60,-.57]],tip:-.91,depth:.85,
      colors:['#842d3f','#b43b3c','#e25337','#ff8249','#ffb974','#fff0be']},
    {sides:7,rings:[[.20,.97],[.64,.55],[.83,.12],[.74,-.32],[.36,-.73]],tip:-1.0,depth:.86,
      colors:['#444b8c','#626da7','#8c94d7','#aebdf0','#d6e6fa','#ffffe9']},
  ];
  const cut=cuts[index%cuts.length], p=[],c=[], tones=(palette||cut.colors).map(hex=>new T.Color(hex));
  const rings=cut.rings.map(([r,y],k)=>Array.from({length:cut.sides},(_,i)=>{
    const a=(i+(index===1?.5:(k===0||k===cut.rings.length-1?.5:0)))*2*Math.PI/cut.sides;
    return [r*Math.cos(a),y,r*Math.sin(a)*cut.depth];
  }));
  function face(a,b,d,shade){
    p.push(...a,...b,...d);const color=tones[shade];for(let j=0;j<3;j++)c.push(color.r,color.g,color.b);
  }
  for(let i=0;i<cut.sides;i++){
    const n=(i+1)%cut.sides;
    face(rings[0][i],[0,cut.rings[0][1],0],rings[0][n],i%3?4:5);
    for(let k=0;k<rings.length-1;k++){
      const table=k===0, rim=k===1;
      face(rings[k][i],rings[k][n],rings[k+1][i],table?2+(i*3)%4:rim?1+i%2:(i+k)%3);
      face(rings[k][n],rings[k+1][n],rings[k+1][i],table?3+i%3:rim?2+i%3:1+(i*5+k)%4);
    }
    face(rings.at(-1)[i],rings.at(-1)[n],[0,cut.tip,0],(i*3)%4);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));
  g.computeVertexNormals();return g;
}
export function dispose(root){
  const geos=new Set(),mats=new Set(),maps=new Set();
  root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry&&!o.isSprite)geos.add(o.geometry);if(o.material)mats.add(o.material);});
  for(const g of geos)g.dispose();
  for(const m of mats){if(m.userData.disposeMap&&m.map)maps.add(m.map);m.dispose();}
  for(const texture of maps)texture.dispose();
  root.removeFromParent();
}
export function rng(seed){
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
const V=(x,y,z)=>new T.Vector3(x,y,z);
export const bladeRadius=.83*1.13, bladeZ=1.06;
function panel(group,points,depth,material,x=0,y=0,z=0,bevel=.02){
  const shape=new T.Shape();points.forEach(([a,b],i)=>i?shape.lineTo(a,b):shape.moveTo(a,b));shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});
  geo.translate(0,0,-depth/2);return put(group,geo,material,x,y,z);
}
function disk(root,r,depth,material,x,y,z,sides=36){
  const part=cyl(root,r,r,depth,material,x,y,z,sides);part.rotation.x=Math.PI/2;return part;
}
function cutter(){
  const s=new T.Shape(), teeth=11, polar=(r,a)=>[Math.cos(a)*r,Math.sin(a)*r];
  for(let i=0;i<teeth;i++){
    const a=i*Math.PI*2/teeth, pitch=Math.PI*2/teeth;
    const start=polar(.57,a);
    if(!i)s.moveTo(...start);
    s.quadraticCurveTo(...polar(.65,a+.03*pitch),...polar(.79,a+.13*pitch));
    s.lineTo(...polar(.83,a+.26*pitch));
    s.quadraticCurveTo(...polar(.68,a+.70*pitch),...polar(.57,a+pitch));
  }
  s.closePath();
  for(let i=0;i<3;i++){
    const t=i*Math.PI*2/3,h=new T.Path();
    h.moveTo(...polar(.29,t));h.lineTo(...polar(.47,t+.10));h.quadraticCurveTo(...polar(.51,t+.38),...polar(.42,t+.62));
    h.lineTo(...polar(.33,t+.45));h.quadraticCurveTo(...polar(.39,t+.24),...polar(.29,t));s.holes.push(h);
  }
  const geo=new T.ExtrudeGeometry(s,{depth:.12,bevelEnabled:true,bevelSize:.018,bevelThickness:.023,bevelSegments:2,curveSegments:7});
  geo.translate(0,0,-.06);return geo;
}
export function buildRig(root){
  const metal=paint('#2b425c',.36,.38), black=paint('#223345',.68,.12), chrome=paint('#d1e5e8',.27,.54),
    blue=paint('#128ce3',.29,.22), blueDark=paint('#1558a2',.42,.26), enamel=paint('#ffa51a',.35,.16),
    lemon=paint('#ffda50',.35,.13), red=paint('#f52e50',.29,.29), redDark=paint('#a8223e',.37,.33);
  const base=new T.Group();root.add(base);base.position.set(-4.18,.17,1.0);
  block(base,2.26,.44,1.15,black,0,.24,0,.09);
  for(let i=0;i<6;i++)disk(base,.15,.075,metal,-.87+i*.34,.24,.595,16);
  block(base,2.32,.12,1.23,blueDark,0,.48,0,.035);
  panel(base,[[-1.07,0],[1.03,0],[1.02,.68],[.58,.95],[-.75,.95],[-1.07,.64]],.96,enamel,0,.53,0,.045);
  block(base,1.48,.10,.99,lemon,-.08,1.51,0,.03);
  panel(base,[[-.89,.17],[-.41,.17],[-.23,.31],[-.23,.63],[-.87,.63]],.04,black,0,.55,.52);
  for(let i=0;i<4;i++)block(base,.37,.025,.04,chrome,-.61,.82+i*.084,.56,.009);
  for(let i=0;i<3;i++)panel(base,[[0,0],[.12,0],[.23,.20],[.11,.20]],.028,metal,.20+i*.20,.64,.52,.006);
  const lamp=paint('#ffe9ae',.22,.1,{emissive:'#ffc249',emissiveIntensity:.53});
  block(base,.25,.15,.08,lamp,.81,1.04,.51,.038);
  const fuelPod=new T.Group();base.add(fuelPod);fuelPod.position.set(-.91,.55,.12);
  cyl(fuelPod,.23,.23,.81,paint('#fb574e',.32,.17),0,.46,.18);
  cyl(fuelPod,.205,.235,.12,chrome,0,.91,.18);
  cyl(fuelPod,.12,.12,.12,metal,0,1.02,.18,12);
  cyl(fuelPod,.24,.24,.095,blueDark,0,.24,.18);
  const pivot=V(-4.12,1.39,1.27);
  function joint(r){
    const g=new T.Group();root.add(g);
    disk(g,r,.42,blueDark,0,0,0);disk(g,r*.86,.064,chrome,0,0,.228);
    disk(g,r*.54,.075,metal,0,0,.266);disk(g,r*.21,.085,blue,0,0,.284,12);
    return g;
  }
  const joints=[joint(.29),joint(.21),joint(.186),joint(.18)];
  function arm(width){
    const g=new T.Group();root.add(g);
    panel(g,[[-width*.39,0],[-width*.52,.18],[-width*.44,.78],[-width*.28,1],[width*.26,1],[width*.49,.85],[width*.50,.14],[width*.36,0]],.26,blue,0,0,0,.018);
    block(g,width*.26,.65,.03,blueDark,-width*.29,.52,.151,.007);
    block(g,width*.15,.63,.027,chrome,width*.29,.5,.153,.006);
    return g;
  }
  const links=[arm(.41),arm(.31),arm(.24)];
  const hydraulic=[new T.Group(),new T.Group()];
  hydraulic.forEach((g,i)=>{root.add(g);block(g,i?.075:.14,1,.10,i?chrome:metal,0,.5,0,.02);});
  const head=new T.Group(),rotor=new T.Group();root.add(head);head.add(rotor);
  head.scale.setScalar(1.13);
  disk(head,.53,.18,redDark,0,0,-.09);
  put(rotor,cutter(),red,0,0,.055);
  const enamelEdge=paint('#ff8a83',.28,.21);
  for(let i=0;i<11;i++){
    const a=i*Math.PI*2/11;
    const wear=panel(rotor,[[.585,.022],[.756,.058],[.775,.070],[.65,.069]],.008,enamelEdge,0,0,.139,.003);
    wear.rotation.z=a;
  }
  disk(rotor,.275,.071,enamel,0,0,.177);disk(rotor,.22,.07,chrome,0,0,.218);
  disk(rotor,.145,.08,metal,0,0,.258,8);
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3+.22;disk(rotor,.032,.035,chrome,Math.cos(a)*.234,Math.sin(a)*.234,.226,8);
  }
  return {pivot,links,joints,hydraulic,head,rotor,speed:0,points:[pivot,V(0,0,0),V(0,0,0),V(0,0,0)],
    finish(skin,scale,tankRank){blue.color.set(skin.arm);red.color.set(skin.blade);enamel.color.set(skin.body);head.scale.setScalar(1.13*scale);fuelPod.scale.y=1+tankRank*.13;},
    heat(v){red.emissive.setRGB(1,.32,.06);red.emissiveIntensity=v*.75;enamelEdge.emissive.setRGB(1,.55,.15);enamelEdge.emissiveIntensity=v*1.1;}};
}
const up=V(0,1,0), direction=V(0,0,0), start=V(0,0,0), end=V(0,0,0);
function span(g,a,b){
  g.position.copy(a);direction.copy(b).sub(a);g.scale.y=direction.length();
  g.quaternion.setFromUnitVectors(up,direction.normalize());
}
export function poseRig(rig,x,y,active,t,dt){
  const [p,elbow,wrist,tip]=rig.points;
  const reach=Math.max(0,x-p.x);
  const lift=.74+Math.min(1.75,reach*.34)+Math.max(0,2.5-y)*.19;
  tip.set(x,y+(active?Math.sin(t*64)*.018:0),.83);
  elbow.set(mix(p.x,x,.29)-.44,mix(p.y,y,.38)+lift,mix(p.z,tip.z,.28));
  wrist.set(mix(p.x,x,.68)-.16,mix(p.y,y,.74)+lift*.63,mix(p.z,tip.z,.69));
  rig.links.forEach((part,i)=>span(part,rig.points[i],rig.points[i+1]));
  start.copy(p).lerp(elbow,.25);start.x+=.14;start.z+=.19;
  end.copy(elbow).lerp(wrist,.30);end.y-=.21;end.z+=.19;
  span(rig.hydraulic[1],start,end);span(rig.hydraulic[0],start,end);rig.hydraulic[0].scale.y*=.54;
  rig.joints.forEach((j,i)=>j.position.copy(rig.points[i]));
  rig.head.position.copy(tip);rig.head.position.z=bladeZ;
  rig.speed+=((active?18:0)-rig.speed)*(1-Math.exp(-8*dt));rig.rotor.rotation.z-=rig.speed*dt;
}
