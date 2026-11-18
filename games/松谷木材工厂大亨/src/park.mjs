import * as T from '../vendor/three.module.js';
import {point,mat,mesh,box,group} from './model.mjs';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';

const columns=3,spacingX=23,spacingZ=25;
const roofGeo=new T.CylinderGeometry(0,1,2,4,1);roofGeo.rotateY(Math.PI/4);
const treeGeo=new T.ConeGeometry(.66,1.25,7);
const tireGeo=new T.BoxGeometry(.24,.34,.46);
const ground=new T.Plane(new T.Vector3(0,1,0),0);
const clamp=T.MathUtils.clamp;

function batchParkGeometry(root){
  root.updateWorldMatrix(true,true);
  const inverse=root.matrixWorld.clone().invert(),batches=[];
  const materials=new Map();
  root.traverse(node=>{
    if(!node.isMesh)return;
    const group=materials.get(node.material)??[];
    group.push(node);materials.set(node.material,group);
  });
  for(const [material,nodes] of materials){
    if(nodes.length<2)continue;
    const copies=nodes.map(node=>{
      const copy=node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone();
      return copy.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,node.matrixWorld));
    });
    const combined=mergeGeometries(copies);
    for(const copy of copies)copy.dispose();
    if(!combined)continue;
    mesh(root,combined,material,0,0,0,false);batches.push(combined);
    for(const node of nodes)node.removeFromParent();
  }
  root.userData.batches=batches;
}

function removeParkGeometry(root){
  root.traverse(node=>{for(const batch of node.userData.batches??[])batch.dispose();});
  root.removeFromParent();
}

export function parkLocation(index){
  const row=Math.floor(index/columns),offset=index%columns;
  const column=row%2?columns-1-offset:offset;
  return point((column-1)*spacingX,0,row*spacingZ);
}

export class ParkView{
  constructor(canvas,company,renderer){
    this.canvas=canvas;this.company=company;this.renderer=renderer;
    this.scene=new T.Scene();this.scene.background=new T.Color('#c2dca2');
    this.scene.fog=new T.Fog('#c2dca2',147,230);
    this.camera=new T.OrthographicCamera(-20,20,40,-40,.1,250);
    this.target=point(0,0,0);this.targetNow=this.target.clone();this.extent=57;this.extentNow=57;
    this.angle=point(28,57,43);this.ray=new T.Raycaster();this.pointer=new T.Vector2();
    this.lots=new Map();this.roads=new Map();this.palette=new Map();this.plots=[];
    this.knownCount=0;
    this.colors={grass:mat('#85bd54'),bank:mat('#458b5b'),water:mat('#37a9ce'),road:mat('#6b778b'),
      roadEdge:mat('#b9c7d3'),white:mat('#fff6de'),gold:mat('#ffc845'),timber:mat('#d9964a'),metal:mat('#3c5167'),
      void:mat('#9cac85'),blue:mat('#289dd9'),tree:mat('#3d8f42'),leaf:mat('#71ba4a')};
    this.scene.add(new T.HemisphereLight('#edf7ff','#929975',1.95));
    const sun=new T.DirectionalLight('#fff2dc',2.22);sun.position.set(-30,58,29);this.scene.add(sun);
    this.resizeObserver=new ResizeObserver(()=>this.resize());
  }

  activate(siteId){
    this.sync();this.focus(siteId,true);
    this.resizeObserver.observe(this.canvas);this.resize();
  }

  deactivate(){this.resizeObserver.disconnect();}

  sync(){
    if(this.company.sites.size===this.knownCount)return;
    this.knownCount=this.company.sites.size;
    this.plots=this.company.plotSites();
    // Rebuild only a plot whose construction state changed.
    for(const [i,lot] of this.lots){
      if(lot.owned===this.company.sites.has(this.plots[i]?.id))continue;
      removeParkGeometry(lot.root);this.lots.delete(i);
    }
  }

  focus(siteId,snap=false){
    const index=this.plots.findIndex(site=>site.id===siteId);
    if(index<0)return;
    this.target.copy(parkLocation(index));
    if(snap)this.targetNow.copy(this.target);
  }

  resize(){
    const {width,height}=this.canvas.getBoundingClientRect();
    if(!width||!height)return;
    this.width=width;this.height=height;
    this.renderer.setSize(width,height,false);this.updateCamera();
  }

