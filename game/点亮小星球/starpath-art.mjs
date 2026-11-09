import * as THREE from './vendor/three.module.js';
import {ZONES,FACILITIES,STATIONS,PADS,EVENTS,OBSTACLES,GATE_Z,SPAWN_POINTS,depth,NODES,MAX_DEPTH,zoneAt,stationCost,AURORA} from './starpath-rules.mjs';

// Original aerospace models. All scenery uses the same coordinates as the
// authoritative map; raised decorative terrain starts outside the playable edge.
export const ART = {
  ink:'#17334c', white:'#f1f5ee', panel:'#cad9dc', teal:'#27cbbd',
  blue:'#508bb9', gold:'#ffbd57', coral:'#ee7288', lilac:'#9680dc',
  zones:[
    {floor:'#63b9a3',light:'#91ccaf',rock:'#416e80',edge:'#355774',flora:'#258d88',ore:'#57e3bd'},
    {floor:'#cfaa73',light:'#f0d59b',rock:'#997554',edge:'#775d57',flora:'#ac8b4e',ore:'#ffcf67'},
    {floor:'#8d83bd',light:'#c1acd9',rock:'#585d91',edge:'#3c4c78',flora:'#7460ac',ore:'#c2a0ff'},
    {floor:'#8dc4dc',light:'#d1f0ec',rock:'#508aaf',edge:'#496e98',flora:'#6facbe',ore:'#a3f5ff'},
    {floor:'#7c9caf',light:'#b6c8cc',rock:'#495972',edge:'#36455e',flora:'#508c91',ore:'#89c5ff'},
    {floor:'#bd849e',light:'#e5b6c1',rock:'#77597f',edge:'#504265',flora:'#ce6c8b',ore:'#ffb7dd'},
    {floor:'#aaa3cc',light:'#ddd9ee',rock:'#7c87ad',edge:'#535f8c',flora:'#62bcb8',ore:'#a8f3ef'},
    {floor:'#99b7cb',light:'#d4e8ec',rock:'#617c9f',edge:'#4c5d84',flora:'#8aace0',ore:'#b6edff'},
    {floor:'#aaa1c3',light:'#e0d9e9',rock:'#71688d',edge:'#514d73',flora:'#b59acb',ore:'#d8bbff'},
  ],
};

ART.zones.push(...['#99d9c4','#b5bfeb','#eccca2'].map((floor,i)=>({floor,light:['#e4fff1','#e9ebff','#fff2d8'][i],edge:'#647b91',rock:'#8399af',flora:['#67cdb9','#b098e0','#e5b775'][i],ore:['#9affdf','#dcc7ff','#ffe5ac'][i]})));
export function roundedGeometry() {
  const g=new THREE.BoxGeometry(1,1,1,4,4,4),p=g.attributes.position;
  const inner=.38,radius=.12,v=new THREE.Vector3(),c=new THREE.Vector3();
  for(let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);c.set(THREE.MathUtils.clamp(v.x,-inner,inner),THREE.MathUtils.clamp(v.y,-inner,inner),THREE.MathUtils.clamp(v.z,-inner,inner));
    v.sub(c).normalize().multiplyScalar(radius).add(c);p.setXYZ(i,v.x,v.y,v.z);
  }
  g.computeVertexNormals();return g;
}

