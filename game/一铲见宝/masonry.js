import {T,paint,put,clamp,rng,cyl,block} from './models.js';
import {jobs} from './garage.js';
import {sampleWall,world,cell,bottom} from './mosaics.js';
export {bottom};
export const binX=-3.88, binZ=2.49;
const axis=new T.Vector3(), spin=new T.Quaternion(), transform=new T.Object3D();
const floor=bottom+cell*.46;
const particleAxis=new T.Vector3(.2,.15,1).normalize();

// The column stays on the apron. Its front pin attaches one real tile to the frame.
// Cutting the pin removes that support; cutting around it can leave it holding a small island.
function buildMounts(root,positions,bricks){
  const frame=paint('#447887',.61,.25), bright=paint('#8ec1c5',.49,.22), dark=paint('#244452',.50,.27);
  const blue=paint('#35baf0',.29,.23), face=paint('#e9ffff',.37,.18);
  return positions.map(([col,row,side])=>{
    const p=world(col,row);
    const tile=bricks.reduce((a,b)=>Math.hypot(a.base.x-p.x,a.base.y-p.y)<Math.hypot(b.base.x-p.x,b.base.y-p.y)?a:b);
    const {x,y,z}=tile.base,postX=clamp(x+side*.82,-4.65,5.3),rear=-.76;
    block(root,.67,.20,.64,dark,postX,bottom+.03,rear,.035);
    block(root,.19,y-bottom,.24,frame,postX,(y+bottom)/2,rear,.018);
    block(root,.045,y-bottom,.035,bright,postX-.047,(y+bottom)/2,rear+.13,.006);
    const span=Math.abs(postX-x),middle=(postX+x)/2;
    block(root,span+.23,.16,.24,bright,middle,y,rear,.018);
    const brace=block(root,Math.hypot(span,.65),.10,.16,frame,middle,y-.325,rear,.013);
    brace.rotation.z=Math.atan2(.65,x-postX);
    const sleeve=cyl(root,.18,.18,.80,dark,x,y,rear+.4,12);sleeve.rotation.x=Math.PI/2;
    const pin=new T.Group();root.add(pin);pin.position.set(x,y,z+.50);
    block(pin,.66,.52,.12,dark,0,0,0,.06);
    cyl(pin,.235,.235,.12,blue,0,0,.10,8).rotation.x=Math.PI/2;
    block(pin,.25,.055,.025,face,0,0,.173,.01);block(pin,.055,.24,.025,face,0,0,.174,.01);
    tile.hp=2.5;tile.pin=pin;
    return tile;
  });
}

const lootTint={coin:'#f4b937',fuel:'#e4553e',tnt:'#c8352d'};
const backOut=t=>1+2.2*(t-1)**3+1.2*(t-1)**2;

// Small props pinned on the face of a special brick. They pop off when the brick leaves the wall.
function lootMarker(root,type){
  const g=new T.Group();root.add(g);
  if(type==='coin'){
    const gold=paint('#ffcd3c',.24,.62,{emissive:'#b0700a',emissiveIntensity:.22}),dark=paint('#6d4113',.55,.25);
    const face=new T.Group();g.add(face);
    cyl(face,.19,.19,.06,gold,0,0,0,28).rotation.x=Math.PI/2;
    put(face,new T.TorusGeometry(.165,.02,6,28),gold,0,0,.034);
    block(face,.09,.09,.085,dark,0,0,0,.012);
    for(const [x,y] of [[0,.115],[0,-.115],[.115,0],[-.115,0]])block(face,.035,.035,.02,dark,x,y,.035,.006);
    g.userData.spin=face;
  }else if(type==='fuel'){
    const red=paint('#f2473c',.32,.16),gold=paint('#ffd447',.3,.22,{emissive:'#b07a00',emissiveIntensity:.2}),dark=paint('#3a2a2e',.5,.2);
    block(g,.25,.30,.11,red,0,-.01,0,.035);
    block(g,.13,.045,.12,dark,-.035,.16,0,.014);
    cyl(g,.035,.035,.07,gold,.075,.175,0,10);
    put(g,new T.SphereGeometry(.058,14,10),gold,0,-.04,.07);
    put(g,new T.ConeGeometry(.045,.075,14),gold,0,.018,.07);
    g.userData.bob=true;
  }else{
    const red=paint('#e83e34',.42,.08),band=paint('#3b2b2b',.6,.1),rope=paint('#6b5440',.8,0);
    for(const x of [-.078,0,.078])cyl(g,.054,.054,.30,red,x,0,x?0:.035,14);
    block(g,.25,.045,.13,band,0,.08,.02,.01);block(g,.25,.045,.13,band,0,-.08,.02,.01);
    const wick=cyl(g,.013,.013,.13,rope,.03,.2,.035,6);wick.rotation.z=-.45;
    const spark=put(g,new T.SphereGeometry(.04,8,6),new T.MeshBasicMaterial({color:'#fff1a0',toneMapped:false}),.06,.26,.035,false);
    g.userData.spark=spark;
  }
  return g;
}

