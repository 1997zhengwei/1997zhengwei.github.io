import * as T from './vendor/three.module.js';

export {T};
const cube=new T.BoxGeometry(),orb=new T.SphereGeometry(.5,14,10),tube=new T.CylinderGeometry(.5,.5,1,16);
const pane=new T.PlaneGeometry(),headband=new T.TorusGeometry(.26,.064,8,18,Math.PI),mats=new Map(),textures=new Map();
export const ink='#203240',red='#e53b37',cream='#fff4dc',mint='#52c3a1',gold='#ffbf29';
export function group(p,x=0,y=0,z=0){const g=new T.Group();p.add(g);g.position.set(x,y,z);return g;}
function material(color){
  if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.65,metalness:.025}));
  return mats.get(color);
}
function shape(p,g,c,x,y,z,w,h,d){const m=new T.Mesh(g,material(c));p.add(m);m.position.set(x,y,z);m.scale.set(w,h,d);return m;}
export const box=(p,x,y,z,w,h,d,c)=>shape(p,cube,c,x,y,z,w,h,d);
export const ball=(p,x,y,z,w,h,d,c)=>shape(p,orb,c,x,y,z,w,h,d);
export const cyl=(p,x,y,z,w,h,d,c)=>shape(p,tube,c,x,y,z,w,h,d);
export function rod(p,a,b,diam,c){
  const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va),mid=va.addScaledVector(v,.5);
  const m=cyl(p,mid.x,mid.y,mid.z,diam,v.length(),diam,c);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;
}
const white=new T.MeshStandardMaterial({roughness:.68,metalness:.025});
// Each rigid part keeps one draw call per primitive, including multi-colour shelf stock.
export function batch(root,casts=true){
  root.updateWorldMatrix(true,true);const local=root.matrixWorld.clone().invert(),by=new Map();
  root.traverse(m=>{if(!m.isMesh)return;const flat=!!m.material.map;const key=m.geometry.uuid+(flat?m.material.uuid:'');
    if(!by.has(key))by.set(key,{geo:m.geometry,mat:flat?m.material:white,flat,list:[]});
    by.get(key).list.push([new T.Matrix4().multiplyMatrices(local,m.matrixWorld),m.material.color]);});
  root.clear();
  for(const {geo,mat,flat,list} of by.values()){
    const inst=new T.InstancedMesh(geo,mat,list.length);
    list.forEach(([matrix,color],i)=>{inst.setMatrixAt(i,matrix);if(!flat)inst.setColorAt(i,color);});
    inst.castShadow=casts&&!flat;inst.receiveShadow=!flat;root.add(inst);
  }
}
function txt(c,s,x,y,size,col,align='left',font='Arial Black, Arial, Microsoft YaHei, sans-serif',weight=900){
  c.fillStyle=col;c.textAlign=align;c.textBaseline='middle';c.font=weight+' '+size+'px '+font;c.fillText(s,x,y);
}
function poster(key,w,h,paint){
  if(textures.has(key))return textures.get(key);
  const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
  const m=new T.MeshBasicMaterial({map:t,side:T.DoubleSide,transparent:true,alphaTest:.035,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  textures.set(key,m);return m;
}
export function print(p,mat,x,y,z,w,h,floor=false){
  const m=new T.Mesh(pane,mat);p.add(m);m.position.set(x,y,z);m.scale.set(w,h,1);if(floor)m.rotation.x=-Math.PI/2;return m;
}
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
function disc(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function burst(c,x,y,r,col,n=15){c.fillStyle=col;c.beginPath();for(let i=0;i<2*n;i++){const a=Math.PI*i/n,d=i%2?r*.80:r;c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);}c.closePath();c.fill();}
export function banner(){
  return poster('sale-banner',1024,352,(c,w,h)=>{
    rect(c,0,0,w,h,'#7750cf');
    for(let y=7;y<h;y+=14)for(let x=610+(y%28?6:0);x<w;x+=14)disc(c,x,y,Math.min(4,(x-610)/70+.5),'#593699');
    c.save();c.translate(35,44);c.transform(1,-.035,-.12,1,0,0);
    txt(c,'BLACK',8,56,121,'#fff4ef');txt(c,'FRIDAY',8,177,133,'#fffaff');c.restore();
    burst(c,744,166,145,'#513785');burst(c,737,157,145,'#ffe136');
    c.save();c.translate(735,154);c.rotate(-.13);txt(c,'−90%',0,-4,80,'#213744','center');txt(c,'FLASH DEAL',0,49,23,'#213744','center');c.restore();
    rect(c,0,324,1024,28,'#4f3890');for(let x=8;x<1024;x+=42){c.fillStyle='#aa8cff';c.beginPath();c.moveTo(x,342);c.lineTo(x+17,332);c.lineTo(x+25,332);c.lineTo(x+8,342);c.fill();}
  });
}
export function sign(text,bg,fg=cream){
  return poster('sign'+text+bg+fg,512,112,(c,w,h)=>{rect(c,0,0,w,h,bg);txt(c,text,w/2,h/2+2,Math.min(70,780/(text.length||1)),fg,'center');});
}
export function graphicTV(wide=false){
  return poster(wide?'cinema-screen':'screen',512,272,(c,w,h)=>{
    const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#111e57');g.addColorStop(.5,'#6148a4');g.addColorStop(1,'#f47174');c.fillStyle=g;c.fillRect(0,0,w,h);
    disc(c,357,64,44,'#ffce78');
    for(const [x,y,r,col] of [[100,312,188,'#a79cf4'],[390,324,231,'#56cfc3'],[177,335,150,'#3851a3'],[467,336,182,'#116785']])disc(c,x,y,r,col);
    if(wide){rect(c,0,0,w,h,'#0e3054');for(let i=0;i<8;i++){c.fillStyle=['#39ffc8','#5791ff','#bb72ee'][i%3];c.beginPath();c.moveTo(i*83-80,272);c.lineTo(i*83+74,0);c.lineTo(i*83+106,0);c.closePath();c.fill();}}
    txt(c,wide?'77″':'55″',25,81,84,'#fff7de');txt(c,wide?'AURORA OLED':'ULTRA  VISION',27,135,18,'#fff7de');rect(c,27,153,86,3,'#ffb853');
  });
}
export function labelMat(kind,price){
  return poster('price'+kind+price,256,128,(c,w,h)=>{
    rect(c,0,0,w,h,'#ffe281');rect(c,0,0,15,h,'#ff5a42');txt(c,'省'+price,134,68,price>=1000?51:62,'#21313a','center');
  });
}
export function floorArt(mode){
  return poster('floor'+mode,512,170,(c,w,h)=>{
    const col=mode==='pay'?'#f4fff0':mode==='wide'?'#284395':'#673f99';
    if(mode==='pay'){rect(c,0,0,w,h,'#15786c');for(let x=3;x<512;x+=28)rect(c,x,2,15,9,'#ffeebc');}
    txt(c,mode==='pay'?'CHECKOUT':mode==='wide'?'WIDE   ↑':'EXPRESS',256,71,mode==='pay'?69:61,col,'center');
    txt(c,mode==='pay'?'结  账  线':mode==='wide'?'宽    道':'快    道',256,130,27,col,'center');
  });
}
export function product(p,k){
  const g=group(p);
  if(k==='tv'||k==='oled'){
    const wide=k==='oled';if(wide)g.scale.set(1.13,1.07,1);
    box(g,0,.64,0,2.85,1.49,.126,'#14252e');print(g,graphicTV(wide),0,.65,.066,2.71,1.33);
    box(g,0,.64,-.077,2.45,1.15,.09,'#233945');
    for(const x of [-.92,.92]){rod(g,[x,.04,0],[x-.12,-.15,.10],.06,ink);box(g,x-.09,-.15,.04,.38,.045,.22,ink);}
    box(g,1.2,-.072,.071,.035,.023,.01,'#74ffdb');
  }else if(k==='crt'){
    box(g,0,.52,0,1.24,.92,.68,'#ed885f');box(g,-.09,.54,.35,.88,.67,.08,'#392d50');
    print(g,sign('COLOR','#397f93','#9dffe1'),-.09,.55,.394,.76,.44);
    for(const y of [.40,.65])ball(g,.46,y,.36,.13,.13,.09,gold);
    for(const x of [-.44,.44]){box(g,x,.06,0,.19,.12,.40,ink);rod(g,[0,.99,0],[x,1.38,0],.034,ink);}
  }else if(k==='espresso'){
    box(g,0,.12,0,1.06,.18,.72,ink);box(g,0,.56,-.19,.99,.86,.36,'#c84337');
    box(g,0,.94,.005,1.1,.29,.72,'#f55f47');box(g,-.14,.80,.22,.43,.12,.22,ink);
    cyl(g,-.15,.41,.20,.34,.36,.31,cream);cyl(g,-.15,.60,.20,.30,.015,.27,'#6c4131');
    for(const x of [.28,.43])ball(g,x,.96,.369,.085,.085,.026,gold);
  }else if(k==='mixer'){
    box(g,0,.12,0,1,.15,.66,'#ef689a');box(g,-.35,.55,-.04,.27,.83,.48,'#b53c77');
    ball(g,.02,.96,0,1.20,.43,.56,'#fa81ab');rod(g,[.22,.83,0],[.22,.48,0],.08,ink);
    ball(g,.19,.38,.04,.67,.50,.56,'#a4cddd');cyl(g,.19,.55,.04,.68,.08,.56,cream);
  }else if(k==='camera'){
    box(g,0,.43,0,1.11,.65,.42,'#2b374d');box(g,0,.72,0,1.08,.12,.44,'#92b8c4');box(g,-.12,.85,0,.37,.16,.35,ink);
    for(const [z,d,col] of [[.24,.55,'#101d32'],[.34,.45,'#82bac1'],[.39,.32,'#234c78']]){
      const lens=cyl(g,.03,.42,z,d,.14,d,col);lens.rotation.x=Math.PI/2;}
    box(g,.39,.82,.01,.13,.10,.15,red);
  }else if(k==='console'){
    box(g,0,.32,0,1.25,.64,.17,ink);box(g,-.57,.32,.015,.22,.66,.19,'#24d4dd');box(g,.57,.32,.015,.22,.66,.19,'#fc6652');
    print(g,graphicTV(),0,.32,.092,.86,.49);
    for(const x of [-.56,.56])ball(g,x,.34,.115,.10,.10,.04,ink);
  }else if(k==='radio'){
    box(g,0,.30,0,.75,.56,.32,'#f1be47');box(g,-.11,.33,.17,.37,.32,.02,ink);box(g,.21,.42,.18,.15,.08,.03,cream);
    rod(g,[-.21,.57,0],[-.44,.96,0],.026,'#7e9fa3');
  }else if(k==='kettle'){
    ball(g,0,.31,0,.74,.60,.60,'#75dbd0');cyl(g,0,.58,0,.46,.08,.39,cream);
    rod(g,[.23,.30,0],[.49,.52,0],.14,'#64bab5');rod(g,[-.20,.51,0],[-.27,.77,0],.075,ink);
    rod(g,[-.27,.77,0],[.19,.77,0],.075,ink);rod(g,[.19,.77,0],[.22,.55,0],.075,ink);
  }else if(k==='fryer'){
    cyl(g,0,.37,0,.71,.63,.66,'#174c53');ball(g,0,.71,0,.71,.16,.66,'#72cbb5');cyl(g,0,.17,0,.72,.10,.67,'#70c7ae');box(g,0,.34,.32,.40,.26,.06,'#123942');box(g,0,.39,.392,.09,.23,.11,gold);
    ball(g,0,.59,.29,.09,.06,.085,'#ffcc71');
  }else if(k==='pan'){
    cyl(g,-.09,.14,0,.73,.19,.70,'#d95040');cyl(g,-.09,.245,0,.68,.028,.65,'#303e46');rod(g,[.16,.17,.02],[.73,.25,.10],.12,'#e4a560');ball(g,.72,.25,.10,.15,.14,.14,ink);
  }else if(k==='phones'){
    shape(g,headband,'#594672',0,.32,0,1,1,1);
    for(const x of [-.25,.25]){ball(g,x,.29,0,.19,.31,.23,'#d09edb');ball(g,x*.70,.29,0,.10,.24,.20,ink);}
  }else if(k==='toast'){
    box(g,0,.25,0,.8,.47,.49,'#ffae7c');box(g,0,.05,0,.80,.08,.50,'#584b4a');
    for(const z of [-.10,.10]){box(g,0,.49,z,.55,.015,.065,ink);ball(g,.02,.50,z,.49,.17,.074,'#df9c53');}
    box(g,.42,.30,0,.12,.07,.12,cream);
  }else if(k==='speaker'){
    box(g,0,.37,0,.52,.74,.41,'#365282');
    for(const [y,d] of [[.50,.20],[.22,.29]]){ball(g,0,y,.20,d,d,.09,'#182d46');ball(g,0,y,.245,d*.48,d*.48,.03,'#66d6c5');}
  }else{
    ball(g,0,.19,0,.76,.29,.45,'#a9d9e2');box(g,0,.11,0,.71,.055,.39,'#546a74');rod(g,[-.23,.26,0],[-.14,.45,0],.09,red);rod(g,[-.14,.45,0],[.22,.40,0],.085,red);
  }
  return g;
}
export function shopper(p,id){
  const actor=group(p),skin=group(actor),wheels=[];
  const person=chunkyPerson(skin,id);
  const hat=['#ff8628','#9952e0','#25cfc1','#fc75a8'][id];
  const cart=group(skin,0,0,-.36),frame=group(cart);
  box(frame,0,.29,0,.81,.07,.93,'#525b94');
  for(const x of [-.41,.41])for(const z of [-.43,.43]){
    const wh=group(cart,x,.19,z);const tire=cyl(wh,0,0,0,.26,.115,.26,ink);tire.rotation.z=Math.PI/2;
    const hub=cyl(wh,x<0?-.062:.062,0,0,.13,.012,.13,'#bacdd0');hub.rotation.z=Math.PI/2;batch(wh);wheels.push(wh);
  }
  for(const y of [.46,.61,.79,.96]){const wid=.38+(y-.46)*.17;const dep=.43+(y-.46)*.20;
    for(const x of [-wid,wid])rod(frame,[x,y,-dep],[x,y,dep],y>.9?.064:.036,y>.9?(id?hat:red):'#7a98d0');
    for(const z of [-dep,dep])rod(frame,[-wid,y,z],[wid,y,z],y>.9?.055:.035,'#7a98d0');
  }
  for(const x of [-1,1])for(let j=-2;j<=2;j++)rod(frame,[x*.38,.45,j*.21],[x*.465,.96,j*.255],.032,'#b0cafa');
  for(const z of [-1,1])for(let j=-2;j<=2;j++)rod(frame,[j*.17,.45,z*.43],[j*.208,.96,z*.53],.03,'#b0cafa');
  for(const x of [-.39,.39])rod(frame,[x,.47,.37],[x,.98,.58],.055,'#5b6cad');
  rod(frame,[-.51,.99,.58],[.51,.99,.58],.105,id?hat:red);
  box(frame,0,.66,-.47,.42,.19,.035,id?hat:'#e75040');
  batch(frame);
  const extensions=[];
  if(id===0){
    for(let i=0;i<4;i++){
      const level=group(cart),y=1.03+i*.09,w=.475+i*.008,d=.54+i*.015;
      for(const x of [-w,w])rod(level,[x,y,-d],[x,y,d],.044,'#dfb0fa');
      rod(level,[-w,y,-d],[w,y,-d],.052,'#a963e0');
      for(const x of [-w,w])box(level,x,y-.048,-d,.09,.12,.09,'#9a61d8');
      batch(level);level.visible=false;extensions.push(level);
    }
  }
  const cargo=group(cart,0,.49,0);
  return {actor,skin,person,wheels,cargo,extensions};
}

// ---------- Big red sale sticker that floats over every product ----------
export function stickerMat(pct,price,big=false){
  return poster('sticker'+pct+price+big,256,256,(c,w,h)=>{
    const star=(r,col,n=14)=>{c.fillStyle=col;c.beginPath();for(let i=0;i<2*n;i++){const a=Math.PI*i/n-.2,d=i%2?r*.78:r;c.lineTo(128+Math.cos(a)*d,120+Math.sin(a)*d);}c.closePath();c.fill();};
    star(118,'#3b1f6e');star(108,big?'#ffd23f':'#ff3b30');star(92,big?'#ffe679':'#ff5a4a');
    c.save();c.translate(128,112);c.rotate(-.12);
    c.lineJoin='round';c.font='900 '+(pct>=100?60:74)+'px Arial Black, Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.lineWidth=12;c.strokeStyle='#3b1f6e';c.strokeText('-'+pct+'%',0,0);c.fillStyle=big?'#3b1f6e':'#fffbe8';
    if(big){c.fillStyle='#ff3b30';}c.fillText('-'+pct+'%',0,0);
    c.font='900 30px Arial Black, Arial, Microsoft YaHei, sans-serif';c.lineWidth=8;c.strokeText('只要¥'+price,0,56);c.fillStyle='#ffffff';c.fillText('只要¥'+price,0,56);
    c.restore();
  });
}
// A floating "grab me" ring texture for loose items on the floor.
export function grabMat(){
  return poster('grab',256,256,(c,w,h)=>{
    c.lineWidth=14;c.strokeStyle='#ffd23f';c.setLineDash([26,16]);c.beginPath();c.arc(128,128,104,0,Math.PI*2);c.stroke();
  });
}

// ---------- Chunky 3D shoppers: you, and three bargain-hunting aunties ----------
const looks=[
  {coat:'#ff7a1a',pants:'#2f4f9a',skin:'#ffd1a8',hair:'#3a2a22',shoes:'#ffffff',kind:'cap'},
  {coat:'#9952e0',pants:'#4b3a73',skin:'#f6c49c',hair:'#6b3a7a',shoes:'#3a2a3a',kind:'curlers'},
  {coat:'#14b8a8',pants:'#2e4a5a',skin:'#e9b48c',hair:'#2a1d1a',shoes:'#c83a2a',kind:'perm'},
  {coat:'#ef5f9a',pants:'#5a3150',skin:'#f3c7a2',hair:'#c9853a',shoes:'#ffffff',kind:'scarf'}
];
function eye(g,x,y,z){ball(g,x,y,z,.1,.12,.05,'#ffffff');ball(g,x,y,z+.025,.055,.07,.03,'#1d1726');}
export function chunkyPerson(parent,id){
  const L=looks[id],root=group(parent,0,0,.86);root.rotation.y=Math.PI;
  const body=group(root),hips=group(body,0,.72,0);
  const legs=[-1,1].map(side=>{const leg=group(hips,side*.15,0,0);ball(leg,0,-.27,0,.22,.5,.24,L.pants);ball(leg,0,-.58,.06,.24,.14,.32,L.shoes);batch(leg);return leg;});
  const torso=group(hips,0,0,0);
  ball(torso,0,.34,0,.66,.72,.5,L.coat);ball(torso,0,.1,0,.56,.3,.44,L.pants);
  const head=group(torso,0,.86,.02);
  ball(head,0,0,0,.56,.54,.52,L.skin);eye(head,-.11,.04,.24);eye(head,.11,.04,.24);
  ball(head,0,-.1,.25,.12,.08,.06,'#e88a7a');ball(head,-.2,-.06,.2,.1,.06,.03,'#ff9a9a');ball(head,.2,-.06,.2,.1,.06,.03,'#ff9a9a');
  if(L.kind==='cap'){ball(head,0,.14,-.02,.6,.36,.56,'#e2312b');box(head,0,.12,.27,.42,.04,.26,'#e2312b');ball(head,0,.32,0,.1,.08,.1,'#ffffff');}
  else if(L.kind==='curlers'){ball(head,0,.13,-.06,.62,.42,.58,L.hair);for(let i=0;i<5;i++){const c=cyl(head,-.22+i*.11,.3,-.02+(i%2)*.06,.1,.18,.1,['#ff9ac8','#7fe0ff','#ffe066'][i%3]);c.rotation.z=Math.PI/2;}
    for(const s of [-1,1]){const g=ball(head,s*.11,.04,.27,.17,.15,.03,'#2a2040');g.scale.z=.02;}rod(head,[-.03,.04,.28],[.03,.04,.28],.02,'#2a2040');}
  else if(L.kind==='perm'){for(let i=0;i<14;i++){const a=i*.9;ball(head,Math.sin(a)*.24,.16+Math.cos(i*1.7)*.1,-.08+Math.cos(a)*.18,.2,.2,.2,L.hair);}
    for(const s of [-1,1])box(head,s*.11,.05,.27,.17,.1,.03,'#ff3b6e');box(head,0,.06,.27,.06,.03,.03,'#ff3b6e');}
  else{ball(head,0,.1,-.04,.62,.5,.6,'#ffd23f');for(let i=0;i<6;i++)ball(head,Math.sin(i*1.1)*.24,.2+Math.cos(i*1.7)*.08,Math.cos(i*1.1)*.2,.08,.08,.08,'#ff5a4a');
    ball(head,0,-.18,-.2,.14,.14,.14,'#ffd23f');}
  batch(head);
  const arms=[-1,1].map(side=>{const arm=group(torso,side*.33,.55,0);ball(arm,0,-.18,.1,.2,.45,.2,L.coat);ball(arm,0,-.38,.26,.15,.15,.15,L.skin);batch(arm);arm.rotation.x=-1.05;return arm;});
  if(L.kind==='scarf'){const bag=group(arms[0],-.1,-.3,.15);box(bag,0,-.1,0,.12,.3,.36,'#ffd23f');rod(bag,[0,.05,-.1],[0,.2,0],.03,'#8a5a1a');rod(bag,[0,.2,0],[0,.05,.1],.03,'#8a5a1a');batch(bag);}
  const crown=new T.Object3D();head.add(crown);crown.position.set(0,.5,0);
  let reachAt=-Infinity;
  function update(angle,stride,speed,time,loaded,jam){
    const moving=speed>.14||jam,since=time-reachAt;
    const swing=moving?Math.sin(stride*.95):0;
    legs[0].rotation.x=swing*.75;legs[1].rotation.x=-swing*.75;
    body.position.y=moving?Math.abs(Math.cos(stride*.95))*.06:Math.sin(time*2+id)*.015;
    torso.rotation.x=moving?(loaded||jam?.32:.18):0;
    torso.rotation.z=moving?Math.sin(stride*.95)*.05:0;
    const cheer=since>=0&&since<.55;
    arms.forEach((arm,i)=>{arm.rotation.x=cheer&&i===1?-2.9+Math.sin(since*20)*.3:-1.05+(moving?Math.sin(stride*.95+i*Math.PI)*.08:0);});
    head.rotation.y=cheer?Math.sin(since*18)*.3:0;
    head.rotation.z=jam?Math.sin(time*16)*.12:0;
  }
  update(0,0,0,0,false,false);
  return {crown,update,reach(time){reachAt=time;},reset(){reachAt=-Infinity;}};
}