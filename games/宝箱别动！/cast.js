import {group,box,ball,drum,ring,rod,facet,jewel,bake,silhouette,tau} from './geometry.js';
const midnight='#253248',gold='#f6be52',sand='#ffc798',snow='#fff0cd';
function eye(g,x,y,z){ball(g,x,y,z,.123,.142,.064,snow);ball(g,x,y+.005,z+.032,.057,.085,.032,'#172132');}
function uniformHead(g,theme){
  const skin=theme==='tide'?'#b87954':theme==='clock'?'#dda77e':'#eab58c';
  ball(g,0,1.34,.02,.72,.71,.66,skin);
  for(const s of [-1,1]){ball(g,s*.337,1.31,0,.112,.17,.13,skin);eye(g,s*.138,1.39,.287);}
  ball(g,0,1.28,.331,.134,.14,.137,skin);box(g,0,1.19,.30,.19,.025,.026,'#895b53');
  for(const s of [-1,1])box(g,s*.147,1.455,.31,.16,.043,.04,'#443d42').rotation.z=s*.16;
  ball(g,0,1.49,-.09,.68,.37,.55,'#54403c');
  const band=drum(g,0,1.58,0,.354,.355,.13,'#172944',24);band.scale.z*=.88;
  const cap=drum(g,0,1.69,-.045,.384,.43,.18,'#1859d1',24);cap.scale.z*=.92;cap.rotation.x=-.07;
  ball(g,0,1.76,-.045,.78,.17,.72,'#256de9');
  ball(g,0,1.57,.268,.74,.087,.48,'#182a48');
  ball(g,0,1.635,.326,.13,.128,.035,'#f6cc56');
}
export function character(root,type,theme){
  const pivot=group(root),figure=group(pivot),torso=group(figure),thief=type==='player';
  const coat=thief?'#a94545':'#3275c8';
  ball(torso,0,.86,0,.69,.80,.50,coat);
  drum(torso,0,.63,.005,.315,.29,.107,'#243345',16);
  if(thief){
    ball(torso,0,1.33,.018,.75,.70,.68,sand);
    for(const s of [-1,1])ball(torso,s*.35,1.32,.008,.12,.14,.14,sand);
    ball(torso,0,1.39,.22,.71,.239,.276,'#252c39');
    eye(torso,-.146,1.385,.339);eye(torso,.146,1.385,.339);
    ball(torso,0,1.29,.348,.14,.125,.12,'#dc976b');
    ball(torso,0,1.60,-.035,.80,.48,.73,'#303c51');
    for(let i=0;i<8;i++){
      const a=i*tau/8,dx=Math.sin(a),dz=Math.cos(a);
      rod(torso,[dx*.12,1.828,-.035+dz*.105],[dx*.27,1.776,-.035+dz*.24],.008,'#415065',5);
      rod(torso,[dx*.27,1.776,-.035+dz*.24],[dx*.378,1.669,-.035+dz*.342],.008,'#415065',5);
    }
    const cuff=drum(torso,0,1.535,-.008,.40,.385,.14,'#222f42',24);cuff.scale.z*=.92;
    for(let i=0;i<16;i++){const a=i*tau/16;box(torso,.394*Math.sin(a),1.54,.357*Math.cos(a)-.008,.021,.097,.021,'#47546a');}
    box(torso,.24,1.53,.271,.095,.076,.033,'#ea9265').rotation.y=.51;
    drum(torso,0,1.085,0,.265,.31,.13,'#eb6850',16);
    box(torso,.22,.97,-.212,.16,.34,.085,'#c3453c').rotation.z=.35;
    for(const s of [-1,1])box(torso,s*.188,.86,.18,.070,.47,.077,'#39475a').rotation.z=s*.31;
    ball(torso,0,.845,-.28,.65,.67,.35,'#28384e');box(torso,0,.81,-.36,.52,.43,.21,'#61758b');
    box(torso,0,.99,-.439,.55,.14,.077,'#91a4b1');box(torso,0,.82,-.485,.092,.19,.034,'#e9ad54');
    rod(torso,[-.21,.67,-.47],[.21,.67,-.47],.023,'#c7d5de');
  }else{
    uniformHead(torso,theme);
    for(const s of [-1,1]){
      box(torso,s*.20,.99,.186,.169,.14,.045,'#2861a2');
      box(torso,s*.245,1.106,0,.15,.07,.37,'#253e63');
      box(torso,s*.245,1.149,-.02,.105,.020,.10,'#e7be57');
    }
    const badge=drum(torso,-.158,.97,.241,.065,.037,.115,'#ffd456',5);badge.rotation.x=.21;
    box(torso,.13,.974,.254,.155,.028,.021,'#b2d7e3');
    box(torso,0,.85,.226,.062,.36,.056,'#233653');
    box(torso,0,.63,.281,.122,.077,.030,'#b1bbc3');
    box(torso,-.30,.66,.009,.12,.19,.16,'#23364a');
    ball(torso,-.30,1.33,-.01,.18,.215,.18,'#2b3b52');
  }
  bake(torso);silhouette(torso);
  const limbs=[];
  for(const side of [-1,1]){
    const leg=group(figure,side*.172,.58,0);
    ball(leg,0,-.17,0,.269,.44,.27,thief?'#33465b':'#354458');
    ball(leg,0,-.41,.061,.285,.20,.40,'#2c3545');bake(leg);
    const arm=group(figure,side*.354,1.005,0);
    ball(arm,0,-.105,0,.239,.33,.236,coat);
    ball(arm,0,-.298,.035,.196,.22,.20,thief?'#35404b':sand);
    if(!thief&&side===1){const lamp=drum(arm,0,-.31,.21,.088,.11,.36,midnight,10);lamp.rotation.x=Math.PI/2;
      ball(arm,0,-.31,.397,.167,.17,.035,'#fff0a6');}
    bake(arm);limbs.push({leg,arm,side});
  }
  return {pivot,figure,torso,limbs};
}
export function animateFigure(a,t,stride,fold){
  a.figure.visible=fold<.97;
  const scale=Math.max(.02,1-fold*.98);
  a.figure.scale.set(1-fold*.42,scale,1-fold*.42);
  a.figure.position.y=Math.abs(Math.sin(t))*stride*.10;
  a.torso.rotation.z=Math.sin(t)*stride*.065;
  a.torso.rotation.x=stride*.095;
  for(const {leg,arm,side} of a.limbs){
    const wave=Math.sin(t)*side*stride;leg.rotation.x=wave*.73;arm.rotation.x=-wave*.66-.10;
    arm.rotation.z=side*(.095+Math.abs(wave)*.06);
  }
}
export function chest(root){
  const g=group(root),base=group(g);
  box(base,0,.35,0,.94,.66,.75,'#bb976c');
  for(const side of [-1,1]){
    box(base,side*.34,.35,0,.095,.69,.77,'#d8b986');
    for(const y of [.10,.54])box(base,side*.34,y,.412,.045,.043,.018,'#754f37');
  }
  box(base,0,.08,0,.96,.08,.77,'#987956');box(base,0,.65,0,.98,.095,.80,'#594e46');
  box(base,-.1,.41,.384,.29,.18,.016,'#f6eed5');
  for(let i=0;i<7;i++)box(base,-.206+i*.033,.42,.400,.010+(i%3)*.005,.085,.008,'#405263');
  bake(base);
  const eyes=group(g,0,.71,.235);
  for(const s of [-1,1])eye(eyes,s*.15,0,0);
  bake(eyes);
  const lid=group(g,0,.68,-.39);
  box(lid,0,.061,.39,1.00,.12,.82,'#b7946b');box(lid,0,.137,.39,.95,.04,.77,'#dac09a');
  box(lid,0,.164,.39,.11,.018,.78,'#f0d29d');bake(lid);
  return {g,lid};
}
function circleFace(p,x,y,z,r,c){const q=drum(p,x,y,z,r,r,.11,c,20);q.rotation.x=Math.PI/2;return q;}
export function relicModel(g,kind){
  if(moreRelics(g,kind)){bake(g);return;}
  if(kind==='scarab'){
    ball(g,0,0,0,.64,.44,.75,gold);
    for(const s of [-1,1]){ball(g,s*.145,.13,.015,.265,.22,.53,'#1eb4a0');for(let i=0;i<3;i++)rod(g,[s*.24,0,(i-1)*.20],[s*.42,-.09,(i-1)*.26],.037,gold);}
    ball(g,0,.06,.34,.26,.18,.24,'#324955');
  }else if(kind==='ruby'||kind==='orb'){
    jewel(g,kind==='ruby'?['#ff91aa','#ee365b','#ba1f54','#f55a83','#941d59','#ff7798']:['#e0c9ff','#ab79fa','#7751c4','#a594ff','#6753aa','#cdb4ff']);
    if(kind==='orb'){const r=ring(g,0,0,0,.42,.045,gold);r.rotation.z=.45;r.rotation.x=.4;}
    facet(g,-.12,.20,.11,.15,.07,.11,'#ffdfdc');
  }else if(kind==='mask'){
    ball(g,0,0,0,.61,.69,.37,gold);
    for(const s of [-1,1]){box(g,s*.265,-.05,0,.15,.48,.31,'#359494').rotation.z=s*.17;box(g,s*.12,.09,.174,.14,.05,.05,midnight);}
    box(g,0,-.22,.17,.11,.28,.11,'#d18e37');drum(g,0,.31,0,.17,.28,.13,'#2f9994',10);
  }else if(kind==='pearl'){
    for(const s of [-1,1]){const shell=ball(g,0,-.07,s*.13,.77,.24,.52,s<0?'#d8869e':'#eeaca7');shell.rotation.x=s<0?.98:-.18;}
    ball(g,0,.13,0,.40,.40,.40,'#fef2d9');
  }else if(kind==='crown'){
    drum(g,0,-.07,0,.33,.27,.19,gold,8);
    for(let i=0;i<6;i++){const a=i*tau/6;drum(g,.25*Math.cos(a),.10,.25*Math.sin(a),.01,.109,.29,'#ffd170',4);}
    facet(g,0,-.04,.31,.14,.15,.08,'#de5471');
  }else if(kind==='key'){
    ring(g,0,.21,0,.18,.075,gold,14);box(g,0,-.12,0,.10,.49,.12,gold);box(g,.095,-.3,0,.22,.10,.12,gold);
  }else{
    circleFace(g,0,.0,0,.35,gold);circleFace(g,0,.0,.065,.265,kind==='watch'?snow:'#367887');
    rod(g,[-.10,-.12,.155],[.12,.18,.155],.027,kind==='watch'?midnight:'#ffb565');
    if(kind==='watch')ring(g,0,.4,0,.083,.032,gold);
    else facet(g,0,.015,.15,.095,.12,.09,'#e95758');
  }
  bake(g);
}