export function makeWall(root,level,index){
  const random=rng(1281+index*193), {tiles,cols,rows}=sampleWall(index);
  const grid=new Array(cols*rows), bricks=[], moving=new Set(), clusters=[];
  // A narrow corner facet on each brick catches light at phone scale. All bricks share one draw call.
  const shape=new T.Shape(), h=cell*.48, bevel=.011, k=h-bevel;
  shape.moveTo(-k,-k);shape.lineTo(k,-k);shape.lineTo(k,k);shape.lineTo(-k,k);shape.closePath();
  const geometry=new T.ExtrudeGeometry(shape,{depth:.60,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1});
  geometry.translate(0,0,-.30);
  const mat=paint('#ffffff',.68,.025);
  const body=new T.InstancedMesh(geometry,mat,tiles.length);
  body.castShadow=body.receiveShadow=true;body.frustumCulled=false;body.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(body);
  // One wall can hide several gems. Each gem owns the ring of bricks around it.
  const spots=(level.gems||[{pixel:level.gemPixel}]).map(g=>world(...g.pixel));
  const goal=spots[0];
  const nearGem=(x,y)=>Math.min(...spots.map(g=>Math.hypot(x-g.x,y-g.y)));
  // Steel plates come from the job sheet as rectangles or circles in drawing units.
  const steelShapes=jobs[index].steel||[];
  const inSteel=(col,row)=>{
    const dx=col+.5,dy=(rows-1-row+.5)*52/rows;
    return steelShapes.some(s=>{
      if(s.ring){const [cx,cy,ro,ri]=s.ring,d=Math.hypot(dx-cx,dy-cy);return d<ro&&d>=ri;}
      if(s.seg){const [x1,y1,x2,y2,w]=s.seg,vx=x2-x1,vy=y2-y1,t=clamp(((dx-x1)*vx+(dy-y1)*vy)/(vx*vx+vy*vy),0,1);return Math.hypot(dx-x1-t*vx,dy-y1-t*vy)<w/2;}
      return s.length===3?Math.hypot(dx-s[0],dy-s[1])<s[2]:dx>=s[0]&&dx<=s[2]&&dy>=s[1]&&dy<=s[3];
    });
  };
  for(const tile of tiles){
    const {row,col,x,y}=tile;
    const frontDistance=nearGem(x,y);
    const medallion=frontDistance<1.34?.19:0;
    const rib=index===0?(row>17&&row<28?.12:0):index===1?(row<7||row===26?.13:0):(row<18?.24:0);
    const depth=medallion+rib+random()*.10;
    const base=new T.Vector3(x,y,depth);
    const b={row,col,base,position:base.clone(),rotation:new T.Quaternion(),vel:new T.Vector3(),
      index:bricks.length,state:'wall',scale:1,thick:1+depth,axis:new T.Vector3(random()-.5,random()-.5,.4+random()).normalize(),
      rate:random()*4+2,links:[],age:0};
    b.hp=index<2?1:index<5?1.25:index<8?1.7:index<12?2.0:2.3;
    if(index>=2&&(frontDistance<1.05||row<4))b.hp+=index>=5?2.7:1.65;
    let brickColor=new T.Color(tile.color).multiplyScalar(.82+random()*.26);
    if(inSteel(col,row)){
      b.steel=true;
      brickColor=new T.Color((col+row)%2?'#9fb0bd':'#8293a2').multiplyScalar(.9+random()*.16);
      if(col%4===0&&row%3===0)brickColor.set('#d6e2ea');
    }
    body.setColorAt(b.index,brickColor);grid[row*cols+col]=b;bricks.push(b);
  }
  function lookup(c,r){return c>=0&&c<cols&&r>=0&&r<rows?grid[r*cols+c]:undefined;}
  for(const b of bricks)b.links=[lookup(b.col-1,b.row),lookup(b.col+1,b.row),lookup(b.col,b.row-1),lookup(b.col,b.row+1)].filter(Boolean);
  const sealSets=spots.map((g,k)=>{
    const set=bricks.filter(b=>b.seal===undefined&&Math.hypot(b.base.x-g.x,(b.base.y-g.y)*1.02)<.79);
    for(const b of set)b.seal=k;return set;
  });
  const seals=sealSets.flat(), clears=spots.map(()=>0);
  const foundation=bricks.filter(b=>b.row===0);
  const mounts=buildMounts(root,jobs[index].mounts,bricks);
  const supports=[...foundation,...mounts];
  const brass=paint('#ffd44a',.29,.28), iron=paint('#253a4b',.39,.32);
  brass.emissive.setHex(0xffce45);brass.emissiveIntensity=0;
  const haloShape=new T.RingGeometry(.39,.47,36);
  const haloPaint=new T.MeshBasicMaterial({color:0xffdc59,transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false});
  let lockFlashAge=Infinity;
  const anchors=jobs[index].anchors.map(([col,row])=>{
    const point=world(col,row);
    const center=bricks.reduce((best,b)=>Math.hypot(b.base.x-point.x,b.base.y-point.y)<Math.hypot(best.base.x-point.x,best.base.y-point.y)?b:best);
    const studs=bricks.filter(b=>Math.hypot(b.base.x-center.base.x,b.base.y-center.base.y)<.48);
    for(const b of studs){b.hp+=1.0;body.setColorAt(b.index,new T.Color('#ad7950').multiplyScalar(.70+random()*.35));}
    const badge=new T.Group();root.add(badge);badge.position.copy(center.base);badge.position.z+=.53;
    cyl(badge,.36,.36,.10,iron,0,0,0,6).rotation.x=Math.PI/2;
    cyl(badge,.29,.29,.12,brass,0,0,.065,6).rotation.x=Math.PI/2;
    const slot=block(badge,.34,.087,.034,iron,0,0,.15,.015);slot.rotation.z=.7;
    const halo=new T.Mesh(haloShape,haloPaint);badge.add(halo);
    halo.position.z=.18;halo.renderOrder=8;halo.visible=false;
    return {center,studs,badge,halo,open:false};
  });

  // Loot bricks: coins pay out, fuel cans top up the tank, dynamite clears a round hole.
  const decor=[...mounts.map(b=>b.pin),...anchors.map(a=>a.badge)], loot=[];
  const taken=new Set([...seals,...mounts,...anchors.flatMap(a=>a.studs),...bricks.filter(b=>b.steel)]);
  const far=(a,b)=>Math.hypot(a.base.x-b.base.x,a.base.y-b.base.y);
  const fromGem=b=>nearGem(b.base.x,b.base.y);
  const rules={
    tnt:b=>b.row>2&&b.base.y<Math.max(...spots.map(g=>g.y))-.2&&fromGem(b)>2.1,
    fuel:b=>b.row>2&&fromGem(b)>1.7,
    coin:b=>b.row>1&&fromGem(b)>1.3,
  };
  function plant(best,type){
    const marker=lootMarker(root,type);
    marker.position.set(best.base.x,best.base.y,best.base.z+.311*best.thick+.05);
    marker.userData.y=best.base.y;marker.userData.size=1.4;
    best.loot={type,marker};
    body.setColorAt(best.index,new T.Color(lootTint[type]));
    for(const b of bricks)if(far(b,best)<.5)taken.add(b);
    loot.push({brick:best,type,marker});decor.push(marker);
  }
  // Hand-placed charges first: puzzle walls put dynamite right beside the steel.
  for(const [type,px,py] of jobs[index].place||[]){
    const p=world(px,py);
    const pool=bricks.filter(b=>!taken.has(b)&&!b.steel&&b.seal===undefined);
    const best=pool.reduce((a,b)=>Math.hypot(b.base.x-p.x,b.base.y-p.y)<Math.hypot(a.base.x-p.x,a.base.y-p.y)?b:a);
    plant(best,type);
  }
  const placed={};for(const [type] of jobs[index].place||[])placed[type]=(placed[type]||0)+1;
  for(const type of ['tnt','fuel','coin'])for(let n=placed[type]||0;n<(jobs[index].loot?.[type]||0);n++){
    // Keep every prize inside the starting arm reach (pivot at -4.12, 1.39).
    const pool=bricks.filter(b=>!taken.has(b)&&b.links.length===4&&Math.hypot(b.base.x+4.12,b.base.y-1.39)<8.2&&rules[type](b));
    if(!pool.length)break;
    let best=pool[0],score=-1;
    for(let s=0;s<70;s++){
      const c=pool[Math.floor(random()*pool.length)];
      const d=Math.min(4,...loot.map(o=>far(o.brick,c)),...mounts.map(m=>far(m,c)+.8));
      if(d>score){score=d;best=c;}
    }
    plant(best,type);
  }

  let largest=0,removed=0,clear=0,visit=0,swallowed=0,time=0;
  const events=[];
  function write(b){
    transform.position.copy(b.position);transform.quaternion.copy(b.rotation);
    transform.scale.set(b.scale,b.scale,b.scale*b.thick);transform.updateMatrix();body.setMatrixAt(b.index,transform.matrix);
  }

  // Opening shot: courses drop in from above, bottom first, then the hardware pops on.
  let building=true,buildTime=0,popTime=-1;
  for(const b of bricks){
    b.delay=b.row*.016+random()*.16;
    b.position.y=b.base.y+4.6;write(b);
  }
  for(const d of decor)d.scale.setScalar(.001);
  body.instanceMatrix.needsUpdate=true;
  function build(dt,skip=false){
    if(!building)return 0;
    buildTime+=skip?99:dt;
    let pending=false,landed=0;
    for(const b of bricks){
      const t=clamp((buildTime-b.delay)/.36,0,1),k=1-t;
      if(t<1)pending=true;else if(!b.landed){b.landed=true;landed++;}
      b.position.copy(b.base);b.position.y+=k*k*k*4.6;b.position.z+=k*k*.9;write(b);
    }
    body.instanceMatrix.needsUpdate=true;
    if(!pending){building=false;popTime=0;}
    return landed;
  }

  function detach(b,state){
    b.state=state;b.age=0;removed++;if(b.seal!==undefined){clear++;clears[b.seal]++;}
    moving.add(b);
    if(b.loot){b.loot.marker.visible=false;events.push({type:b.loot.type,x:b.base.x,y:b.base.y});b.loot=null;}
  }
  function unsupported(x){
    ++visit;
    const stable=supports.filter(b=>b.state==='wall');
    for(const b of stable)b.mark=visit;
    for(let i=0;i<stable.length;i++)for(const n of stable[i].links){
      if(n.state==='wall'&&n.mark!==visit){n.mark=visit;stable.push(n);}
    }
    let falling=0;
    for(const b of bricks){
      if(b.state!=='wall'||b.mark===visit)continue;
      const group=[b];b.mark=visit;
      for(let i=0;i<group.length;i++)for(const n of group[i].links){
        if(n.state==='wall'&&n.mark!==visit){n.mark=visit;group.push(n);}
      }
      const center=new T.Vector3();for(const n of group){center.add(n.base);detach(n,'chunk');}
      center.multiplyScalar(1/group.length);
      clusters.push({group,center,side:center.x<x?-1:1,t:0,low:Math.min(...group.map(n=>n.base.y))});
      falling+=group.length;largest=Math.max(largest,group.length);
    }
    return falling;
  }
  const wallXStart=world(0,52).x;
  function nearest(x,y,radius){
    const col=(x-wallXStart)/cell,row=(y-bottom)/cell,range=Math.ceil(radius/cell);
    const result=[];
    for(let r=Math.floor(row)-range;r<=Math.floor(row)+range;r++)for(let c=Math.floor(col)-range;c<=Math.floor(col)+range;c++){
      const b=lookup(c,r);if(b?.state==='wall'&&Math.hypot(b.base.x-x,b.base.y-y)<radius)result.push(b);
    }
    return result;
  }
  function settle(x,count,unbolted){
    const falling=count?unsupported(x):0;
    let opened=0;
    if(count)for(const a of anchors){
      if(!a.open&&a.studs.filter(b=>b.state==='wall').length<=Math.floor(a.studs.length*.22)){
        a.open=true;a.badge.visible=false;opened++;
      }
    }
    return {count,falling,opened,unbolted};
  }
  const chipColor=new T.Color(),chipTint=new T.Color('#ffdc9e');
  function hit(x,y,tool){
    const candidates=nearest(x,y,tool.radius).sort((a,b)=>(a.base.x-x)**2+(a.base.y-y)**2-(b.base.x-x)**2-(b.base.y-y)**2);
    let count=0,unbolted=0;
    for(const b of candidates.filter(b=>!b.steel).slice(0,tool.bite)){
      b.hp-=tool.power;
      if(b.hp>0){if(!b.chipped){body.getColorAt(b.index,chipColor);body.setColorAt(b.index,chipColor.lerp(chipTint,.25));b.chipped=true;body.instanceColor.needsUpdate=true;}continue;}
      if(b.pin){b.pin.visible=false;unbolted++;}
      count++;detach(b,'fall');b.vel.set((b.base.x-x)*3+(random()-.5)*2.3,.3+random()*2.1,.7+random()*2.1);
    }
    const result=settle(x,count,unbolted);
    result.contact=candidates.length>0;result.at=candidates[0]?.base;
    result.steel=candidates.some(b=>b.steel);
    return result;
  }
  function blast(x,y,radius){
    let count=0,unbolted=0;
    for(const b of nearest(x,y,radius)){
      if(b.pin){b.pin.visible=false;unbolted++;}
      count++;detach(b,'fall');
      const dx=b.base.x-x,dy=b.base.y-y,d=Math.max(.08,Math.hypot(dx,dy)),push=2.6+5.2*(1-d/radius);
      b.vel.set(dx/d*push+(random()-.5)*1.4,dy/d*push*.8+1.6+random()*2,2.2+random()*3.2);b.rate=6+random()*9;
    }
    return settle(x,count,unbolted);
  }
  function flashLocks(){lockFlashAge=0;}
  function animate(dt,elapsed=dt){
    time+=dt;
    if(Number.isFinite(lockFlashAge)){
      lockFlashAge+=elapsed;
      const beat=.62,phase=(lockFlashAge%beat)/beat;
      const pulse=lockFlashAge<2*beat?Math.sin(Math.PI*Math.min(phase/.78,1)):0;
      brass.emissiveIntensity=1.5*pulse;haloPaint.opacity=.95*pulse;
      for(const a of anchors){a.halo.visible=!a.open&&pulse>.001;a.halo.scale.setScalar(1+1.05*phase);}
      if(lockFlashAge>=2*beat)lockFlashAge=Infinity;
    }
    const impacts=[];
    if(popTime>=0&&popTime<3){
      popTime+=dt;
      decor.forEach((d,i)=>d.scale.setScalar(Math.max(.001,(d.userData.size||1)*backOut(clamp((popTime-i*.06)/.32,0,1)))));
    }
    for(const l of loot){
      const m=l.marker;if(!m.visible)continue;
      if(m.userData.spin)m.userData.spin.rotation.y=Math.sin(time*1.7+l.brick.col)*.55;
      if(m.userData.bob)m.position.y=m.userData.y+Math.sin(time*3.2+l.brick.col)*.025;
      if(m.userData.spark)m.userData.spark.scale.setScalar(.6+.6*Math.abs(Math.sin(time*23+l.brick.row)));
    }
    for(let i=clusters.length-1;i>=0;i--){
      const g=clusters[i];g.t+=dt;
      const t=Math.max(0,g.t-.075),drop=5*t*t,angle=Math.min(.49,t*(.25+t*.65));
      axis.set(.83,0,g.side*.5).normalize();spin.setFromAxisAngle(axis,angle);
      if(g.impactTime===undefined&&(drop>=g.low-floor||t>.95)){
        g.impactTime=t;impacts.push({x:g.center.x,count:g.group.length});
      }
      let held=0;
      for(const b of g.group){
        if(b.state!=='chunk')continue;
        b.position.copy(b.base).sub(g.center).applyQuaternion(spin).add(g.center);
        b.position.y-=drop;b.position.z+=t*.80;b.position.x+=g.side*t*.27;b.rotation.copy(spin);
        // The compression wave travels up the mosaic. Higher courses still read as
        // sheets while the lowest ones have already turned into a spray of cubes.
        const delay=Math.min(.25,(b.base.y-g.low)*.028)+Math.abs(b.base.x-g.center.x)*.009;
        if(g.impactTime!==undefined&&t-g.impactTime>=delay){
          b.state='fall';b.position.y=Math.max(floor,b.position.y);
          b.vel.set(g.side*(.45+t)+(random()-.5)*3.1,-7*t+random(),.65+random()*2.6);
        }else held++;
      }
      if(!held)clusters.splice(i,1);
    }
    const piles=new Map();
    for(const b of moving){
      if(b.state==='fall'){
        b.age+=dt;b.vel.y-=13.8*dt;b.position.addScaledVector(b.vel,dt);
        spin.setFromAxisAngle(b.axis,b.rate*dt);b.rotation.multiply(spin);
        if(b.position.y<floor){
          b.position.y=floor;
          b.vel.y=Math.abs(b.vel.y)>.95?Math.abs(b.vel.y)*.25:0;b.vel.x*=.72;b.vel.z*=.65;b.rate*=.72;
          if(b.age>.36&&b.vel.y<.65){b.state='belt';b.beltAge=0;}
        }
        if(b.position.z>2.8){b.position.z=2.8;b.vel.z*=-.25;}
        b.position.x=clamp(b.position.x,-4.72,5.53);
      }else if(b.state==='belt'){
        b.beltAge+=dt;
        const pileKey=Math.floor(b.position.x/.28)*17+Math.floor(b.position.z/.32);
        const pile=piles.get(pileKey)||0;piles.set(pileKey,pile+1);
        b.position.y+=((floor+Math.min(6,pile)*.12)-b.position.y)*Math.min(1,dt*9);
        b.position.x-=dt*(1.75+Math.min(2,b.beltAge*.58));
        b.position.z+=(binZ-b.position.z)*Math.min(1,dt*.70);
        if(b.position.x<=binX+.22){b.state='chute';b.chute=0;b.chuteStart=b.position.clone();}
      }else if(b.state==='chute'){
        b.chute+=dt*2.9;
        const t=clamp(b.chute,0,1);
        b.position.set(b.chuteStart.x-.35*t,b.chuteStart.y-.72*t*t,b.chuteStart.z+(binZ-b.chuteStart.z)*t);
        b.scale=1-t*t;if(t>=1){b.state='gone';moving.delete(b);swallowed++;}
      }
      write(b);
    }
    if(moving.size||impacts.length||dt>0&&lastMoving)body.instanceMatrix.needsUpdate=true;
    lastMoving=moving.size;
    return impacts;
  }
  let lastMoving=0;
  function openView(k=0){
    const g=spots[k];
    for(const b of moving){
      if((b.state==='chunk'||b.state==='fall')&&Math.abs(b.position.x-g.x)<.63&&Math.abs(b.position.y-g.y)<.59)return false;
    }
    return true;
  }
  // Distance from a point to the closest standing steel brick, capped at .6.
  function steelGap(x,y){
    let d=.6;
    for(const b of nearest(x,y,.6))if(b.steel){const e=Math.hypot(b.base.x-x,b.base.y-y);if(e<d)d=e;}
    return d;
  }
  // Level check: every steel brick that seals a gem must sit inside some dynamite blast.
  function audit(radius){
    const charges=loot.filter(l=>l.type==='tnt').map(l=>l.brick.base);
    const stuck=seals.filter(b=>b.steel&&!charges.some(c=>Math.hypot(c.x-b.base.x,c.y-b.base.y)<radius));
    return {steel:bricks.filter(b=>b.steel).length,steelSeals:seals.filter(b=>b.steel).length,uncovered:stuck.map(b=>[b.col,b.row])};
  }
  function busy(){
    if(clusters.length)return true;
    for(const b of moving)if(b.state==='fall'&&b.age<1.4)return true;
    return false;
  }
  function take(){
    const out={events:events.splice(0),swallowed};swallowed=0;return out;
  }
  return {bricks,anchors,mounts,loot,spots,steel:bricks.some(b=>b.steel),gemX:goal.x,gemHeight:goal.y,hit,blast,build,animate,openView,busy,take,steelGap,audit,
    flashLocks,occludes:(raycaster,distance)=>raycaster.intersectObject(body,false).some(hit=>hit.distance<distance),
    building:()=>building,near:(x,y,r=.69)=>nearest(x,y,r).length>0,
    stats:()=>({removed,largest,total:bricks.length,clear,count:seals.length,gems:sealSets.map((set,k)=>({clear:clears[k],count:set.length})),locks:anchors.length,opened:anchors.filter(a=>a.open).length,
      loot:loot.length,lootLeft:loot.filter(l=>l.brick.loot).length})};
}