  updateCamera(){
    const width=this.extentNow, height=width*this.height/this.width;
    this.camera.left=-width/2;this.camera.right=width/2;this.camera.top=height/2;this.camera.bottom=-height/2;
    this.camera.position.copy(this.targetNow).add(this.angle);this.camera.lookAt(this.targetNow);
    this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  }

  zoom(direction){this.extent=clamp(this.extent*(direction<0?.83:1.2),24,85);}

  floorAt(x,y){
    this.pointer.set(x/this.width*2-1,1-y/this.height*2);
    this.ray.setFromCamera(this.pointer,this.camera);
    return this.ray.ray.intersectPlane(ground,new T.Vector3());
  }

  pan(fromX,fromY,toX,toY){
    const from=this.floorAt(fromX,fromY),to=this.floorAt(toX,toY);
    if(!from||!to)return;
    this.target.copy(this.targetNow).add(from.sub(to));
    this.target.x=clamp(this.target.x,-31,31);
    this.target.z=clamp(this.target.z,-10,parkLocation(this.plots.length-1).z+12);
    this.targetNow.copy(this.target);this.updateCamera();
  }

  project(index){
    const world=parkLocation(index);world.setY(2.6);
    const v=world.project(this.camera);
    return {x:(v.x+1)*.5*this.width,y:(1-v.y)*.5*this.height};
  }

  roadRow(row){
    const p=this.colors,z=row*spacingZ;
    const root=group(this.scene,0,0,z);
    box(root,90,.40,spacingZ+.02,p.grass,0,-.24,0,0,false);
    box(root,82,.16,4.56,p.roadEdge,0,.047,10.45,.046,false);
    box(root,82,.09,3.95,p.road,0,.153,10.45,.045,false);
    for(const x of [-34.5,-11.5,11.5,34.5]){
      box(root,4.46,.16,spacingZ,p.roadEdge,x,.043,0,.046,false);
      box(root,3.82,.09,spacingZ,p.road,x,.163,0,.04,false);
      for(let a=-10;a<10;a+=4.25)box(root,.06,.012,1.2,p.white,x,.215,a,.003,false);
    }
    for(let x=-39;x<41;x+=4.45)box(root,1.55,.015,.06,p.white,x,.218,10.45,.003,false);
    box(root,4.9,.03,spacingZ+.01,p.bank,-40,.022,0,0,false);
    box(root,3.98,.04,spacingZ+.01,p.water,-40,.037,0,0,false);
    for(const [x,z] of [[39,-9],[40,-4],[42,3],[39,8],[-37,-7],[-37,3],[-43,-5],[-43,4]]){
      mesh(root,treeGeo,p.tree,x,.69,z,false).scale.setScalar(1.6);
      mesh(root,treeGeo,p.leaf,x,1.48,z,false).scale.setScalar(1.18);
    }
    batchParkGeometry(root);this.roads.set(row,root);
  }

  siteMaterials(site){
    const family=site.biome??site.id;
    if(!this.palette.has(family))this.palette.set(family,{
      floor:mat(site.floor),roof:mat(site.roof),belt:mat(site.belt),machine:mat(site.machine),
      truck:mat(site.truck),forest:mat(site.forest[0]),lawn:mat(site.grass)
    });
    return this.palette.get(family);
  }

