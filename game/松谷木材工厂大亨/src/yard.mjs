import * as T from '../vendor/three.module.js';
import {TAU,point,mat,mesh,box,group,cylinder,sign} from './model.mjs';

export const SITES=[point(2.7,0,6.85),point(5.26,0,7.6),point(2.7,0,11.28),point(5.26,0,12.11),
  point(2.7,0,15.65),point(5.28,0,16.24),point(.19,0,10.85),point(.19,0,15.9)];
export const PINS={
  inbound:point(-4.08,3.85,-8.15), saw:point(-1.8,3.38,.03),
  stack:point(3.98,4.4,8.9), dispatch:point(8.87,3.05,12.2),finish:point(-5.25,3.63,5.45)
};
export const CONTROL_PADS={
  inbound:point(-3.42,.21,-12.13),saw:point(2.32,.21,-.62),finish:point(-6.72,.21,5.05),
  stack:point(.85,.21,12),dispatch:point(8.63,.21,11.86)
};
export const CREW_STANDS={
  inbound:[[-5.80,-8.48],[-5.80,-10.35]],
  saw:[[-2.84,1.2],[3.44,-.58]],
  stock:[[3.65,2.1]],
  dispatch:[[11.96,2.74],[11.96,8.57]],
  finish:[[-6.20,9.95],[-4.45,10.15]]
};

export function pedestrianPads(scene,p,site){
  const paint=mat('#62958a');
  for(const [station,stands] of Object.entries(CREW_STANDS)){
    if(station==='finish'&&!site.finish)continue;
    for(const [x,z] of stands){
      box(scene,1.39,.26,1.23,p.trim,x,.034,z,.034,false);
      box(scene,1.22,.020,1.07,paint,x,.173,z,.025,false);
      for(const offset of [-.47,.47])box(scene,1.10,.012,.044,p.cream,x,.185,z+offset,.007,false);
    }
  }
  // The rail keeps the unloading crew on the apron beside the truck lane.
  for(const z of [-10.98,-9.4,-7.8])box(scene,.11,.65,.11,p.forest,-6.57,.47,z,.016);
  box(scene,.11,.105,3.25,p.yellow,-6.57,.75,-9.39,.018);
}

export function controlPads(scene,p,site){
  for(const [key,{x,y,z}] of Object.entries(CONTROL_PADS)){
    if(key==='finish'&&!site.finish)continue;
    box(scene,1.48,.07,1.04,p.dark,x,y,z,.045,false);
    for(const off of [-.44,.44])box(scene,1.2,.013,.045,p.yellow,x,y+.043,z+off,.003,false);
    box(scene,.70,.015,.07,p.white,x,y+.043,z,.008,false);
  }
}