// ---------- More loot: three per night, each with its own silhouette ----------
const gems={
  sapphire:['#9fd0ff','#3a7bf0','#2453b8','#6aa2ff','#1c3a8a','#b9e1ff'],
  diamond:['#fff0f7','#ffb3d6','#f07bb0','#ffd6ea','#d9588f','#ffe5f1'],
  emerald:['#b8ffd9','#2fcf86','#16975e','#6ff0ac','#0e6b45','#c9ffe6'],
  amethyst:['#e6ccff','#a35ce0','#7a3cb8','#c48af5','#5b2a8f','#f0dcff']
};
function disk(g,x,y,z,r,t,c,n=24){const q=drum(g,x,y,z,r,r,t,c,n);q.rotation.x=Math.PI/2;return q;}
function moreRelics(g,kind){
  if(gems[kind]){jewel(g,gems[kind]);g.children[0].scale.setScalar(1.15);facet(g,-.12,.2,.11,.15,.07,.11,'#ffffff');return true;}
  switch(kind){
  case 'vase':
    ball(g,0,-.05,0,.58,.6,.58,'#f2f5ff');drum(g,0,.32,0,.13,.17,.24,'#f2f5ff',12);drum(g,0,.45,0,.19,.15,.06,'#f2f5ff',12);
    ring(g,0,.07,0,.29,.03,'#2d5bd1',20).rotation.x=Math.PI/2;ring(g,0,-.16,0,.27,.025,'#2d5bd1',20).rotation.x=Math.PI/2;
    for(let i=0;i<6;i++){const a=i*tau/6;ball(g,Math.sin(a)*.27,-.04,Math.cos(a)*.27,.1,.1,.05,'#3a6ae0').rotation.y=a;}
    drum(g,0,-.33,0,.18,.2,.06,'#2d5bd1',12);return true;
  case 'goldbar':
    for(const [x,y,z] of [[-.2,-.2,0],[.2,-.2,0],[0,-.2,.0],[-.1,0,0],[.1,0,0],[0,.2,0]]){
      const b=drum(g,x*1.1,y,z,.12,.17,.17,gold,4);b.rotation.y=Math.PI/4;b.scale.set(.32,.17,.2);}
    box(g,0,.22,.12,.18,.03,.01,'#fff3b0');return true;
  case 'cat':
    ball(g,0,-.12,0,.55,.5,.45,gold);ball(g,0,.27,0,.5,.45,.42,gold);
    for(const s of [-1,1]){facet(g,s*.16,.5,0,.14,.18,.1,gold);ball(g,s*.1,.3,.2,.07,.05,.03,midnight);}
    rod(g,[.22,.05,.05],[.33,.42,.08],.07,gold);ball(g,.33,.45,.08,.13,.13,.13,'#fff3c4');
    ring(g,0,.08,.02,.2,.035,'#e2443a',20).rotation.x=Math.PI/2.4;ball(g,0,.05,.22,.08,.08,.08,'#ffe066');
    box(g,0,-.1,.23,.2,.24,.02,'#fff6cf');return true;
  case 'trophy':
    drum(g,0,.2,0,.34,.16,.4,gold,18);drum(g,0,.42,0,.36,.36,.04,'#ffe28a',18);
    for(const s of [-1,1]){const r=ring(g,s*.35,.22,0,.13,.035,gold,14);r.rotation.y=Math.PI/2;}
    drum(g,0,-.07,0,.05,.05,.2,gold,8);drum(g,0,-.22,0,.2,.24,.12,'#7a4b2a',8);box(g,0,-.22,.2,.18,.06,.01,'#ffe28a');
    facet(g,0,.24,.24,.12,.14,.06,'#ff5d7a');return true;
  case 'bottle':
    ball(g,0,0,0,.42,.62,.42,'#bfe9f2');drum(g,0,.38,0,.08,.1,.18,'#bfe9f2',10);drum(g,0,.5,0,.09,.09,.08,'#9b6a3c',10);
    box(g,0,-.12,0,.26,.06,.1,'#8a5a32');rod(g,[0,-.1,0],[0,.18,0],.012,'#5a3a22');
    facet(g,.05,.04,0,.17,.22,.02,'#ffffff');return true;
  case 'anchor':
    rod(g,[0,-.3,0],[0,.32,0],.05,gold);ring(g,0,.4,0,.09,.035,gold,14);box(g,0,.22,0,.34,.06,.06,gold);
    const arc=ring(g,0,-.12,0,.27,.05,gold,24);arc.scale.y=1;
    for(const s of [-1,1])facet(g,s*.27,-.04,0,.12,.14,.06,gold);return true;
  case 'coffer':
    box(g,0,-.1,0,.62,.34,.42,'#7b4a2c');box(g,0,.1,0,.66,.06,.46,gold);
    for(const s of [-1,1])box(g,s*.22,-.1,.215,.06,.36,.02,gold);
    for(let i=0;i<7;i++)disk(g,-.2+i%4*.13,.17+Math.floor(i/4)*.04,(i%2-.5)*.18,.07,.025,'#ffd44d',14).rotation.x=1.3;
    box(g,0,-.04,.22,.09,.1,.02,'#3b2a20');return true;
  case 'spyglass':{
    const t=group(g);t.rotation.z=.7;
    drum(t,0,-.18,0,.1,.12,.3,'#b07a2e',12);drum(t,0,.06,0,.085,.1,.2,gold,12);drum(t,0,.24,0,.07,.085,.18,'#c9913a',12);
    ring(t,0,-.04,0,.11,.02,'#6b4520',14).rotation.x=Math.PI/2;disk(t,0,.34,0,.06,.02,'#bfe9f2');return true;}
  case 'skull':
    ball(g,0,.06,0,.55,.5,.5,'#cfeeff');box(g,0,-.2,.04,.32,.14,.3,'#b4e3ff');
    for(const s of [-1,1])ball(g,s*.12,.04,.21,.14,.14,.06,'#3a5d90');
    facet(g,0,-.07,.24,.06,.06,.04,'#3a5d90');for(let i=0;i<4;i++)box(g,-.09+i*.06,-.2,.2,.03,.06,.02,'#ffffff');
    facet(g,-.14,.24,.14,.1,.06,.06,'#ffffff');return true;
  case 'hourglass':
    for(const y of [-.33,.33])drum(g,0,y,0,.25,.25,.06,'#8a5a32',10);
    for(const s of [-1,1])for(const t of [-1,1])rod(g,[s*.2,-.33,t*.06],[s*.2,.33,t*.06],.02,'#8a5a32');
    drum(g,0,.15,0,.17,.03,.3,'#d7f2ff',12);drum(g,0,-.15,0,.03,.17,.3,'#d7f2ff',12);
    drum(g,0,-.22,0,.08,.15,.14,'#ffc94a',12);drum(g,0,.06,0,.05,.02,.07,'#ffc94a',8);return true;
  case 'musicbox':
    box(g,0,-.16,0,.6,.28,.44,'#e87aa8');box(g,0,-.01,0,.62,.04,.46,gold);
    const lid=box(g,0,.13,-.2,.6,.3,.04,'#f59bc2');lid.rotation.x=-.25;
    drum(g,0,.05,0,.08,.08,.05,'#ffffff',10);ball(g,0,.18,0,.1,.16,.1,'#ffe0ef');drum(g,0,.11,0,.03,.14,.1,'#ffb3d6',10);
    ball(g,0,.3,0,.07,.07,.07,sand);return true;
  case 'gear':
    disk(g,0,0,0,.32,.12,gold,16);disk(g,0,0,.02,.13,.16,'#c48a26',12);
    for(let k=0;k<10;k++){const a=k*tau/10;box(g,Math.sin(a)*.34,Math.cos(a)*.34,0,.1,.12,.12,gold).rotation.z=-a;}
    for(let k=0;k<4;k++){const a=k*tau/4+.4;box(g,Math.sin(a)*.22,Math.cos(a)*.22,.04,.05,.12,.05,'#ffe28a').rotation.z=-a;}return true;
  case 'cuckoo':
    box(g,0,-.04,0,.48,.5,.28,'#7b4a2c');for(const s of [-1,1]){const r=box(g,s*.15,.3,0,.4,.05,.34,'#5a3420');r.rotation.z=-s*.62;}
    disk(g,0,-.02,.15,.15,.03,'#fff6dd');rod(g,[0,-.02,.17],[.06,.07,.17],.012,midnight);rod(g,[0,-.02,.17],[-.08,-.02,.17],.012,midnight);
    ball(g,0,.22,.16,.12,.11,.12,'#ffd24a');facet(g,0,.21,.23,.05,.04,.06,'#ff8a3a');
    rod(g,[0,-.3,.05],[0,-.5,.05],.012,gold);disk(g,0,-.52,.05,.06,.02,gold);return true;
  case 'astrolabe':
    ball(g,0,0,0,.2,.2,.2,'#7f6bff');
    for(const [rx,rz] of [[0,0],[Math.PI/2,0],[Math.PI/3,.6]]){const r=ring(g,0,0,0,.34,.025,gold,28);r.rotation.x=rx;r.rotation.z=rz;}
    for(let i=0;i<5;i++){const a=i*tau/5;facet(g,Math.sin(a)*.34,Math.cos(a)*.34,0,.06,.06,.06,'#fff3a6');}
    drum(g,0,-.4,0,.12,.16,.08,'#8a5a32',10);return true;
  case 'lollipop':{
    rod(g,[0,-.45,0],[0,.02,0],.025,'#ffffff');
    const cols=['#ff5d8f','#ffd24a','#5be3b8','#62a8ff','#c48af5'];
    for(let i=0;i<5;i++)disk(g,0,.24,.01*i,.3-i*.055,.07,cols[i],24);return true;}
  case 'donut':{
    const d=ring(g,0,0,0,.24,.13,'#e9a95b',20);d.rotation.x=Math.PI/2;
    const ice=ring(g,0,.05,0,.235,.11,'#ff8fc0',20);ice.rotation.x=Math.PI/2;ice.scale.y=.6;
    for(let i=0;i<12;i++){const a=i*tau/12;box(g,Math.sin(a)*(.2+i%2*.08),.13,Math.cos(a)*(.2+i%2*.08),.05,.02,.02,['#fff','#ffd24a','#5be3b8','#62a8ff'][i%4]).rotation.y=a*3;}
    return true;}
  case 'cake':
    drum(g,0,-.2,0,.36,.36,.22,'#ffe7f0',18);drum(g,0,.02,0,.27,.27,.2,'#ff9cc2',18);drum(g,0,.2,0,.18,.18,.16,'#ffe7f0',16);
    for(let i=0;i<8;i++){const a=i*tau/8;ball(g,Math.sin(a)*.34,-.08,Math.cos(a)*.34,.08,.06,.08,'#ffffff');}
    ball(g,0,.36,0,.15,.16,.15,'#ff3b55');facet(g,0,.45,0,.08,.06,.08,'#3fb36b');return true;
  case 'bear':
    ball(g,0,-.12,0,.5,.52,.42,'#ff4b5c');ball(g,0,.25,0,.42,.38,.36,'#ff4b5c');
    for(const s of [-1,1]){ball(g,s*.16,.42,0,.14,.14,.12,'#ff4b5c');ball(g,s*.27,-.02,.04,.15,.22,.15,'#ff4b5c');ball(g,s*.15,-.38,.03,.16,.13,.16,'#ff4b5c');}
    ball(g,0,.2,.17,.16,.12,.1,'#ff8a96');for(const s of [-1,1])ball(g,s*.08,.3,.17,.05,.05,.03,'#7a1020');
    facet(g,-.1,.05,.16,.1,.14,.04,'#ffd0d6');return true;
  case 'gumball':
    ball(g,0,.12,0,.56,.56,.56,'#e4f6ff');
    for(let i=0;i<14;i++){const a=i*2.4,r=.14+(i%3)*.06;ball(g,Math.sin(a)*r,.0+(i%4)*.07,Math.cos(a)*r+.08,.1,.1,.1,['#ff5d8f','#ffd24a','#5be3b8','#62a8ff','#c48af5'][i%5]);}
    drum(g,0,-.24,0,.2,.26,.22,'#e2443a',12);box(g,0,-.23,.2,.1,.08,.04,'#ffd24a');disk(g,0,-.13,.22,.04,.03,'#c0c0c0');
    drum(g,0,.42,0,.08,.08,.06,'#e2443a',10);return true;
  case 'choco':
    for(let i=0;i<9;i++){const row=i<5?0:i<8?1:2,k=i<5?i:i<8?i-5:0,n=[5,3,1][row];
      disk(g,(k-(n-1)/2)*.2,-.25+row*.2+(k%2)*.02,0,.11,.05,'#ffcc3a',16).rotation.x=.25;}
    disk(g,0,.17,.05,.11,.05,'#6b3b1f',16).rotation.x=.25;return true;
  case 'icecream':
    drum(g,0,-.2,0,.2,.02,.48,'#e6a95e',12);
    for(const [y,c] of [[.1,'#ffd1e6'],[.28,'#c8f3e2'],[.44,'#fff3c4']])ball(g,0,y,0,.36-y*.25,.3,.36-y*.25,c);
    ball(g,0,.6,0,.1,.1,.1,'#ff3b55');for(let i=0;i<6;i++)box(g,Math.sin(i)*.12,.2+i*.05,Math.cos(i)*.12+.05,.05,.02,.02,'#ff8a3a').rotation.y=i;
    return true;
  case 'jar':
    drum(g,0,-.04,0,.28,.28,.56,'#e4f6ff',16);drum(g,0,.28,0,.3,.3,.08,'#ff5d8f',16);
    for(let i=0;i<18;i++){const a=i*2.3,r=.18;ball(g,Math.sin(a)*r,-.26+(i%6)*.08,Math.cos(a)*r,.11,.11,.11,['#ff5d8f','#ffd24a','#5be3b8','#62a8ff','#c48af5','#ff8a3a'][i%6]);}
    return true;
  case 'candycrown':
    drum(g,0,-.1,0,.34,.3,.22,'#ffd8ec',10);ring(g,0,-.2,0,.31,.04,gold,24).rotation.x=Math.PI/2;
    for(let i=0;i<5;i++){const a=i*tau/5;drum(g,Math.sin(a)*.27,.12,Math.cos(a)*.27,.01,.1,.28,['#ff5d8f','#5be3b8','#ffd24a','#62a8ff','#c48af5'][i],6);
      ball(g,Math.sin(a)*.27,.28,Math.cos(a)*.27,.1,.1,.1,['#ff5d8f','#5be3b8','#ffd24a','#62a8ff','#c48af5'][i]);}
    facet(g,0,-.07,.31,.14,.15,.08,'#ff3b6e');return true;
  }
  return false;
}

