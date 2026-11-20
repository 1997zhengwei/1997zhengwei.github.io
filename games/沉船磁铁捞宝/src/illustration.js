
import { curve, fishArt, ink, magnetArt, openVault, oval, pill, star, treasuresArt } from './sprites.js';
import { gateAt, maxDepth, vaultKind, vaultRevealSeconds, vaultSite, zoneAt } from './rules.js';

const surfaceBlue = [32, 109, 253];
const deepBlue = [23, 71, 130];
const skyStops = [[0,'#612ee8'],[.15,'#614bea'],[.31,'#6187eb'],[.50,'#61d3e6'],[.65,'#61e7e1'],[1,'#76f2dc']];
const paleRock = '#8a80c4';

function waterColor(depth) {
  const mix = Math.max(0, Math.min(1, (depth - 6) / 28));
  const trench = Math.max(0, Math.min(1, (depth - 113) / 33));
  const abyss = Math.max(0, Math.min(1, (depth - 150) / 340));
  return 'rgb(' + surfaceBlue.map((channel, index) =>
    Math.round(channel + (deepBlue[index] - channel) * mix - [5, 23, 37][index] * trench - [3, 23, 19][index] * abyss)).join(',') + ')';
}

function randomFrom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function cloud(ctx, x, y, width) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width, width);
  curve(ctx,'M -1 .04 Q -1.03 -.118 -.76 -.135 Q -.647 -.363 -.409 -.291 Q -.12 -.523 .139 -.287 Q .425 -.338 .563 -.18 Q .957 -.202 1.021 .006 Q .978 .137 .740 .137 H -.771 Q -1.02 .137 -1 .04 Z','#fff7eb',null);
  curve(ctx,'M -.80 .113 Q -.65 .061 -.40 .060 H .66 Q .874 .06 .97 .032 Q .88 .134 .737 .137 H -.772 Z','#e6ecf7',null);
  ctx.restore();
}

function createShore() {
  const canvas=document.createElement('canvas');
  canvas.width=1260;
  canvas.height=210;
  const ctx=canvas.getContext('2d');
  const rand=randomFrom(80219);
  ctx.translate(630,189);
  ctx.scale(47,47);
  ctx.lineCap='round';
  ctx.lineJoin='round';
  curve(ctx,'M -14 -.16 Q -10.82 -1.86 -7.55 -.86 Q -5.19 -1.19 -2.37 -.73 Q -.07 -.61 2.21 -1.13 Q 4.71 -1.31 6.13 -.74 Q 9.4 -1.90 13.9 -.76 V .67 H -14 Z','#5ba8aa',null);
  curve(ctx,'M -14 .04 Q -10.64 -.43 -8.92 -.67 Q -7.06 -.88 -4.64 -.21 Q -2.78 -.3 -.84 -.34 Q 1.12 -.44 2.93 -.31 Q 4.33 -.63 7.1 -.50 Q 9.43 -.73 14 -.29 V .62 H -14 Z','#67c7a2',null);
  for(let i=0;i<37;i++){
    const x=-13.15+i*.74+(rand()-.5)*.32;
    if(Math.abs(x)<.8 && i%2===1) continue;
    const h=.58+rand()*1.17;
    const bottom=.03+Math.sin(x*.81)*.17;
    ctx.save();
    ctx.translate(x,bottom);
    ctx.scale(h,h);
    if(i%4===1 || i%7===2) {
      const foliage=i%3===0?'#97d775':'#64b984';
      curve(ctx,'M -.023 .055 V -.584',null,'#5b797e',.056);
      oval(ctx,-.006,-.473,.245,.362,foliage);
      oval(ctx,-.196,-.371,.162,.214,foliage);
      oval(ctx,.157,-.38,.183,.218,foliage);
      curve(ctx,'M -.015 -.137 V -.59 M -.012 -.29 L -.118 -.42 M -.01 -.356 L .123 -.47',null,'#589481',.035);
      oval(ctx,-.071,-.636,.033,.039,'#d6ea85');
    } else {
      const foliage=i%3===0?'#418e96':'#43ae99';
      curve(ctx,'M -.018 -1.08 Q -.08 -.871 -.219 -.674 H -.12 Q -.178 -.494 -.323 -.373 H -.224 Q -.265 -.238 -.371 -.169 Q -.024 -.029 .363 -.171 Q .246 -.27 .206 -.382 H .309 Q .155 -.53 .127 -.681 H .211 Q .054 -.853 -.018 -1.08 Z',foliage,null);
      curve(ctx,'M -.017 -1.066 L -.028 -.242 Q .148 -.142 .345 -.174 Q .196 -.336 .171 -.391 H .294 Q .14 -.537 .102 -.690 H .193 Q .047 -.889 -.017 -1.066 Z','#337f93',null);
      curve(ctx,'M -.031 -.304 L -.031 .032',null,'#517a85',.051);
    }
    ctx.restore();
  }
  curve(ctx,'M -14 .04 Q -11.03 -.052 -8.67 .015 Q -6.77 -.21 -4.98 -.024 Q -2.58 .103 -.11 -.059 Q 2.61 -.195 4.15 -.012 Q 6.6 .11 8.82 -.049 Q 11.2 -.177 14 .094 V .45 H -14 Z','#43a7bc',null);
  return canvas;
}

