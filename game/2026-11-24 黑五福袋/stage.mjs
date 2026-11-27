import * as T from './vendor/three.module.js';
import {products,cellOpen,measurePressure,supportContacts} from './packing.mjs';
import {merchandise} from './merch.mjs';

const cream='#ffedc1';
const pitch=.84;
const bottom=.08;
const depth=.64;
function painted(width,height,draw) {
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  draw(canvas.getContext('2d'),width,height);
  const tex=new T.CanvasTexture(canvas);
  tex.colorSpace=T.SRGBColorSpace;
  tex.anisotropy=4;
  return tex;
}

function block(parent,w,h,d,x,y,z,color) {
  const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.78}));
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}

function disposeBag(bag) {
  bag.traverse(obj=>{
    if(!obj.isMesh) return;
    obj.geometry.dispose();
    obj.material.map?.dispose();
    obj.material.dispose();
  });
  bag.clear();
}

function bagOutline(level) {
  const points=[];
  for(let x=0;x<level.w;x++){
    const top=level.tops?.[x]??level.h;
    points.push([x,top],[x+1,top]);
  }
  for(let x=level.w-1;x>=0;x--){
    const floor=level.floors?.[x]??0;
    points.push([x+1,floor],[x,floor]);
  }
  return points;
}

export function packingStage(host){
  const scene=new T.Scene(), camera=new T.OrthographicCamera();
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
  renderer.setClearColor(0,0);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.24;
  const sky=new T.HemisphereLight('#fff3df','#8a735b',1.74);
  const key=new T.DirectionalLight('#fff6e2',2.53);key.position.set(-4,8,8);
  const rim=new T.DirectionalLight('#b9f2ff',1.15);rim.position.set(3,4,-5);
  scene.add(sky,key,rim);
  host.prepend(renderer.domElement);

  const bag=new T.Group(), stock=new T.Group();
  scene.add(bag,stock);
  const ghost=new T.Mesh(new T.BoxGeometry(1,1,.10),new T.MeshBasicMaterial({
    color:'#5ddaac',transparent:true,opacity:.33,depthWrite:false,
  }));
  const outline=new T.LineSegments(new T.EdgesGeometry(ghost.geometry),
    new T.LineBasicMaterial({color:'#10664b',transparent:true,opacity:.94}));
  ghost.add(outline);scene.add(ghost);
  const drag=new T.Group();scene.add(drag);
  const crackPath=new T.BufferGeometry().setFromPoints([
    [-.24,.29],[.015,.078],[.034,-.014],[.164,-.18],
    [.034,-.014],[-.113,-.085],[-.17,-.26],
  ].map(([x,y])=>new T.Vector3(x,y,0)));
  const crackInk=new T.LineBasicMaterial({color:'#fff7d8'});
  const shadeGeometry=new T.PlaneGeometry(1,1);
  const shadowTexture=painted(64,64,(ctx,w,h)=>{
    const gradient=ctx.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);
    gradient.addColorStop(0,'#1d101ea6');gradient.addColorStop(.68,'#21111d40');gradient.addColorStop(1,'#21111d00');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  });
  const dustGeometry=new T.CircleGeometry(1,8);
  const particles=Array.from({length:10},()=>{
    const mesh=new T.Mesh(dustGeometry,new T.MeshBasicMaterial({color:'#fff0b2',transparent:true,depthWrite:false}));
    mesh.visible=false;
    scene.add(mesh);
    return mesh;
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const models=new Map();
  let level, bagWidth, held=null, walls=[], handle, bagPulse, renderStack=[];

  function resize(){
    const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
    const extra=Math.max(0,(level?.h??5)-5)*pitch;
    const fullWidth=Math.max(7.3,(5.58+extra)*w/h),fullHeight=fullWidth*h/w;
    Object.assign(camera,{left:-fullWidth/2,right:fullWidth/2,bottom:-fullHeight/2,top:fullHeight/2,near:.1,far:60});
    camera.position.set(1.31,3.64+extra/2,18);
    camera.lookAt(0,2.66+extra/2,0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    renderer.setSize(w,h,false);
  }
  new ResizeObserver(resize).observe(host);
  resize();

  function reset(next){
    level=next;bagWidth=level.w*pitch;
    const height=level.h*pitch;
    const paper=level.paper??'#edb982';
    const trim=level.trim??'#ba774b';
    const accent=level.accent??'#b27143';
    const contour=bagOutline(level);
    resize();
    for(const {shadow} of models.values())shadow.material.dispose();
    disposeBag(bag);stock.clear();models.clear();
    walls=[];renderStack=[];bagPulse=null;bag.rotation.z=0;
    for(const particle of particles)particle.visible=false;
    const board=painted(512,Math.round(512*height/bagWidth),(ctx,w,h)=>{
      const wash=ctx.createRadialGradient(w*.47,h*.12,w*.06,w*.47,h*.27,h*.92);
      wash.addColorStop(0,'#ffeece');wash.addColorStop(.69,paper);wash.addColorStop(1,trim);
      const unit=w/level.w;
      ctx.beginPath();
      for(const [i,[x,y]] of contour.entries()){
        if(i===0)ctx.moveTo(x*unit,h-y*h/level.h);
        else ctx.lineTo(x*unit,h-y*h/level.h);
      }
      ctx.closePath();ctx.clip();
      ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
      let seed=931;
      for(let i=0;i<4200;i++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const x=seed/2**32*w;
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        ctx.fillStyle=i%3===0?'#fff1cf55':'#9b562526';
        ctx.fillRect(x,seed/2**32*h,1+(i%4),1);
      }
      ctx.strokeStyle='#8d522773';ctx.lineWidth=1.6;ctx.setLineDash([3,5]);ctx.beginPath();
      for(let x=1;x<level.w;x++){ctx.moveTo(x*w/level.w,0);ctx.lineTo(x*w/level.w,h);}
      for(let y=1;y<level.h;y++){ctx.moveTo(0,y*h/level.h);ctx.lineTo(w,y*h/level.h);}
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();
      ctx.strokeStyle='#7a3f1fb0';ctx.lineWidth=3.2;ctx.setLineDash([9,7]);ctx.lineJoin='round';
      ctx.beginPath();
      const inset=7;
      for(const [i,[x,y]] of contour.entries()){
        const px=Math.min(w-inset,Math.max(inset,x*unit)), py=Math.min(h-inset,Math.max(inset,h-y*h/level.h));
        if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.stroke();
      ctx.restore();
      ctx.strokeStyle='#fffbe76e';ctx.lineWidth=3;
      for(let x=0;x<level.w;x++)for(let y=0;y<level.h;y++){
        if(cellOpen(level,x,y)&&!cellOpen(level,x,y-1)){
          const baseline=h-y*h/level.h-4;
          ctx.beginPath();ctx.moveTo(x*unit,baseline);ctx.lineTo((x+1)*unit,baseline);ctx.stroke();
        }
      }
    });
    const liner=new T.Mesh(new T.PlaneGeometry(bagWidth,height),new T.MeshBasicMaterial({map:board,transparent:true,alphaTest:.15}));
    liner.position.set(0,bottom+height/2,-.36);bag.add(liner);
    const silhouette=new T.Shape(contour.map(([x,y])=>new T.Vector2(x*pitch-bagWidth/2,bottom+y*pitch)));
    const backing=new T.Mesh(new T.ExtrudeGeometry(silhouette,{
      depth:.13,bevelEnabled:true,bevelSegments:3,bevelSize:.07,bevelThickness:.045,
    }),new T.MeshStandardMaterial({color:trim,roughness:.87}));
    backing.position.z=-.58;bag.add(backing);
    for(let x=0;x<level.w;x++){
      const floor=level.floors?.[x]??0,top=level.tops?.[x]??level.h;
      const center=(x+.5)*pitch-bagWidth/2;
      block(bag,pitch+.007,.115,.98,center,bottom+floor*pitch-.063,.11,trim);
      block(bag,pitch+.007,.041,.035,center,bottom+floor*pitch-.048,.614,cream);
      block(bag,pitch+.01,.059,.19,center,bottom+top*pitch+.03,-.31,trim);
      if(x===level.w-1)continue;
      const nextTop=level.tops?.[x+1]??level.h, nextFloor=level.floors?.[x+1]??0;
      if(nextTop!==top){
        block(bag,.068,Math.abs(nextTop-top)*pitch,.20,center+pitch*.5,bottom+(top+nextTop)*pitch*.5,-.29,trim);
      }
      if(nextFloor!==floor){
        block(bag,.08,Math.abs(nextFloor-floor)*pitch,.88,center+pitch*.5,bottom+(floor+nextFloor)*pitch*.5,.072,accent);
      }
    }
    if(level.divider){
      const x=level.divider.column*pitch-bagWidth/2, y=level.divider.height*pitch;
      block(bag,.081,y,.87,x,bottom+y/2,.106,accent);
      block(bag,.094,y,.036,x,bottom+y/2,.56,trim);
      block(bag,.137,.074,.92,x,bottom+y-.014,.106,cream);
    }
    for(const d of [-1,1]){
      const column=d<0?0:level.w-1;
      const floor=level.floors?.[column]??0, top=level.tops?.[column]??level.h;
      const wallHeight=(top-floor)*pitch;
      const x=d*(bagWidth/2+.093);
      const wall=new T.Group();wall.position.set(x,bottom+floor*pitch,0);bag.add(wall);
      block(wall,.174,wallHeight+.16,1.16,0,wallHeight/2,.17,paper);
      block(wall,.057,wallHeight+.16,.038,d*.032,wallHeight/2,.761,cream);
      const fold=new T.BufferGeometry();
      fold.setAttribute('position',new T.Float32BufferAttribute([
        0,wallHeight+.04,.62, d*.29,wallHeight-.17,-.26, d*.23,.28,-.26,
        0,wallHeight+.04,.62, d*.23,.28,-.26, 0,-.08,.62,
      ],3));
      fold.computeVertexNormals();
      const flap=new T.Mesh(fold,new T.MeshStandardMaterial({color:accent,roughness:.96,side:T.DoubleSide}));
      wall.add(flap);walls.push({wall,d,x});
    }
    handle=new T.Group();handle.position.set(0,bottom+height+.03,-.20);bag.add(handle);
    const ropeCurve=new T.CubicBezierCurve3(new T.Vector3(-1.13,0,0),
      new T.Vector3(-1.02,1.01,-.07),
      new T.Vector3(1.02,1.01,-.07),
      new T.Vector3(1.13,0,0));
    const tug=level.tops&&level.tops[0]<4 ? .71 : 1;
    handle.scale.x=tug;
    for(const [radius,color] of [[.083,trim],[.062,cream]]){
      const part=new T.Mesh(new T.TubeGeometry(ropeCurve,32,radius,8,false),new T.MeshStandardMaterial({color,roughness:.91}));
      if(radius<.08)part.position.set(-.008,.025,.019);
      handle.add(part);
    }
    const tagFace=painted(128,128,(ctx,w,h)=>{
      ctx.fillStyle='#c8362b';ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='#f3c242';ctx.lineWidth=7;ctx.strokeRect(9,9,w-18,h-18);
      ctx.fillStyle='#f8d65a';ctx.font='900 78px "Microsoft YaHei",sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.save();ctx.translate(w/2,h/2+3);ctx.rotate(Math.PI);ctx.fillText('福',0,0);ctx.restore();
    });
    const tag=new T.Group();
    // 挂在 bag 上而不是 handle 上：handle 会按袋口宽度横向压缩，吊牌不能跟着变形
    tag.position.set(.86*tug,bottom+height+.45,.12);bag.add(tag);
    const string=new T.Mesh(new T.CylinderGeometry(.012,.012,.3,6),new T.MeshStandardMaterial({color:'#f3c242',roughness:.6}));
    string.position.y=-.02;tag.add(string);
    const card=new T.Mesh(new T.PlaneGeometry(.5,.5),new T.MeshStandardMaterial({map:tagFace,roughness:.7,side:T.DoubleSide}));
    card.position.y=-.3;card.rotation.z=Math.PI/4+.12;tag.add(card);
    tag.rotation.z=-.18;
    const shadow=painted(256,64,(ctx,w,h)=>{
      ctx.scale(w/h,1);ctx.fillStyle=ctx.createRadialGradient(h/2,h/2,2,h/2,h/2,h/2);
      ctx.fillStyle.addColorStop(0,'#58382775');ctx.fillStyle.addColorStop(1,'#58382700');ctx.fillRect(0,0,h,h);
    });
    const shade=new T.Mesh(new T.PlaneGeometry(bagWidth+1.3,.87),new T.MeshBasicMaterial({map:shadow,transparent:true,depthWrite:false}));
    shade.position.set(.09,bottom-.20,-.54);bag.add(shade);
    for(const id of level.items){
      const node=new T.Group(), pivot=new T.Group();
      node.visible=false;stock.add(node);node.add(pivot);
      pivot.add(merchandise(id,pitch));
      const crack=new T.Line(crackPath,crackInk);
      crack.position.z=.385;crack.visible=false;pivot.add(crack);
      const shadow=new T.Mesh(shadeGeometry,new T.MeshBasicMaterial({
        color:'#a3896b',map:shadowTexture,transparent:true,opacity:.66,depthWrite:false,
      }));
      stock.add(shadow);shadow.visible=false;
      models.set(id,{node,pivot,crack,shadow});
    }
    ghost.visible=false;
  }

  function placement(item){
    return [-bagWidth/2+(item.x+item.w/2)*pitch,bottom+(item.y+item.h/2)*pitch];
  }
  function update(layout,preview,dragging,resetMotion=false){
    const lift=dragging?.fromBag ? dragging.id : null;
    const visible=preview?.layout && lift ? preview.remaining : layout;
    renderStack=[...visible].sort((a,b)=>a.y-b.y);
    const loads=measurePressure(visible,level);
    const projected=preview?.layout ? measurePressure(preview.layout,level):null;
    for(const [id,actor] of models){
      const {node,shadow}=actor;
      const item=visible.find(item=>item.id===id);
      const wasVisible=node.visible;
      node.visible=!!item&&id!==lift;
      shadow.visible=node.visible;
      if(resetMotion || !item || id===lift) {
        actor.flight=null;actor.impact=null;actor.crackAt=0;
      }
      if(!node.visible)continue;
      const [x,y]=placement(item);
      const angle=item.turned ? -Math.PI/2 : 0;
      const pressure=loads.get(id)??0, projectedLoad=projected?.get(id)??0;
      const limit=products[id].limit??Infinity;
      const kind=products[id].kind;
      const flexible=['cookies','cocoa','tea','candles','audio','plush'].includes(kind);
      actor.target={x,y,angle,broken:item.broken,w:item.w,h:item.h,pressure,
        flexible,warning:!item.broken&&projectedLoad>limit&&projectedLoad>pressure,
        supports:supportContacts(visible,item).map(support=>support.id)};
      if(!wasVisible){
        node.position.set(x,y,depth*.37);
        actor.pivot.rotation.z=angle;
      }
    }
    ghost.visible=!!preview;
    if(preview){
      const {entry,layout:valid,broken}=preview;
      const pos=placement(entry);
      ghost.scale.set(entry.w*pitch-.035,entry.h*pitch-.035,1);
      const top=(preview.ceiling??level.h)*pitch;
      ghost.position.set(pos[0],Math.min(pos[1],bottom+Math.max(top/2,top-entry.h*pitch/2)),.73);
      ghost.material.color.set(!valid||broken.length ? '#e96654' : '#65edb1');
      outline.material.color.set(!valid||broken.length ? '#b12a24' : '#18745b');
    }
    drag.visible=!!dragging;
    if(dragging){
      if(held!==dragging.id){drag.clear();drag.add(merchandise(dragging.id,pitch));held=dragging.id;}
      drag.position.set(dragging.point.x,dragging.point.y,1.09);
      drag.rotation.set(-.16,.12,dragging.turned?-Math.PI/2:0);
      drag.scale.setScalar(.91);
    }
  }
  function land(entry,layout,newDamage,origin,onContact){
    const actor=models.get(entry.id);
    const [x,y]=placement(entry);
    const now=performance.now();
    const dx=origin ? T.MathUtils.clamp(origin.x-x,-.44,.44):0;
    const dy=origin ? T.MathUtils.clamp(origin.y-y,.32,1.33):.55;
    actor.flight={at:now,dx,dy,duration:reduced.matches?1:Math.min(295,135+dy*105),
      entry,layout,newDamage,onContact};
    for(const id of newDamage)models.get(id).crackAt=now+actor.flight.duration;
    actor.impact=null;
  }

  function contact(flight,time){
    const {entry,layout,newDamage,onContact}=flight;
    const strength=T.MathUtils.clamp(.58+products[entry.id].weight*.092,.72,1.25);
    const reactions=new Map([[entry.id,strength]]);
    let layer=[entry];
    while(layer.length){
      const next=new Map();
      for(const item of layer){
        const supports=supportContacts(layout,item);
        for(const support of supports){
          const force=reactions.get(item.id)*.58/Math.sqrt(supports.length);
          reactions.set(support.id,Math.max(force,reactions.get(support.id)??0));
          next.set(support.id,support);
        }
      }
      layer=[...next.values()];
    }
    for(const [id,force] of reactions){
      const actor=models.get(id);
      actor.impact={at:time,force,dropped:id===entry.id,direction:id.length%2?1:-1};
    }
    bagPulse={at:time,strength,direction:entry.x+entry.w*.5>level.w/2?1:-1};
    const [x,y]=placement(entry);
    const source=newDamage.length ? layout.find(item=>item.id===newDamage[0]):entry;
    const [hitX,hitY]=placement(source);
    for(const [i,mesh] of particles.entries()){
      mesh.visible=!reduced.matches;
      const direction=i%2?1:-1;
      mesh.material.color.set(newDamage.length?'#fff1f4':'#ffebbd');
      mesh.userData={at:time,x:newDamage.length?hitX+direction*.16:x+direction*entry.w*pitch*.34,
        y:newDamage.length?hitY+.05:y-entry.h*pitch*.43,
        vx:direction*(.68+i*.14), vy:.28+(i%4)*.32, size:.028+(i%3)*.015};
    }
    onContact();
  }
  const ray=new T.Raycaster(), plane=new T.Plane(new T.Vector3(0,0,1),-depth*.37);
  function point(clientX,clientY){
    const rect=host.getBoundingClientRect();
    ray.setFromCamera({x:(clientX-rect.left)/rect.width*2-1,y:1-(clientY-rect.top)/rect.height*2},camera);
    return ray.ray.intersectPlane(plane,new T.Vector3());
  }
  function grid(p){
    return {x:(p.x+bagWidth/2)/pitch,y:(p.y-bottom)/pitch};
  }
  let prev=0;
  const contactDepth=new Map();
  function frame(time){
    const dt=Math.min(.04,(time-prev)/1000);prev=time;
    const blend=1-Math.exp(-19*dt);
    for(const {flight,node} of models.values()){
      if(node.visible&&flight&&time-flight.at>=flight.duration){
        const actor=models.get(flight.entry.id);
        actor.flight=null;contact(flight,time);
      }
    }
    contactDepth.clear();
    for(const {id} of renderStack){
      const actor=models.get(id);
      const {node,pivot,crack,shadow,target,flight,impact}=actor;
      if(!node.visible)continue;
      const {x,y,angle,broken,w,h,pressure,flexible,warning,supports}=target;
      const elapsed=impact ? Math.max(0,(time-impact.at)/1000):5;
      const wave=impact&&!reduced.matches ? Math.exp(-elapsed*7)*impact.force:0;
      const squeeze=wave*Math.max(0,Math.cos(elapsed*27))*(flexible ? .119 : .045);
      const bounce=wave*Math.sin(elapsed*21)*(impact?.dropped ? .17 : -.055);
      const lean=wave*Math.sin(elapsed*25)*(impact?.direction??1)*(flexible ? .075 : .048);
      const waitingForCrack=time<(actor.crackAt??0);
      const glassBroken=broken&&!waitingForCrack;
      const compressed=waitingForCrack?0:Math.min(.069,pressure*.012)*(flexible ? 1 : .32);
      const squash=squeeze+compressed+(glassBroken ? .14 : 0);
      const rumble=warning&&!reduced.matches?Math.sin(time*.032)*.022:0;
      // A packed item settles to the highest visible support when packaging compresses.
      const supportSink=supports.length ? Math.min(...supports.map(id=>contactDepth.get(id)??0)):0;
      contactDepth.set(id,supportSink+squash*h*pitch);
      const f=flight ? T.MathUtils.clamp((time-flight.at)/flight.duration,0,1):1;
      const tx=x+(flight ? flight.dx*(1-f)**2:0);
      const ty=y+(flight ? flight.dy*(1-f*f):0)+bounce-squash*h*pitch*.5-supportSink;
      if(flight||wave>.012)node.position.set(tx,ty,depth*.37+(1-f)*.51);
      else {
        node.position.x+=(tx-node.position.x)*blend;
        node.position.y+=(ty-node.position.y)*blend;
        node.position.z=depth*.37;
      }
      node.rotation.z=lean+rumble+(glassBroken ? .063 : 0);
      node.rotation.x=(1-f)*-.20;
      node.rotation.y=(1-f)*.16;
      node.scale.set(1+squash*.28,1-squash,1+squash*.17);
      pivot.rotation.z+=(angle-pivot.rotation.z)*blend;
      crack.visible=glassBroken;
      shadow.position.set(node.position.x+.058,node.position.y-.048,-.23);
      shadow.scale.set(w*pitch*1.22,h*pitch*.96,1);
      shadow.material.opacity=.68+(1-f)*.13;
    }
    for(const mesh of particles){
      if(!mesh.visible)continue;
      const {at,x,y,vx,vy,size}=mesh.userData,t=Math.max(0,(time-at)/1000);
      if(t>.38){mesh.visible=false;continue;}
      mesh.material.opacity=(1-t/.38)**1.4;
      mesh.position.set(x+vx*t,y+vy*t-.92*t*t,1.04);
      mesh.scale.setScalar(size*(1+t));
    }
    if(bagPulse){
      const t=Math.max(0,(time-bagPulse.at)/1000);
      const drift=reduced.matches?0:Math.exp(-t*7)*Math.sin(t*25)*bagPulse.strength;
      bag.rotation.z=-drift*.018*bagPulse.direction;
      handle.rotation.x=drift*.28;
      for(const {wall,d,x} of walls){
        wall.position.x=x+d*drift*.083;
        wall.rotation.z=-d*drift*.031;
      }
    }
    renderer.render(scene,camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function thumbnails(){
    // Render thumbnails with the same artwork and lights as the pieces in the bag.
    const swatch=new T.Scene(), view=new T.OrthographicCamera(-1.40,1.40,1.40,-1.40,.1,30);
    swatch.add(sky.clone(),key.clone());
    view.position.set(4,4,13);view.lookAt(0,0,0);
    const images={};
    const preview=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
    preview.setSize(138,138);preview.outputColorSpace=T.SRGBColorSpace;
    preview.toneMapping=renderer.toneMapping;preview.toneMappingExposure=renderer.toneMappingExposure;
    for(const id of Object.keys(products)){
      const item=merchandise(id,pitch);swatch.add(item);
      preview.render(swatch,view);
      images[id]=preview.domElement.toDataURL();swatch.remove(item);
    }
    preview.dispose();preview.forceContextLoss();return images;
  }
  return {reset,update,point,grid,thumbnails,land};
}