// ---------- Guard dog ----------
export function dog(root){
  const pivot=group(root),figure=group(pivot),body=group(figure),fur='#b9774a',dark='#6b3f26';
  ball(body,0,.52,0,.55,.48,.95,fur);ball(body,0,.5,.18,.46,.4,.4,'#f2d3a8');
  const head=group(figure,0,.82,.45);
  ball(head,0,0,0,.5,.46,.46,fur);ball(head,0,-.08,.24,.28,.22,.3,'#f2d3a8');ball(head,0,-.02,.4,.12,.1,.08,'#1e1a1d');
  for(const s of [-1,1]){eye(head,s*.12,.08,.2);const ear=ball(head,s*.24,.02,-.02,.14,.34,.2,dark);ear.rotation.z=s*.35;}
  ring(figure,0,.66,.36,.2,.04,'#e2443a',16).rotation.x=Math.PI/2.3;
  drum(figure,0,.58,.53,.07,.06,.03,'#ffd456',5).rotation.x=Math.PI/2;
  bake(body);silhouette(body);bake(head);
  const tail=group(figure,0,.62,-.46);rod(tail,[0,0,0],[0,.25,-.12],.045,fur);bake(tail);
  const legs=[];
  for(const [x,z] of [[-.15,.28],[.15,.28],[-.15,-.28],[.15,-.28]]){
    const leg=group(figure,x,.42,z);ball(leg,0,-.18,0,.15,.4,.16,fur);ball(leg,0,-.38,.04,.17,.1,.2,'#f2d3a8');bake(leg);legs.push(leg);
  }
  return {pivot,figure,body,head,tail,legs,dog:true};
}
export function animateDog(a,t,pace,alert,time){
  a.legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(t+(i%2?Math.PI:0)+(i>1?Math.PI:0))*.7*pace;});
  a.figure.position.y=Math.abs(Math.sin(t))*.06*pace;
  a.tail.rotation.y=Math.sin(time*(alert?22:9))*.6;
  a.head.rotation.x=alert?-.25+Math.sin(time*30)*.05:Math.sin(time*2)*.06;
  a.head.position.y=.82+(alert?.06:0);
}

