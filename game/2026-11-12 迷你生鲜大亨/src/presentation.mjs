import * as T from '../vendor/three.module.js';
import {cargoHeight} from './cargo.mjs';
export function screenDirection(camera,x,y){const d=new T.Vector3();camera.getWorldDirection(d);d.y=0;d.normalize();return {x:-d.z*x-d.x*y,y:d.x*x-d.z*y};}
export function project(camera,x,y,z,width,height){const p=new T.Vector3(x,y,z).project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2,visible:p.z>-1&&p.z<1&&Math.abs(p.x)<1.15&&Math.abs(p.y)<1.15};}
export function pickFloor(camera,x,y,width,height){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/width*2-1,1-y/height*2),camera);const p=new T.Vector3();return ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-.25),p)?[p.x,p.z]:null;}
export class CameraRig{
 constructor(camera){this.camera=camera;this.focus=new T.Vector3(-1,.3,6);this.overview=false;this.width=1;this.height=1;this.cargoHeight=2.5;this.viewHeight=25;}
 resize(w,h){this.width=w;this.height=h;this.updateProjection();}
 updateProjection(){const c=this.camera,aspect=this.width/this.height,height=this.overview?(this.height>this.width?Math.max(72,(this.expanded?56:42)/aspect):57):this.viewHeight;c.left=-height*aspect/2;c.right=height*aspect/2;c.top=height/2;c.bottom=-height/2;c.near=.1;c.far=250;c.updateProjectionMatrix();}
 toggle(){this.overview=!this.overview;this.updateProjection();return this.overview;}
 update(p,dt,expanded=false){this.expanded=expanded;const pile=cargoHeight(p.bag||{}),base=this.height>this.width?25:23;this.cargoHeight+=(pile-this.cargoHeight)*(1-Math.exp(-dt*5));const wanted=base+Math.max(0,this.cargoHeight-6)*.72;this.viewHeight+=(wanted-this.viewHeight)*(1-Math.exp(-dt*4));this.updateProjection();const rise=Math.max(0,this.cargoHeight-3)*.34;const target=this.overview?new T.Vector3(expanded?4.5:1,.3,-1):new T.Vector3(p.x+.5,.6+rise,p.z-1.5);this.focus.lerp(target,1-Math.exp(-dt*5));this.camera.position.copy(this.focus).add(new T.Vector3(8,32,25));this.camera.lookAt(this.focus);this.camera.updateMatrixWorld();}
}