  createLot(site,index,mill){
    const p=this.colors,m=this.siteMaterials(site),at=parkLocation(index);
    const root=group(this.scene,at.x,0,at.z);
    if(mill)box(root,19.6,.02,19,m.lawn,0,-.012,-.36,.026,false);
    box(root,17.6,.37,17.5,p.roadEdge,0,.15,-.39,.19,false);
    box(root,17.24,.15,17.15,mill?m.floor:p.void,0,.39,-.39,.16,false);
    for(const x of [-8.14,8.14])box(root,.10,.019,16.1,p.white,x,.475,-.35,.007,false);
    for(const z of [-8.48,7.78])box(root,16.2,.019,.09,p.white,0,.476,z,.007,false);
    if(!mill){
      for(const x of [-6.7,6.7])for(const z of [-6.8,6.13]){
        box(root,.31,.83,.31,p.gold,x,.86,z,.06,false);
        box(root,.39,.20,.39,p.metal,x,.52,z,.035,false);
      }
      batchParkGeometry(root);
      return {root,owned:false};
    }
    for(const side of [-1,1])box(root,2.06,.06,12.6,p.road,side*6.8,.484,.7,.035,false);
    const office=group(root,-5.06,.46,-5.45);
    box(office,4.43,2.51,4.12,p.white,0,1.15,0,.12,false);
    mesh(office,roofGeo,m.roof,0,2.97,0,false).scale.set(3.34,1.0,3.18);
    box(office,3.44,.65,.085,p.blue,0,1.65,2.08,.024,false);
    box(office,1.05,1.38,.11,p.metal,0,.70,2.09,.046,false);
    for(const [x,z] of [[6.73,-6.8],[6.7,-3.88],[-5.3,6.27]]){
      mesh(root,treeGeo,m.forest,x,1.22,z,false).scale.setScalar(1.55);
      mesh(root,treeGeo,p.leaf,x,1.93,z,false).scale.setScalar(1.13);
    }
    const line=group(root,-.12,.48,-.9);
    box(line,2.56,.29,11.17,m.belt,0,.26,0,.12,false);
    for(const x of [-1.3,1.3])box(line,.12,.18,11.23,p.gold,x,.42,0,.018,false);
    for(let j=0;j<12;j++)box(line,2.4,.052,.14,p.blue,0,.425,-5.2+j*.95,.02,false);
    box(line,3.25,.66,1.97,m.machine,0,2.31,-.60,.21,false);
    for(const x of [-1.37,1.37])box(line,.60,2.05,1.87,m.machine,x,1.17,-.60,.10,false);
    box(line,2.44,.19,.089,p.gold,0,2.28,.407,.028,false);
    if(site.finish){
      box(root,2.01,.39,5.12,m.belt,-3.74,.81,2.30,.10,false);
      box(root,2.71,1.94,2.58,m.machine,-3.74,1.80,1.92,.16,false);
      box(root,1.81,.69,.07,p.metal,-3.74,1.68,3.23,.08,false);
    }
    batchParkGeometry(root);
    const stock=group(root,3.51,.48,3.58);
    for(const z of [-1.48,1.43])for(const x of [-.89,.89]){
      box(stock,1.54,.19,2.29,p.metal,x,.09,z,.034,false);
      for(let i=0;i<4;i++)box(stock,1.42,.205,2.18,p.timber,x,.24+i*.23,z,.036,false);
    }
    const truck=group(root,6.55,.49,6.01);
    box(truck,1.24,.20,3.47,p.metal,0,.21,0,.09,false);
    box(truck,1.34,1.04,1.24,m.truck,0,.76,1.03,.14,false);
    box(truck,1.15,.42,.065,p.blue,0,1.01,1.67,.018,false);
    box(truck,1.24,.084,1.27,p.white,0,1.28,1.02,.04,false);
    box(truck,1.22,.26,2.03,m.truck,0,.52,-.68,.07,false);
    for(const a of [-.66,.66])for(const z of [-1.1,.98])mesh(truck,tireGeo,p.metal,a,.23,z,false);
    batchParkGeometry(stock);batchParkGeometry(truck);
    return {root,owned:true,stock,truck,mill};
  }

  render(dt){
    this.sync();
    const f=1-Math.exp(-dt*9);
    this.targetNow.lerp(this.target,f);this.extentNow=T.MathUtils.lerp(this.extentNow,this.extent,f);
    this.updateCamera();
    const middle=Math.max(0,Math.round(this.targetNow.z/spacingZ)),range=Math.ceil(this.extentNow*this.height/this.width/spacingZ*.52)+1;
    const start=Math.max(-1,middle-range),end=middle+range;
    for(const [row,road] of this.roads)if(row<start||row>end){removeParkGeometry(road);this.roads.delete(row);}
    for(let row=start;row<=end;row++)if(!this.roads.has(row))this.roadRow(row);
    for(const [i,lot] of this.lots){
      const row=Math.floor(i/columns);
      if(row<start||row>end){removeParkGeometry(lot.root);this.lots.delete(i);}
    }
    for(let i=Math.max(0,start)*columns;i<Math.min(this.plots.length,(end+1)*columns);i++){
      const site=this.plots[i];
      if(!this.lots.has(i))this.lots.set(i,this.createLot(site,i,this.company.sites.get(site.id)));
      const lot=this.lots.get(i);
      if(!lot.mill)continue;
      const s=lot.mill.state,job=s.jobs.dispatch??s.jobs.inbound;
      lot.stock.visible=s.planks>0;lot.stock.scale.y=clamp(s.planks/12,.35,2.8);
      lot.truck.position.z=job?6.65-9.12*(job.elapsed/job.duration):6.65;
    }
    this.renderer.render(this.scene,this.camera);
  }
}
