import * as T from '../vendor/three.module.js';
import { buildingBase, DECK, groundHeight, floorHeight, tide } from './rules.mjs';
import { WRECK, wreckWidth, SALVAGE } from './voyage-state.mjs';
import { salvageReady } from './voyage.mjs';

function hull(tools, group, length, width, base, height, colors) {
  const {mesh,material}=tools,positions=[],colorList=[],color=new T.Color();
  const sections=[[-.5,.03],[-.36,.83],[0,1],[.35,.84],[.5,.035]];
  const levels=[[0,.45],[.45,.85],[1,1]];
  function tri(a,b,c,col){positions.push(...a,...b,...c);color.set(col);for(let i=0;i<3;i++)colorList.push(color.r,color.g,color.b);}
  for(const side of [-1,1])for(let i=0;i<sections.length-1;i++)for(let j=0;j<levels.length-1;j++){
    const [z,w]=sections[i],[nz,nw]=sections[i+1],[y,spread]=levels[j],[ny,nspread]=levels[j+1];
    const a=[side*w*width/2*spread,base+y*height,z*length],b=[side*nw*width/2*spread,base+y*height,nz*length];
    const c=[side*nw*width/2*nspread,base+ny*height,nz*length],d=[side*w*width/2*nspread,base+ny*height,z*length];
    tri(a,b,c,colors[j]);tri(a,c,d,colors[j]);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colorList,3));geo.computeVertexNormals();
  mesh(geo,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1,side:T.DoubleSide}),group);
}
export function voyageStructure(b,s,tools) {
  const {box,cylinder,beam,sphere}=tools,g=new T.Group();
  if(b.type==='dock'){
    for(const x of [-.9,.9])for(const z of [-.88,.88]){
      cylinder(g,'#927350',x,DECK+.37,z,.07,.085,.85,7);cylinder(g,'#e4c995',x,DECK+.81,z,.085,.085,.055,8);
      const rope=new T.Mesh(new T.TorusGeometry(.105,.018,5,12),new T.MeshStandardMaterial({color:'#dfcba0',roughness:1}));rope.position.set(x,DECK+.24,z);rope.rotation.x=Math.PI/2;g.add(rope);
    }
    for(const x of [-.8,.8])box(g,'#d8be84',x,DECK+.035,.7,.26,.07,.45);
    beam(g,[-.78,DECK+.58,-.9],[.78,DECK+.58,-.9],.025,'#dfcba0');
    box(g,'#578e94',-.89,DECK+.53,.15,.035,.3,.42);box(g,'#f6deaa',-.86,DECK+.53,.15,.02,.2,.05);
    box(g,'#e5c897',0,DECK+.02,.7,.08,.02,.42);
    beam(g,[-.13,DECK+.04,.72],[0,DECK+.04,.9],.022,'#fbedd0',4);beam(g,[.13,DECK+.04,.72],[0,DECK+.04,.9],.022,'#fbedd0',4);
  }
  if(b.type==='workbench'){
    const y=buildingBase(s,b);
    for(const x of [-.62,.62])for(const z of [-.32,.32])box(g,'#99744d',x,y+.4,z,.105,.8,.11);
    box(g,'#bb965f',0,y+.82,0,1.64,.15,1.03);box(g,'#8f704a',0,y+.2,0,1.3,.08,.7);
    box(g,'#59838b',.3,y+.913,.12,.5,.025,.65);box(g,'#e9d2a3',-.32,y+.918,-.06,.55,.025,.39);
    cylinder(g,'#a8beb2',.48,y+.99,-.12,.09,.09,.18,6);box(g,'#7d9293',-.12,y+.97,.29,.3,.12,.1);
    beam(g,[-.2,y+.94,.16],[.05,y+.94,.45],.025,'#9c754d',5);
    const shelf=new T.Group();shelf.position.set(-.55,y+1.03,-.28);g.add(shelf);
    beam(g,[0,-.1,0],[0,.62,0],.03,'#8e7353');beam(g,[0,.62,0],[.34,.62,0],.025,'#8e7353');
    box(shelf,s?.voyage.lamp?'#ffd190':'#d2bf8d',.31,.41,0,.19,.27,.16);
    box(shelf,'#73684d',.31,.57,0,.23,.045,.2);box(shelf,'#73684d',.31,.25,0,.23,.045,.2);
    if(s?.voyage.lamp){sphere(shelf,'#ffe4a4',.31,.43,0,.09);const light=new T.PointLight('#ffc987',1.5,4,1.3);light.position.set(.31,.45,0);shelf.add(light);}
  }
  g.position.set(b.x,0,b.z);g.rotation.y=b.rotation*Math.PI/2;
  g.traverse(o=>{if(o.isMesh)o.userData.buildingId=b.id;});return g;
}