export function terrain(scene,p,random,site){
  const biome=site.biome??site.id;
  box(scene,152,.65,158,p.grass,0,-.42,0,0,false);
  for(const [x,z,w,d,m] of [
    [-.9,2.1,13.1,29.6,p.pad],[-3.1,-8.05,8.4,7.4,p.sand],
    [3.77,10,9.1,17.4,p.sand],[-8.35,-7.45,4.45,33,p.road],
    [8.93,7.1,4.65,41.3,p.road],[-5.5,2.3,3.6,7.25,p.road],
    [1.6,-14.32,17.5,3.65,p.road]
  ]){
    box(scene,w+.24,.16,d+.24,p.trim,x,-.005,z,0,false);
    const height=m===p.road?.088:m===p.sand?.078:.066;
    box(scene,w,.12,d,m,x,height,z,.006,false);
  }
  const seam=mat('#77859a');
  for(let z=-4.5;z<15;z+=3.2)box(scene,11.9,.009,.026,seam,-.35,.132,z,.003,false);
  for(let x=-5.6;x<5.9;x+=2.95)box(scene,.022,.009,25.6,seam,x,.132,2.4,.003,false);
  for(let z=-9.65;z<16;z+=1.36){
    for(const x of [-5.05,6.61]){
      box(scene,.065,.015,.81,p.white,x,.16,z,0,false);
    }
  }
  for(let z=6.2;z<18;z+=3.8){
    box(scene,8.1,.016,.025,p.trim,3.6,.163,z,0,false);
  }
  for(let z=-23;z<9;z+=2.5)box(scene,.075,.018,.96,p.cream,-8.35,.157,z,0,false);
  for(let z=-12;z<27;z+=2.65)box(scene,.075,.018,.98,p.cream,8.93,.157,z,0,false);
  for(let x=-5.3;x<9;x+=2.65)box(scene,.94,.018,.08,p.cream,x,.157,-14.25,0,false);
  for(let i=0;i<10;i++)box(scene,.76,.018,.13,p.cream,-8.35,.161,-4.49+i*.198,0,false).rotation.y=-.1;
  for(const [x,z,w,d] of [[-2.4,-8.6,4.8,5.7],[4.45,9.45,6.5,12.8],[0,.1,5.8,10]]){
    for(const side of [-1,1]){
      box(scene,.063,.017,d,p.yellow,x+side*w/2,.157,z,0,false);
      box(scene,w,.017,.063,p.yellow,x,.157,z+side*d/2,0,false);
    }
  }
  const stream=group(scene,-16.7,-.09,3.9);stream.rotation.y=.11;
  const width=biome==='river'?8.2:4.17;
  const snow=biome==='ridge',autumn=biome==='redwood';
  box(stream,width+.86,.025,70,mat(snow?'#eef4ff':autumn?'#bc8849':'#b1c6a1'),0,0,0,0,false);
  box(stream,width,.027,70,snow?mat('#a9cee7',{roughness:.26}):p.water,0,.024,0,0,false);
  const ripple=mat(snow?'#e9f9ff':'#a7d7c5');
  for(let i=0;i<36;i++)box(stream,.049,.011,.23+random()*1.4,ripple,(random()-.5)*(width-.2),.045,(random()-.5)*65,0,false);
  const bridge=group(scene,-16.8,0,4.8);
  bridge.scale.x=biome==='river'?1.39:1;
  for(let i=0;i<13;i++)box(bridge,.54,.19,2.45,p.wood,-3.14+i*.52,.18,0,.027);
  for(const z of [-1.12,1.12]){
    box(bridge,6.7,.14,.13,p.cream,0,.72,z,.027);
    for(let i=-3;i<=3;i++)box(bridge,.13,.78,.13,p.wood,i,.37,z,.025);
  }
  for(const [x,z] of [[-9.8,-3.65],[-5.7,-4],[7,1.1],[11,4.7],[-4,12.2]]){
    const g=group(scene,x,0,z);
    box(g,.29,.25,.29,p.steel,0,.15,0,.035);
    cylinder(g,.052,.083,3.15,p.dark,0,1.65,0,9);
    box(g,.62,.094,.094,p.dark,.28,3.23,0,.018);
    box(g,.34,.16,.28,p.dark,.59,3.17,0,.031);
    box(g,.24,.025,.21,p.cream,.59,3.075,0,.008);
  }
}