export function buildStarpathArt({root,part,ring,textSprite,healthBar,mat,geometry,optimizeTree,mergeStatic}) {
  const facilityTags=[],animations=[],terrain=[];
  const seed=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
  const block=(g,c,x,y,z,w,h,d,glow=0)=>part(g,'round',c,x,y,z,w,h,d,glow);
  function label(g,text,x,y,z,width=3.2,color=ART.ink){
    const tag=textSprite(text,{width,size:28,bg:'#f2f7f0ed',color});tag.position.set(x,y,z);g.add(tag);return tag;
  }
  function cable(g,points,color=ART.teal,radius=.055){
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,12,radius,5,false),mat(color,.12));g.add(mesh);return mesh;
  }
  function pad(g,r=2.15){
    part(g,'cylinder',ART.ink,0,.08,0,r,.16,r);
    part(g,'cylinder',ART.panel,0,.19,0,r*.95,.16,r*.95);
    ring(g,r*.94,ART.teal,.7,.045).position.y=.29;
  }
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,1,32,32,32);
  sg.addColorStop(0,'#102b4890');sg.addColorStop(.5,'#102b4840');sg.addColorStop(1,'#102b4800');sc.fillStyle=sg;sc.fillRect(0,0,64,64);
  const shadowMap=new THREE.CanvasTexture(shadowCanvas),shadowMat=new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,opacity:.65});
  function contact(g,x,z,w,d){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),shadowMat);m.rotation.x=-Math.PI/2;m.position.set(x,.055,z);g.add(m)}
  const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=512;
  const gc=grainCanvas.getContext('2d');gc.fillStyle='#f2f5f1';gc.fillRect(0,0,512,512);
  for(let i=0;i<2300;i++){
    gc.fillStyle=i%3?'#36545c0c':'#ffffff50';const x=seed(i+4)*512,y=seed(i+555)*512;
    gc.fillRect(x,y,.7+seed(i+99)*2.5,.6+seed(i+24)*2);
  }
  for(let i=0;i<14;i++){
    gc.fillStyle=i%2?'#4d687809':'#ffffff25';gc.beginPath();
    const x=seed(i+39)*512,y=seed(i+59)*512,r=15+seed(i+62)*55;
    for(let j=0;j<7;j++){const a=j*Math.PI*2/7,rr=r*(.7+seed(i+j)*.5);gc.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.6);}gc.closePath();gc.fill();
  }
  const grainMap=new THREE.CanvasTexture(grainCanvas);grainMap.colorSpace=THREE.SRGBColorSpace;grainMap.wrapS=grainMap.wrapT=THREE.RepeatWrapping;

  function terrainFor(zone){
    const length=zone.end-zone.start,z=GATE_Z-(zone.start+zone.end)/2,colors=ART.zones[zone.id];
    const geo=new THREE.PlaneGeometry(132,length,44,Math.ceil(length/3));geo.rotateX(-Math.PI/2);
    const pos=geo.attributes.position,values=[];
    const swatches=ART.zones.map(c=>Object.fromEntries(['floor','light','edge','rock'].map(key=>[key,new THREE.Color(c[key])])));
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),localZ=pos.getZ(i),worldZ=localZ+z,outer=Math.max(0,Math.abs(x)-23.3);
      const d=GATE_Z-worldZ;
      const blend=key=>{const c=swatches[0][key].clone();for(let j=1;j<ZONES.length;j++){const boundary=j===6?635:ZONES[j].start,t=THREE.MathUtils.smoothstep(d+Math.sin(x*.23+j)*2.4,boundary-5,boundary+5);c.lerp(swatches[j][key],t)}return c};
      const base=blend('floor'),light=blend('light'),edge=blend('edge'),shade=blend('rock');
      const ridge=Math.min(9,outer*.28)*( .68+.32*Math.sin(worldZ*.09+x*.18));
      pos.setY(i,outer?ridge-.035:-.035);
      const patch=(Math.sin(x*.28+Math.cos(worldZ*.11)*2)+Math.cos(worldZ*.24+x*.13))*.5;
      const col=base.clone().lerp(light,Math.max(0,patch)*.36).lerp(shade,Math.max(0,-patch)*.18);
      if(Math.abs(x)<4.5+Math.sin(worldZ*.12)*.8)col.lerp(light,.18);
      if(outer>0)col.lerp(edge,Math.min(.88,outer/18));
      col.multiplyScalar(.96+seed(x*11+worldZ*7)*.08);values.push(col.r,col.g,col.b);
    }
    geo.setAttribute('color',new THREE.Float32BufferAttribute(values,3));geo.computeVertexNormals();
    const map=grainMap.clone();map.repeat.set(132/16,length/16);
    const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map,vertexColors:true,roughness:.93,metalness:0,flatShading:true}));mesh.position.z=z;mesh.receiveShadow=true;root.add(mesh);terrain.push(mesh);
    // An irregular rim frames the trail. The physical playing width remains 46m.
    const cliffs=new THREE.Group();root.add(cliffs);
    for(let i=0;i<Math.ceil(length/7);i++)for(const side of [-1,1]){
      const worldZ=GATE_Z-zone.start-i*7-3,x=side*(26+seed(i*5+zone.id)*6),height=2.8+seed(i+53)*6;
      const rock=part(cliffs,'rock',i%3?colors.edge:colors.rock,x,height*.38,worldZ,3.8+seed(i+7)*3,height,4.5);
      rock.rotation.set(.15,seed(i)*5,side*.16);
      if(i%3===0)part(cliffs,'crystal',colors.ore,x,height*1.08,worldZ,.5,1.7,.55,.09);
    }
    optimizeTree(cliffs);
  }
  ZONES.forEach(terrainFor);
  if(MAX_DEPTH>620)terrainFor({...ZONES[6],start:620,end:700});
  terrainFor({...ZONES[0],start:-45,end:0});
  const baseSurroundings=new THREE.Group();root.add(baseSurroundings);
  for(const side of [-1,1]){
    for(let i=0;i<4;i++){
      const x=side*(15.2+seed(i+104)*4),z=-6+i*7;
      part(baseSurroundings,'rock',i%2?'#4d8691':'#689e98',x,.7,z,1.4,1.05,1.6);
      if(i%2){
        block(baseSurroundings,ART.ink,side*14.2,.35,z,1.7,.55,1.7);
        const panel=block(baseSurroundings,ART.blue,side*14.2,1.1,z,2.4,.10,2);panel.rotation.z=side*.2;
        for(let j=-1;j<=1;j++)block(baseSurroundings,'#7ab4d3',side*14.2,1.22,z+j*.5,2.15,.02,.06);
      }else{
        block(baseSurroundings,ART.white,side*13.8,.65,z,1.1,1.2,1.5);
        block(baseSurroundings,ART.gold,side*13.8,1.28,z,1.15,.13,1.55);
        block(baseSurroundings,ART.ink,side*13.8,.68,z+.77,.6,.45,.035);
      }
    }
    block(baseSurroundings,ART.ink,side*14,.3,-10,1.3,.5,1.3);
    part(baseSurroundings,'cylinder',ART.white,side*14,2.4,-10,.09,4.2,.09);
    part(baseSurroundings,'ball',ART.teal,side*14,4.55,-10,.2,.2,.2,.3);
  }
  optimizeTree(baseSurroundings);

  // Soft, sandy islands break up the large floor without adding fake obstacles.
  const islands=new THREE.Group();root.add(islands);
  const islandMaterials=ART.zones.map(c=>new THREE.MeshBasicMaterial({color:c.light,transparent:true,opacity:.11,depthWrite:false}));
  for(let i=0;i<160;i++){
    const z=-17-seed(i+93)*(MAX_DEPTH-8),x=(i%2?1:-1)*(3.8+seed(i+45)*15),c=ART.zones[zoneAt({z})];
    const m=new THREE.Mesh(new THREE.CircleGeometry(1,7),islandMaterials[zoneAt({z})]);
    m.rotation.x=-Math.PI/2;m.rotation.z=seed(i)*6;m.position.set(x,.012,z);m.scale.set(1.8+seed(i+3)*2.5,.7+seed(i+10)*1.4,1);islands.add(m);
  }
  optimizeTree(islands);
  // Keep the central route open. Tiny lights and periodic distance signs replace
  // the old continuous rectangular runway.
  const routeProps=new THREE.Group();root.add(routeProps);
  for(let d=4;d<MAX_DEPTH;d+=10){
    const z=GATE_Z-d,x=(d%20?1:-1)*(3.1+Math.sin(d*.1)*.35);
    block(routeProps,ART.ink,x,.15,z,.30,.30,.5);block(routeProps,ART.teal,x,.33,z,.17,.08,.35,.5);
    if(d%30===4){const tag=label(routeProps,String(d-4).padStart(2,'0')+'m',x,.65,z,1.4);tag.material.depthTest=true;}
  }
  optimizeTree(routeProps);

  const hub=new THREE.Group();root.add(hub);
  // Aerospace deck: inset seams, dark underbody and a legible central departure lane.
  block(hub,ART.ink,0,-.6,5,25.7,1.3,34.9);
  block(hub,ART.white,0,-.12,5,25.0,.4,34.4);
  const floorCanvas=document.createElement('canvas');floorCanvas.width=512;floorCanvas.height=700;
  const fc=floorCanvas.getContext('2d');fc.fillStyle='#d5e2df';fc.fillRect(0,0,512,700);
  fc.strokeStyle='#b4c6ca';fc.lineWidth=1;
  for(let x=0;x<=512;x+=64)for(let y=0;y<700;y+=70){fc.strokeRect(x+2,y+2,60,66);fc.fillStyle='#a7bfc5';fc.fillRect(x+7,y+8,3,3);fc.fillRect(x+54,y+58,3,3);}
  fc.fillStyle='#35536b';fc.fillRect(209,0,94,700);fc.fillStyle='#223b53';fc.fillRect(223,0,66,700);
  fc.fillStyle='#55dbce';fc.fillRect(212,0,3,700);fc.fillRect(297,0,3,700);
  for(let y=25;y<700;y+=80){fc.fillStyle='#9cf5d9';fc.beginPath();fc.moveTo(256,y);fc.lineTo(244,y+15);fc.lineTo(249,y+15);fc.lineTo(256,y+7);fc.lineTo(263,y+15);fc.lineTo(268,y+15);fc.closePath();fc.fill();}
  const floorMap=new THREE.CanvasTexture(floorCanvas);floorMap.colorSpace=THREE.SRGBColorSpace;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(24.3,34.1),new THREE.MeshStandardMaterial({map:floorMap,roughness:.64,metalness:.15}));floor.rotation.x=-Math.PI/2;floor.position.set(0,.11,5);floor.receiveShadow=true;hub.add(floor);
  for(const side of [-1,1]){
    block(hub,ART.ink,side*12.25,.18,5,.33,.45,33.5);
    block(hub,ART.white,side*12.25,.45,5,.38,.18,33.5);
    block(hub,ART.teal,side*12.25,.36,5,.39,.045,32.5,.3);
    block(hub,ART.ink,side*8.75,.2,-12,7.1,.5,.32);
    for(let j=0;j<5;j++)block(hub,ART.gold,side*11.7,.13,1+j*4,.5,.035,.25);
  }
  for(const p of SPAWN_POINTS)ring(hub,.53,'#7eaaa9',.55,.028).position.set(p.x,.13,p.z);
  contact(hub,-6,0,7,6);contact(hub,6,0,7,6);contact(hub,0,16,7,8);
  optimizeTree(hub);

  for(const f of FACILITIES){
    const g=new THREE.Group();g.position.set(f.x,0,f.z);root.add(g);pad(g,f.id==='ship'?2.5:2.15);
    if(f.id==='training'){
      block(g,ART.ink,0,.53,0,3.3,.65,2.45);
      block(g,ART.white,0,1.5,-.2,3.5,1.65,1.9);
      block(g,ART.blue,0,2.32,-.15,3.52,.3,2.1);
      block(g,ART.ink,0,1.48,.82,2.8,1.25,.13);
      // Three translucent-looking oxygen canisters inset into a dark recess.
      for(const x of [-.8,0,.8]){
        part(g,'cylinder','#5fc8d3',x,1.47,.94,.23,.93,.23,.04);
        part(g,'cylinder',ART.white,x,1.99,.94,.25,.12,.25);
        part(g,'cylinder',ART.white,x,.96,.94,.25,.12,.25);
        block(g,'#b2fff1',x,1.47,1.15,.08,.63,.045,.35);
        cable(g,[[x,.97,.9],[x,.69,1.1],[x*.65,.61,1.42]],'#2e9dba',.065);
      }
      block(g,ART.white,0,.65,1.35,3.45,.25,.73);
      block(g,ART.teal,0,.79,1.50,1.2,.09,.28,.25);
      for(const side of [-1,1]){
        block(g,ART.ink,side*1.63,1.4,-.2,.2,1.7,1.6);
        block(g,ART.gold,side*1.75,1.78,.45,.045,.28,.22);
      }
      const rotor=new THREE.Group();rotor.position.set(0,2.64,-.35);g.add(rotor);
      for(let i=0;i<3;i++){const a=i*Math.PI*2/3,m=block(rotor,ART.white,Math.sin(a)*.4,0,Math.cos(a)*.4,.17,.08,.8);m.rotation.y=a;}
      animations.push({g:rotor,axis:'y',speed:1.1});
      const tag=label(g,'O₂ TRAINING',0,3.0,0,3.4);facilityTags.push({tag,facility:f});
    }else if(f.id==='shop'){
      block(g,ART.ink,0,.56,0,3.45,.70,2.5);
      block(g,ART.white,0,1.52,-.4,3.5,1.8,1.65);
      block(g,ART.gold,0,2.48,-.25,3.65,.26,2.1);
      block(g,ART.ink,0,1.61,.48,2.8,1.18,.12);
      for(const side of [-1,1]){
        const rifle=new THREE.Group();rifle.position.set(side*.75,1.6,.8);rifle.rotation.z=side*.3;g.add(rifle);
        block(rifle,ART.white,0,0,0,.66,.27,.25);block(rifle,ART.blue,.32,.04,0,.5,.13,.18);block(rifle,ART.teal,-.12,-.2,0,.13,.3,.13);
        block(g,ART.gold,side*.76,1.05,.78,.6,.035,.12,.1);
      }
      block(g,ART.white,0,.82,1.35,3.55,.3,.9);block(g,ART.ink,0,1.02,1.3,1.4,.09,.7);
      block(g,ART.teal,0,1.08,1.28,1.05,.025,.47,.2);
      for(const side of [-1,1]){block(g,ART.blue,side*1.65,1.4,-.45,.25,1.7,1.6);part(g,'cylinder',ART.ink,side*1.48,.55,1.1,.21,.48,.21);}
      const tag=label(g,'GEAR WORKSHOP',0,3.1,0,3.8);facilityTags.push({tag,facility:f});
    }else{
      part(g,'cylinder',ART.ink,0,.48,0,1.65,.7,1.65);
      part(g,'capsule',ART.white,0,1.9,0,1.4,2.4,1.4);
      block(g,ART.blue,0,1.7,1.2,2.0,1.2,.4);
      block(g,ART.ink,0,1.85,1.42,1.6,.72,.14);
      block(g,'#61d5de',0,1.88,1.51,1.32,.47,.05,.1);
      block(g,ART.ink,0,.64,1.42,1.4,.7,.25);
      block(g,ART.panel,0,.16,2.25,1.6,.2,1.6);
      for(const side of [-1,1]){
        block(g,ART.blue,side*1.35,.8,-.18,.75,1.6,1.25);
        part(g,'cylinder',ART.ink,side*1.5,.16,-.18,.5,.3,.5);
        part(g,'cylinder',ART.gold,side*1.5,.08,-.18,.3,.12,.3,.2);
        cable(g,[[side*.6,2.9,-.5],[side*.9,2.3,-1.1],[side*1.3,.8,-.7]],ART.teal,.07);
      }
      const radar=new THREE.Group();radar.position.set(0,3.7,0);g.add(radar);
      part(radar,'cylinder',ART.ink,0,0,0,.08,.6,.08);const dish=part(radar,'ball',ART.white,0,.36,0,.65,.15,.65);dish.rotation.z=.45;
      animations.push({g:radar,axis:'y',speed:.4});
    }
    optimizeTree(g);
  }

  const arches=[];
  for(const [d,name]of [[0,'FRONTIER'],...ZONES.slice(1).map(z=>[z.start,z.name.toUpperCase()])]){
    const g=new THREE.Group();g.position.z=GATE_Z-d;root.add(g);const width=d?8:4.8,c=d?ART.zones[ZONES.findIndex(z=>z.start===d)].ore:ART.teal;
    for(const side of [-1,1]){
      block(g,ART.ink,side*width,1.12,0,.8,2.3,1.1);
      block(g,ART.white,side*width,1.65,0,.92,1.95,.75);
      block(g,c,side*width,1.7,.41,.14,1.2,.045,.35);
      block(g,ART.blue,side*width,.23,0,1.2,.45,1.45);
    }
    if(!d){
      block(g,ART.ink,0,3.03,0,10.45,.35,.8);
      block(g,ART.white,0,3.3,0,10.7,.28,1);
      block(g,ART.teal,0,3.02,.42,8.8,.07,.035,.35);
      const sign=label(g,'FRONTIER  ↑',0,3.85,0,3.8);sign.material.depthTest=true;
    }
    const tag=label(g,d?`${d}m · ${name}`:'DEPARTURE',0,d?2.9:4.55,0,d?5:3.2);arches.push({g,tag,d});
    for(let i=-3;i<=3;i++)block(g,c,i*.8,.025,0,.46,.025,.15,.15);
    optimizeTree(g);
  }

  const stationMeshes=STATIONS.map(s=>{
    const g=new THREE.Group();g.position.set(s.x,0,s.z);root.add(g);pad(g,1.7);
    const outline=ring(g,1.8,ART.teal,.6,.045);outline.position.y=.3;
    const ghost=new THREE.Group();g.add(ghost);
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;block(ghost,ART.blue,Math.sin(a)*1.05,.38,Math.cos(a)*1.05,.18,.27,.38);}
    part(ghost,'cylinder','#5faeac',0,.58,0,.48,.65,.48);
    ring(ghost,.61,'#acfff0',.7,.025).position.y=.98;
    const tower=new THREE.Group();g.add(tower);
    part(tower,'cylinder',ART.ink,0,.52,0,.86,.6,.86);
    part(tower,'cylinder',ART.white,0,1.15,0,.72,1.15,.72);
    part(tower,'cylinder',ART.blue,0,1.05,0,.74,.22,.74);
    for(const side of [-1,1]){
      part(tower,'cylinder','#52c9cf',side*.46,1.5,0,.2,.9,.2,.08);
      part(tower,'cylinder',ART.white,side*.46,2.02,0,.23,.16,.23);
      cable(tower,[[side*.46,1.05,0],[side*.9,.55,.45],[side*.65,.35,.9]],ART.teal,.07);
      const arm=block(tower,ART.ink,side*1.13,1.2,0,1,.14,.25);arm.rotation.z=side*.15;
      block(tower,ART.blue,side*1.45,1.38,0,.85,.1,1.4);
      for(let j=-1;j<=1;j++)block(tower,'#81c4e0',side*1.45,1.45,j*.4,.7,.025,.06);
    }
    part(tower,'cylinder',ART.ink,0,2.05,0,.76,.18,.76);
    part(tower,'cylinder',ART.teal,0,2.17,0,.54,.12,.54,.4);
    const field=new THREE.Group();g.add(field);const fieldRing=ring(field,7,'#6aead6',.8,.07);fieldRing.position.y=.09;
    const disk=new THREE.Mesh(new THREE.CircleGeometry(7,64),new THREE.MeshBasicMaterial({color:'#6ae2cd',transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false}));disk.rotation.x=-Math.PI/2;disk.position.y=.028;field.add(disk);
    for(let i=0;i<12;i++){const a=i*Math.PI/6,m=block(field,ART.teal,Math.cos(a)*7,.1,Math.sin(a)*7,.17,.07,.6,.3);m.rotation.y=-a;}
    field.visible=false;tower.visible=false;
    const cost=stationCost(s),tag=label(g,`BUILD O₂ · ${cost.metal}M / ${cost.crystal}C`,0,2.15,0,3.7),bar=healthBar(g,2.95,1.8,ART.teal);bar.g.visible=false;
    optimizeTree(tower);optimizeTree(ghost);optimizeTree(field);return{g,tower,ghost,field,outline,tag,bar,status:'empty'};
  });
  const pads=PADS.map(p=>{
    const g=new THREE.Group();g.position.set(p.x,.03,p.z);root.add(g);
    part(g,'hex',ART.ink,0,0,0,.72,.08,.72);
    part(g,'hex','#729caa',0,.05,0,.62,.035,.62);
    block(g,'#d3efde',0,.08,0,.38,.025,.075);block(g,'#d3efde',0,.08,0,.075,.025,.38);
    const outline=ring(g,.78,'#bfe5de',.55,.035);optimizeTree(g);
    return{g,outline,p};
  });
  const eventMeshes=EVENTS.map(ev=>{
    const g=new THREE.Group();g.position.set(ev.x,0,ev.z);root.add(g);let beacon=null;
    if(ev.aurora){
      part(g,'cylinder',ART.ink,0,.10,0,1.55,.18,1.55);
      for(const side of [-1,1]){block(g,ART.panel,side*.9,.20,0,.65,.14,1.4);block(g,ART.zones[8].ore,side*.9,.29,0,.40,.035,.90,.15)}
    }else if(ev.type==='boss'){
      part(g,'cylinder',ART.ink,0,.12,0,2.5,.25,2.5);
      beacon=new THREE.Group();g.add(beacon);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(beacon,'crystal',ART.zones[ev.zone].ore,Math.sin(a)*1.7,1,Math.cos(a)*1.7,.4,1.8,.4,.12);}
      part(beacon,'crystal','#ffcf8c',0,1.45,0,.65,1.3,.65,.2);
    }else{
      block(g,ART.ink,0,.29,0,2.85,.5,2.0);block(g,ART.white,0,.89,0,2.7,.95,1.8);
      block(g,ART.gold,0,1.4,0,2.8,.2,1.9);block(g,ART.ink,0,.9,.94,2.1,.55,.09);
      for(const x of [-.75,0,.75])block(g,ART.teal,x,.93,1,.25,.25,.035,.3);
      for(const side of [-1,1])block(g,ART.blue,side*1.1,.85,0,.16,1.16,1.95);
    }
    const outline=ring(g,5.3,ART.zones[ev.zone].ore,.4,.045),tag=label(g,ev.name.toUpperCase(),0,3,0,4.1);
    optimizeTree(g);return{g,outline,tag,beacon};
  });

  const obstacles=new THREE.Group();root.add(obstacles);
  for(const o of OBSTACLES){
    const c=ART.zones[zoneAt(o)];
    const rock=part(obstacles,'rock',c.rock,o.x,o.r*.52,o.z,o.r,o.r*.72,o.r);rock.rotation.y=seed(o.z)*6;
    part(obstacles,'rock',c.light,o.x-.25,o.r*.8,o.z-.2,o.r*.72,o.r*.48,o.r*.74);
    part(obstacles,'crystal',c.ore,o.x+.25,o.r*1.35,o.z,.22,.85,.22,.1);
    contact(obstacles,o.x,o.z,o.r*3,o.r*2.8);
  }
  optimizeTree(obstacles);
  // Instancing keeps richer vegetation affordable on mobile GPUs.
  const dummy=new THREE.Object3D(),color=new THREE.Color(),pebbles=new THREE.InstancedMesh(geometry.rock,mat('#ffffff'),1600);
  for(let i=0;i<1600;i++){
    const z=-14-seed(i+51)*(MAX_DEPTH-2),x=(i%2?1:-1)*(3.3+seed(i+98)*18),c=ART.zones[zoneAt({z})];
    dummy.position.set(x,.06,z);dummy.rotation.set(.1,i*1.7,.12);dummy.scale.set(.10+seed(i)*.28,.07+seed(i+22)*.20,.12+seed(i+33)*.24);dummy.updateMatrix();
    pebbles.setMatrixAt(i,dummy.matrix);pebbles.setColorAt(i,color.set(i%3?c.rock:c.light));
  }
  pebbles.receiveShadow=true;root.add(pebbles);
  const plants=new THREE.Group();root.add(plants);
  const leaves=[],stems=[];
  for(let i=0;i<520;i++){
    const z=-18-seed(i+633)*(MAX_DEPTH-8),x=(i%2?1:-1)*(3.5+seed(i+85)*(i>130?5:17)),c=ART.zones[zoneAt({z})];
    if((MAX_DEPTH>620&&((z<-647&&z>-712&&Math.abs(x)<15)||(z<-810&&z>-916&&Math.abs(x)<4.6)))||[...STATIONS,...EVENTS,...NODES,AURORA.radar].some(p=>Math.hypot(x-p.x,z-p.z)<2.8))continue;
    const size=.5+seed(i+31)*.7;
    if(i%4===0){
      for(let j=0;j<3;j++)part(plants,'crystal',c.ore,x+(j-1)*.25,size*.65+j*.05,z,.16,size*(j===1?1.4:1),.16,.07);
    }else{
      stems.push({x,z,s:size,c:c.flora});
      for(let j=0;j<3;j++)leaves.push({x:x+Math.cos(j*2.09)*size*.25,y:size*(.65+j*.17),z:z+Math.sin(j*2.09)*size*.25,s:size*(.5-j*.06),c:j===2?c.ore:c.flora});
    }
  }
  optimizeTree(plants);
  for(const [kind,items]of [['ball',leaves],['cylinder',stems]]){
    const inst=new THREE.InstancedMesh(geometry[kind],mat('#ffffff'),items.length);
    items.forEach((p,i)=>{dummy.position.set(p.x,p.y??p.s*.36,p.z);dummy.rotation.set(0,i*2.3,kind==='ball'?.35:0);dummy.scale.set(kind==='ball'?p.s:.09,kind==='ball'?p.s*.5:p.s*.8,kind==='ball'?p.s:.09);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);inst.setColorAt(i,color.set(p.c));});inst.receiveShadow=true;root.add(inst);
  }
  const landmarks=new THREE.Group();root.add(landmarks);
  for(const zone of ZONES){const c=ART.zones[zone.id];for(let i=0;i<5;i++){
    const x=(i%2?-1:1)*(24.5+i%2*2),z=GATE_Z-zone.start-(zone.end-zone.start)*(.12+i*.18);
    if(zone.id===1){const dune=part(landmarks,'ball',i%2?c.light:c.floor,x,1.0,z,6,2.6,9);dune.rotation.y=i*.6;part(landmarks,'cone',c.rock,x-1,3,z,.45,3,.45)}
    if(zone.id===2){for(let j=0;j<3;j++)part(landmarks,'crystal',j===1?c.ore:c.flora,x+(j-1)*1.7,2.6+j*.5,z,.8,4+j,1.1,.08)}
    if(zone.id===3){const ice=part(landmarks,'crystal',c.light,x,3,z,2,5+i%3,1.6,.05);ice.rotation.z=(i%2?1:-1)*.18;part(landmarks,'rock',c.rock,x+1,.7,z+2,3,1,3)}
    if(zone.id===4){const wreck=new THREE.Group();wreck.position.set(x,0,z);wreck.rotation.z=(i%2?1:-1)*.25;landmarks.add(wreck);block(wreck,ART.ink,0,1.2,0,4,2,5);block(wreck,ART.panel,0,2.3,0,4.2,.3,5.1);block(wreck,c.ore,0,1.7,2.53,2.4,.18,.04,.25);for(const side of [-1,1])block(wreck,ART.blue,side*2.1,2.5,0,2.3,.13,3.6)}
    if(zone.id===5){const hoop=new THREE.Group();hoop.position.set(x,4,z);hoop.rotation.x=Math.PI/2;landmarks.add(hoop);ring(hoop,3,c.ore,.7,.15);for(let k=0;k<4;k++)part(hoop,'crystal',c.light,Math.cos(k*Math.PI/2)*3,0,Math.sin(k*Math.PI/2)*3,.5,.6,.5,.15)}
    if(zone.id===6){block(landmarks,ART.ink,x,1.0,z,3.4,2.1,3.4);block(landmarks,ART.white,x,2.1,z,3.6,.3,3.6);for(const side of [-1,1])part(landmarks,'crystal',c.ore,x+side,3,z,.4,2.4,.5,.12)}
    if(zone.id===7){for(const side of [-1,1]){block(landmarks,ART.ink,x+side*1.3,.8,z,.2,1.6,5);block(landmarks,c.ore,x+side*1.3,1.7,z,.13,.08,5,.18)}block(landmarks,ART.white,x,.7,z,2.5,.8,2.7)}
    if(zone.id===8){for(const side of [-1,1]){const pillar=block(landmarks,c.rock,x+side*1.6,2.0,z,1,4,1.4);pillar.rotation.z=side*.1;block(landmarks,c.ore,x+side*1.6,2.0,z+.73,.12,2.5,.035,.15)}block(landmarks,c.light,x,4.0,z,4.2,.6,1.4)}
  }}optimizeTree(landmarks);
  const guideMarker=new THREE.Group();root.add(guideMarker);
  const guideRing=ring(guideMarker,1.1,ART.gold,.85,.05),guideArrow=part(guideMarker,'cone',ART.gold,0,2.1,0,.16,.33,.16,.15);guideArrow.rotation.z=Math.PI;
  return{facilityTags,stationMeshes,pads,eventMeshes,arches,guideMarker,guideRing,guideArrow,animations,terrain};
}
