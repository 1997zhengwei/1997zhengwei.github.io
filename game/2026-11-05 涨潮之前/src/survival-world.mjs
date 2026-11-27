import * as T from '../vendor/three.module.js';
import { buildingBase,groundHeight } from './rules.mjs';
import { CHUNK,chunkIsland } from './frontier-state.mjs';
import { supplyPosition } from './survival.mjs';

export function survivalStructure(b,s,h){
  const {box,cylinder,beam,sphere,batch}=h,g=new T.Group(),base=buildingBase(s,b),wood='#aa8053',stone='#8a9d95',cream='#e2c692';
  if(b.type==='seawall'){
    for(let row=0;row<4;row++)for(let j=0;j<4;j++)box(g,row%2?stone:'#a4b3a2',(j-1.5)*.51+(row%2?.08:0),base+.18+row*.3,0,.49,.29,.68-row*.07);
    box(g,cream,0,base+1.38,0,2.12,.12,.52);
  }else if(b.type==='windbreak'){
    for(const x of [-.9,.9])cylinder(g,wood,x,base+.9,0,.07,.1,1.9);
    for(let i=0;i<8;i++)box(g,i%2?'#cab487':'#b9a47a',0,base+.16+i*.2,0,1.84,.17,.13);
    beam(g,[-.87,base+.1,.09],[.87,base+1.65,.09],.05,wood);
  }else if(b.type==='station'){
    for(const x of [-.6,.6])for(const z of [-.4,.4])cylinder(g,wood,x,base+.45,z,.045,.06,.9);
    box(g,cream,0,base+.94,0,1.5,.12,1.05);
    box(g,'#4d7e7b',0,base+1.08,.05,.9,.18,.6);
    cylinder(g,wood,.5,base+1.8,-.3,.035,.035,1.8);
    beam(g,[.5,base+2.5,-.7],[.5,base+2.5,.3],.025,cream);
    box(g,'#cf8560',.5,base+2.55,.25,.34,.18,.38);
    cylinder(g,'#e1b969',-.38,base+1.25,0,.13,.13,.12);
  }else if(b.type==='stove'){
    for(const x of [-.33,.33])box(g,stone,x,base+.35,0,.24,.7,.7);
    box(g,'#526b69',0,base+.1,0,.8,.18,.8);
    box(g,'#758b80',0,base+.8,0,1,.18,.9);
    cylinder(g,'#5c736d',0,base+1.18,-.13,.13,.15,.75);
    box(g,cream,0,base+1.63,-.13,.64,.12,.57);
    for(const x of [-.24,0,.24])box(g,'#ddb788',x,base+.36,.38,.035,.39,.04);
  }else if(b.type==='beacon'){
    cylinder(g,stone,0,base+.24,0,.55,.7,.48);
    for(const x of [-.3,.3])for(const z of [-.3,.3])cylinder(g,wood,x,base+1.6,z,.055,.08,2.7);
    box(g,'#ffe2a3',0,base+2.83,0,.57,.65,.57);
    cylinder(g,'#67958b',0,base+3.29,0,0,.7,.4,4);
    for(let i=0;i<5;i++)box(g,cream,0,base+.65+i*.4,.34,.65,.05,.06);
  }else if(b.type==='garden'){
    box(g,'#705d43',0,base+.15,0,1.55,.2,1.55);
    for(const z of [-.85,.85])box(g,wood,0,base+.2,z,1.8,.35,.12);
    for(const x of [-.85,.85])box(g,wood,x,base+.2,0,.12,.35,1.8);
    for(let i=0;i<9;i++){const x=(i%3-1)*.46,z=(Math.floor(i/3)-1)*.46;cylinder(g,'#6f9a67',x,base+.5,z,.09,.15,.65);sphere(g,'#a6bd78',x,base+.79,z,.18);}
  }else{
    for(const x of [-.6,.6])for(const z of [-.5,.5])box(g,wood,x,base+.45,z,.12,.9,.12);
    box(g,cream,0,base+.95,0,1.65,.16,1.5);
    if(b.type==='lumbermill'){
      for(let i=0;i<3;i++){const m=cylinder(g,i%2?wood:cream,0,base+1.13+i*.17,0,.16,.16,1.32);m.rotation.z=Math.PI/2;}
      cylinder(g,'#87a5a0',.4,base+1.54,0,.36,.36,.08,12).rotation.z=Math.PI/2;
    }else{
      box(g,'#65938e',-.33,base+1.17,0,.6,.35,.8);sphere(g,stone,.43,base+1.2,.15,.25);box(g,'#abc7c0',.3,base+1.15,-.3,.3,.3,.25);
    }
  }
  // The pale arrow points INTO the incoming wind, making direction tangible.
  if(['seawall','windbreak'].includes(b.type)){
    box(g,'#f4d68f',0,base+1.52,.34,.09,.06,.48);
    beam(g,[0,base+1.52,.6],[-.18,base+1.52,.4],.035,'#f4d68f');beam(g,[0,base+1.52,.6],[.18,base+1.52,.4],.035,'#f4d68f');
  }
  if((b.hp??100)<75)beam(g,[-.25,base+.1,.42],[.25,base+.6,.42],.027,'#5e6055');
  batch(g);
  if(b.type==='stove'){const flame=new T.Mesh(new T.ConeGeometry(.16,.43,7),new T.MeshStandardMaterial({color:'#f8bf6b',emissive:'#f89535',emissiveIntensity:.7}));flame.material.userData.local=true;flame.position.set(0,base+.42,.08);g.add(flame);g.userData.flames=flame;}
  if(['stove','beacon'].includes(b.type)){
    const light=new T.PointLight('#ffd18b',b.type==='beacon'?3:2.5,b.type==='beacon'?12:5,1.6);light.position.set(0,base+(b.type==='beacon'?2.9:.6),0);g.add(light);g.userData.light=light;
  }
  g.position.set(b.x,0,b.z);g.rotation.y=b.rotation*Math.PI/2;
  g.traverse(o=>{if(o.isMesh)o.userData.buildingId=b.id;});return g;
}

export function createFrontierWorld(scene,{terrain,resourceModel,dispose}){
  const chunks=new Map();let chunkKey='';const supply=resourceModel('crate');scene.add(supply);supply.traverse(o=>{if(o.isMesh)o.userData.survivalId='supply';});supply.visible=false;
  return{
    update(s,time,focus=s.player){
      supply.visible=Boolean(s.survival.started&&s.survival.supplyDay!==s.survival.day);
      if(supply.visible){const p=supplyPosition(s);supply.position.set(p.x,groundHeight(p.x,p.z)+.07+Math.sin(time*2)*.045,p.z);}
      if(!s.survival.started)return;
      const cx=Math.floor(focus.x/CHUNK),cz=Math.floor(focus.z/CHUNK),key=`${cx},${cz}`;if(key===chunkKey)return;chunkKey=key;
      const wanted=new Set();for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++){
        const i=chunkIsland(x,z);if(!i)continue;const k=`${x},${z}`;wanted.add(k);
        if(!chunks.has(k))chunks.set(k,terrain(scene,[i.x-i.rx-1,i.z-i.rz-1,i.rx*2+2,i.rz*2+2],.7));
      }
      for(const [k,obj]of chunks)if(!wanted.has(k)){scene.remove(obj);dispose(obj);chunks.delete(k);}
    },
    pickables:()=>[...chunks.values(),...(supply.visible?[supply]:[])],
  };
}
