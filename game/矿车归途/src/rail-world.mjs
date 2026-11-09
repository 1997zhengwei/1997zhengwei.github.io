import * as THREE from '../vendor/three.module.min.js';
import {V,OPP,key,point,same,canBuild,nextDirection,DIRS,isSwitch} from './rail-engine.mjs';

const cube=new THREE.BoxGeometry(1,1,1),ink=0x292a25;
const random=(x,y,s=0)=>{const n=Math.sin(x*121.43+y*317.37+s*93.1)*43758.5453;return n-Math.floor(n);};
const materials=new Map();
function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshToonMaterial({color}));return materials.get(color);}
function box(g,w,h,d,x,y,z,color){const m=new THREE.Mesh(cube,material(color));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function batch(g){
  g.updateMatrixWorld(true);const inv=g.matrixWorld.clone().invert(),objects=[];g.traverse(o=>{if(o.isMesh&&o.geometry===cube&&!o.isInstancedMesh)objects.push(o);});if(!objects.length)return;
  const mesh=new THREE.InstancedMesh(cube,new THREE.MeshToonMaterial({color:0xffffff}),objects.length);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.ownMaterial=true;
  const edge=new THREE.EdgesGeometry(cube),pos=edge.attributes.position,vertices=[],v=new THREE.Vector3();
  objects.forEach((o,i)=>{const m=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld);mesh.setMatrixAt(i,m);mesh.setColorAt(i,o.material.color);if(!o.userData.noOutline)for(let j=0;j<pos.count;j++){v.fromBufferAttribute(pos,j).applyMatrix4(m);vertices.push(v.x,v.y,v.z);}o.parent.remove(o);});
  edge.dispose();mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();g.add(mesh);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:ink,transparent:true,opacity:.85}));lines.userData.ownMaterial=true;g.add(lines);
}
function dispose(g){g.traverse(o=>{if(o.geometry&&o.geometry!==cube)o.geometry.dispose();if(o.userData.ownMaterial)o.material?.dispose();if(o.userData.texture)o.material.map?.dispose();});g.clear();}
function plate(text,color='#fff8e4',fill='#b84b3e',size=.62){
  const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');x.fillStyle=fill;x.strokeStyle='#2c2b27';x.lineWidth=13;x.beginPath();x.roundRect(16,16,224,224,28);x.fill();x.stroke();x.fillStyle=color;x.font='900 174px Trebuchet MS, Segoe UI';x.textAlign='center';x.textBaseline='middle';x.strokeStyle='#342922';x.lineWidth=5;x.strokeText(text,128,140);x.fillText(text,128,140);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthWrite:false}));s.scale.set(size,size,1);s.userData.texture=true;s.userData.ownMaterial=true;return s;
}
function villager(g,x,y,z,steve=false){
  box(g,.22,.25,.20,x,y+.12,z,steve?0x43a2a2:0x8c6d48);box(g,.25,.25,.24,x,y+.36,z,0xc59970);box(g,.27,.055,.25,x,y+.49,z,steve?0x543d2e:0x9b7956);
  for(const dx of [-.07,.07]){box(g,.045,.035,.018,x+dx,y+.38,z+.13,0xfff6de);box(g,.025,.028,.021,x+dx,y+.38,z+.14,steve?0x435f9d:0x557142);}
  if(!steve)box(g,.06,.11,.09,x,y+.31,z+.16,0xb18a62);else box(g,.12,.045,.018,x,y+.28,z+.13,0x704a32);
}
function carriage(id){
  const g=new THREE.Group();box(g,.65,.12,.80,0,.20,0,0x3b3e39);box(g,.67,.20,.73,0,.35,0,0xb98b5b);for(const xx of[-.28,.28])for(const zz of[-.30,.30])box(g,.065,.27,.065,xx,.58,zz,0xa27b50);
  for(const xx of [-.34,.34]){box(g,.025,.24,.40,xx,.49,0,0xb6d3cf);box(g,.03,.055,.76,xx,.30,0,0x5d5145);}
  villager(g,0,.20,.23);box(g,.73,.11,.84,0,.75,0,0xc85042);box(g,.78,.035,.86,0,.81,0,0xa33a31);
  const wheels=[];for(const xx of [-.34,.34])for(const zz of [-.27,.27]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.065,10),material(0x313936));m.rotation.z=Math.PI/2;m.position.set(xx,.13,zz);m.castShadow=true;g.add(m);wheels.push(m);}
  box(g,.10,.055,.15,0,.17,.49,0x4f4d40);box(g,.10,.055,.15,0,.17,-.49,0x4f4d40);batch(g);
  const arrowGeo=new THREE.BufferGeometry();arrowGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.13,.835,.20,.13,.835,.20,0,.835,.44],3));arrowGeo.computeVertexNormals();const arrow=new THREE.Mesh(arrowGeo,new THREE.MeshBasicMaterial({color:0xfff5dc,side:THREE.DoubleSide}));arrow.userData.ownMaterial=true;g.add(arrow);
  const number=plate(String(id));number.position.set(0,1.13,0);g.add(number);g.userData.number=number;g.userData.wheels=wheels;return g;
}
function engine(){const g=new THREE.Group();box(g,.68,.16,1.12,0,.24,0,0x3b3d38);box(g,.63,.53,.48,0,.54,-.29,0xa57b4f);box(g,.72,.105,.58,0,.86,-.29,0xc65041);box(g,.33,.29,.026,0,.59,-.04,0xb1d2ce);villager(g,0,.39,-.05,true);
  const boiler=new THREE.Mesh(new THREE.CylinderGeometry(.245,.245,.68,12),material(0x464848));boiler.rotation.x=Math.PI/2;boiler.position.set(0,.47,.30);boiler.castShadow=true;g.add(boiler);box(g,.17,.29,.17,0,.80,.49,0x3c3a36);box(g,.25,.07,.24,0,.97,.49,0x313333);
  for(const xx of [-.35,.35])for(const zz of [-.35,.35]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.07,12),material(0x303936));wheel.rotation.z=Math.PI/2;wheel.position.set(xx,.16,zz);g.add(wheel);}box(g,.62,.08,.13,0,.19,.70,0xc24a3b);batch(g);return g;}