export function forest(scene,p,random,site){
  const positions=[];
  for(let i=0;i<345;i++){
    const x=(random()-.5)*89,z=(random()-.61)*80;
    if((x>-13.3&&x<13.4&&z>-23&&z<20)||(x>-20.5&&x<-13.3))continue;
    positions.push([x,z,.66+random()*.76,random()*TAU,i]);
  }
  for(const a of [[-12.8,-10,1.14,3,1],[-13.1,-5.55,.98,1,9],[12.85,-7.1,1.04,1,7],[-12.8,10.5,1.16,4,4],[10.7,-17.7,1.06,1,6],[11.4,-20.1,1.1,4,1],[-13,16.9,.75,1,2],[-10.3,17.8,.96,1,6],[-11.9,13.9,.85,2,2],[12.96,15.4,.94,1,6]])positions.push(a);
  const bark=new T.InstancedMesh(new T.CylinderGeometry(.135,.23,1.65,7),p.wood,positions.length);
  const fir=[0,1,2].map(()=>new T.InstancedMesh(new T.ConeGeometry(1,1,9),mat('#fff'),positions.length));
  const dummy=new T.Object3D();
  positions.forEach(([x,z,s,turn,i],index)=>{
    const colors=(site?.biome??site?.id)==='pine'&&i%7===0?['#ae6b29','#e39333','#f5b94b']:(site?.forest??['#24852c','#49a632','#77c53b']);
    dummy.rotation.set(0,turn,0);dummy.position.set(x,.65*s,z);dummy.scale.setScalar(s);dummy.updateMatrix();bark.setMatrixAt(index,dummy.matrix);
    for(let layer=0;layer<3;layer++){
      dummy.position.set(x,(1.61+layer*.68)*s,z);
      const size=(1.35-layer*.26)*s;
      dummy.scale.set(size,(1.92-layer*.22)*s,size);dummy.updateMatrix();
      fir[layer].setMatrixAt(index,dummy.matrix);fir[layer].setColorAt(index,new T.Color(colors[layer]));
    }
  });
  for (const part of [bark,...fir]) {part.castShadow=part.receiveShadow=true;scene.add(part);}
  const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(.49,0),mat('#a5af9d'),45);
  for(let i=0;i<45;i++){
    dummy.position.set(-16.6+(i%2?2.78:-2.83)+random()*.5,.17,-32+random()*64);
    dummy.rotation.set(random()*.4,random()*TAU,0);
    dummy.scale.set(.45+random(),.36+random()*.5,.36+random());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
    rocks.setColorAt(i,new T.Color(i%3?'#e0e7d9':'#c2ceba'));
  }
  rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);
  const bushes=new T.InstancedMesh(new T.IcosahedronGeometry(.49,0),mat('#fff'),84);
  const starts=[[-11.8,2.6],[-12.3,12.5],[-9.4,17.65],[-6.33,17.68],[-1.14,17.93],[11.8,12.0],[12.7,6.2],[7.6,-11.6],[-11.8,-14.5],[11.9,17.1],[-14.4,-4.8],[-3.9,-12.4]];
  for(let i=0;i<84;i++){
    const [x,z]=starts[Math.floor(i/7)],s=.33+random()*.69;
    dummy.position.set(x+(random()-.5)*1.4,s*.27,z+(random()-.5)*1.25);
    dummy.rotation.set(0,random()*TAU,0);dummy.scale.set(s*1.48,s,s*1.1);
    dummy.updateMatrix();bushes.setMatrixAt(i,dummy.matrix);
    bushes.setColorAt(i,new T.Color(['#6d9a59','#7aa762','#a5b660','#c39a58'][i%4]));
  }
  bushes.castShadow=true;bushes.receiveShadow=true;scene.add(bushes);
}

function cabin(scene,p,x,z,w,d,label){
  const g=group(scene,x,.14,z);
  box(g,w+.27,.23,d+.24,p.sand,0,.13,0,.032);
  box(g,w,2.03,d,p.cream,0,1.22,0,.068);
  for(const x of [-w*.44,w*.44])box(g,.14,1.93,.13,p.roof,x,1.17,d*.50+.047,.022);
  for(const z of [-d*.38,0,d*.38])box(g,.089,.69,.63,p.glass,w*.51,1.38,z,.03);
  const roofShape=new T.Shape();
  roofShape.moveTo(-w*.6,0);roofShape.lineTo(w*.6,0);roofShape.lineTo(0,w*.27);roofShape.closePath();
  mesh(g,new T.ExtrudeGeometry(roofShape,{depth:d+.42,bevelEnabled:false}),p.clay,0,2.17,-(d+.42)/2);
  const angle=Math.atan2(w*.27,w*.6);
  for(const side of [-1,1]){
    box(g,w*.656,.105,d+.51,p.roof,side*w*.305,2.193+w*.13,0,.023).rotation.z=-side*angle;
    for(let k=0;k<8;k++)box(g,w*.63,.056,.060,p.clay,side*w*.30,2.25+w*.13,-d*.49+(k/7)*d*.98,.012).rotation.z=-side*angle;
    box(g,.13,1.92,.10,p.wood,side*(w*.5-.025),1.16,d*.5+.04,.018);
  }
  box(g,.72,1.46,.1,p.forest,-w*.15,.94,d/2+.025,.024);
  const win=group(g,w*.24,1.40,d/2+.056);
  box(win,.76,.72,.104,p.wood,0,0,0,.04);
  box(win,.64,.60,.10,p.glass,0,0,.031,.023);
  box(win,.043,.62,.015,p.cream,0,0,.090);
  box(win,.65,.043,.015,p.cream,0,0,.090);
  box(g,.94,.171,.39,p.sand,-w*.15,.23,d*.5+.17,.031);
  sign(g,label,w*.58,.42,0,2.02,d/2+.065);
  return g;
}

