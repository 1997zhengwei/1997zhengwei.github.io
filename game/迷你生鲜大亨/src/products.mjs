import {modelId} from './stores.mjs';
import {specialProduct,buildTray} from './market-models.mjs';
import * as T from '../vendor/three.module.js';
import {box,sphere,cylinder,batchColors,mat,M,inkMaterial,outline} from './art.mjs';
import {CargoMotion} from './cargo.mjs';
const prototypes=new Map();
const productMaterial=new T.MeshStandardMaterial({vertexColors:true,color:'#ffffff',roughness:.31,metalness:.025});
export function product(id,storeId='corner'){id=modelId(id,storeId);if(prototypes.has(id))return prototypes.get(id);const g=new T.Group();
 if(id==='tomato'){sphere(g,0,0,0,.42,mat('#f74a32'),[1,.86,1]);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const l=sphere(g,Math.sin(a)*.13,.34,Math.cos(a)*.13,.13,mat('#2f9140'),[.5,.3,1.7]);l.rotation.y=a;}cylinder(g,0,.39,0,.045,.15,mat('#307b35'));}
 if(id==='eggplant'){sphere(g,0,.04,0,.35,mat('#8647b4'),[.9,1.65,.9]);sphere(g,0,.53,0,.18,mat('#4a9f42'),[1,.4,1]);const stem=cylinder(g,.05,.64,0,.045,.24,mat('#4a9f42'));stem.rotation.z=-.35;}
 if(id==='egg'){sphere(g,0,.04,0,.31,mat('#fff0cd'),[1,1.3,1]);}
 if(id==='milk'){box(g,0,.06,0,.54,.77,.5,mat('#fff9ed'),.06);box(g,0,.1,.256,.43,.29,.025,mat('#65bcec'),.015);box(g,0,.5,0,.44,.15,.46,mat('#73bde4'),.04);box(g,.12,.61,0,.13,.08,.16,M.white,.02);sphere(g,0,.11,.28,.1,M.white,[.65,1,.3]);}
 if(id==='bread'){sphere(g,0,0,0,.4,mat('#c77d2d'),[1.5,.65,.83]);sphere(g,0,.08,0,.38,mat('#efb352'),[1.48,.61,.8]);for(let i=-1;i<=1;i++){const slash=box(g,i*.23,.3,0,.055,.025,.29,mat('#ffe2a0'),.02);slash.rotation.y=-.35;}}
 if(id==='juice'){cylinder(g,0,0,0,.26,.67,mat('#ff7941'));cylinder(g,0,.39,0,.14,.15,mat('#fbf0d5'));cylinder(g,0,.5,0,.17,.09,mat('#4aaf68'));box(g,0,.02,.262,.32,.3,.02,M.white,.01);sphere(g,0,.02,.285,.115,mat('#f25436'),[1,.9,.2]);}
 if(id==='wheat'){for(let i=-1;i<=1;i++){const st=cylinder(g,i*.15,0,0,.026,.75,mat('#d9b94d'));st.rotation.z=i*.13;for(let j=0;j<3;j++)sphere(g,i*.15,.2+j*.12,(j%2?1:-1)*.06,.1,mat('#f8d56a'),[.7,1.25,.8]);}}
 specialProduct(g,id);batchColors(g,productMaterial);const mesh=g.children.find(c=>c.isMesh);mesh.geometry.userData.shared=true;prototypes.set(id,mesh);return mesh;
}
export function productObject(id,storeId='corner'){const proto=product(id,storeId),o=new T.Mesh(proto.geometry,proto.material);outline(o);return o;}
export function items(parent,id,max=48,storeId='corner'){const proto=product(id,storeId),m=new T.InstancedMesh(proto.geometry,proto.material,max),edge=new T.InstancedMesh(proto.geometry,inkMaterial,max);m.count=edge.count=0;m.castShadow=true;m.receiveShadow=true;m.instanceMatrix.setUsage(T.DynamicDrawUsage);edge.instanceMatrix.setUsage(T.DynamicDrawUsage);m.frustumCulled=edge.frustumCulled=false;m.userData.edge=edge;parent.add(m,edge);return m;}
const dummy=new T.Object3D();
export function fillItems(mesh,count,pose){mesh.count=Math.max(0,Math.min(mesh.instanceMatrix.count,Math.floor(count)));const edge=mesh.userData.edge;if(edge)edge.count=mesh.count;for(let i=0;i<mesh.count;i++){const p=pose(i);dummy.position.set(p.x||0,p.y||0,p.z||0);dummy.rotation.set(p.rx||0,p.ry||0,p.rz||0);dummy.scale.setScalar(p.scale??1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);edge?.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;if(edge)edge.instanceMatrix.needsUpdate=true;}
export function carry(parent,storeId='corner',trayStyle){
 const group=new T.Group();parent.add(group);const motion=new CargoMotion(),meshes={};
 for(const id of ['tomato','egg','eggplant','milk','bread','juice','wheat','flower'])meshes[id]=items(group,id,30,storeId);
 const trayModel=new T.Group();buildTray(trayModel,trayStyle);
 const proto=trayModel.children.find(c=>c.isMesh),trays=new T.InstancedMesh(proto.geometry,proto.material,30);trays.count=0;trays.castShadow=true;trays.instanceMatrix.setUsage(T.DynamicDrawUsage);trays.frustumCulled=false;group.add(trays);
 return {group,motion,sync(bag,instant=false){motion.sync(bag,instant);},target(key){const p=motion.pose(key);return p?parent.localToWorld(new T.Vector3(p.x,p.y,p.z)):null;},lastTarget(id){const e=motion.last(id);return e?{key:e.key,point:this.target(e.key),scale:motion.pose(e.key).scale*parent.scale.x}:null;},pulse(){motion.pulse();},update(bag,options={}){motion.sync(bag);const poses=motion.update(options.dt??.016,options);for(const [id,mesh]of Object.entries(meshes)){const list=poses.filter(p=>p.id===id);fillItems(mesh,list.length,i=>list[i]);}if(options.cart)trays.count=0;else fillItems(trays,poses.length?1:0,i=>{const p=poses[0];return {x:p.x,y:p.boardY,z:p.z,rz:p.rz,scale:p.arrival>0?1:0};});},dispose(){group.removeFromParent();trays.dispose();proto.geometry.dispose();proto.material.dispose();for(const m of Object.values(meshes)){m.dispose();m.userData.edge.dispose();}}};
}
