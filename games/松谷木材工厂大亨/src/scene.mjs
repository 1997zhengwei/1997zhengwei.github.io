import * as T from '../vendor/three.module.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {point,mat,mesh,box,group,cylinder,sign,vehicle,worker,plantMaterials,timberMaterials,randomGen,geoBox} from './model.mjs';
import {SITES,CREW_STANDS,terrain,forest,architecture,buildLine,controlPads,pedestrianPads} from './yard.mjs';
import {roughOrigin,finishingCenter,addLandmark,finishingLine} from './region-art.mjs';

const clamp=T.MathUtils.clamp;
const mix=T.MathUtils.lerp;
const portion=(t,a,b)=>{
  const p=clamp((t-a)/(b-a),0,1);
  return p*p*(3-2*p);
};
function driveTruck(truck,x,z,direction){
  truck.g.position.set(x,.13,z);
  for(const wheel of truck.wheels)wheel.rotation.x=-z*direction/.435;
}
const colors=['#ffffff','#f2d6b3','#e7c194','#f8e1bf','#f1cba3'].map(c=>new T.Color(c));
const locations={
  overview:[-.55,.36,1.2,21.0],
  inbound:[-4.5,1.32,-8.15,14.1],
  saw:[.02,1.28,-.78,10.2],
  finish:[-4.4,1.18,5.1,13.8],
  stack:[3.68,1.43,8.87,14.0],
  dispatch:[7.9,1.3,10.8,15.5]
};

export class MillView {
  constructor(canvas,mill,renderer){
    this.canvas=canvas;this.mill=mill;this.site=mill.region;
    this.renderer=renderer??new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.NeutralToneMapping;
    this.renderer.toneMappingExposure=1.07;
    this.scene=new T.Scene();this.scene.background=new T.Color(this.site.light);
    this.scene.fog=new T.Fog(this.site.light,74,158);
    this.camera=new T.OrthographicCamera(-12,12,20,-20,.1,160);
    this.target=point(0,0,0);this.targetNow=this.target.clone();
    this.angle=point(15,37,32);this.angleNow=this.angle.clone();
    this.focus='overview';this.width=1;this.height=1;this.aspect=1;
    this.clock=0;this.chipTimer=0;this.lastLogs=-1;this.lastBoards=-1;this.lastRough=-1;
    this.p=plantMaterials(this.site);this.wood=timberMaterials();this.random=randomGen(19430+Number(this.site.number)*797);
    this.finishedMat=this.wood.boardMat.clone();
    this.finishedMat.color.set(this.mill.finish?.id==='kiln'?'#ffcf8c':this.mill.finish?.id==='plane'?'#fff8de':this.mill.finish?.id==='press'?'#cdab82':'#fff2ce');
    this.finishedGeo=this.mill.finish?.id==='press'?new T.BoxGeometry(.84,.34,3.2):this.wood.boardGeo;
    this.dummy=new T.Object3D();
    this.lights();
    const environment=group(this.scene);
    terrain(environment,this.p,this.random,this.site);
    forest(environment,this.p,this.random,this.site);
    architecture(environment,this.p,this.site);
    controlPads(environment,this.p,this.site);
    pedestrianPads(environment,this.p,this.site);
    addLandmark(environment,this.p,this.site,this.random);
    this.batchScenery(environment);
    this.line=buildLine(this.scene,this.p,this.site.number);
    this.secondary=finishingLine(this.scene,this.p,this.site);
    this.buildTransport();
    this.buildStock();
    this.buildCrew();
    this.buildChips();
    this.setFocus('overview');
    this.extentNow=this.extent;
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.activate();
  }

  activate(){
    this.resizeObserver.observe(this.canvas);
    this.resize();
  }

  deactivate(){this.resizeObserver.disconnect();}