function fence(scene,p,x1,z1,x2,z2){
  const length=Math.hypot(x2-x1,z2-z1),g=group(scene,(x1+x2)/2,0,(z1+z2)/2);
  g.rotation.y=-Math.atan2(z2-z1,x2-x1);
  for(const y of [.42,.84])box(g,length,.09,.10,p.cream,0,y,0,.014);
  const posts=Math.ceil(length/1.6);
  for(let i=0;i<=posts;i++)box(g,.123,1.10,.132,p.wood,-length/2+length*i/posts,.55,0,.014);
}

function crate(g,p,x,z,s){
  box(g,s,s,s,p.wood,x,.21+s/2,z,.035);
  box(g,s*.83,s*.77,.05,p.roof,x,.21+s/2,z+s/2,.016);
  for(const side of [-1,1])box(g,.074,s*.91,s*.91,p.cream,x+side*s*.42,.21+s/2,z,.010);
}

export function architecture(scene,p,site){
  const office=cabin(scene,p,5.71,-8.55,4.51,4.04,'TIMBER '+(site?.number??'01'));
  cylinder(office,.18,.27,1.57,p.forest,1.09,2.84,-.45);
  cylinder(office,.27,.27,.14,p.dark,1.09,3.66,-.45);
  cabin(scene,p,-4.95,12.9,2.8,2.78,'CREW');
  const flags=group(scene,4.18,0,-6.63);
  for(let i=0;i<3;i++){
    cylinder(flags,.036,.053,2.71,p.chrome,i*.52,1.46,0,8);
    box(flags,.41,.49,.072,i===1?p.yellow:i===2?p.jade:p.belt,i*.52+.20,2.5,0,.037);
  }
  const service=group(scene,-5.6,0,4.65);
  if(!site?.finish){
    for(const x of [-1.56,1.56])for(const z of [-2.09,2.09]){
      box(service,.25,2.54,.25,p.forest,x,1.37,z,.026);
      box(service,.38,.29,.39,p.steel,x,.23,z,.028);
    }
    box(service,3.43,.26,4.65,p.clay,0,2.68,0,.045);
    box(service,1.41,.085,3.5,p.roof,0,2.847,0,.035);
    for(let i=0;i<9;i++)box(service,3.48,.055,.085,p.belt,0,2.89,-2.17+i*.53,.015);
    sign(service,'TOOLS',2.06,.47,0,2.45,2.35);
    box(service,3.15,1.48,.14,p.forest,0,.92,-2.14,.032);
    for(let i=0;i<7;i++)crate(service,p,-1.07+(i%3)*.90,-1.18+Math.floor(i/3)*.91,.53+i%3*.067);
  }
  for(const [x,z,s] of [[6.6,-6.5,.74],[5.7,-6.45,.57],[-3.2,10.7,.64],[-3.2,11.47,.64],[6.8,15.4,.72]])crate(scene,p,x,z,s);
  for(const spec of [[-11,-5,-11,16],[-11,16,-2,16],[3.2,-11.3,6.65,-11.3],[11.7,-11.3,11.7,.8],[-2.4,-12.1,3.1,-12.1]])fence(scene,p,...spec);
  const entry=group(scene,-3.65,0,-12.12);
  box(entry,.16,1.76,.17,p.wood,0,.88,0,.02);
  sign(entry,'LOG IN',1.48,.51,0,1.39,.097);
}