export function createVoyageWorld(scene,tools) {
  const {mesh,box,cylinder,beam,sphere,material}=tools;
  const group=new T.Group();scene.add(group);group.visible=false;
  const ship=new T.Group();group.add(ship);ship.position.set(WRECK.x,0,WRECK.z);ship.rotation.y=WRECK.angle;
  hull(tools,ship,6.8,3,-.63,1.9,['#526d68','#8f9478']);
  for(let i=0;i<19;i++){
    const z=-2.8+i*.31,w=wreckWidth(z)*2;if(w>.1)box(ship,i%3?'#b4a77e':'#948f73',0,WRECK.deck-.07,z,w,.14,.285);
  }
  for(const side of [-1,1])for(let i=0;i<8;i++){
    const z=-2.55+i*.72,w=wreckWidth(z);if(w>.3){cylinder(ship,'#7d8068',side*(w+.05),1.15,z,.045,.06,.5,6);if(i%3!==1)beam(ship,[side*w,1.35,z],[side*w,1.35,Math.min(2.7,z+.58)],.035,'#8d8c6f');}
  }
  beam(ship,[0,.9,-.7],[-.44,4.3,-.28],.1,'#8b8367',8);beam(ship,[-1.2,3.25,-.35],[1.15,3.25,-.35],.045,'#8f876a');
  beam(ship,[-.44,4.3,-.28],[1.05,1.3,2.4],.016,'#d0bb8c',4);
  beam(ship,[-.44,4.3,-.28],[-1.2,1.25,-2],.016,'#c2b287',4);
  const sailGeo=new T.BufferGeometry();sailGeo.setAttribute('position',new T.Float32BufferAttribute([-.4,4.05,-.25,-1.12,3.28,-.34,-.7,2.55,-.1,-.4,4.05,-.25,-.7,2.55,-.1,.62,2.9,-.1],3));sailGeo.computeVertexNormals();
  mesh(sailGeo,material('#d7caa5',{side:T.DoubleSide}),ship);
  for(const p of [{x:-.93,z:-1.8},{x:.92,z:1.45}]){box(ship,'#8e8c6e',p.x,1.16,p.z,.45,.4,.5);beam(ship,[p.x-.2,1.38,p.z],[p.x+.2,1.38,p.z],.024,'#c1b487');}
  const hatch=box(ship,'#47645e',0,WRECK.deck+.014,1.12,.82,.025,.83);
  for(const x of [-.48,.48])box(ship,'#8c8969',x,1.02,1.12,.08,.12,1.03);
  for(const z of [.62,1.62])box(ship,'#8c8969',0,1.02,z,1.05,.12,.08);
  for(let i=0;i<10;i++){const a=i*1.8;sphere(ship,'#b8bb98',Math.sin(a)*1.42,.18,Math.cos(a)*2.6,.095,1,.65,1);}
  ship.traverse(o=>{if(o.isMesh)o.userData.voyageId='wreck';});
  hatch.userData.voyageId='salvage:hold';
  const salvageModels=new Map();
  for(const p of SALVAGE){
    const g=new T.Group();group.add(g);g.position.set(p.x,0,p.z);
    if(p.id==='hold'){
      box(g,'#8b7152',0,.25,0,.54,.38,.43);box(g,'#c1ab72',0,.45,0,.57,.055,.46);
      box(g,'#d7b66c',0,.3,.23,.1,.12,.03);
      const lamp=new T.Group();lamp.position.set(.28,.55,.03);g.add(lamp);box(lamp,'#d8bd7b',0,.12,0,.15,.23,.13);box(lamp,'#7a7257',0,.25,0,.19,.04,.17);
    }else{
      box(g,p.id==='drift'?'#ac895a':'#899779',0,.2,0,.85,.52,.72);box(g,'#c9b27d',0,.48,0,.9,.06,.77);
      for(const x of [-.32,.32]){box(g,'#657d79',x,.22,.375,.07,.58,.035);box(g,'#657d79',x,.52,0,.07,.035,.76);}
      box(g,'#97b7ab',0,.56,0,.28,.06,.2);
    }
    g.traverse(o=>{if(o.isMesh)o.userData.voyageId=`salvage:${p.id}`;});salvageModels.set(p.id,g);
  }
  const boat=new T.Group();group.add(boat);hull(tools,boat,3.5,1.5,-.16,.67,['#9a7149','#c29c65']);
  for(let i=0;i<10;i++){const z=-1.4+i*.31,w=Math.max(.15,(1-Math.pow(z/1.8,2))*.66);box(boat,i%2?'#bf985d':'#d0ad75',0,.13,z,w*2,.08,.28);}
  for(const z of [-.56,.55])box(boat,'#e2c088',0,.43,z,1.28,.12,.24);
  for(const x of [-.72,.72])beam(boat,[x,.52,-.95],[x,.52,.95],.045,'#dfbd83');
  cylinder(boat,'#977a4e',0,.68,-1.08,.025,.035,.6,6);box(boat,'#609ca2',.16,.87,-1.08,.31,.2,.025);
  const oars=[];
  for(const sign of [-1,1]){const oar=new T.Group();oar.position.set(sign*.72,.42,.02);boat.add(oar);beam(oar,[0,0,0],[sign*1.08,-.35,.14],.025,'#af8854');box(oar,'#d4b681',sign*1.03,-.32,.14,.28,.075,.38);oars.push(oar);}
  boat.traverse(o=>{if(o.isMesh)o.userData.voyageId='boat';});
  const wake=new T.Group();group.add(wake);
  for(const side of [-1,1]){const geo=new T.BufferGeometry(),positions=[];for(let i=0;i<18;i++){const t=i/17;positions.push(side*(.5+t*.7),.02,-.9-t*2.8);}geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));wake.add(new T.Line(geo,new T.LineBasicMaterial({color:'#e8f1cf',transparent:true,opacity:.55,depthWrite:false})));}
  const dockHint=new T.Group();group.add(dockHint);const hintGeo=new T.RingGeometry(.25,.29,40);const hint=new T.Mesh(hintGeo,new T.MeshBasicMaterial({color:'#f5dd97',transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));hint.rotation.x=-Math.PI/2;dockHint.add(hint);
  function update(s,time,moving){
    group.visible=Boolean(s.voyage?.started);if(!group.visible)return;
    const v=s.voyage,t=tide(s),b=v.boat;
    boat.visible=Boolean(b);wake.visible=Boolean(b?.aboard&&moving);
    if(b){boat.position.set(b.x,t.water+.16+Math.sin(time*2.4)*.025,b.z);boat.rotation.set(Math.sin(time*2.2)*.013,b.angle,Math.sin(time*1.8)*.025);wake.position.set(b.x,t.water+.035,b.z);wake.rotation.y=b.angle;
      oars.forEach((o,i)=>{o.rotation.y=b.aboard&&moving?Math.sin(time*7.5+i*.3)*.48:0;o.rotation.z=b.aboard&&moving?Math.cos(time*7.5)*.14:0;});}
    for(const p of SALVAGE){const g=salvageModels.get(p.id);g.visible=salvageReady(s,p)&&(p.id!=='hold'||t.water<.24);
      g.position.y=p.id==='hold'?.82:t.water+Math.sin(time*2+p.x)*.025;g.rotation.y=p.id==='hold'?WRECK.angle:.3+Math.sin(time*.4+p.z)*.09;}
    const dock=s.buildings.find(b=>b.type==='bridge'&&b.x>7&&b.x<10);
    dockHint.visible=!v.goals.dock&&Boolean(dock);if(dock){dockHint.position.set(dock.x,DECK+.02,dock.z);hint.scale.setScalar(1+Math.sin(time*2)*.1);}
  }
  return {update,pickables:()=>group.visible?[ship,...[...salvageModels.values()].filter(o=>o.visible),...(boat.visible?[boat]:[])]:[]};
}
