import * as T from '../vendor/three.module.js';

// Test the rendered, rotated model against the finite camera-to-player segment.
// Items beyond the player or behind the camera must remain unaffected.
const inverse=new T.Matrix4(),origin=new T.Vector3(),target=new T.Vector3(),direction=new T.Vector3(),hit=new T.Vector3(),box=new T.Box3(),ray=new T.Ray();
export function obstructsPlayerView(cameraPosition,focus,geometry,worldMatrix,padding=0){
 inverse.copy(worldMatrix).invert();origin.copy(cameraPosition).applyMatrix4(inverse);target.copy(focus).applyMatrix4(inverse);
 box.copy(geometry.boundingBox).expandByScalar(padding/Math.max(.001,worldMatrix.getMaxScaleOnAxis()));
 if(box.containsPoint(origin))return true;
 direction.copy(target).sub(origin);const length=direction.length();if(length<1e-6)return false;
 ray.set(origin,direction.multiplyScalar(1/length));
 return !!ray.intersectBox(box,hit)&&origin.distanceTo(hit)<length-.001;
}

const surfaceRay=new T.Raycaster(),surfaceDirection=new T.Vector3(),surfaceHits=[];
export function surfaceObstructsView(cameraPosition,focus,surface){
 surfaceDirection.copy(focus).sub(cameraPosition);const length=surfaceDirection.length();if(length<1e-6)return false;
 surfaceRay.set(cameraPosition,surfaceDirection.multiplyScalar(1/length));surfaceRay.near=0;surfaceRay.far=length-.001;surfaceHits.length=0;
 surface.updateWorldMatrix(true,true);
 // Test triangles even after a previous frame cut the surface away. Bounding
 // boxes alone would incorrectly hide walls whose open doorway is in view.
 surface.traverse(object=>{if(object.isMesh)object.raycast(surfaceRay,surfaceHits);});
 return surfaceHits.length>0;
}