function waveBand(ctx,time) {
  ctx.beginPath();
  for(let i=0;i<=62;i++){
    const x=-13+i*26/62;
    const y=.045 + .113*Math.sin(x*1.22+time*.66) + .055*Math.sin(x*2.12-time*.79);
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.lineTo(13,.48);
  ctx.lineTo(-13,.48);
  ctx.closePath();
  ctx.fillStyle='#0b6df5';
  ctx.fill();
  ctx.strokeStyle='#5cdaee';
  ctx.lineWidth=.055;
  ctx.beginPath();
  for(let i=0;i<=62;i++){
    const x=-13+i*26/62;
    const y=.045 + .113*Math.sin(x*1.22+time*.66) + .055*Math.sin(x*2.12-time*.79);
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.stroke();
}

function skipper(ctx, time) {
  ctx.save();
  ctx.translate(1.17,-.82);
  ctx.scale(-1.26,1.26);
  curve(ctx,'M -.36 -.294 Q -.392 -.141 -.467 -.015 Q -.462 .127 -.195 .146 Q .11 .168 .232 .009 Q .212 -.059 .061 -.17 L .161 -.35 Z','#35436f',ink,.072);
  curve(ctx,'M .021 -.217 Q .265 -.194 .344 -.062 L .42 .02 Q .434 .102 .355 .114 L .038 .124 Q -.063 .094 -.015 .028 Z','#516099',ink,.048);
  curve(ctx,'M -.43 -.71 Q -.493 -.906 -.279 -.984 Q -.083 -1.036 .154 -.963 Q .325 -.9 .31 -.728 L .24 -.308 Q .068 -.205 -.187 -.237 Q -.447 -.263 -.466 -.376 Z','#4dbaba',ink,.076);
  curve(ctx,'M -.386 -.82 Q -.324 -.938 -.180 -.958 Q -.249 -.779 -.262 -.553 L -.225 -.328 Q -.363 -.337 -.372 -.442 Z','#78d4be',null);
  curve(ctx,'M -.445 -.456 Q -.214 -.381 .247 -.498 L .225 -.372 Q -.146 -.276 -.443 -.346 Z','#2d8da7',null);
  curve(ctx,'M -.316 -.952 Q -.241 -.811 -.005 -.830 Q .170 -.867 .184 -1.015 Q -.063 -1.089 -.316 -.952 Z','#ffce86',ink,.055);
  curve(ctx,'M -.223 -.861 Q -.487 -.801 -.48 -.589 L -.335 -.622 Q -.272 -.713 -.159 -.790 Z','#ffbb75',ink,.057);
  oval(ctx,-.008,-1.172,.30,.276,'#ecbd9b',ink,.066);
  curve(ctx,'M -.305 -1.14 Q -.331 -1.368 -.213 -1.438 Q -.095 -1.511 .128 -1.408 L .25 -1.205 Q .171 -1.162 .133 -1.307 Q .064 -1.214 -.037 -1.299 Q -.100 -1.191 -.199 -1.229 L -.213 -1.124 Z','#564c75',ink,.051);
  curve(ctx,'M -.293 -1.306 Q -.467 -1.487 -.214 -1.623 Q -.020 -1.703 .186 -1.575 Q .258 -1.484 .241 -1.345 Z','#ee8c77',ink,.065);
  curve(ctx,'M -.271 -1.375 Q -.209 -1.499 -.081 -1.547',null,'#ffc8a2',.050);
  curve(ctx,'M -.309 -1.373 Q -.125 -1.377 .253 -1.394 Q .391 -1.374 .32 -1.302 Q .112 -1.237 -.306 -1.288 Z','#ffb577',ink,.056);
  oval(ctx,.036,-1.185,.031,.039,'#4b4266');
  oval(ctx,.173,-1.184,.031,.04,'#4b4266');
  oval(ctx,.183,-1.10,.056,.029,'#eb9c91');
  curve(ctx,'M .077 -1.067 Q .139 -1.021 .193 -1.079',null,'#885c69',.032);
  ctx.save();
  ctx.translate(.176,-.748);
  ctx.rotate(Math.sin(time * 2.6) * .098);
  curve(ctx,'M -.079 -.038 Q .107 -.127 .227 .069 L .371 .023 Q .477 .001 .513 .11 Q .552 .245 .434 .281 L .176 .35 Q .052 .345 -.039 .198 Z','#6cd2c2',ink,.058);
  pill(ctx,.320,.069,.116,.216,.034,'#ffcf89',ink,.043);
  oval(ctx,.504,.145,.104,.086,'#f0bf9c',ink,.051);
  ctx.restore();
  ctx.restore();
}

function boat(ctx,time,rank,vaultFound) {
  ctx.save();
  ctx.translate(0,Math.sin(time*1.72)*.058);
  curve(ctx,'M -3.86 -.09 Q -3.53 .17 -2.81 .13 H 2.81 Q 3.45 .131 3.89 -.08',null,'#77b2d7',.056);
  curve(ctx,'M -3.69 -.84 Q -3.43 -.667 -2.88 -.681 H 3.56 Q 3.48 -.394 3.02 -.093 Q 2.81 .052 2.49 .068 H -2.03 Q -2.88 .047 -3.69 -.84 Z','#f39e62',ink,.102);
  curve(ctx,'M -3.40 -.529 Q -3.08 -.398 -2.73 -.385 H 3.29 Q 3.21 -.251 3.007 -.109 Q 2.786 .04 2.47 .059 H -2.02 Q -2.82 .04 -3.40 -.529 Z','#405bab',null);
  curve(ctx,'M -3.22 -.343 Q -2.85 -.28 -2.62 -.28 H 3.16 L 3.02 -.12 Q 2.89 -.046 2.55 -.05 H -1.99 Q -2.58 -.059 -3.22 -.343 Z','#354e9a',null);
  curve(ctx,'M -3.53 -.720 Q -3.29 -.621 -2.87 -.624 H 3.42',null,'#ffe4a9',.11);
  curve(ctx,'M -2.89 -.565 H 3.12',null,'#b37d70',.041);
  curve(ctx,'M 1.81 -.531 Q 2.28 -.456 2.71 -.503',null,'#7d9cd2',.047);
  oval(ctx,-2.83,-.491,.044,.038,'#ffe9ad');
  pill(ctx,-2.36,-1.99,1.70,1.27,.11,'#ffe7ac',ink,.077);
  pill(ctx,-2.51,-2.12,1.97,.209,.078,'#e38e92',ink,.075);
  curve(ctx,'M -2.41 -2.07 H -.657',null,'#ffd1aa',.058);
  for (const x of [-2.13,-1.37]) {
    pill(ctx,x,-1.77,.58,.59,.082,'#74b3d7',ink,.052);
    curve(ctx,'M '+(x+.089)+' -1.63 H '+(x+.393),null,'#d5eff7',.048);
    curve(ctx,'M '+(x+.316)+' -1.76 V -1.23',null,'#fff1bf',.060);
  }
  oval(ctx,-2.014,-.863,.253,.232,'#f7a68f',ink,.044);
  oval(ctx,-2.014,-.862,.145,.135,'#f7d394',ink,.039);
  curve(ctx,'M -2.014 -.925 V -.806',null,'#feebbe',.035);
  curve(ctx,'M -3.14 -.759 V -1.135 H -2.42',null,'#ad7b7b',.063);
  curve(ctx,'M -.51 -.731 V -1.843 L .02 -1.726',null,ink,.153);
  curve(ctx,'M -.51 -1.82 L .02 -1.704',null,'#e1a875',.081);
  oval(ctx,0,-1.69,.135,.124,'#ffc587',ink,.058);
  oval(ctx,0,-1.69,.05,.047,'#755f84');
  curve(ctx,'M -.03 -1.28 H .451 V -.986 H .112 Z','#7b9ac5',ink,.058);
  oval(ctx,.222,-1.18,.093,.09,'#d4e5f7',ink,.040);
  skipper(ctx,time);
  pill(ctx,1.72,-1.04,1.27,.30,.07,'#c99077',ink,.061);
  curve(ctx,'M 1.83 -.968 H 2.872',null,'#ffe0a6',.054);
  curve(ctx,'M 1.85 -.786 V -.689 M 2.81 -.78 V -.697',null,ink,.053);
  curve(ctx,'M -1.92 -2.11 V -2.88',null,'#6a628a',.052);
  if(rank>=3) {
    const trim=rank>=4?'#ffda73':'#b8e8e2';
    curve(ctx,'M -2.81 -.285 H 2.94 Q 2.76 -.16 2.56 -.15 H -2.03',null,trim,.074);
    if(rank>=4) star(ctx,2.33,-.26,.14,'#fff4bd');
  }
  const wave=Math.sin(time*4.61)*.079;
  const flag=vaultFound || rank>=4?'#ffd16e':rank>=2?'#b99ee9':rank===1?'#82d8ca':'#ffac96';
  curve(ctx,'M -1.887 -2.877 Q -1.618 '+(-2.970+wave)+' -1.295 -2.861 L -1.425 -2.687 L -1.316 -2.558 Q -1.636 '+(-2.636+wave)+' -1.894 -2.553 Z',flag,ink,.040);
  if(vaultFound || rank>=4) star(ctx,-1.62,-2.71,.13,'#fff7cb');
  oval(ctx,-1.893,-2.904,.042,.043,'#fff4c0',ink,.029);
  ctx.restore();
}

function buildBank(side) {
  const random = randomFrom(side === -1 ? 5167 : 8013);
  const body = new Path2D();
  const lip = new Path2D();
  body.moveTo(side*11.3,-.12);
  lip.moveTo(side*8.1,.1);
  body.lineTo(side*8.1,.1);
  const facets=[];
  for(let i=1;i<=Math.ceil((maxDepth+6)/1.72);i++){
    const d=i*1.72;
    const x=side*(7.95 + .47*Math.sin(i*.92) + (random()-.5)*.95);
    body.lineTo(x,d);
    lip.lineTo(x,d);
    facets.push({ x: x + side*(.12+random()*.29), d, wave: random() });
  }
  body.lineTo(side*11.3,maxDepth+8);
  body.closePath();
  return { body, lip, facets, side };
}

function banks(ctx,borders,near,far) {
  const tint=ctx.createLinearGradient(0,0,0,maxDepth);
  tint.addColorStop(0,'#3856b3');
  tint.addColorStop(16/maxDepth,'#6d426d');
  tint.addColorStop(37/maxDepth,'#514879');
  tint.addColorStop(66/maxDepth,'#735784');
  tint.addColorStop(97/maxDepth,'#546292');
  tint.addColorStop(150/maxDepth,'#35457a');
  tint.addColorStop(1,'#2f355b');
  for(const {body,lip,facets,side} of borders) {
    ctx.fillStyle=tint;
    ctx.fill(body);
    ctx.strokeStyle='#445a91';
    ctx.lineWidth=.19;
    ctx.stroke(lip);
    ctx.save();
    ctx.clip(body);
    for(const {x,d,wave} of facets) {
      if(d<near-2 || d>far+2) continue;
      ctx.save();
      ctx.translate(x,d);
      ctx.scale(side,1);
      ctx.globalAlpha=.58;
      curve(ctx,'M -.39 -.29 Q .60 -.15 .91 -.75 L 2.99 -.30 L 2.69 .60 Q 1.34 1.32 .22 .75 Z',wave>.42?paleRock:'#8883b6',null);
      curve(ctx,'M .25 .75 Q .95 .93 1.82 .57 L 2.60 1.07 L 1.07 1.58 L .22 1.30 Z','#626bab',null);
      curve(ctx,'M .12 .64 Q .82 .74 1.41 .36',null,'#a6a3d6',.055);
      ctx.restore();
    }
    ctx.restore();
  }
}

function seaweed(ctx, x,d, side, size, t, alt=false) {
  ctx.save();
  ctx.translate(x,d);
  ctx.scale(side*size,size);
  ctx.rotate(Math.sin(t*1.19+d)*.089);
  const green=alt?'#71bfc2':'#75c6ab';
  const deep=alt?'#5995b1':'#589cb3';
  curve(ctx,'M -.03 .024 C -.298 -.245 -.359 -.88 -.168 -1.13 C -.187 -.661 .001 -.474 .069 -.061 Z',deep,'#345c87',.034);
  curve(ctx,'M .013 .07 C -.05 -.24 .277 -.491 .220 -1.34 C .515 -.998 .391 -.415 .091 .078 Z',green,'#345c87',.038);
  curve(ctx,'M .087 .051 C .141 -.215 .622 -.31 .611 -.865 Q .90 -.251 .167 .096 Z',deep,'#345c87',.039);
  curve(ctx,'M .13 -.121 Q .311 -.533 .276 -.896',null,'#b2dec7',.027);
  ctx.restore();
}

function coral(ctx,x,d,size,shade) {
  ctx.save();
  ctx.translate(x,d);
  ctx.scale(size,size);
  const stems=[
    'M 0 .11 Q .03 -.511 -.31 -.833 M -.154 -.571 L -.45 -.572',
    'M 0 .058 Q -.08 -.319 .20 -.936 M .042 -.448 Q .339 -.502 .449 -.667',
    'M .047 .041 Q .184 -.136 .399 -.233',
  ];
  for(const stem of stems) {
    curve(ctx,stem,null,'#514e85',.189);
    curve(ctx,stem,null,shade,.124);
  }
  oval(ctx,0,.057,.25,.10,shade,'#564d84',.053);
  ctx.restore();
}

function wreckPanel(ctx,run,near,far) {
  if(far<17 || near>42) return;
  ctx.save();
  ctx.scale(run%2?-1:1,1);
  ctx.translate(7.48,22.8);
  ctx.rotate(.168);
  curve(ctx,'M -.92 -5.31 Q .188 -5.8 2.87 -5.29 L 3.67 5.77 Q 1.80 6.09 -.39 5.46 Q -.959 3.67 -1.15 1.23 L -1.239 -3.63 Z','#655e8b','#4c527f',.156);
  for(let i=0;i<15;i++) {
    const y=-5.15+i*.715;
    const a=-.93+.046*Math.abs(i-5);
    pill(ctx,a,y,3.85,.62,.082,i%3===0?'#94748b':'#846a8e','#695d86',.065);
    curve(ctx,'M '+(a+.12)+' '+(y+.084)+' H 3.03',null,'#ab849a',.045);
  }
  curve(ctx,'M -.78 -5.17 Q -1.22 -2.81 -.90 1.21 Q -.63 4.22 -.26 5.36',null,'#a18ba7',.132);
  for(const [x,y] of [[-.11,-2.99],[.142,.281],[.355,3.79]]) {
    oval(ctx,x,y,.387,.407,'#455a8c','#5c608b',.14);
    oval(ctx,x,y,.37,.38,null,'#d1aa9b',.092);
    oval(ctx,x-.186,y-.251,.067,.042,'#e6c0aa');
  }
  ctx.restore();
}

function seabed(ctx,near,far) {
  if(far<maxDepth-1) return;
  ctx.save();
  ctx.translate(0,maxDepth-42);
  curve(ctx,'M -13 43.11 Q -7.69 42.88 -4.89 43.24 Q -2.09 43.69 .08 43.51 Q 2.67 42.94 5.08 43.18 Q 7.44 43.56 11.98 42.69 V 58 H -13 Z','#2a477c',null);
  curve(ctx,'M -13 46.31 Q -8.38 46.03 -5.56 46.72 Q -.42 47.82 3.59 46.73 Q 7.52 45.57 13 46.08 V 58 H -13 Z','#304578',null);
  curve(ctx,'M -8.52 45.52 Q -6.32 45.37 -5.08 45.78 M .91 45.21 Q 2.82 44.99 4.31 45.16',null,'#5473a3',.047);
  curve(ctx,'M -7.87 42.22 L -6.14 42.13 L -5.72 43.29 L -7.97 43.51 L -8.27 43.07 Z','#858abb','#596a9c',.09);
  curve(ctx,'M 5.51 42.93 L 6.36 42.20 L 7.48 42.52 L 7.78 43.55 H 5.91 Z','#7484b7','#5b6fa7',.09);
  coral(ctx,-6.91,42.25,.98,'#d589ac');
  coral(ctx,6.49,42.32,1.12,'#db94ba');
  seaweed(ctx,-5.91,43.21,-1,1.05,0,true);
  seaweed(ctx,7.79,43.09,1,1.16,.9);
  ctx.translate(.94,0);
  curve(ctx,'M -2.85 47.85 L -2.46 44.75 L -1.63 43.62 H 1.63 L 2.46 44.75 L 2.85 47.85 Z','#44466f','#162f56',.10);
  curve(ctx,'M -2.46 44.75 H 2.46 L 1.63 43.62 H -1.63 Z','#86789b','#394b71',.07);
  curve(ctx,'M -2.35 45.07 H 2.35 M -2.19 46.31 H 2.19',null,'#c5a477',.095);
  for (const dx of [-1.57,0,1.57]) star(ctx,dx,45.69,.31,'#efd69d');
  ctx.translate(-.94,0);
  for(const [x,d,r] of [[-4.4,44.09,.17],[-4.15,44.27,.11],[1.25,44.55,.13],[5.7,44.82,.22],[5.44,44.94,.09]]) {
    oval(ctx,x,d,r,r*.34,'#5f7ba8','#3f5d93',.035);
  }
  ctx.restore();
}

function garden(ctx, near, far, time) {
  for (const [side, d, height, hue] of [
    [-1,55.1,1.35,'#cf9bbb'],[1,58.9,1.6,'#f198b5'],[-1,65.4,1.6,'#b4a6ea'],
    [1,68.2,1.21,'#f6b8ad'],[-1,71.4,1.5,'#f1a4c8'],[1,76.3,1.55,'#d4a5e4'],
    [-1,80.0,1.10,'#f1afad'], [1,82.2,1.1,'#c993d6'],
  ]) {
    if (d < near - 2 || d > far + 2) continue;
    const x = side * 7.40;
    coral(ctx,x,d,height,hue);
    coral(ctx,x-side*.55,d+.12,height*.69,'#78c9ce');
    seaweed(ctx,x+side*.35,d+.44,-side,height*.87,time,true);
    star(ctx,x-side*.43,d-.84,.10+(.04*Math.sin(time*2+d)),'#c7f4da');
  }
}

function ruins(ctx, near, far, run) {
  const mirror = run % 2 ? -1 : 1;
  for (const [side, depth] of [[-1,91.1],[1,103.9],[-1,113.1]]) {
    if (depth < near - 5 || depth > far + 5) continue;
    ctx.save();
    ctx.scale(side*mirror,1);
    ctx.translate(7.86,depth);
    ctx.rotate(side*.11);
    const arch='M -.98 1.93 V -.54 C -.98 -1.58 -.45 -2.22 .32 -2.22 C 1.20 -2.22 1.56 -1.64 1.61 -.57 V 1.93';
    curve(ctx,arch,null,'#334d80',.74);
    curve(ctx,arch,null,'#7b86ae',.57);
    curve(ctx,arch,null,'#949fc2',.25);
    for (const y of [-.58,.24,1.03]) curve(ctx,'M -1.252 '+y+' H -.73',null,'#65769f',.058);
    pill(ctx,-1.30,1.73,.79,.27,.075,'#788bb1','#506692');
    oval(ctx,.27,-1.21,.186,.178,'#9abbae','#526d98',.067);
    star(ctx,.268,-1.211,.119,'#e8d8ae');
    coral(ctx,-1.32,2.0,.69,'#9a97bf');
    ctx.restore();
  }
}

function crystals(ctx, near, far, time) {
  for (const [side, depth, size] of [[-1,118.7,1],[1,123.3,1.3],[-1,135.3,1.2],[1,139.6,1],[-1,146.3,1.32]]) {
    if (depth < near - 3 || depth > far + 3) continue;
    ctx.save();
    ctx.translate(side*7.48,depth);
    ctx.scale(side*size,size);
    curve(ctx,'M -.26 .18 L -.76 -.412 L -.55 -1.024 L -.11 -.467 L -.02 .186 Z','#7679c6','#485b9b',.092);
    curve(ctx,'M .01 .17 L -.17 -.94 L .078 -1.52 L .424 -.92 L .258 .175 Z','#8384cf','#495b9c',.079);
    curve(ctx,'M .078 -1.52 L .08 -.695 L .424 -.92 Z','#c2c5f0',null);
    curve(ctx,'M .26 .171 L .51 -.52 L .8 -.67 L .775 -.134 L .5 .19 Z','#63b7cf','#4a6e9f',.076);
    curve(ctx,'M .51 -.52 L .568 -.197 L .80 -.67 Z','#a3e7e7',null);
    star(ctx,-.32,-1.06,.135+Math.sin(time*3+depth)*.04,'#d8f5ef');
    ctx.restore();
  }
}

const deepLandmarks = [
  [160, 218, 12, '#3d7392', '#84cdbf'],
  [221, 302, 15, '#455c91', '#a5d9f1'],
  [304, 402, 11, '#615f9d', '#c5b7fc'],
  [406, 490, 13, '#63557f', '#e8c58b'],
];

function deepRuins(ctx, near, far, time) {
  deepLandmarks.forEach(([start, end, interval, stone, jewel], zone) => {
    for (let d=start; d<end; d+=interval) {
      if(d<near-3 || d>far+3) continue;
      const side=Math.round((d-start)/interval)%2===0?-1:1;
      ctx.save();
      ctx.translate(side*7.32,d);
      ctx.scale(side,1);
      if(zone===2) {
        curve(ctx,'M -.52 1.02 L -.93 -.61 L -.53 -1.23 L -.12 -.55 L -.12 1.11 M -.05 1.12 L .08 -1.02 L .51 -1.92 L 1.01 -1.03 L .80 1.12 Z',stone,'#3e4f81',.075);
        curve(ctx,'M .51 -1.92 L .41 -.82 L 1.01 -1.03 Z',jewel,null);
        star(ctx,.25,-1.53,.13+Math.sin(time*3+d)*.045,'#e1dafa');
      } else {
        curve(ctx,'M -1.20 1.21 V -.35 Q -1.18 -1.29 -.25 -1.46 Q .68 -1.47 .94 -.48 V 1.21 H .41 V -.37 Q .26 -.96 -.25 -.94 Q -.73 -.87 -.73 -.37 V 1.21 Z',stone,'#2e426c',.082);
        curve(ctx,'M -1.14 -.24 H -.79 M .50 -.23 H .87 M -1.14 .38 H -.79 M .50 .40 H .87',null,jewel,.059);
        if(zone>0) oval(ctx,-.13,-.78,.21,.20,stone,jewel,.062);
        if(zone===3) star(ctx,-.13,-.78,.14,'#fff0a3');
      }
      ctx.restore();
    }
  });
}

function beacon(ctx, level, time) {
  ctx.save();
  ctx.translate(-6.6,.064);
  ctx.rotate(-.032);
  const gleam = Math.sin(time * 2.5) * .20;
  ctx.globalAlpha = .36 + Math.min(.12, level * .024);
  curve(ctx,'M .09 -1.34 L 2.6 '+(-1.97+gleam)+' L 2.6 '+(-1.27+gleam)+' Z','#fff1b9',null);
  ctx.globalAlpha = 1;
  curve(ctx,'M -.34 .03 L -.232 -1.141 H .228 L .33 .022 Z','#fff0c2','#567a91',.06);
  curve(ctx,'M -.258 -.317 Q -.009 -.260 .28 -.420 L .247 -.657 Q -.045 -.533 -.273 -.616 Z','#ed9b83',null);
  pill(ctx,-.200,-1.465,.400,.331,.054,'#ffdc87','#645f86',.053);
  curve(ctx,'M -.278 -1.445 L .011 -1.689 L .281 -1.445 Z','#ed938b','#645f86',.068);
  oval(ctx,.019,-1.309,.087,.095,'#ffefaf');
  ctx.restore();
}

function gate(ctx, data, time) {
  ctx.save();
  ctx.translate(0,data.d);
  const rockwork = zoneAt(data.d).start >= 81;
  const beamColor = data.sway ? '#676994' : rockwork ? '#7589aa' : '#a77e80';
  const rimColor = data.sway ? '#c3a8ce' : rockwork ? '#a5b7d0' : '#dcaa8d';
  for(const [a,b] of data.beams) {
    const width=b-a;
    pill(ctx,a,-.299,width,.58,.075,beamColor,'#594f7f',.093);
    pill(ctx,a+.025,-.30,width-.05,.214,.07,rimColor,'#736586',.044);
    ctx.fillStyle='#906d7d';
    ctx.fillRect(a+.029,.131,width-.06,.107);
    for(let x=a+.48;x<b-.21;x+=.65) {
      oval(ctx,x,.054,.043,.041,'#efc998','#8c6f80',.021);
    }
  }
  for(const [a,b] of data.gaps) {
    const wide=b-a>3;
    const glow=wide?'#a3eed8':'#ffdcab';
    const core=wide?'#def9d7':'#fff0bf';
    for(const x of [a+.13,b-.13]) {
      oval(ctx,x,-.04,.17,.29,wide?'#548fa7':'#a8828e','#566785',.049);
      oval(ctx,x,-.048,.089,.215,glow,'#7c999e',.026);
      oval(ctx,x,-.088,.043,.135,core);
    }
    const center=(a+b)/2;
    ctx.globalAlpha=.69 + Math.sin(time*3.14+data.d)*.22;
    curve(ctx,'M '+(center-.162)+' -.481 L '+center+' -.652 L '+(center+.162)+' -.481',null,glow,.062);
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

function sprite(ctx, art, x,d, size, turn=0, left=false) {
  ctx.save();
  ctx.translate(x,d);
  ctx.rotate(turn);
  if(left) ctx.scale(-1,1);
  ctx.drawImage(art,-size,-size,size*2,size*2);
  ctx.restore();
}

function vaultScene(ctx, age, time) {
  const { x, d } = vaultSite;
  const opening = age === null ? 0 : 1 - (1 - Math.min(1, age / .6)) ** 3;
  const glowSize = 2.55 + opening * 2.2;
  const aura = ctx.createRadialGradient(x,d-.35,.1,x,d-.35,glowSize);
  aura.addColorStop(0,'#ffe39cad');
  aura.addColorStop(.46,'#ffbb625b');
  aura.addColorStop(1,'#ffd97700');
  ctx.save();
  if (age !== null) ctx.globalAlpha = Math.min(1, (vaultRevealSeconds - age) / .36);
  oval(ctx,x,d-.35,glowSize,glowSize,aura);
  if (age === null || age < .10) {
    oval(ctx,x,d,1.53,1.37,null,'#ffe3a3',.039);
    star(ctx,x-1.28,d-.65,.17+Math.sin(time*2.8)*.045,'#fff0b7');
    star(ctx,x+1.27,d-.55,.18,'#fff0b7');
    sprite(ctx,treasuresArt[vaultKind],x,d,1.68);
  } else {
    ctx.translate(x,d);
    ctx.save();
    ctx.globalAlpha *= opening * .52;
    curve(ctx,'M -.44 -.12 L -2.26 -3.58 L -1.46 -3.13 L .12 -.18 L .36 -4.49 L 1.04 -4.02 L .50 -.10 L 2.80 -3.06 L 2.97 -2.08 L .67 .09 Z','#ffe3a2',null);
    ctx.restore();
    for (let i=0; i<14; i++) {
      const life = Math.max(0, age - .15 - (i % 5) * .067);
      const angle = i * 2.40;
      const travel = Math.min(1, life / 1.40);
      const sx = Math.cos(angle) * travel * (2.2 + (i % 3) * .43);
      const sy = -travel * (1.3 + (i % 5) * .76);
      if (life <= 0) continue;
      const size = (.115 + (i % 4) * .024) * (1 - travel * .39);
      if (i % 3 === 0) oval(ctx,sx,sy,.092+Math.abs(Math.cos(angle+age*9))*.085,.13,'#ffdb69','#fff3bf',.034);
      else star(ctx,sx,sy,size,'#fff2bf');
    }
    ctx.scale(1.53,1.53);
    openVault(ctx,opening);
  }
  ctx.restore();
}

function shieldBurst(ctx, hit, time) {
  const t=(time-hit.time)/.72;
  const spread=.98+t*1.55;
  ctx.save();
  ctx.translate(hit.x,hit.d);
  ctx.globalAlpha=(1-t)*.37;
  oval(ctx,0,0,spread,spread*.76,'#8ffcde');
  ctx.globalAlpha=(1-t)*.92;
  oval(ctx,0,0,spread,spread*.76,null,'#9ffff2',.093);
  oval(ctx,0,0,spread*.78,spread*.58,null,'#effffd',.055);
  for(let i=0;i<10;i++) {
    const angle=i*Math.PI/5;
    star(ctx,Math.cos(angle)*(spread+.14),Math.sin(angle)*(spread*.78+.13),.09+(i%2)*.095,'#e8ffec');
  }
  curve(ctx,'M 0 -.60 Q .23 -.42 .55 -.43 V -.02 Q .50 .34 0 .57 Q -.50 .34 -.55 -.02 V -.43 Q -.24 -.42 0 -.60 Z',null,'#e6fff3',.071);
  curve(ctx,'M -.22 -.02 L -.055 .16 L .25 -.20',null,'#fffbe9',.096);
  ctx.restore();
}

function makeParticles() {
  const pool=Array.from({length:46},()=>({life:0}));
  let cursor=0;
  return {
    emit(x,d,splash,rare) {
      const n=splash?15:rare?13:9;
      for(let i=0;i<n;i++) {
        const p=pool[cursor++%pool.length];
        const a=i/n*Math.PI*2;
        p.x=x;
        p.d=d;
        p.vx=Math.cos(a)*(.78+Math.random()*1.07);
        p.vy=splash?-(1.12+Math.random()*2.48):Math.sin(a)*(1.17+Math.random()*.99);
        p.life=.43+Math.random()*.37;
        p.size=.036+Math.random()*.065;
        p.hue=splash?'#bceaf6':rare?'#ffc28d':'#ffe6a2';
        p.spark=!splash && i%2===0;
      }
    },
    step(ctx,dt) {
      for(const p of pool) {
        if(p.life<=0) continue;
        p.life-=dt;
        p.x+=p.vx*dt;
        p.d+=p.vy*dt;
        p.vy+=2.35*dt;
        ctx.globalAlpha=Math.min(1,p.life*3.2);
        if(p.spark) star(ctx,p.x,p.d,p.size*1.6,p.hue);
        else oval(ctx,p.x,p.d,p.size,p.size,p.hue);
      }
      ctx.globalAlpha=1;
    },
  };
}

export function createIllustration(canvas) {
  const context=canvas.getContext('2d',{alpha:false});
  if(!context) throw new Error('Canvas unavailable');
  const borders=[buildBank(1),buildBank(-1)];
  const shore=createShore();
  const rand=randomFrom(77531);
  const waterHeight=maxDepth+4;
  const bubbles=Array.from({length:760},()=>({ x:(rand()-.5)*17.6,d:rand()*waterHeight, r:.022+rand()*.064, speed:.21+rand()*.46 }));
  const birds=[
    { x:-5.45,y:-3.31,w:1.36, p:.47 },
    { x:5.36,y:-4.29,w:1.55, p:1.21 },
    { x:8.46,y:-2.38,w:.89, p:2.09 },
  ];
  const schools=[6.2,12.8,22.6,31.0,38.1,49.4,56.5,65.8,74.1,82.4,92.7,103.7,115.5,126,135,144,162,187,208,229,256,278,312,347,375,414,449,471]
    .map((d,index)=>({d,i:index%fishArt.length,n:5}))
    .flatMap(({d,i,n})=>Array.from({length:n},(_,j)=>({
      d:d+(rand()-.5)*1.58, i, x:j*.92+i*3.17, dir:i%2?-1:1, wobble:rand()*6.28, size:.60+rand()*.38,
    })));
  const plants=[
    [-7.86,6.34,1,.82], [7.94,9.14,-1,1.16],[-7.92,12.9,1,.91],[8.07,16.91,-1,1.25],
    [-7.69,21.6,1,1.25],[7.81,24.9,-1,1.15],[-7.84,30.11,1,1.26],[7.9,36.33,-1,1.32],[-8.14,39.53,1,1.36],
  ];
  const particles=makeParticles();
  const size={width:1,height:1,ratio:1,scale:1,halfHeight:1,halfWidth:9.07};

  function resize(width,height) {
    size.width=Math.max(1,width);
    size.height=Math.max(1,height);
    size.ratio=Math.min(window.devicePixelRatio||1,2);
    const ratio=size.width/size.height;
    size.halfHeight=Math.max(7.4,9.07/ratio);
    size.halfWidth=size.halfHeight*ratio;
    size.scale=size.height/(2*size.halfHeight);
    canvas.width=Math.round(size.width*size.ratio);
    canvas.height=Math.round(size.height*size.ratio);
  }

  function render({time,dt,cameraDepth,shake,x,d,tilt,phase,items,gates,run,ping,levels,radius,guard,shieldHit,rank,vaultFound,vaultAge}) {
    const ctx=context;
    const {width,height,ratio,scale,halfHeight}=size;
    const drift=Math.sin(time*47)*Math.max(0,shake)*8;
    const horizon=height*.5-cameraDepth*scale;
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.fillStyle=waterColor(cameraDepth);
    ctx.fillRect(0,0,width,height);
    if(horizon>0) {
      const skyWash=ctx.createLinearGradient(0,0,0,horizon);
      for(const [position,color] of skyStops) skyWash.addColorStop(position,color);
      ctx.fillStyle=skyWash;
      ctx.fillRect(0,0,width,horizon+.15);
    }
    ctx.translate(width*.5+drift,horizon);
    ctx.scale(scale,scale);
    ctx.lineCap='round';
    ctx.lineJoin='round';
    const near=cameraDepth-halfHeight;
    const far=cameraDepth+halfHeight;

    if(near<0) {
      for(const c of birds) cloud(ctx,c.x+Math.sin(time*.15+c.p)*.37,c.y,c.w);
      ctx.drawImage(shore,-630/47,-189/47,1260/47,210/47);
      if(levels.beacon>0) beacon(ctx,levels.beacon,time);
    }
    banks(ctx,borders,near,far);
    if(near<.59 && far>-2) waveBand(ctx,time);
    wreckPanel(ctx,run,near,far);
    garden(ctx,near,far,time);
    ruins(ctx,near,far,run);
    crystals(ctx,near,far,time);
    deepRuins(ctx,near,far,time);
    seabed(ctx,near,far);
    for(const [index,[px,pd,side,s]] of plants.entries()) {
      if(pd<near-2 || pd>far+2) continue;
      seaweed(ctx,px,pd,side,s,time,index%2===0);
      if(index%3===0) coral(ctx,px+side*.20,pd+.44,.68,'#dc8dac');
    }
    for(const f of schools) {
      if(f.d<near-1 || f.d>far+1) continue;
      const fx=(((f.x+time*(.88+.09*f.i)+12)%24)-12)*f.dir;
      const fd=f.d+Math.sin(time*1.70+f.wobble)*.24;
      ctx.globalAlpha=.83;
      sprite(ctx,fishArt[f.i],fx,fd,f.size,Math.sin(time*2+f.wobble)*.05,f.dir<0);
    }
    ctx.globalAlpha=1;
    for(const mote of bubbles) {
      const depth=((mote.d-time*mote.speed)%waterHeight+waterHeight)%waterHeight;
      if(depth<near || depth>far || depth<.2) continue;
      const mx=mote.x+Math.sin(time*.83+mote.d)*.15;
      oval(ctx,mx,depth,mote.r,mote.r,null,'#8cc6e685',.028);
    }
    for(const crossing of gates) if(crossing.d>near-1 && crossing.d<far+1) gate(ctx,gateAt(crossing,time),time);
    for(const item of items) {
      if(item.state==='lost' && item.escape.time>1.44) continue;
      if(item.y<near-2 || item.y>far+2) continue;
      if(item.kind>=4 && item.state==='rest') {
        const flash=(Math.sin(time*2.28+item.spin)+1)*.5;
        ctx.globalAlpha=.25+flash*.63;
        star(ctx,item.px+.49,item.y-.35,.11+flash*.09,'#ffebbe');
        ctx.globalAlpha=1;
      }
      sprite(ctx,treasuresArt[item.kind],item.px,item.y,item.state==='held'?1.11:1.04,item.angle);
    }
    if(phase==='up' && ping>0) {
      const u=1-Math.min(1,ping/.33);
      ctx.globalAlpha=(1-u)*.68;
      oval(ctx,x,d+.28,radius*(.44+u*.62),.34+u*.48,null,'#b4e8f6',.039);
      ctx.globalAlpha=1;
    }
    const wobble=Math.sin(time*2.7)*Math.min(.20,d*.012);
    const tieX=x+Math.sin(tilt)*.45;
    const tieD=d-.45;
    ctx.beginPath();
    ctx.moveTo(0,-1.69);
    ctx.quadraticCurveTo(tieX*.48+wobble,(tieD-1.69)*.50,tieX,tieD);
    ctx.strokeStyle='#ffdda1';
    ctx.lineWidth=.047;
    ctx.stroke();
    sprite(ctx,magnetArt,x,d,1.27+Math.min(.19, levels.capacity*.043),tilt);
    if (far >= vaultSite.d - 3 && (!vaultFound || vaultAge !== null)) vaultScene(ctx,vaultAge,time);
    if ((phase==='down' || phase==='up') && guard>0) {
      ctx.globalAlpha=.42;
      oval(ctx,x,d,.78,.64,null,'#98f0de',.050);
      ctx.globalAlpha=1;
    }
    if(shieldHit) shieldBurst(ctx,shieldHit,time);
    if(near<.59 && far>-2) boat(ctx,time,rank,vaultFound);
    particles.step(ctx,dt);
  }

  return { size, resize, render, emit:particles.emit };
}
