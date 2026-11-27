import * as T from '../vendor/three.module.js';
export const WORLD_SCALE=.88;
export const FOLLOW_HEIGHT=22;
export const CAMERA_OFFSET=Object.freeze({x:19,y:30,z:24});
export function floorHeightAt(x,z){
 if(z<-20){if(Math.abs(x)>3.6&&Math.abs(x)<12.7&&z<-40&&z>-59)return .4;return Math.abs(x)<2.8&&z<-37?.36:.28;}
 if(Math.abs(x)>13)return .14;
 if(Math.abs(x)>3.6&&Math.abs(x)<12.7&&z<4.8&&z>-19)return .4;
 return Math.abs(x)<2.8&&z<4.7?.36:.28;
}
export function projectPoint(camera,x,y,z,width,height){const p=new T.Vector3(x*WORLD_SCALE,y,z*WORLD_SCALE).project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2,visible:p.z<1&&p.x>-1.2&&p.x<1.2&&p.y>-1.2&&p.y<1.2};}
export function screenDirection(camera,x,y){const dir=new T.Vector3();camera.getWorldDirection(dir);dir.y=0;dir.normalize();const right=new T.Vector3(-dir.z,0,dir.x);return {x:right.x*x-dir.x*y,z:right.z*x-dir.z*y};}
export function pickFloor(camera,x,y,width,height){
 const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/width*2-1,-y/height*2+1),camera);
 const p=new T.Vector3(),plane=new T.Plane(new T.Vector3(0,1,0),-.28);
 if(!ray.ray.intersectPlane(plane,p))return null;
 plane.constant=-floorHeightAt(p.x/WORLD_SCALE,p.z/WORLD_SCALE);
 ray.ray.intersectPlane(plane,p);
 return {x:p.x/WORLD_SCALE,z:p.z/WORLD_SCALE};
}
