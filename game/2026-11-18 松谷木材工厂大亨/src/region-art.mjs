import * as T from '../vendor/three.module.js';
import {point,box,mat,mesh,cylinder,group,sign} from './model.mjs';

export const roughOrigin=point(-2.65,0,5.15);
export const finishingCenter=point(-5.5,0,5.05);

export function addLandmark(root,p,site,random){
  const biome=site?.biome??site?.id;
  if(!biome||biome==='pine'){
    const depot=group(root,-4.48,0,-12.3);
    box(depot,1.52,.13,1.53,p.chrome,0,.17,0,.032);
    for(const x of [-.61,.61])box(depot,.13,1.59,.17,p.forest,x,.91,0,.025);
    sign(depot,'TIMBER CO.',1.63,.48,0,1.56,.08,'#245c90');
    return;
  }
  if(biome==='river'){
    const pier=group(root,-12.52,0,-9.6);
    box(pier,2.22,.2,7.2,p.wood,0,.13,0,.035);
    for(let i=0;i<13;i++)box(pier,2.22,.07,.047,p.cream,0,.25,-3.53+i*.58,.006);
    for(const z of [-3.1,-1.5,.10,1.72,3.30])cylinder(pier,.10,.13,.68,p.wood,-1.02,.41,z,9);
    const boat=group(root,-15.3,.10,-10.3);
    box(boat,1.56,.47,4.1,p.forest,0,.13,0,.19);
    box(boat,1.37,.12,3.88,p.belt,0,.41,0,.06);
    box(boat,1.28,.72,1.26,p.white,0,.84,-1.08,.066);
    box(boat,1.17,.32,.04,p.glass,0,.89,-.421,.013);
    box(boat,1.18,.15,1.2,p.yellow,0,1.25,-1.08,.04);
    for(let i=0;i<5;i++)box(boat,.82,.18,1.29,p.wood,0,.55+i*.16,.90,.037);
    for(const z of [-2.6,2.7]){
      cylinder(pier,.16,.18,2.38,p.white,.66,1.36,z,11);
      cylinder(pier,.18,.18,.36,p.belt,.66,2.38,z,11);
    }
  }else{
    const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),mat('#fff'),26);
    const dummy=new T.Object3D();
    for(let i=0;i<26;i++){
      const lane=i%2?1:-1,s=.8+random()*1.85;
      dummy.position.set(lane*(14.2+random()*5.3),s*.23,-19.3+i*.47+random()*9);
      dummy.scale.set(s*.88,s,s*1.20);dummy.rotation.set(random(),random()*5,random()*.6);
      dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
      rocks.setColorAt(i,new T.Color(biome==='ridge'?['#c8d9ef','#e7effa','#879cb9'][i%3]:['#a16f50','#b78358','#c9a173'][i%3]));
    }
    rocks.castShadow=rocks.receiveShadow=true;root.add(rocks);
    if(biome==='ridge'){
      const tower=group(root,11.92,0,-8.28);
      for(const x of [-.52,.52])for(const z of [-.54,.54])box(tower,.13,4.49,.14,p.forest,x,2.34,z,.021);
      box(tower,1.5,.17,1.58,p.white,0,4.60,0,.038);
      cylinder(tower,.033,.042,1.28,p.steel,0,5.28,0,8);
      box(tower,1.34,.53,.095,p.belt,0,4.94,.36,.04);
      for(const [x,z,size] of [[-12.5,-11.7,3.2],[-14,-18.2,5.1],[-7.7,-18.0,3.5]]){
        const peak=group(root,x,0,z);
        mesh(peak,new T.ConeGeometry(size,size*2,5),mat('#839dbc'),0,size*.93,0).rotation.y=.49;
        mesh(peak,new T.ConeGeometry(size*.49,size*.98,5),p.white,0,size*1.44,0).rotation.y=.49;
      }
    }else{
      const silo=group(root,9.85,0,-8.12);
      for(const x of [-.64,.64])for(const z of [-.51,.51])box(silo,.11,1.74,.11,p.forest,x,1.01,z,.016);
      cylinder(silo,.84,.84,2.17,p.chrome,0,2.47,0,18);
      for(const y of [1.63,2.39,3.24])cylinder(silo,.88,.88,.095,p.jade,0,y,0,18);
      cylinder(silo,0,.86,.44,p.jade,0,3.79,0,18);
      sign(silo,'CHIPS',1.38,.36,0,2.18,.85,'#8c393b');
    }
  }
}

