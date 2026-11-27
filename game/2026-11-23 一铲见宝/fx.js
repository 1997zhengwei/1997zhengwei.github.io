import {T} from './models.js';

const stamp=new T.Object3D(), up=new T.Vector3(0,1,0), dir=new T.Vector3();

function glowTexture(stops,size=128){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const c=canvas.getContext('2d'),g=c.createRadialGradient(size/2,size/2,1,size/2,size/2,size/2);
  for(const [at,color] of stops)g.addColorStop(at,color);
  c.fillStyle=g;c.fillRect(0,0,size,size);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
}

// Hot streaks thrown off the blade rim. Each spark is stretched along its velocity.
export function sparks(root){
  const max=160;
  const mesh=new T.InstancedMesh(new T.BoxGeometry(.026,1,.026),new T.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),max);
  mesh.count=0;mesh.frustumCulled=false;mesh.renderOrder=4;root.add(mesh);
  const list=[],hot=new T.Color('#fffbd0'),warm=new T.Color('#ff8a2a'),tint=new T.Color();
  function add(x,y,z,vx,vy,vz,life){
    if(list.length<max)list.push({p:new T.Vector3(x,y,z),v:new T.Vector3(vx,vy,vz),age:0,life});
  }
  // A fan of sparks around direction (dx,dy).
  function emit(x,y,z,dx,dy,n,speed=5){
    for(let i=0;i<n;i++){
      const a=(Math.random()-.5)*.9,s=speed*(.5+Math.random()*.8);
      const cx=dx*Math.cos(a)-dy*Math.sin(a),cy=dx*Math.sin(a)+dy*Math.cos(a);
      add(x,y,z,cx*s,cy*s,(.4+Math.random())*s*.35,.16+Math.random()*.26);
    }
  }
  function burst(x,y,z,n,speed=6){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2,s=speed*(.35+Math.random()*.8);
      add(x,y,z,Math.cos(a)*s,Math.sin(a)*s+1.5,(.3+Math.random())*s*.4,.25+Math.random()*.4);
    }
  }
  function animate(dt){
    for(let i=list.length-1;i>=0;i--){
      const s=list[i];s.age+=dt;
      if(s.age>s.life){list.splice(i,1);continue;}
      s.v.y-=12*dt;s.p.addScaledVector(s.v,dt);
    }
    mesh.count=list.length;
    list.forEach((s,i)=>{
      const speed=s.v.length()||1,k=1-s.age/s.life;
      dir.copy(s.v).divideScalar(speed);
      stamp.position.copy(s.p);stamp.quaternion.setFromUnitVectors(up,dir);
      stamp.scale.set(.6+k,Math.min(.36,speed*.03)*(.35+k),.6+k);stamp.updateMatrix();
      mesh.setMatrixAt(i,stamp.matrix);mesh.setColorAt(i,tint.copy(warm).lerp(hot,k*k));
    });
    if(list.length){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}
  }
  return {emit,burst,animate};
}

// Fireball, smoke and a flat shock ring for detonations.
export function blasts(root){
  const fire=glowTexture([[0,'rgba(255,255,236,1)'],[.25,'rgba(255,214,110,.95)'],[.55,'rgba(255,120,40,.55)'],[1,'rgba(255,80,20,0)']]);
  const smoke=glowTexture([[0,'rgba(120,98,86,.55)'],[.6,'rgba(150,130,118,.3)'],[1,'rgba(170,150,140,0)']]);
  const make=(map,blending)=>{
    const m=new T.SpriteMaterial({map,transparent:true,depthWrite:false,blending,opacity:0,toneMapped:false});
    m.userData.disposeMap=true;const s=new T.Sprite(m);s.visible=false;s.renderOrder=5;root.add(s);return s;
  };
  const flames=Array.from({length:6},()=>make(fire,T.AdditiveBlending));
  const puffs=Array.from({length:10},()=>make(smoke,T.NormalBlending));
  const ringMat=new T.MeshBasicMaterial({color:'#ffe9a8',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,toneMapped:false,blending:T.AdditiveBlending});
  const rings=Array.from({length:3},()=>{const r=new T.Mesh(new T.RingGeometry(.82,1,48),ringMat.clone());r.visible=false;r.renderOrder=5;root.add(r);return r;});
  let nf=0,np=0,nr=0;const live=[];
  function start(obj,data){obj.visible=true;obj.userData=data;if(!live.includes(obj))live.push(obj);}
  function boom(x,y,z,size=1,smoky=true){
    for(let i=0;i<3;i++){
      const f=flames[nf++%flames.length];
      f.position.set(x+(Math.random()-.5)*.4*size,y+(Math.random()-.5)*.4*size,z+.2+i*.05);
      start(f,{age:-i*.04,life:.42+i*.08,from:.4*size,to:(2.4+i*.5)*size,peak:1,rise:.6});
    }
    for(let i=0;i<(smoky?4:0);i++){
      const s=puffs[np++%puffs.length];
      s.position.set(x+(Math.random()-.5)*.9*size,y+(Math.random()-.2)*.6*size,z-.1);
      start(s,{age:-.08-i*.05,life:1.1+Math.random()*.5,from:.6*size,to:(2.2+Math.random())*size,peak:.8,rise:1.1});
    }
    const ring=rings[nr++%rings.length];ring.position.set(x,y,z+.3);
    start(ring,{age:0,life:.5,from:.3*size,to:3.2*size,peak:.9,rise:0,ring:true});
  }
  function animate(dt,camera){
    for(let i=live.length-1;i>=0;i--){
      const o=live[i],d=o.userData;d.age+=dt;
      if(d.age<0){o.material.opacity=0;continue;}
      const t=Math.min(1,d.age/d.life),grow=1-(1-t)**3;
      o.scale.setScalar(d.from+(d.to-d.from)*grow);
      o.position.y+=d.rise*dt*(1-t);
      o.material.opacity=d.peak*(t<.15?t/.15:1-(t-.15)/.85);
      if(d.ring)o.quaternion.copy(camera.quaternion);
      if(t>=1){o.visible=false;live.splice(i,1);}
    }
  }
  return {boom,animate};
}

// Soft sunburst that sits behind a revealed gem.
export function rayTexture(){
  const size=256,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const c=canvas.getContext('2d'),h=size/2;
  c.translate(h,h);
  for(let i=0;i<14;i++){
    const a=i*Math.PI*2/14,w=i%2?.09:.15;
    const g=c.createLinearGradient(0,0,Math.cos(a)*h,Math.sin(a)*h);
    g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.5,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=g;c.beginPath();c.moveTo(0,0);c.arc(0,0,h,a-w,a+w);c.closePath();c.fill();
  }
  const core=c.createRadialGradient(0,0,0,0,0,h*.55);
  core.addColorStop(0,'rgba(255,255,255,.95)');core.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=core;c.beginPath();c.arc(0,0,h*.55,0,Math.PI*2);c.fill();
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
}
export {glowTexture};
