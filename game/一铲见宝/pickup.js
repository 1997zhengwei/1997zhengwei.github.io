import {T} from './models.js';

const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
function pointDistance(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  const t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)):0;
  return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
}
// Test the swept teeth against the outline the player sees. Camera-space x/y
// are world units for the orthographic camera, independent of screen density.
export function gemContact(jewel){
  const positions=jewel.geometry.attributes.position, vertices=new Map();
  for(let i=0;i<positions.count;i++){
    const v=new T.Vector3().fromBufferAttribute(positions,i);
    vertices.set([v.x,v.y,v.z].join(','),v);
  }
  const points=Array.from(vertices.values(),v=>({v,x:0,y:0}));
  const view=new T.Matrix4(),tmp=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3();
  const hull=[],upper=[];
  function push(chain,p){
    while(chain.length>1&&cross(chain.at(-2),chain.at(-1),p)<=0)chain.pop();
    chain.push(p);
  }
  return function touches(start,end,camera,bladeZ,bladeRadius){
    jewel.updateWorldMatrix(true,false);view.multiplyMatrices(camera.matrixWorldInverse,jewel.matrixWorld);
    for(const p of points){tmp.copy(p.v).applyMatrix4(view);p.x=tmp.x;p.y=tmp.y;}
    points.sort((p,q)=>p.x-q.x||p.y-q.y);
    hull.length=upper.length=0;
    for(const p of points)push(hull,p);
    for(let i=points.length-1;i>=0;i--)push(upper,points[i]);
    hull.pop();upper.pop();hull.push(...upper);
    a.set(start.x,start.y,bladeZ).applyMatrix4(camera.matrixWorldInverse);
    b.set(end.x,end.y,bladeZ).applyMatrix4(camera.matrixWorldInverse);
    let inside=true;const r2=(bladeRadius+.045)**2;
    for(let i=0;i<hull.length;i++){
      const p=hull[i],q=hull[(i+1)%hull.length];
      const sideA=cross(p,q,a),sideB=cross(p,q,b);
      if(sideB<0)inside=false;
      if(sideA*sideB<0&&cross(a,b,p)*cross(a,b,q)<0)return true;
      if(Math.min(pointDistance(a,p,q),pointDistance(b,p,q),pointDistance(p,a,b),pointDistance(q,a,b))<=r2)return true;
    }
    return inside;
  };
}