function curveAt(p,ports){
  const [a,b]=ports,aa=V[a],bb=V[b];const start=new THREE.Vector3(p.x+aa[0]*.5,p.y,p.z+aa[1]*.5),end=new THREE.Vector3(p.x+bb[0]*.5,p.y,p.z+bb[1]*.5);
  return OPP[a]===b?new THREE.LineCurve3(start,end):new THREE.QuadraticBezierCurve3(start,p,end);
}
// Flat arrows make the rail's purpose readable without adding a building.
function flowArrow(group,p,dir,color=0xfff7dc){
  const g=new THREE.Group();g.position.copy(p);g.rotation.y=dir==='E'?Math.PI/2:dir==='W'?-Math.PI/2:dir==='N'?Math.PI:0;
  for(const [size,y,c]of [[1,.125,0x34424b],[.70,.128,color]]){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-.16*size,y,-.11*size,.16*size,y,-.11*size,0,y,.18*size],3));
    const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));mesh.userData.ownMaterial=true;g.add(mesh);
  }group.add(g);
}

export class RailWorld{
  constructor(canvas,labels){
    this.canvas=canvas;this.labelsRoot=labels;this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xe4d5b4);this.camera=new THREE.OrthographicCamera(-7,7,7,-7,.1,100);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.scene.add(new THREE.HemisphereLight(0xfff4d8,0x64735b,1.4));const sun=new THREE.DirectionalLight(0xffefcc,2.4);sun.position.set(-7,13,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.5,far:35});sun.shadow.normalBias=.035;this.scene.add(sun);
    this.land=new THREE.Group();this.rails=new THREE.Group();this.decor=new THREE.Group();this.dynamic=new THREE.Group();this.scene.add(this.land,this.rails,this.decor,this.dynamic);this.engine=engine();this.dynamic.add(this.engine);this.cars=new Map();this.hit=[];this.labels=[];this.gates=[];this.smoke=[];this.effects=[];
    this.ray=new THREE.Raycaster();this.ndc=new THREE.Vector2();this.zoom=1;this.yaw=-.62;this.targetYaw=-.62;this.clock=0;this.coupledCount=0;this.run=null;this.editable=true;
    this.cursor=new THREE.Group();for(const [x,z]of [[-.44,-.44],[.44,-.44],[-.44,.44],[.44,.44]]){box(this.cursor,.19,.035,.035,x,.115,z,0xe8ee7a);box(this.cursor,.035,.035,.19,x,.115,z,0xe8ee7a);}batch(this.cursor);this.cursor.visible=false;this.scene.add(this.cursor);
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(canvas.parentElement);this.resize();
  }
  pos(p,y=0){return new THREE.Vector3(p[0]-(this.level.w-1)/2,y,p[1]-(this.level.h-1)/2);}
  resize(){const r=this.canvas.parentElement.getBoundingClientRect();this.width=r.width;this.height=r.height;this.yaw=this.targetYaw=r.width/r.height<.8?-1.20:-.62;this.renderer.setSize(r.width,r.height,false);this.fit();}
  fit(){if(!this.level)return;const aspect=this.width/this.height,yaw=this.yaw,target=new THREE.Vector3(.35,0,0);this.camera.position.set(Math.sin(yaw)*16,19,Math.cos(yaw)*16).add(target);this.camera.lookAt(target);this.camera.updateMatrixWorld();
    const points=[];for(const x of[-this.level.w/2-.2,this.level.w/2+.2])for(const z of[-this.level.h/2-.2,this.level.h/2+.2])for(const y of[0,1.4])points.push(new THREE.Vector3(x,y,z));const end=this.pos(this.level.exit);for(const x of[end.x+.4,end.x+1.65])for(const y of[0,1.4])points.push(new THREE.Vector3(x,y,end.z));
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of points){p.applyMatrix4(this.camera.matrixWorldInverse);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}const top=this.width<600?100:125,bottom=this.height<650?111:135,availableHeight=Math.max(180,this.height-top-bottom),availableWidth=this.width-30;
    const scale=Math.min(availableWidth/(maxX-minX+.3),availableHeight/(maxY-minY+.3))*this.zoom,span=this.height/scale,cx=(minX+maxX)/2,desiredY=(top+this.height-bottom)/2,cy=(minY+maxY)/2+(desiredY-this.height/2)/scale;
    this.camera.left=cx-span*aspect/2;this.camera.right=cx+span*aspect/2;this.camera.top=cy+span/2;this.camera.bottom=cy-span/2;this.camera.updateProjectionMatrix();}
  load(level){
    this.level=level;this.run=null;this.zoom=1;this.yaw=this.targetYaw=-.62;this.coupledCount=0;for(const g of [this.land,this.rails,this.decor])dispose(g);for(const c of this.cars.values()){this.dynamic.remove(c);dispose(c);}this.cars.clear();this.hit=[];this.gates=[];this.labels=[];this.labelsRoot.replaceChildren();this.cursor.visible=false;
    const sand=level.chapter==='Redstone Valley';this.scene.background.set(sand?0x98a451:0x87a449);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshToonMaterial({color:sand?0xe2ccb0:0xd9cba9}));ground.rotation.x=-Math.PI/2;ground.position.y=-.40;ground.receiveShadow=true;ground.userData.ownMaterial=true;this.land.add(ground);
    const textureCanvas=document.createElement('canvas');textureCanvas.width=512;textureCanvas.height=512;const ctx=textureCanvas.getContext('2d');ctx.fillStyle=sand?'#98a451':'#87a449';ctx.fillRect(0,0,512,512);
    for(let i=0;i<8500;i++){const x=random(i,3)*512,y=random(i,4)*512;ctx.fillStyle=i%3===0?'#b5c57928':i%3===1?'#536d3b24':'#d8dc9420';ctx.fillRect(x,y,2+random(i,5)*4,1+random(i,6)*4);}
    const texture=new THREE.CanvasTexture(textureCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(level.w/4,level.h/4);
    const landscapeTexture=texture.clone();landscapeTexture.repeat.set(50,50);landscapeTexture.needsUpdate=true;ground.material.map=landscapeTexture;ground.material.color.set(0xffffff);ground.material.needsUpdate=true;ground.userData.texture=true;ground.position.y=.005;
    const top=new THREE.Mesh(new THREE.PlaneGeometry(level.w,level.h),new THREE.MeshToonMaterial({map:texture,color:0xffffff}));top.rotation.x=-Math.PI/2;top.position.y=.016;top.receiveShadow=true;top.userData.ownMaterial=true;top.userData.texture=true;this.land.add(top);
    // Low terrain, inked silhouettes and dappled grass follow the visual grammar
    // of the reference. Minecraft remains in the block geology and passengers.
    for(let z=0;z<level.h;z++)for(let x=0;x<level.w;x++){
      const p=[x,z],v=this.pos(p),r=random(x,z);if(!canBuild(level,p)){this.rock(v,r);continue;}
      const plane=new THREE.Mesh(new THREE.PlaneGeometry(.98,.98),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));plane.rotation.x=-Math.PI/2;plane.position.copy(v).y=.035;plane.userData.cell=p;this.land.add(plane);this.hit.push(plane);
      if(r>.86&&!level.cars.some(c=>same(c.p,p))&&!same(level.exit,p))for(let i=0;i<3;i++){const grass=box(this.decor,.022,.10,.018,v.x-.33+i*.07,.065,v.z+.32,0x4c6b36);grass.rotation.z=(i-1)*.22;}
    }
    const gridPoints=[];for(let x=0;x<=level.w;x++)gridPoints.push(x-level.w/2,.025,-level.h/2,x-level.w/2,.025,level.h/2);for(let z=0;z<=level.h;z++)gridPoints.push(-level.w/2,.025,z-level.h/2,level.w/2,.025,z-level.h/2);const gridGeo=new THREE.BufferGeometry();gridGeo.setAttribute('position',new THREE.Float32BufferAttribute(gridPoints,3));const grid=new THREE.LineSegments(gridGeo,new THREE.LineBasicMaterial({color:0x445a37,transparent:true,opacity:.24}));grid.userData.ownMaterial=true;this.land.add(grid);
    for(let i=0;i<12;i++){const side=i%4,t=(i/4|0),v=new THREE.Vector3(side===0?-level.w/2-.50:side===1?level.w/2+.50:(t-1)*2.3,0,side===2?-level.h/2-.50:side===3?level.h/2+.50:(t-1)*2);if(v.distanceTo(this.pos(level.exit))<1.8||level.cars.some(c=>v.distanceTo(this.pos(c.p))<1.65))continue;this.tree(v,.75+random(i,0)*.25,sand);}
    for(const [k,beats]of Object.entries(level.signals||{})){const p=this.pos(point(k)),group=new THREE.Group();group.position.copy(p);for(const side of [-1,1])box(group,.07,.62,.07,side*.43,.32,0,0x4b503b);batch(group);const arm=new THREE.Group();arm.position.set(-.43,.65,0);for(let i=0;i<6;i++)box(arm,.14,.065,.07,.07+i*.14,0,0,i%2?0xf2e6ba:0xb94f3c);batch(arm);group.add(arm);this.decor.add(group);this.gates.push({arm,group,key:k});this.label(point(k),`AUTO +${beats}`,'gate',.86);}
    for(const tunnel of level.tunnels||[])for(const [i,p]of [tunnel.a,tunnel.b].entries()){const arch=new THREE.Group();arch.position.copy(this.pos(p));arch.rotation.y=Math.PI/2;box(arch,.12,.80,.85,-.45,.4,0,0x6c725f);box(arch,.12,.80,.85,.45,.4,0,0x6c725f);box(arch,1.04,.22,.85,0,.86,0,0x8b9177);batch(arch);this.decor.add(arch);this.label(p,`${String.fromCharCode(65+(level.tunnels||[]).indexOf(tunnel))} ↔`,'tunnel',1.16);}
    batch(this.land);batch(this.decor);
    for(const c of level.cars){const model=carriage(c.id);model.position.copy(this.pos(c.p,.06));model.rotation.y=this.angle(c.dir);this.dynamic.add(model);this.cars.set(c.id,model);}
    this.engine.position.copy(this.pos(level.exit,.045)).add(new THREE.Vector3(.82,0,0));this.engine.rotation.y=Math.PI/2;this.engine.visible=true;this.label(level.exit,'ENGINE','engine',1.5);this.resize();
  }
  label(p,text,type,lift){const el=document.createElement(type==='switch'?'button':'span');el.className=`map-label ${type}`;el.textContent=text;if(type==='switch'){el.type='button';el.setAttribute('aria-label','Change gold switch branch');el.onclick=e=>{e.stopPropagation();this.onSwitch?.(p);};}else el.setAttribute('aria-hidden','true');this.labelsRoot.append(el);this.labels.push({p,text,type,lift,el});return el;}
  rock(v,r){const g=new THREE.Group();g.position.copy(v);g.scale.y=.48;box(g,.90,.48,.87,0,.24,0,0x7e8869);box(g,.64,.28,.66,-.10,.61,-.07,0x9aa383);box(g,.38,.19,.42,-.14,.84,-.10,0xaab18b);box(g,.22,.14,.26,.34,.11,.32,0x66785b);this.decor.add(g);}
  tree(v,s,birch){const g=new THREE.Group();g.position.copy(v);g.scale.setScalar(s);box(g,.19,.84,.19,0,.42,0,birch?0xd8cdb0:0x6f593b);box(g,1.03,.49,.90,0,1.02,0,birch?0xb4b65e:0x538047);box(g,.82,.30,.73,-.07,1.42,-.04,birch?0xc3c56e:0x71984f);box(g,.42,.21,.44,-.15,1.67,-.05,birch?0xd4cd7b:0x8aa359);this.decor.add(g);}
  drawTracks(tracks){this.tracks=tracks;dispose(this.rails);for(const l of this.labels.filter(l=>l.type==='switch'))l.el.remove();this.labels=this.labels.filter(l=>l.type!=='switch');const all={...tracks};for(let i=1;i<=4;i++)all[key([this.level.exit[0]+i,this.level.exit[1]])]={ports:'EW',fixed:true};
    for(const [k,t]of Object.entries(all)){const p=this.pos(point(k),.083);let pairs=[];const ports=t.ports;if(ports.length===2)pairs=[ports];else if(ports.length===4)pairs=['NS','EW'];else if(ports.length===3){const stem=t.stem||(ports.includes('E')?'E':ports[0]);pairs=[...ports].filter(d=>d!==stem).map(d=>stem+d);}
      for(const pair of pairs){const curve=curveAt(p,pair);for(let j=0;j<6;j++){const pt=curve.getPoint((j+.5)/6),tan=curve.getTangent((j+.5)/6),m=box(this.rails,.61,.045,.095,pt.x,pt.y-.025,pt.z,t.fixed?0x69767b:0xcf9855);m.rotation.y=Math.atan2(tan.x,tan.z);}
        const points=curve.getPoints(9);for(let j=0;j<points.length-1;j++){const a=points[j],b=points[j+1],d=b.clone().sub(a),n=new THREE.Vector3(-d.z,0,d.x).normalize();for(const side of [-1,1]){const aa=a.clone().addScaledVector(n,.18*side),bb=b.clone().addScaledVector(n,.18*side);const m=box(this.rails,.075,.065,aa.distanceTo(bb)+.01,0,0,0,0xf2efe0);m.position.copy(aa).lerp(bb,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),bb.sub(aa).normalize());}}
      }
      if(isSwitch(t)){const branch=t.branchNames?.[t.switch||0]||'TAP';const label=this.label(point(k),`${branch} ⇄`,'switch',.75);label.setAttribute('aria-label',`Change gold switch branch. ${branch} route selected`);const stem=t.stem||(ports.includes('E')?'E':ports[0]),branches=DIRS.filter(d=>ports.includes(d)&&d!==stem),dir=branches[(t.switch||0)%2],d=V[dir];box(this.rails,.13,.075,.13,p.x,p.y+.03,p.z,0xe1b14a);const lever=box(this.rails,.045,.055,.28,p.x+d[0]*.15,p.y+.08,p.z+d[1]*.15,0xf0c858);lever.rotation.y=this.angle(dir);flowArrow(this.rails,p.clone().add(new THREE.Vector3(d[0]*.30,0,d[1]*.30)),dir,0xffce5b);}else if(ports.length===3){const stem=t.stem||(ports.includes('E')?'E':ports[0]);for(const arm of ports){const v=V[arm];flowArrow(this.rails,p.clone().add(new THREE.Vector3(v[0]*.31,0,v[1]*.31)),arm===stem?arm:OPP[arm]);}}
    }batch(this.rails);for(const gate of this.gates){const tile=tracks[gate.key];if(tile?.ports.length===2){const curve=curveAt(this.pos(point(gate.key)),tile.ports),tangent=curve.getTangent(.5);gate.group.rotation.y=Math.atan2(tangent.x,tangent.z);gate.group.position.copy(curve.getPoint(.5));}}
  }
  angle(d){return d==='E'?Math.PI/2:d==='W'?-Math.PI/2:d==='N'?Math.PI:0;}
  pick(x,y){const r=this.canvas.getBoundingClientRect();this.ndc.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);this.ray.setFromCamera(this.ndc,this.camera);return this.ray.intersectObjects(this.hit,false)[0]?.object.userData.cell||null;}
  showCursor(p){this.cursor.visible=!!p;if(p)this.cursor.position.copy(this.pos(p));}
  pose(c,future,part){
    const currentPos=this.pos(c.p,.06);if(!future||same(c.p,future.p))return {p:currentPos,angle:this.angle(c.heading),opacity:1};
    if(Math.abs(c.p[0]-future.p[0])+Math.abs(c.p[1]-future.p[1])>1)return {p:part<.5?currentPos:this.pos(future.p,.06),angle:this.angle(future.heading),opacity:Math.abs(part-.5)*2};
    const useCurrent=part<.5,car=useCurrent?c:future,pos=this.pos(car.p,.065),tile=this.tracks[key(car.p)],incoming=car.incoming,out=nextDirection(tile,incoming)||future.heading,curve=curveAt(pos,incoming+out),t=useCurrent?.5+part:part-.5;
    return {p:curve.getPoint(t),angle:Math.atan2(curve.getTangent(t).x,curve.getTangent(t).z),opacity:1};
  }
  setRun(result,time,beat=.48){
    this.run=result;const total=result.frames.length-1,at=Math.min(total,time/beat),i=Math.floor(at),f=at-i,frame=result.frames[i],next=result.frames[Math.min(i+1,total)],count=frame.coupled.length+(next.coupled.length-frame.coupled.length)*f;
    this.coupledCount=count;const departure=result.ok&&at>=total?Math.min(4,(time-total*beat)*2):0;
    for(const c of frame.cars){const model=this.cars.get(c.id),future=next.cars.find(q=>q.id===c.id);model.visible=true;
      if(c.status==='coupled'){const n=frame.coupled.indexOf(c.id),p=this.pos(this.level.exit,.06);p.x+=(count-n-1)*.89+departure;model.position.copy(p);model.rotation.y=Math.PI/2;}
      else{const pose=this.pose(c,future,f);model.position.copy(pose.p);model.rotation.y=pose.angle;model.visible=pose.opacity>.18;}
      for(const w of model.userData.wheels)w.rotation.x=time*8;
    }
    this.engine.position.copy(this.pos(this.level.exit,.045));this.engine.position.x+=.82+count*.89+departure;
    for(const gate of this.gates){const waiting=[...frame.cars,...next.cars].some(c=>key(c.p)===gate.key&&c.wait>0);gate.arm.rotation.z=waiting?0:-Math.PI*.42;}
  }
  resetCars(){this.run=null;this.coupledCount=0;for(const c of this.level.cars){const m=this.cars.get(c.id);m.visible=true;m.position.copy(this.pos(c.p,.06));m.rotation.y=this.angle(c.dir);}this.engine.position.copy(this.pos(this.level.exit,.045));this.engine.position.x+=.82;for(const gate of this.gates)gate.arm.rotation.z=-Math.PI*.42;}
  frame(dt,time){this.clock=time;this.yaw+=Math.atan2(Math.sin(this.targetYaw-this.yaw),Math.cos(this.targetYaw-this.yaw))*Math.min(1,dt*7);this.fit();
    if(this.run&&Math.floor(time*4)!==Math.floor((time-dt)*4)){const puff=new THREE.Mesh(new THREE.SphereGeometry(.095,7,5),new THREE.MeshBasicMaterial({color:0xf9f3dd,transparent:true,opacity:.8,depthWrite:false}));puff.position.copy(this.engine.position).add(new THREE.Vector3(.47,1.05,0));this.dynamic.add(puff);this.smoke.push({mesh:puff,age:0});}
    for(let i=this.smoke.length-1;i>=0;i--){const p=this.smoke[i];p.age+=dt;p.mesh.position.y+=dt*.35;p.mesh.position.x-=dt*.14;p.mesh.scale.setScalar(1+p.age*.6);p.mesh.material.opacity=Math.max(0,.6-p.age*.6);if(p.age>1){this.dynamic.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();this.smoke.splice(i,1);}}
    for(const l of this.labels){const p=this.pos(l.p,l.lift).project(this.camera);l.el.style.left=`${(p.x*.5+.5)*this.width}px`;l.el.style.top=`${(-p.y*.5+.5)*this.height}px`;l.el.style.opacity=this.run&&l.type==='engine'?'.3':'1';}
    this.renderer.render(this.scene,this.camera);
  }
}