export function finishingLine(scene,p,site){
  if(!site?.finish)return null;
  const stage=site.finish, line=group(scene,finishingCenter.x,0,finishingCenter.z);
  const aprons=group(line,0,0,1.12);
  box(aprons,3.31,.16,5.7,p.steel,0,.231,0,.047);
  box(aprons,2.60,.11,5.8,p.belt,0,.43,0,.028);
  for(const x of [-1.38,1.38])box(aprons,.095,.13,5.75,p.yellow,x,.51,0,.014);
  for(let i=0;i<13;i++){
    const r=cylinder(aprons,.09,.09,2.53,i%3===0?p.chrome:i%2===0?p.beltTop:p.belt,0,.48,-2.64+i*.429,10);
    r.rotation.z=Math.PI/2;
  }
  box(line,3.02,.23,2.51,p.dark,0,.365,.3,.049);
  const heat=mat('#ffbc69',{emissive:'#ff7433',emissiveIntensity:.08});
  const moving=group(line,0,0,.37);
  if(stage.id==='kiln'){
    box(line,3.01,2.32,2.48,p.forest,0,1.63,.28,.13);
    box(line,2.72,2.20,2.57,p.jade,0,1.62,.39,.11);
    box(line,2.07,1.15,.070,p.dark,0,1.44,1.70,.06);
    box(line,1.71,.827,.078,heat,0,1.44,1.711,.050);
    for(const x of [-.65,0,.65])box(line,.049,.827,.091,p.forest,x,1.44,1.74,.022);
    box(moving,.65,.059,1.51,p.chrome,0,2.80,0,.015);
    box(moving,1.51,.057,.65,p.chrome,0,2.80,0,.015);
    const ring=cylinder(line,.91,.91,.14,p.dark,0,2.84,.37,28);
    ring.material=p.forest;
    moving.position.y=.15;
    for(const x of [-1.075,1.075]){
      cylinder(line,.17,.22,.67,p.chrome,x,2.88,.39);
      cylinder(line,.23,.23,.09,p.forest,x,3.20,.39);
    }
  }else if(stage.id==='plane'){
    for(const x of [-1.22,1.22])box(line,.47,2.54,2.10,p.jade,x,1.63,.37,.093);
    box(line,3.13,.30,2.22,p.yellow,0,2.94,.37,.085);
    box(line,2.10,.51,.17,p.forest,0,2.30,1.46,.026);
    box(moving,2.42,.27,.58,p.chrome,0,1.54,0,.065);
    box(moving,2.08,.048,.63,heat,0,1.41,0,.022);
    cylinder(line,.24,.24,1.16,p.steel,1.02,3.12,.73);
    cylinder(line,.31,.31,.26,p.yellow,1.02,3.78,.73);
  }else{
    box(line,3.44,.26,2.56,p.belt,0,.55,.40,.07);
    for(const x of [-1.35,1.35])for(const z of [-.64,1.43]){
      cylinder(line,.14,.14,2.55,p.chrome,x,1.88,z,14);
      box(line,.29,.43,.30,p.jade,x,2.89,z,.037);
    }
    box(line,3.50,.44,2.51,p.jade,0,3.00,.39,.08);
    box(moving,3.0,.24,1.58,p.yellow,0,2.20,0,.08);
    for(const x of [-.80,.80])cylinder(moving,.095,.095,.72,p.chrome,x,2.63,0,10);
    box(line,2.19,.30,.052,heat,0,3.01,1.68,.025);
  }
  sign(line,stage.building,1.86,.37,0,stage.id==='press'?3.31:2.57,stage.id==='press'?1.71:1.78,'#254677');
  for(const x of [-1.43,1.43]){
    box(line,.14,.27,.91,p.yellow,x,.35,2.53,.031);
    box(line,.18,.055,.86,p.dark,x,.51,2.56,.014);
  }
  box(scene,2.04,.08,3.71,p.forest,roughOrigin.x,.19,roughOrigin.z,.027);
  for(let i=0;i<4;i++)box(scene,.11,.12,3.37,p.wood,roughOrigin.x-.69+i*.46,.29,roughOrigin.z,.019);
  return {moving,heat};
}