  dispose(){
    this.deactivate();
    const shared=new Set(geoBox.values()),geometries=new Set(),materials=new Set();
    this.scene.traverse(object=>{
      if(object.geometry&&!shared.has(object.geometry))geometries.add(object.geometry);
      if(object.material)for(const material of [].concat(object.material))materials.add(material);
      object.shadow?.dispose();
      if(object.isInstancedMesh)object.dispose();
    });
    for(const geometry of geometries)geometry.dispose();
    const maps=new Set([...materials].map(material=>material.map).filter(Boolean));
    for(const map of maps)map.dispose();
    for(const material of materials)material.dispose();
  }

  lights(){
    this.scene.add(new T.HemisphereLight('#e8f6ff','#869172',1.78));
    const sun=new T.DirectionalLight('#fff3e4',2.62);
    sun.position.set(-16,34,14);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);
    Object.assign(sun.shadow.camera,{left:-29,right:29,top:29,bottom:-29,near:1,far:84});
    sun.shadow.normalBias=.027;sun.shadow.bias=-.00013;sun.shadow.radius=3;
    this.scene.add(sun);
    const fill=new T.DirectionalLight('#dbeaff',.78);fill.position.set(12,14,-18);this.scene.add(fill);
  }

  batchScenery(root){
    root.updateMatrixWorld(true);
    const groups=new Map();
    root.traverse(o=>{
      if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
      const key=o.material.uuid+'/'+o.castShadow;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(o);
    });
    for(const items of groups.values()){
      if(items.length<3)continue;
      const copies=items.map(o=>{
        const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
        return g.applyMatrix4(o.matrixWorld);
      });
      const merged=mergeGeometries(copies);
      copies.forEach(g=>g.dispose());
      if(!merged)continue;
      mesh(this.scene,merged,items[0].material,0,0,0,items[0].castShadow);
      items.forEach(o=>o.removeFromParent());
    }
  }

  log(parent){
    const log=mesh(parent,this.wood.logGeo,this.wood.logMat);
    log.rotation.x=Math.PI/2;return log;
  }

  board(parent,finished=false){
    return mesh(parent,finished?this.finishedGeo:this.wood.boardGeo,finished?this.finishedMat:this.wood.boardMat);
  }

  buildTransport(){
    const p=this.p,g=this.scene;
    this.inTruck=vehicle(g,p,this.site.truck,'logs');
    this.outTruck=vehicle(g,p,(this.site.biome??this.site.id)==='river'?'#225cc5':'#1683df','boards');
    this.parkedTruck=vehicle(g,p,(this.site.biome??this.site.id)==='ridge'?'#909df5':'#316fba','boards');
    this.parkedTruck.g.position.set(7.59,.13,-3.84);
    this.parkedTruck.g.rotation.y=Math.PI;
    this.truckLogs=Array.from({length:22},(_,i)=>{
      const log=this.log(this.inTruck.cargo);
      log.scale.setScalar(.64);
      log.position.set((i%3-1)*.542,.31+Math.floor(i/3)*.477,0);
      return log;
    });
    this.truckBoards=Array.from({length:54},(_,i)=>{
      const b=this.board(this.outTruck.cargo,true);
      b.position.set((i%4-1.5)*.48,.11+Math.floor(i/4)*.197,-.13);
      b.scale.set(.62,this.mill.finish?.ratio===2?.56:.75,1.07);
      return b;
    });
    this.feedFork=vehicle(g,p,'#ec9b38','fork');
    this.shipFork=vehicle(g,p,'#eaa03e','fork');
    this.shipCargo=group(this.shipFork.lift,0,.11,1.12);
    this.shipSlats=Array.from({length:6},(_,i)=>{
      const b=this.board(this.shipCargo,true);
      b.position.set((i%2-.5)*.64,.106+Math.floor(i/2)*.20,0);
      b.scale.set(.78,this.mill.finish?.ratio===2?.56:.75,.79);return b;
    });
    this.inFlight=this.log(g);this.sawLog=this.log(g);
    this.sawnCore=mesh(g,new T.BoxGeometry(.73,.48,3.20),this.wood.boardMat);
    this.wip=Array.from({length:14},()=>this.board(g));
    if(this.secondary){
      this.finishWip=Array.from({length:20},()=>this.board(g,true));
      this.finishInput=Array.from({length:3},()=>this.board(g));
    }
  }

  buildStock(){
    const p=this.p;
    this.logs=Array.from({length:30},(_,i)=>{
      const log=this.log(this.scene);log.scale.setScalar(.80);
      log.position.copy(this.logSlot(i));
      return log;
    });
    this.storage=SITES.map((site,i)=>{
      const g=group(this.scene,site.x,0,site.z);
      box(g,1.96,.09,3.73,p.pad,0,.197,0,.028);
      for(const z of [-1.78,1.78])box(g,1.91,.026,.076,p.yellow,0,.25,z,.01);
      const rack=group(g);
      for(const z of [-1.40,0,1.4])box(rack,1.78,.16,.2,p.wood,0,.35,z,.026);
      for(const x of [-.66,-.23,.23,.66])box(rack,.14,.096,3.23,p.cream,x,.456,0,.023);
      sign(g,'BAY '+(i+1),1.0,.34,0,.26,2.04).rotation.x=-Math.PI/2;
      return {g,rack};
    });
    this.stack=new T.InstancedMesh(this.finishedGeo,this.finishedMat,144);
    this.stack.castShadow=this.stack.receiveShadow=true;
    this.stack.frustumCulled=false;this.stack.count=0;
    this.stack.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.scene.add(this.stack);
    if(this.secondary){
      this.rough=new T.InstancedMesh(this.wood.boardGeo,this.wood.boardMat,56);
      this.rough.castShadow=this.rough.receiveShadow=true;
      this.rough.frustumCulled=false;this.rough.count=0;
      this.rough.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(this.rough);
    }
  }

  buildCrew(){
    const p=this.p,g=this.scene;
    const {inbound,saw,stock,dispatch,finish}=CREW_STANDS;
    this.workers=[
      worker(g,p,...inbound[0],'#ed6243','#ffd23d',{skin:'#bc7b54'}),
      worker(g,p,...saw[0],'#227ada','#ffdf50',{earmuffs:true}),
      worker(g,p,...stock[0],'#da4e49','#e8f6ff',{vest:'blue',glasses:true}),
      worker(g,p,...dispatch[0],'#1476ac','#ffcd36',{skin:'#ab6746'}),
      worker(g,p,...finish[0],'#7754b5','#e8f6ff',{skin:'#eaa978',earmuffs:true})
    ];
    this.workers.forEach(({g})=>g.scale.setScalar(1.28));
    this.crew=[
      ['inbound',worker(g,p,...inbound[1],'#cf5831','#f8faff',{vest:'blue',skin:'#b27450'})],
      ['saw',worker(g,p,...saw[1],'#285cba','#f8faff',{earmuffs:true})],
      ['dispatch',worker(g,p,...dispatch[1],'#2b749f','#f8faff',{glasses:true,skin:'#c97950'})]
    ];
    if(this.secondary)this.crew.push(['finish',worker(g,p,...finish[1],'#7754b5','#ffa443',{glasses:true,skin:'#cc855e'})]);
    this.crew.forEach(([,w])=>w.g.scale.setScalar(1.29));
    this.driverModels=[
      worker(this.feedFork.g,p,0,-.22,'#43796e','#ffcc5b',{seated:true}),
      worker(this.shipFork.g,p,0,-.22,'#3b6284','#ffcc5b',{seated:true})
    ];
    this.driverModels.forEach(({g})=>{g.position.y=.62;g.scale.setScalar(.87);});
  }

  buildChips(){
    this.chips=[];
    this.chipMesh=new T.InstancedMesh(new T.BoxGeometry(.10,.058,.17),mat('#ffce78'),80);
    this.chipMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.chipMesh.frustumCulled=false;this.chipMesh.count=0;this.scene.add(this.chipMesh);
  }

  sparks(x,y,z,count=8){
    const r=this.random;
    for(let i=0;i<count&&this.chips.length<80;i++){
      this.chips.push({x,y,z,vx:(r()-.48)*4.3,vy:1+r()*3,vz:(r()-.39)*3.8,life:.39+r()*.51,twist:r()*6});
    }
  }

  setFocus(focus){
    this.focus=focus;
    const [x,y,z,extent]=locations[focus]??locations.overview;
    this.target.set(x,y,z);this.extent=extent;
    this.angle.set(...(focus==='saw'?[27,24,-22]:focus==='stack'?[19,28,33]:[15,37,32]));
  }

  resize(){
    const rect=this.canvas.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return;
    this.width=rect.width;this.height=rect.height;this.aspect=rect.width/rect.height;
    this.renderer.setSize(rect.width,rect.height,false);
    this.updateCamera(1);
  }

  updateCamera(f){
    this.targetNow.lerp(this.target,f);this.extentNow=mix(this.extentNow,this.extent,f);
    this.angleNow.lerp(this.angle,f);
    const overview=this.focus==='overview';
    const wide=this.extentNow,high=Math.max(overview?30.0:13,wide/this.aspect);
    const actualWide=high*this.aspect;
    this.camera.left=-actualWide*.5;this.camera.right=actualWide*.5;
    this.camera.top=high*.5;this.camera.bottom=-high*.5;
    this.camera.position.copy(this.targetNow).add(this.angleNow);
    this.camera.lookAt(this.targetNow);
    this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  }

  project(anchor){
    const v=anchor.clone().project(this.camera);
    return {x:(v.x+1)*.5*this.width,y:(1-v.y)*.5*this.height,visible:v.x>-.96&&v.x<.96&&v.y>-.92&&v.y<.94};
  }

  logSlot(index){
    return point(-3.67+(index%5)*.66,.47+Math.floor(index/5)*.58,-8.44+.091*Math.sin(index*4.3));
  }

  stackSlot(index){
    const site=SITES[Math.min(SITES.length-1,Math.floor(index/18))];
    const row=Math.floor(index%18/2);
    const beam=this.mill.finish?.ratio===2;
    return point(site.x+(index%2-.5)*(beam?.84:.73),.62+row*(beam?.39:.282)+Math.floor(row/3)*.085,site.z);
  }

  roughSlot(index){
    return point(roughOrigin.x+(index%2-.5)*.73,.54+Math.floor(index/2)*.254,roughOrigin.z);
  }

  showStock(){
    const s=this.mill.state;
    if(s.logs!==this.lastLogs){
      this.logs.forEach((log,i)=>{log.visible=i<s.logs;});this.lastLogs=s.logs;
    }
    if(s.planks!==this.lastBoards){
      const d=this.dummy;
      for(let i=0;i<s.planks;i++){
        d.position.copy(this.stackSlot(i));d.rotation.set(0,Math.sin(i*9.16)*.013,0);
        d.scale.set(1,1,.98+.020*Math.sin(i*3.48));d.updateMatrix();
        this.stack.setMatrixAt(i,d.matrix);this.stack.setColorAt(i,colors[i%colors.length]);
      }
      this.stack.count=s.planks;this.stack.instanceMatrix.needsUpdate=true;
      if(this.stack.instanceColor)this.stack.instanceColor.needsUpdate=true;
      this.lastBoards=s.planks;
    }
    if(this.rough&&s.rough!==this.lastRough){
      const d=this.dummy;
      for(let i=0;i<s.rough;i++){
        d.position.copy(this.roughSlot(i));d.rotation.set(0,0,0);d.scale.set(1,1,1);
        d.updateMatrix();this.rough.setMatrixAt(i,d.matrix);
      }
      this.rough.count=s.rough;this.rough.instanceMatrix.needsUpdate=true;this.lastRough=s.rough;
    }
    this.storage.forEach(({g},i)=>{g.visible=i<s.levels.yard+1;});
  }

  showInbound(job){
    this.inTruck.g.visible=!!job;
    this.inFlight.visible=false;
    const {trolley,cable,claw}=this.line;
    let x=-4,y=2.1,z=-8.56;
    if(job){
      const t=job.elapsed/job.duration;
      driveTruck(this.inTruck,-8.35,-23+14.48*portion(t,0,.26)+16.5*portion(t,.78,1),1);
      this.truckLogs.forEach((log,i)=>{log.visible=i<job.total-job.done;});
      if(t>.31&&t<.74&&job.done<job.total){
        const a=clamp((t-.31)/.43*job.total-job.done,0,1);
        const unit=job.total-job.done-1;
        const origin=point(-8.35+(unit%3-1)*.542,1.47+Math.floor(unit/3)*.477,-9.41);
        const dest=this.logSlot(this.mill.state.logs);
        const travel=portion(a,.12,.88),lift=Math.sin(Math.PI*a)*.87;
        x=mix(origin.x,dest.x,travel);y=mix(origin.y,dest.y,travel)+lift;z=mix(origin.z,dest.z,travel);
        this.inFlight.visible=true;this.inFlight.position.set(x,y,z);
        this.inFlight.scale.setScalar(mix(.64,.8,travel));
        this.truckLogs[unit].visible=false;y+=.35;
      }
    }
    trolley.position.x=x;claw.position.set(x,y,z);
    cable.position.set(x,(y+.2+3.50)*.5,z);cable.scale.y=Math.max(.02,3.50-y-.2);
  }

  showCut(job,dt){
    const {blade,beacon,motor,rollers,booster,nameplate,trophy}=this.line;
    const level=this.mill.state.levels.saw;
    motor.visible=level>=2;booster.visible=level>=4;nameplate.visible=level>=8;trophy.visible=level>=12;
    this.sawLog.visible=false;this.sawnCore.visible=false;
    this.wip.forEach(board=>{board.visible=false;});
    const fork=this.feedFork;
    fork.g.position.set(-3.40,0,-4.08);fork.g.rotation.y=.55;fork.lift.position.y=.42;
    if(!job){
      blade.rotation.x+=dt*.42;beacon.material.emissiveIntensity=.08;
      return;
    }
    const t=job.elapsed/job.duration;
    beacon.material.emissiveIntensity=.75+Math.sin(this.clock*14)*.33;
    blade.rotation.x+=dt*(t>.20&&t<.81?24:5);
    rollers.forEach(roller=>{roller.rotation.x+=dt*4.6;});
    if(t<.572){
      const take=portion(t,0,.21),feed=portion(t,.19,.57);
      const origin=this.logSlot(job.loadFrom??this.mill.state.logs);
      this.sawLog.visible=true;
      this.sawLog.position.set(mix(origin.x,0,take),mix(origin.y,1.14,take)+.47*Math.sin(take*Math.PI),
        mix(origin.z,-3.57,take)+3.31*feed);
      this.sawLog.scale.setScalar(mix(.80,1.11,take));
      this.sawLog.rotation.set(Math.PI/2,0,-.24*Math.sin(Math.PI*take));
      // Work from the apron along the side of the rack, keeping the chassis out of the timber and belt.
      const transfer=portion(t,0,.24),park=portion(t,.34,.572);
      fork.g.position.set(mix(mix(-3.73,-3.18,transfer),-3.40,park),0,
        mix(mix(-5.04,-4.34,transfer),-4.08,park));
      fork.g.rotation.y=mix(mix(Math.PI,1.35,portion(t,.08,.25)),.55,park);
      fork.lift.position.y=.42+.35*portion(t,.018,.19)*(1-portion(t,.27,.50));
    }
    if(t>.40&&t<.77){
      const feed=portion(t,.40,.70);
      this.sawnCore.visible=true;
      this.sawnCore.scale.z=Math.max(.12,feed);
      this.sawnCore.position.set(0,1.01,-.06+2.06*feed);
    }
    if(t>.41&&t<.65){
      this.chipTimer+=dt;
      if(this.chipTimer>.067){
        this.sparks(-.21,1.16,.54,3);this.chipTimer=0;
      }
    }
    if(t>.42)for(let i=job.done;i<job.total;i++){
      if(t<.42+i*.012)continue;
      const b=this.wip[i],settle=this.mill.deliveryTime('saw',i,job.total);
      const emerge=portion(t,.42+i*.012,.64+i*.009);
      const move=portion(t,settle-.15,settle);
      const s=this.mill.state;
      const target=this.secondary?this.roughSlot(s.rough+i-job.done):this.stackSlot(s.planks+i-job.done);
      const off=i%2===0?-.49:.49;
      b.visible=true;
      b.position.set(mix(off*(.37+.63*emerge),target.x,move),
        mix(.879+Math.floor(i/2)*.184,target.y,move)+Math.sin(move*Math.PI)*.24,
        mix(.28+4.27*emerge,target.z,move));
      b.scale.set(1,1,.29+.71*emerge);
      b.rotation.set(0,Math.sin(Math.PI*move)*.23,Math.sin(Math.PI*move)*.041);
    }
  }

  showFinish(job,dt){
    if(!this.secondary)return;
    const {moving,heat}=this.secondary;
    const stage=this.mill.finish.id,t=job?job.elapsed/job.duration:0;
    heat.emissiveIntensity=job?.8+Math.sin(this.clock*12)*.21:.08;
    if(stage==='kiln')moving.rotation.y+=dt*(job?7:.45);
    else moving.position.y=job?-(stage==='press'?1.15:.40)*Math.sin(Math.PI*portion(t,.25,.69))**2:0;
    for(const board of this.finishInput)board.visible=false;
    for(const board of this.finishWip)board.visible=false;
    if(!job)return;
    for(let i=0;i<Math.min(job.total*this.mill.finish.ratio,this.finishInput.length);i++){
      const advance=t-i*.03;
      if(advance<0||advance>.42)continue;
      const board=this.finishInput[i];
      const take=portion(advance,0,.25),feed=portion(advance,.22,.42);
      board.visible=true;
      board.position.set(mix(roughOrigin.x,finishingCenter.x,take),.60+i*.24+Math.sin(Math.PI*take)*.40,mix(roughOrigin.z,finishingCenter.z-1.83,take)+1.54*feed);
      board.rotation.y=Math.sin(Math.PI*take)*.11;
    }
    if(t>.48&&t<.76&&Math.floor(this.clock*15)!==Math.floor((this.clock-dt)*15)){
      this.sparks(finishingCenter.x,.95,finishingCenter.z+1.33,stage==='plane'?4:2);
    }
    for(let i=job.done;i<job.total;i++){
      const settle=this.mill.deliveryTime('finish',i,job.total);
      if(t<Math.max(.43,settle-.24))continue;
      const board=this.finishWip[i],exit=portion(t,settle-.25,settle-.11);
      const carry=portion(t,settle-.13,settle);
      const target=this.stackSlot(this.mill.state.planks+i-job.done);
      board.visible=true;
      board.position.set(mix(finishingCenter.x+(i%2-.5)*.7,target.x,carry),mix(.68,target.y,carry)+Math.sin(Math.PI*carry)*.45,
        mix(finishingCenter.z+.55+exit*2.2,target.z,carry));
      board.scale.set(1,1,.53+.47*exit);board.rotation.y=Math.sin(Math.PI*carry)*.17;
    }
  }

  showDispatch(job){
    const f=this.shipFork;
    this.outTruck.g.visible=!!job;this.shipCargo.visible=false;
    this.parkedTruck.g.visible=!job;
    f.g.position.set(6.73,0,4.55);f.g.rotation.y=.29;f.lift.position.y=.42;
    if(!job)return;
    const t=job.elapsed/job.duration;
    driveTruck(this.outTruck,8.96,25-15.45*portion(t,0,.30)-20.3*portion(t,.78,1),-1);
    this.outTruck.g.rotation.y=Math.PI;
    this.truckBoards.forEach((b,i)=>{b.visible=i<job.done;});
    if(job.done<job.total){
      const picked=job.picked-job.done;
      const origin=this.stackSlot(Math.max(0,picked?job.loadFrom:this.mill.state.planks-1));
      const pickup=this.mill.pickupTime(job.done,job.total);
      const drop=this.mill.deliveryTime('dispatch',job.done,job.total);
      const previous=job.done?this.mill.deliveryTime('dispatch',job.done-1,job.total):.06;
      const stage=portion(t,pickup,drop);
      const returning=portion(t,previous,pickup);
      const travel=picked?stage:1-returning;
      f.g.position.set(mix(origin.x+.28,job.done||picked?6.94:6.71,travel),0,
        mix(origin.z-2.04,job.done||picked?10.03:4.55,travel));
      f.g.rotation.y=mix(.02,Math.PI*.5,travel);
      f.lift.position.y=mix(Math.max(.43,origin.y-.39),picked?1.02:.43,travel);
      this.shipSlats.forEach((b,i)=>{b.visible=i<picked;});
      this.shipCargo.visible=picked>0;
    }
  }

  updateChips(dt){
    let n=0;
    for(let i=this.chips.length-1;i>=0;i--){
      const c=this.chips[i];c.life-=dt;
      if(c.life<=0){this.chips.splice(i,1);continue;}
      c.x+=dt*c.vx;c.y+=dt*c.vy;c.z+=dt*c.vz;c.vy-=dt*6.4;
      const d=this.dummy;
      d.position.set(c.x,Math.max(.17,c.y),c.z);d.rotation.set(c.life*10,c.twist,c.life*7);
      d.scale.setScalar(.45+c.life*.78);d.updateMatrix();this.chipMesh.setMatrixAt(n++,d.matrix);
    }
    this.chipMesh.count=n;
    if(n)this.chipMesh.instanceMatrix.needsUpdate=true;
  }

  animateWorker(w,active,index){
    const t=this.clock*(active?2.15:.68)+index*4.1;
    w.g.position.set(w.x+(active?.18:.04)*Math.sin(t),.181-.12*w.g.scale.y,w.z+(active?.13:.045)*Math.cos(t));
    w.g.rotation.y=Math.sin(t*.37)*.37+(index===1?1.45:.3);
    w.legs.forEach((leg,j)=>{leg.rotation.x=(active?.33:.06)*Math.sin(t*3+j*Math.PI);});
    w.arms.forEach((arm,j)=>{arm.rotation.x=(active?.41:.10)*Math.sin(t*3+j*Math.PI+Math.PI);});
  }

  render(dt){
    this.clock+=dt;
    this.updateCamera(1-Math.exp(-dt*8));
    const jobs=this.mill.state.jobs;
    this.showStock();
    this.showInbound(jobs.inbound);
    this.showCut(jobs.saw,dt);
    this.showFinish(jobs.finish,dt);
    this.showDispatch(jobs.dispatch);
    for(let i=0;i<this.workers.length;i++){
      const w=this.workers[i];
      w.g.visible=i!==4||!!this.secondary;
      const active=i===0?jobs.inbound:i===1?jobs.saw:i===3?jobs.dispatch:i===4?jobs.finish:true;
      this.animateWorker(w,active,i);
    }
    this.crew.forEach(([station,w],i)=>{
      w.g.visible=this.mill.state.crew[station];
      if(w.g.visible)this.animateWorker(w,jobs[station],i+6);
    });
    this.updateChips(dt);
    this.renderer.render(this.scene,this.camera);
  }
}

