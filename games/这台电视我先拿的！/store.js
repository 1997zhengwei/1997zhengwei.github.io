import {T,group,box,ball,cyl,rod,batch,print,banner,graphicTV,floorArt,sign,labelMat,product,ink,red,cream,mint,gold,stickerMat} from './art.js';
import {departments,bulky,goods} from './market.js';
const ivory='#d8d4ff',teal='#28d4cf',navy='#343474';
const offerRing=new T.RingGeometry(1.84,1.93,50);
const palettes={mint:['#25e2a3','#ffce34','#14bcd7'],rose:['#ff668a','#ffc145','#c64ddc'],cream:['#ff9849','#38c7ed','#f45f70'],aqua:['#29e5d4','#9660ed','#ff78c1']};
function groundTiles(p,map){
  const [width,back,front]=map.size,depth=front-back;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const c=canvas.getContext('2d');c.fillStyle=map.floor;c.fillRect(0,0,256,256);c.fillStyle=map.id?'#ffffff14':'#89aaff';c.fillRect(128,0,128,128);c.fillRect(0,128,128,128);
  c.strokeStyle='#627ed7';c.lineWidth=2;for(const k of [0,128,256]){c.beginPath();c.moveTo(k,0);c.lineTo(k,256);c.moveTo(0,k);c.lineTo(256,k);c.stroke();}
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(width/3.74,depth/3.74);tex.anisotropy=4;
  const mat=new T.MeshStandardMaterial({map:tex,roughness:.83});const f=new T.Mesh(new T.PlaneGeometry(width,depth),mat);
  f.rotation.x=-Math.PI/2;f.position.set(0,.014,(back+front)/2);f.receiveShadow=true;p.add(f);
  return ()=>{tex.dispose();mat.dispose();f.geometry.dispose();};
}
function chevron(p,x,z,c,rotation=0){
  const g=group(p,x,.05,z);g.rotation.y=rotation;
  for(const side of [-1,1]){const m=box(g,side*.15,0,.02,.11,.012,.41,c);m.rotation.y=side*.68;}
}
function shelf(p,r,i){
  const palette=palettes[r.theme],g=group(p,r.x,0,r.z),lg=Math.max(r.w,r.d),dep=Math.min(r.w,r.d);
  if(r.w<r.d)g.rotation.y=Math.PI/2;
  box(g,0,.09,0,lg,.18,dep,'#6357b3');
  box(g,0,.51,0,lg-.09,.73,dep-.10,'#986add');
  for(const x of [-lg/2+.07,lg/2-.07]){
    box(g,x,.68,0,.095,1.24,dep,ivory);
    for(const z of [-dep*.45,dep*.45])box(g,x,1.15,z,.10,.34,.11,'#726ed5');
  }
  for(const y of [.30,.82,1.27]){
    box(g,0,y,0,lg+.045,.09,dep+.06,ivory);
    for(const side of [-1,1])box(g,0,y-.02,side*(dep/2+.036),lg,.095,.035,side===1?'#9850d8':teal);
  }
  const n=Math.max(3,Math.floor((lg-.24)/.45));
  for(let j=0;j<n;j++)for(let row=0;row<2;row++){
    const x=(j-(n-1)/2)*(lg-.36)/n;
    const col=palette[(Math.floor(j/3)+row)%3],yy=row?.87:.35;
    for(const side of [-1,1]){
      const z=side*(dep*.32),h=.31+(j%3)*.025;
      if((i+row)%3===1){
        cyl(g,x,yy+h/2,z,.26,h,.26,col);cyl(g,x,yy+h+.015,z,.25,.035,.25,'#eee1b2');cyl(g,x,yy+.12,z,.262,.07,.262,cream);
      }else{
        box(g,x,yy+h/2,z,.29,h,.24,col);box(g,x,yy+h*.63,z+side*.124,.16,.055,.013,'#fff2cf');
      }
    }
    if(j%3===0){box(g,x,.8,dep/2+.057,.27,.105,.02,'#ffdb6a');box(g,x+.02,.81,dep/2+.07,.08,.025,.01,ink);}
  }
  const blocks=Math.max(1,Math.floor(lg/1.20));
  for(let j=0;j<blocks;j++){
    const x=-lg/2+(j+.5)*lg/blocks,col=palette[(i+j)%3],type=(i+j)%3;
    box(g,x,1.335,0,lg/blocks-.14,.08,.90,type===1?'#a57ce2':'#9ca1e5');
    for(let k=0;k<4;k++){
      const z=k>1?-.215:.16,xx=x+(k%2-.5)*.385;
      if(type===0){
        box(g,xx,1.63,z,.33,.50,.27,col);box(g,xx,1.64,z+.142,.24,.22,.012,cream);
        box(g,xx,1.66,z+.152,.14,.079,.009,'#287e78');box(g,xx,1.891,z,.12,.014,.27,cream);
      }else if(type===1){
        cyl(g,xx,1.56,z,.31,.36,.31,col);cyl(g,xx,1.65,z,.319,.105,.319,'#ffdd67');
        cyl(g,xx,1.766,z,.30,.05,.30,'#415c66');cyl(g,xx+.04,1.796,z,.096,.013,.096,'#cfdfd2');
      }else{
        box(g,xx,1.55,z,.32,.33,.30,col);box(g,xx,1.73,z,.34,.07,.32,'#f7cf83');
        box(g,xx,1.768,z,.075,.008,.32,'#a44f42');box(g,xx,1.57,z+.155,.18,.07,.012,cream);
      }
    }
    box(g,x,1.39,.546,.45,.15,.05,gold);box(g,x,1.4,.577,.20,.04,.012,'#454f4b');
  }
}
function planter(p,x,z){
  cyl(p,x,.30,z,.62,.59,.62,'#b563bd');cyl(p,x,.58,z,.70,.12,.70,'#dc81d0');
  for(let i=0;i<6;i++){const a=i*2.39;const l=ball(p,x+Math.sin(a)*.14,.95+i%2*.13,z+Math.cos(a)*.14,.24,.78,.23,i%2?'#38916e':'#75b777');l.rotation.z=Math.sin(a)*.46;l.rotation.x=Math.cos(a)*.46;}
}
function basketStack(p,x,z){
  const stack=group(p,x,0,z);
  for(let i=0;i<5;i++){
    const y=.16+i*.135;
    box(stack,0,y,0,.72,.21,.51,i%2?'#df6042':'#178a81');
    for(const xx of [-.26,-.09,.09,.26])box(stack,xx,y,.259,.07,.115,.009,'#394e4e');
    box(stack,0,y+.116,0,.77,.051,.54,'#ffd68e');
  }
  box(stack,0,.831,0,.66,.018,.40,'#426c67');
}
function till(p,x,z,number){
  const g=group(p,x,0,z);
  box(g,0,.52,0,1.56,1.04,1.64,'#22bcab');box(g,0,.17,0,1.62,.17,1.70,'#4959a2');box(g,0,1.04,0,1.72,.13,1.76,cream);
  box(g,0,1.13,-.28,1.23,.08,.78,'#3c4c52');for(let j=0;j<6;j++)box(g,0,1.177,-.58+j*.12,1.15,.008,.018,'#697879');
  cyl(g,.44,1.32,.46,.13,.39,.13,ink);const sc=box(g,.44,1.57,.45,.65,.41,.11,'#273b4a');sc.rotation.x=.1;
  print(g,sign('¥  00.00','#142f36','#9df1c4'),.44,1.57,.517,.54,.23);
  box(g,-.43,1.17,.48,.36,.14,.37,red);box(g,-.43,1.245,.47,.24,.012,.23,'#64dfcb');
  box(g,.6,2.15,-.6,.07,2,.07,'#41545c');box(g,.6,3.13,-.6,.58,.46,.15,'#2f9c87');print(g,sign(number,'#287768'),.6,3.13,-.515,.50,.29);
}
function backwall(scene){
  const p=group(scene,0,0,-4.8);
  box(p,0,2.12,-9.7,18.4,4.28,.32,'#9773eb');box(p,0,.64,-9.47,18.4,1.3,.16,'#7151c6');
  for(let j=-8;j<=8;j+=2){box(p,j,2.07,-9.48,.14,4.18,.22,ivory);}
  box(p,0,4.31,-9.72,18.8,.27,.65,'#46308c');
  box(p,0,4.07,-9.49,18.4,.17,.21,'#bb9bff');
  box(p,0,2.84,-9.29,9.28,2.82,.22,'#283b44');print(p,banner(),0,2.85,-9.165,9.06,2.66);
  for(const x of [-6.5,6.5]){
    box(p,x,2.62,-9.46,2.9,2.41,.21,'#544499');
    for(let k=0;k<2;k++)for(let m=0;m<2;m++){
      box(p,x-.66+1.32*k,2.12+m*1.01,-9.30,1.2,.89,.07,m?'#a8c6ff':'#7d99ed');
      const shine=box(p,x-.97+1.32*k,2.13+m*1.01,-9.251,.11,.65,.007,'#cfece5');shine.rotation.z=-.45;
    }
  }
  for(const district of departments.slice(1)){
    const side=Math.sign(district.x),x=side*14;
    box(p,x,2.12,-9.7,10.1,4.28,.32,'#9773eb');box(p,x,4.31,-9.72,10.3,.27,.65,'#46308c');
    box(p,x,2.18,-9.45,8.4,2.30,.15,'#593d9b');
    print(p,sign(district.sign,district.color,'#252655'),x,2.70,-9.355,7.8,.83);
    print(p,sign(district.name,'#593d9b'),x,1.68,-9.355,4.35,.76);
    for(const [j,k] of (side<0?['kettle','espresso','mixer']:['radio','console','camera']).entries()){
      const kiosk=group(p,x+(j-1)*2.6,0,-9.02);
      box(kiosk,0,.45,0,2.46,.90,.58,district.color);
      product(kiosk,k).position.set(0,.92,0);
    }
  }
  for(const x of [-18.95,18.95]){
    box(scene,x,.39,-2.45,.3,.78,24.7,'#9273df');box(scene,x,.8,-2.45,.4,.12,24.7,cream);
    for(const z of [-13,-7,-2,4,8])box(scene,x,.96,z,.33,1.92,.34,'#bb9efb');
  }
}
function originalMarket(p,map){
  const {racks,tills}=map;
  box(p,0,-.41,-2.5,39.1,.8,25.6,'#5553ac');box(p,0,-.12,-2.5,38.8,.24,25.2,cream);
  box(p,0,-.92,0,200,.35,200,'#526ac2');
  // The store sits inside an arcade with terrazzo aprons and covered loading bays.
  for(const side of [-1,1]){
    box(p,side*21.4,-.53,0,4.1,.54,25.4,'#717fcd');
    for(let j=0;j<6;j++)box(p,side*21.4,-.249,-8.4+j*3.25,3.7,.018,.033,'#6374bd');
    for(const z of [-7.3,1.8,8.0])planter(p,side*20.5,z);
    basketStack(p,side*18.65,7.63);basketStack(p,side*18.62,8.35);
    for(let j=0;j<3;j++){const x=side*(5.8+j*.86);box(p,x,.29,9.49,.79,.54,.60,j%2?'#d79c66':'#ba815b');box(p,x,.574,9.49,.15,.016,.62,ivory);box(p,x,.32,9.80,.33,.15,.02,cream);}
  }
  backwall(p);racks.forEach((r,i)=>shelf(p,r,i));
  box(p,0,.30,-8.12,4.95,.58,1.18,'#6550bc');box(p,0,.61,-8.12,5.10,.11,1.29,cream);
  for(const x of [-2.20,2.20])box(p,x,1.58,-8.51,.09,1.98,.09,'#543b91');
  box(p,0,2.32,-8.50,4.87,1.43,.13,'#48347b');
  print(p,banner(),0,2.32,-8.426,4.74,1.35);
  for(const side of [-1,1]){
    const x=side*1.88;
    box(p,x,.90,-8.13,.52,.50,.55,red);box(p,x,1.16,-8.13,.11,.02,.54,'#ffca5b');
    print(p,sign('SALE','#db4f3e'),x,.92,-7.84,.45,.13);
  }
  for(const x of [-.97,.97]){box(p,x,.045,0,.09,.027,2.36,'#ffd853');for(let j=0;j<8;j++){const m=box(p,x,.062,-1.01+j*.29,.12,.016,.10,ink);m.rotation.y=.35;}}
  for(const x of [4.35,7.40])box(p,x,.041,.55,.055,.025,4.0,'#4b76cf');
  for(const z of [-.62,.65,1.95])chevron(p,5.88,z,'#385bb4',Math.PI);
  print(p,floorArt('wide'),5.87,.052,3.05,2.35,.87,true);
  print(p,floorArt('tight'),0,.052,1.12,1.85,.57,true);
  for(const [i,t] of tills.entries()){
    const g=group(p,t.x,0,t.z);
    box(g,0,.039,0,4.16,.035,1.54,'#369f8a');print(g,floorArt('pay'),0,.066,0,4.10,1.43,true);
    for(const x of [-2.10,2.10]){cyl(g,x,.38,.90,.12,.75,.12,navy);ball(g,x,.80,.90,.20,.17,.20,gold);}
    till(g,3,.38,'0'+(i+1));
  }
  for(const district of departments.slice(1)){
    const x=district.x,side=Math.sign(x);
    for(const z of [-11.4,-2.75,5.35]){
      print(p,sign(district.name,district.color,'#292855'),x,.061,z,4.15,.82,true);
    }
    for(const z of [-5.2,-2.5,2.1,4.3])chevron(p,side*8.43,z,district.color,Math.PI);
    const pillar=group(p,side*17.8,0,-10.8);
    box(pillar,0,1.08,0,.15,2.16,.15,ink);box(pillar,0,2.28,0,1.92,.83,.14,district.color);
    print(pillar,sign(district.name,district.color,'#272657'),0,2.31,.081,1.79,.62);
  }
  for(let x=-5.9;x<7;x+=1.36){box(p,x,.06,9.6,.84,.035,.26,'#aba6f0');}
  box(p,0,-.61,11.27,39.3,.26,1.69,'#687bcd');
  for(let x=-19.0;x<19.1;x+=.47)box(p,x,-.464,11.25,.20,.015,1.28,'#8a9be6');
  for(const x of [-6.5,6.5]){
    box(p,x,.065,8.85,3.34,.08,.82,'#d65b46');
    print(p,sign('RUSH MART','#cf5946'),x,.117,8.85,2.75,.51,true);
  }
  for(const [x,z,caption,col] of [[-6.50,-3.10,'02   HOME','#218c82'],[6.84,-4.16,'03   AUDIO','#586898'],[-6.52,5.93,'01   COOK','#d76142']]){
    box(p,x,1.68,z,.09,.89,.09,ink);box(p,x,2.12,z,1.46,.46,.10,ivory);print(p,sign(caption,col),x,2.12,z+.056,1.37,.38);
  }
  for(const side of [-1,1]){const x=side*4.9;box(p,x,1.75,-7.83,.09,3.5,.09,ink);const tag=group(p,x,3.11,-7.78);tag.rotation.z=side*.07;
    box(tag,0,0,0,1.47,1.11,.13,'#7047c1');print(tag,sign('SALE','#ffcc45','#253640'),0,.19,.073,1.33,.40);print(tag,sign('50%','#ffcc45','#cb463c'),0,-.25,.073,1.23,.42);}
}
function branchCheckout(p,t,i){
  const g=group(p,t.x,0,t.z);
  box(g,0,.039,0,4.16,.035,1.54,'#369f8a');print(g,floorArt('pay'),0,.066,0,4.10,1.43,true);
  till(g,t.side*3,.38,String(i+1).padStart(2,'0'));
}
function branchMarket(p,map){
  const [width,back,front]=map.size,depth=front-back,middle=(front+back)/2;
  box(p,0,-.4,middle,width+.45,.78,depth+.35,'#5552a5');
  box(p,0,-.13,middle,width+.20,.24,depth+.18,'#c7c0f2');
  box(p,0,-.92,middle,200,.35,200,'#526ac2');
  box(p,0,1.48,back,width,2.95,.30,'#7158b7');
  box(p,0,2.96,back,width+.35,.18,.49,map.color);
  for(let x=-width/2+1.4;x<width/2;x+=2.7){
    box(p,x,1.16,back+.188,.12,2.3,.11,'#b6a5df');
    box(p,x+.65,1.29,back+.171,1.10,.85,.085,map.look==='docks'?'#6574b3':'#9480ce');
  }
  for(const x of [-width/2,width/2]){
    box(p,x,.38,middle,.28,.76,depth,'#7d68bd');
    box(p,x,.78,middle,.34,.10,depth,map.color);
    for(let z=back+2;z<front;z+=4.8)planter(p,x*.999,z);
  }
  for(let x=-width/2+.45;x<width/2;x+=.50)box(p,x,.045,front-.30,.24,.028,.15,map.color);
  print(p,sign(map.name,map.color,'#2d2451'),map.start[0],.067,front-.82,4.6,.78,true);
  for(const t of map.tills)chevron(p,t.x,t.z-2,'#33978f',Math.PI);
  map.tills.forEach((t,i)=>branchCheckout(p,t,i));
  map.racks.forEach((r,i)=>{
    shelf(p,r,i);
    const g=group(p,r.x,0,r.z);if(r.w<r.d)g.rotation.y=Math.PI/2;
    const length=Math.max(r.w,r.d),dep=Math.min(r.w,r.d);
    box(g,0,.15,dep/2+.035,length-.15,.12,.055,map.color);
    if(map.look==='crates'||map.look==='docks'){
      for(const side of [-1,1]){
        const x=side*(length/2-.55);
        box(g,x,1.93,0,.62,.4,.61,'#b48663');box(g,x,2.14,0,.071,.02,.62,'#ffe1a6');
      }
    }
  });
  for(const g of map.gates)for(const side of [-1,1])for(let j=0;j<9;j++){
    const x=g.x+side*(g.half-.12),z=g.z-1.38+j*.34;
    box(p,x,.054,z,.12,.03,.30,j%2?'#493261':'#ffd54f');
  }
  for(const [i,[x,z]] of map.flash.entries()){
    const accent=[map.color,'#ffbd69','#65ddd0'][i];
    const decal=new T.Mesh(offerRing,new T.MeshStandardMaterial({color:accent,side:T.DoubleSide}));
    decal.rotation.x=-Math.PI/2;decal.position.set(x,.047,z);p.add(decal);
    box(p,x,.044,z-1.64,2.52,.022,.48,accent);
    print(p,sign('闪购 '+['A','B','C'][i]+' 区',accent,'#34305d'),x,.063,z-1.65,2.41,.43,true);
  }
  if(map.garden){
    const g=map.garden;
    box(p,g.x,.27,g.z,g.w,.54,g.d,'#649c9b');box(p,g.x,.57,g.z,g.w-.25,.06,g.d-.25,'#7fbd91');
    for(const x of [-2.9,-1.6,1.6,2.9])for(const z of [-1.7,1.7])planter(p,g.x+x,g.z+z);
    cyl(p,g.x,.70,g.z,2.5,.35,2.5,'#5767ae');cyl(p,g.x,.89,g.z,2.39,.09,2.39,'#6cdde1');
    cyl(p,g.x,1.01,g.z,.77,.34,.77,'#cddcf8');ball(p,g.x,1.27,g.z,.42,.34,.42,'#9df5e5');
  }
  if(map.look==='cross'){
    for(const x of [-6,-3,0,3,6])box(p,x,.041,0,.96,.016,.10,'#97fff2');
    for(const z of [-8,-4,4,8])box(p,0,.042,z,.12,.016,1.20,'#97fff2');
  }
  if(map.look==='islands'||map.look==='wings'){
    for(const r of map.racks)box(p,r.x,.029,r.z,r.w+.65,.021,r.d+.65,map.color);
  }
  if(map.look==='lanes')for(const x of [-2.4,2.4])for(let z=back+1;z<front-2;z+=1.7)box(p,x,.035,z,.08,.018,.64,map.color);
  if(map.look==='docks'||map.look==='final')for(let z=back+1;z<front-1;z+=1.9)for(const x of [-width/2+1.2,width/2-1.2])chevron(p,x,z,map.color);
}
export function scenery(parent,map){
  const releaseFloor=groundTiles(parent,map),parts=group(parent);
  if(map.id===0)originalMarket(parts,map);else branchMarket(parts,map);
  batch(parts);
  return ()=>{releaseFloor();parts.traverse(m=>{if(m.isInstancedMesh)m.dispose();});parent.removeFromParent();};
}
export function display(scene,p){
  const base=group(scene,p.x,0,p.z);const tv=bulky(p.kind);
  if(tv){cyl(base,0,.083,0,3.40,.16,1.25,'#9355ce');cyl(base,0,.17,0,3.37,.08,1.24,'#ffdb48');}
  else {cyl(base,0,.057,0,1.16,.115,.93,'#776bb9');cyl(base,0,.128,0,1.13,.071,.90,p.flash?'#ffdb48':'#dad6ff');}
  batch(base);
  const item=group(scene,p.x,tv?.43:.22,p.z);
  const model=product(item,p.kind);if(!tv)model.scale.setScalar(1.15);batch(model);
  // Big sale sticker tilted toward the camera, bobbing with the product.
  const g=goods[p.kind],pct=Math.round((1-g.price/g.list)*100);
  const card=group(item,tv?1.2:.05,tv?1.75:1.12,.1);card.rotation.x=-.62;
  const face=print(card,stickerMat(pct,g.price,tv||p.flash),0,0,0,tv?1.25:.92,tv?1.25:.92);face.renderOrder=4;
  item.userData.sticker=card;
  return item;
}
