import {THREE,box,material} from './world.mjs';
import {sponge,patrick,squidward} from './characters.mjs';
let currentView='full';
const host=document.querySelector('#stage'),scene=new THREE.Scene();scene.background=new THREE.Color('#a6d6d3');
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;host.append(renderer.domElement);
const cam=new THREE.PerspectiveCamera(30,1,.1,100);cam.position.set(0,3.8,11);cam.lookAt(0,1.5,0);scene.add(new THREE.HemisphereLight('#f2fcf5','#78978a',2.5));const sun=new THREE.DirectionalLight('#fff0d0',3);sun.position.set(-6,10,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-8,right:8,top:6,bottom:-6});scene.add(sun);
const models=[sponge(scene),patrick(scene),squidward(scene)],parts=[];
models.forEach((m,i)=>{m.position.x=(i-1)*3.65;box(scene,[3.1,.2,2.4],material('#ecdfbb'),[m.position.x,-.28,0],.15);for(const child of m.children){let center=child.position.clone();if(child.geometry){child.geometry.computeBoundingBox();center.add(child.geometry.boundingBox.getCenter(new THREE.Vector3()));}parts.push({object:child,base:child.position.clone(),center});}m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.castShadow=o.receiveShadow=true;}});});
function resize(){renderer.setSize(host.clientWidth,host.clientHeight,false);cam.aspect=host.clientWidth/host.clientHeight;cam.updateProjectionMatrix();renderer.render(scene,cam);}new ResizeObserver(resize).observe(host);
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{const mode=b.dataset.view;currentView=mode;cam.position.set(0,mode==='explode'?4.2:3.8,mode==='explode'?12.5:11);cam.lookAt(0,1.5,0);document.querySelectorAll('[data-view]').forEach(a=>a.classList.toggle('on',a===b));models.forEach(m=>m.traverse(o=>{if(o.isMesh)o.material.wireframe=mode==='wire';}));parts.forEach(p=>{p.object.position.copy(p.base);if(mode==='explode'){p.object.position.x+=p.center.x*.4;p.object.position.y+=(p.center.y-1.3)*.7;p.object.position.z+=Math.max(0,p.center.z)*1.8;}});document.querySelector('#caption').textContent={full:'直接使用游戏中的真实角色模型，放大观察轮廓、五官与配色。',wire:'线框观察：每个曲面实际由三角形组成。辨识度主要来自轮廓、比例、五官位置和配色。',explode:'拆解示意：把部件沿位置方向适度分开，观察眼睛、鼻子、衣服和身体之间的层次。'}[mode];resize();});resize();

renderer.setAnimationLoop(()=>renderer.render(scene,cam));