export function debris(root){
  const pool=new T.InstancedMesh(new T.BoxGeometry(1,1,1),paint('#ffffff',.7),120);
  pool.count=0;pool.frustumCulled=false;root.add(pool);
  const particles=[];
  const canvas=document.createElement('canvas');canvas.width=canvas.height=48;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(24,24,2,24,24,23);
  gradient.addColorStop(0,'rgba(255,242,214,.81)');gradient.addColorStop(.46,'rgba(255,238,204,.54)');gradient.addColorStop(1,'rgba(255,240,215,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,48,48);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const haze=Array.from({length:20},()=>{
    const mat=new T.SpriteMaterial({map:texture,transparent:true,opacity:0,depthWrite:false});mat.userData.disposeMap=true;
    const sprite=new T.Sprite(mat);sprite.visible=false;root.add(sprite);return sprite;
  });
  let nextPuff=0;
  function impact(x,count){
    const width=Math.min(3.1,.55+count*.012),n=Math.min(12,3+Math.floor(count*.06));
    for(let i=0;i<n;i++){
      const puff=haze[nextPuff];nextPuff=(nextPuff+1)%haze.length;
      const offset=(Math.random()-.5)*2;
      puff.position.set(x+offset*width,.26+Math.random()*.24,1.15+Math.random()*1.05);
      puff.userData={age:0,life:.40+Math.random()*.30,slide:offset*.95,size:.55+Math.random()*.55};
      puff.visible=true;
    }
  }
  function burst(x,y,color,count,power=1){
    for(let i=0;i<count&&particles.length<120;i++){
      const size=.033+Math.random()*.077;
      particles.push({pos:new T.Vector3(x+(Math.random()-.5)*.54,y+(Math.random()-.5)*.42,.45+Math.random()*.27),
        v:new T.Vector3((Math.random()-.5)*4.7*power,.8+Math.random()*3.4,1.2+Math.random()*2),
        age:0,life:.38+Math.random()*.39,size,angle:Math.random()*6,color:new T.Color(i%5===0?'#fff2aa':color)});
    }
  }
  function animate(dt){
    for(const puff of haze)if(puff.visible){
      const p=puff.userData;p.age+=dt;const t=Math.min(1,p.age/p.life);
      puff.position.x+=p.slide*dt;puff.position.y+=dt*.85;
      puff.scale.setScalar(p.size*(.45+t));puff.material.opacity=(1-t)*.40;puff.visible=t<1;
    }
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.age+=dt;if(p.age>p.life){particles.splice(i,1);continue;}
      p.v.y-=9*dt;p.pos.addScaledVector(p.v,dt);p.pos.y=Math.max(.15,p.pos.y);
    }
    pool.count=particles.length;
    particles.forEach((p,i)=>{
      transform.position.copy(p.pos);transform.scale.setScalar(p.size*(1-p.age/p.life*.83));
      transform.quaternion.setFromAxisAngle(particleAxis,p.angle+p.age*6);transform.updateMatrix();
      pool.setMatrixAt(i,transform.matrix);pool.setColorAt(i,p.color);
    });
    if(particles.length){pool.instanceMatrix.needsUpdate=true;pool.instanceColor.needsUpdate=true;}
  }
  return {burst,impact,animate};
}