export function buildLine(scene,p,number='01'){
  const rack=group(scene,-2.29,0,-8.37);
  box(rack,4.12,.14,4.32,p.steel,0,.205,0,.025);
  for(const x of [-1.88,1.88]){
    box(rack,.16,.83,3.98,p.wood,x,.68,0,.020);
    for(const z of [-1.76,1.76])box(rack,.24,1.43,.29,p.wood,x,.88,z,.032);
  }
  for(let i=0;i<6;i++)box(rack,4,.11,.106,p.cream,0,.32,-1.85+i*.74,.017);
  const crane=group(scene,-4.48,0,-8.55);
  const westLeg=-5.42,eastLeg=2.7;
  const span=eastLeg-westLeg+.32,beamCenter=(eastLeg+westLeg)/2;
  for(const x of [westLeg,eastLeg])for(const z of [-1.85,1.85]){
    box(crane,.231,3.84,.25,p.forest,x,2.04,z,.036);
    box(crane,.51,.23,.48,p.steel,x,.26,z,.043);
  }
  for(const z of [-1.85,1.85]){
    box(crane,span,.31,.31,p.jade,beamCenter,3.86,z,.036);
    box(crane,span+.04,.053,.36,p.chrome,beamCenter,4.05,z,.013);
  }
  const trolley=group(scene,-4,3.67,-8.55);
  box(trolley,.72,.28,4.03,p.yellow,0,0,0,.055);
  box(trolley,.85,.29,.58,p.dark,0,-.19,0,.047);
  const cable=cylinder(scene,.040,.040,1,p.dark,-4,2.25,-8.52,8);
  const claw=group(scene,-4,1.4,-8.52);
  box(claw,.60,.16,.33,p.yellow,0,.14,0,.033);
  box(claw,.13,.46,.145,p.dark,-.31,-.13,0,.025).rotation.z=.31;
  box(claw,.13,.46,.145,p.dark,.31,-.13,0,.025).rotation.z=-.31;
  const line=group(scene);
  box(line,3.72,.34,12.28,p.steel,0,.425,.33,.060);
  box(line,3.49,.09,12.29,p.belt,0,.62,.33,.04);
  for(const x of [-1.67,1.67]){
    box(line,.19,.35,12.32,p.belt,x,.69,.33,.042);
    box(line,.075,.049,12.29,p.yellow,x,.884,.33,.011);
    box(line,.047,.026,12.21,p.white,x,.920,.33,.007,false);
    for(const z of [-5.2,-2.55,0,2.55,5.08]){
      box(line,.25,.54,.35,p.forest,x,.415,z,.026);
      box(line,.38,.085,.50,p.steel,x,.19,z,.014);
      box(line,.052,.075,.19,p.chrome,x+Math.sign(x)*.099,.735,z,.008,false);
    }
  }
  const rollers=[],rollerGeo=new T.CylinderGeometry(.108,.108,3.16,12);
  for(let i=0;i<30;i++){
    const z=-5.67+i*.414;
    if(Math.abs(z)<.80)continue;
    const g=group(line,0,.67,z);
    const rollerMaterial=i%4===0?p.chrome:i%2===0?p.beltTop:p.belt;
    mesh(g,rollerGeo,rollerMaterial,0,0,0,false).rotation.z=Math.PI/2;rollers.push(g);
  }
  const saw=group(scene,0,0,-.18);
  box(saw,4.31,.25,2.10,p.dark,0,.281,0,.069);
  box(saw,3.95,.56,1.95,p.jade,0,.68,0,.07);
  for(const x of [-1.81,1.81]){
    box(saw,.43,2.27,1.74,p.jade,x,1.52,0,.085);
    box(saw,.48,.42,1.89,p.yellow,x,2.62,0,.05);
    box(saw,.71,.76,.92,p.forest,x*.92,1.03,.14,.063);
    box(saw,.48,.35,.103,p.white,x,1.86,.94,.037);
  }
  box(saw,4.18,.31,1.75,p.jade,0,2.77,-.09,.085);
  box(saw,3.64,.026,1.22,p.beltTop,0,2.94,-.09,.029);
  for(const x of [-1.36,1.36])box(saw,.565,.09,1.09,p.jade,x,2.99,-.08,.021);
  box(saw,3.66,.38,1.12,p.yellow,0,2.60,-.10,.075);
  box(saw,3.58,.18,.078,p.yellow,0,2.59,.52,.019);
  for(let i=0;i<11;i++)box(saw,.13,.168,.022,p.dark,-1.57+i*.31,2.59,.57,.009).rotation.z=-.45;
  sign(saw,'SAW '+number,1.48,.38,0,2.28,.99,'#294053');
  const blade=group(saw,-.26,1.56,.06);
  const shape=new T.Shape();
  for(let i=0;i<54;i++){
    const a=i/54*TAU,r=i%3===0?.81:.697;
    if(i===0)shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);
    else shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);
  }
  shape.closePath();
  mesh(blade,new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false}),mat('#d6dbce',{metalness:.58,roughness:.29})).rotation.y=Math.PI/2;
  cylinder(blade,.137,.137,.125,p.dark,0,0,0,20).rotation.z=Math.PI/2;
  for(let i=0;i<6;i++){
    const a=i/6*TAU;
    cylinder(blade,.045,.045,.019,p.dark,.058,Math.cos(a)*.227,Math.sin(a)*.227,9).rotation.z=Math.PI/2;
  }
  const beacon=cylinder(saw,.15,.16,.199,mat('#ff984a',{emissive:'#ff6523',emissiveIntensity:.15}),1.73,3.067,-.12,13);
  cylinder(saw,.19,.19,.070,p.dark,1.73,2.941,-.12);
  const motor=group(saw,0,2.96,-.47);
  for(const x of [-.86,.86]){
    box(motor,1.03,.45,.65,p.forest,x,.21,0,.079);
    for(let i=0;i<6;i++)box(motor,.046,.34,.025,p.chrome,x-.36+i*.14,.21,.33,.01);
  }
  const booster=group(saw,0,0,0);
  for(const x of [-2.25,2.25]){
    box(booster,.42,1.12,.96,p.belt,x,.92,-.19,.07);
    for(const z of [-.43,-.16,.11])box(booster,.075,.79,.044,p.chrome,x*1.098,.92,z,.01);
    cylinder(booster,.082,.132,.30,p.yellow,x,1.61,-.19,10);
  }
  const nameplate=sign(saw,'TURBO MILL',2.41,.48,0,3.61,.29,'#213a62');
  const trophy=group(saw,0,3.56,-.13);
  box(trophy,1.80,.13,.79,p.forest,0,.06,0,.037);
  cylinder(trophy,.36,.22,.14,p.yellow,0,.49,0,14);
  cylinder(trophy,.18,.18,.27,p.yellow,0,.27,0,12);
  cylinder(trophy,.38,.24,.42,p.yellow,0,.65,0,18);
  const panel=group(saw,-2.37,0,.43);
  box(panel,.181,1.32,.20,p.dark,0,.79,0,.035);
  box(panel,.55,.44,.45,p.yellow,0,1.58,0,.059).rotation.x=.18;
  box(panel,.36,.15,.03,p.dark,0,1.63,.246,.015);
  for(const x of [-.11,.11])mesh(panel,new T.SphereGeometry(.066,10,7),x<0?p.jade:p.red,x,1.49,.248);
  return {trolley,cable,claw,rollers,blade,beacon,motor,booster,nameplate,trophy};
}