// ---------- Wall camera ----------
export function securityCam(root,x,z){
  const pivot=group(root,x,2.05,z),head=group(pivot);
  box(pivot,0,.16,0,.14,.32,.14,'#3b4258');
  box(head,0,0,.18,.3,.24,.52,'#e9edf5');box(head,0,0,.46,.26,.2,.06,'#2a3346');
  disk(head,0,0,.5,.08,.04,'#59b7ff',14);box(head,0,.16,.2,.36,.06,.58,'#c9d0de');
  bake(pivot);bake(head);
  const led=ball(head,.1,.07,.47,.06,.06,.04,'#ff3b4b');led.material=led.material.clone();led.userData.disposable=true;
  return {pivot,head,led};
}

// ---------- Key card ----------
export function keycard(g){
  box(g,0,0,0,.62,.4,.05,'#3ad6ff');box(g,0,.12,.03,.62,.08,.01,'#14435a');
  box(g,-.15,-.04,.03,.16,.12,.01,'#ffd24a');box(g,.13,-.06,.03,.22,.04,.01,'#ffffff');
  ring(g,.2,.12,0,.05,.015,'#ffffff',10);bake(g);
}

// ---------- Disguise boxes: the player's hiding spot, bought in the shop ----------
export const disguises=[
  {id:'crate',name:'快递纸箱',price:0,blurb:'朴实无华，就是个箱子'},
  {id:'barrel',name:'橡木酒桶',price:150,blurb:'海盗都不会怀疑它'},
  {id:'gift',name:'惊喜礼盒',price:260,blurb:'谁会抓一个礼物呢？'},
  {id:'plant',name:'盆栽伪装',price:380,blurb:'叶子会偷偷发抖'},
  {id:'trash',name:'垃圾桶',price:520,blurb:'守卫都绕着走'},
  {id:'chest',name:'黄金宝箱',price:900,blurb:'宝箱……别动！'}
];
export function chestOf(root,kind='crate'){
  if(kind==='crate')return chest(root);
  const g=group(root),base=group(g);
  let lidY=.68,lid;
  if(kind==='barrel'){
    drum(base,0,.34,0,.42,.38,.68,'#9a6234',14);ball(base,0,.34,0,.86,.5,.86,'#9a6234');
    for(const y of [.1,.34,.58])ring(base,0,y,0,.42+(y===.34?.03:0),.03,'#4a3a32',20).rotation.x=Math.PI/2;
    box(base,0,.36,.43,.22,.14,.02,'#f6eed5');
    lid=group(g,0,lidY,-.39);drum(lid,0,.02,.39,.4,.4,.06,'#b37840',14);rod(lid,[-.2,.06,.39],[.2,.06,.39],.025,'#5a3a22');
  }else if(kind==='gift'){
    box(base,0,.33,0,.9,.64,.78,'#e2443a');box(base,0,.33,0,.16,.66,.8,'#ffd24a');box(base,0,.33,0,.92,.66,.16,'#ffd24a');
    lid=group(g,0,lidY,-.39);box(lid,0,.05,.39,.98,.14,.84,'#ff5d55');box(lid,0,.05,.39,.17,.16,.86,'#ffd24a');box(lid,0,.05,.39,1,.16,.17,'#ffd24a');
    for(const s of [-1,1]){const b=ball(lid,s*.14,.2,.39,.26,.18,.12,'#ffd24a');b.rotation.z=s*.5;}
  }else if(kind==='plant'){
    drum(base,0,.28,0,.42,.32,.56,'#c86a3e',12);drum(base,0,.56,0,.44,.44,.06,'#e08250',12);drum(base,0,.6,0,.4,.4,.02,'#4a3226',12);
    lid=group(g,0,lidY,-.39);
    for(let i=0;i<9;i++){const a=i*2.4,dx=Math.sin(a),dz=Math.cos(a);const l=facet(lid,dx*.18,.3+(i%3)*.12,.39+dz*.18,.34,.62,.24,['#4d956d','#72ae79','#37816b'][i%3]);l.rotation.z=-dx*.45;l.rotation.x=dz*.45;}
  }else if(kind==='trash'){
    drum(base,0,.33,0,.43,.36,.66,'#7c8a96',16);for(let i=0;i<8;i++){const a=i*tau/8;box(base,Math.sin(a)*.4,.33,Math.cos(a)*.4,.04,.6,.04,'#5f6c78').rotation.y=a;}
    box(base,0,.36,.41,.2,.12,.02,'#62d18a');
    lid=group(g,0,lidY,-.39);drum(lid,0,.04,.39,.46,.46,.08,'#9aa8b4',16);drum(lid,0,.12,.39,.1,.1,.06,'#5f6c78',10);
    ball(lid,.18,.12,.5,.14,.05,.1,'#ffd24a');
  }else{
    box(base,0,.3,0,.94,.6,.72,'#c98a2a');for(const s of [-1,1])box(base,s*.4,.3,0,.08,.62,.74,'#ffd24a');
    box(base,0,.32,.37,.16,.2,.03,'#ffe28a');box(base,0,.6,0,.96,.06,.74,'#8a5a1a');
    lid=group(g,0,lidY,-.36);const top=drum(lid,0,.05,.36,.37,.37,.94,'#e0a43a',14);top.rotation.z=Math.PI/2;top.scale.set(.37,.94,.37);
    for(const s of [-1,1]){const band=drum(lid,s*.4,.05,.36,.38,.38,.08,'#ffd24a',14);band.rotation.z=Math.PI/2;band.scale.set(.38,.08,.38);}
    for(let i=0;i<4;i++)facet(lid,-.24+i*.16,.38,.36,.1,.1,.1,['#ff5d7a','#5be3b8','#62a8ff','#ffd24a'][i]);
  }
  bake(base);if(lid)bake(lid);
  const eyes=group(g,0,.71,.235);for(const s of [-1,1])eye(eyes,s*.15,0,0);bake(eyes);
  return {g,lid};
}