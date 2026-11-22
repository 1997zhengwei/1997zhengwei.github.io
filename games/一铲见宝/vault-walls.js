// Walls 9-16. Same blueprint rules as the first eight: a 48 x 52 drawing,
// every painted pixel becomes a brick, transparent pixels are holes.
function star(a,x,y,r,tips,inner,color){
  a.poly(color,Array.from({length:tips*2},(_,i)=>{
    const t=-Math.PI/2+i*Math.PI/tips,radius=i%2?inner:r;
    return [x+Math.cos(t)*radius,y+Math.sin(t)*radius];
  }));
}
function hole(ctx,draw){ctx.save();ctx.globalCompositeOperation='destination-out';draw();ctx.restore();}

// 9 · Bronze cauldron on three legs, a beast mask cast into the belly.
export function bronzeDing(a,ctx){
  const {poly,rect,oval,line}=a;
  for(const [x,w] of [[11.5,5],[36.5,5],[24,5.4]]){
    poly('#2c5446',[[x-w/2,39],[x+w/2,39],[x+w/2-.7,52],[x-w/2+.7,52]]);
    rect('#5c9b80',x-w/2+1,41,1.1,10);
    poly('#d9a945',[[x-w/2-.4,39],[x+w/2+.4,39],[x+w/2,42],[x-w/2,42]]);
    rect('#24473b',x-w/2+.6,49,w-1.2,1);
  }
  for(const x of [11,37]){
    poly('#2c5446',[[x-3.8,15],[x-3.8,5],[x-2.3,3.4],[x+2.3,3.4],[x+3.8,5],[x+3.8,15]]);
    line('#d9a945',1,[[x-3.2,14],[x-3.2,5.4],[x-2,4.2],[x+2,4.2],[x+3.2,5.4],[x+3.2,14]]);
  }
  hole(ctx,()=>{rect('#000',9.2,6.4,3.6,6.4);rect('#000',35.2,6.4,3.6,6.4);});
  oval('#2c5446',24,27.5,20.6,14);
  ctx.save();ctx.beginPath();ctx.ellipse(24,27.5,19.2,12.7,0,0,Math.PI*2);ctx.clip();
  rect('#3f7a63',3,14,42,30);rect('#69b394',3,17,42,4);
  for(let x=4;x<44;x+=4)poly('#d9a945',[[x,19],[x+2,17.4],[x+4,19],[x+2,20.6]]);
  rect('#24473b',3,21,42,1.1);rect('#24473b',3,35.6,42,1.1);
  for(let x=5;x<44;x+=5)line('#8fd0b0',1,[[x,37.8],[x+2.5,39.3],[x+5,37.8]]);
  poly('#24473b',[[14,23.4],[34,23.4],[36,28],[33.6,34.4],[14.4,34.4],[12,28]]);
  line('#d9a945',1.2,[[13.6,25],[17.4,23.8],[21,25.4]]);line('#d9a945',1.2,[[34.4,25],[30.6,23.8],[27,25.4]]);
  oval('#d9a945',18.2,28,3,2.3);oval('#132f28',18.2,28,1.3,1.3);
  oval('#d9a945',29.8,28,3,2.3);oval('#132f28',29.8,28,1.3,1.3);
  line('#8fd0b0',1,[[15,32.6],[19,31.4],[24,33],[29,31.4],[33,32.6]]);
  line('#c4f2d9',1,[[8,16],[6,22],[6.6,28]]);
  ctx.restore();
  rect('#2c5446',3,13,42,4.4);rect('#d9a945',3,13,42,1.3);rect('#24473b',3,16.3,42,1.1);
  for(let x=5;x<44;x+=6)rect('#e9c56a',x,14.4,2.6,1.1);
}

// 10 · Ice castle. The gem waits behind a steel portcullis.
export function frostCastle(a,ctx){
  const {poly,rect,oval,line}=a;
  rect('#6fa6d0',4,30,40,22);
  for(let y=33;y<50;y+=3.4)line('#5288b8',.7,[[4,y],[44,y]]);
  for(const x of [3,37]){
    rect('#7fb7dd',x,14,8,38);rect('#c4ebfa',x+1.3,16,2,34);rect('#5d93c2',x+6.2,15,1.2,36);
    poly('#4664b2',[[x-1.4,14.5],[x+4,2.5],[x+9.4,14.5]]);
    poly('#f4fbff',[[x+2.1,8],[x+4,2.5],[x+5.9,8],[x+5,9],[x+4,8],[x+3,9.2]]);
    for(let k=0;k<4;k++)poly('#e8f8ff',[[x-1+k*2.6,14.4],[x+.6+k*2.6,14.4],[x-.2+k*2.6,17]]);
    rect('#2f4f80',x+2.8,20,2.4,4);oval('#2f4f80',x+4,20,1.2,1.2);
    rect('#2f4f80',x+2.8,29,2.4,4);oval('#2f4f80',x+4,29,1.2,1.2);
  }
  for(let x=11;x<15;x+=2.2)rect('#6fa6d0',x,27.6,1.3,2.6);
  for(let x=33.4;x<37;x+=2.2)rect('#6fa6d0',x,27.6,1.3,2.6);
  rect('#8cc3e6',15,18,18,34);
  for(const x of [16.4,29.4])rect('#d3f0fb',x,20,2.2,30);
  poly('#4664b2',[[13.2,18.6],[24,5.6],[34.8,18.6]]);
  poly('#f4fbff',[[20.8,9.6],[24,5.6],[27.2,9.6],[25.8,10.8],[24,9.6],[22.2,10.8]]);
  for(let k=0;k<7;k++)poly('#e8f8ff',[[14+k*2.8,18.4],[15.8+k*2.8,18.4],[14.9+k*2.8,21.4]]);
  star(a,24,24.6,3,6,1.3,'#ffffff');
  poly('#24416f',[[19,50],[19,39],[20.6,36.4],[24,35],[27.4,36.4],[29,39],[29,50]]);
  line('#cfefff',1,[[19,39],[20.6,36.4],[24,35],[27.4,36.4],[29,39]]);
  for(const x of [20.6,22.8,25.2,27.4])rect('#9fb0bd',x-.55,36,1.1,14);
  rect('#9fb0bd',19,38.6,10,1);
  rect('#eef9ff',2,49.2,44,2.8);line('#ffffff',1,[[2,49.6],[46,49.6]]);
}

// 11 · Volcano temple. A steel ring locks the sun disc that holds the gem.
export function lavaTemple(a,ctx){
  const {poly,rect,oval,line}=a;
  poly('#5a3b3b',[[0,52],[7,32],[13,18],[18,11],[30,11],[35,18],[41,32],[48,52]]);
  poly('#76504a',[[3,52],[9,34],[14,22],[19,14],[22,14],[17,24],[13,38],[11,52]]);
  poly('#46302f',[[37,52],[35,38],[31,24],[27,14],[30,14],[34,21],[39,34],[45,52]]);
  poly('#ff7a2a',[[18,11],[30,11],[28.6,13],[19.4,13]]);
  poly('#ffd25a',[[20,11],[28,11],[27,12.2],[21,12.2]]);
  line('#ff6a24',1.6,[[20,13],[17,19],[16,25],[12.5,31]]);line('#ffb340',.8,[[20,13],[17,19],[16,25]]);
  line('#ff6a24',1.6,[[28.5,13],[31,18],[34,24],[35.5,30]]);line('#ffb340',.8,[[28.5,13],[31,18],[34,24]]);
  rect('#3a2626',9,36,30,16);
  poly('#2b1d1e',[[7,37],[24,30.6],[41,37]]);poly('#e2a24a',[[9.4,36.2],[24,31.6],[38.6,36.2]]);
  for(const x of [11,17,29,35]){rect('#c9b6a4',x,38,2.6,12);rect('#f0e2cf',x+.5,38,.9,12);rect('#8d6c58',x-.4,49,3.4,1.4);}
  rect('#1d1414',21,40,6,10);oval('#1d1414',24,40,3,2.2);oval('#ff8a3a',24,46.6,1.6,.9);
  oval('#ffb340',24,22.4,4.4,4.4);oval('#ff7a2a',24,22.4,3.4,3.4);oval('#ffe08a',23.4,21.6,1.4,1.2);
  ctx.save();ctx.translate(24,22.4);
  for(let i=0;i<12;i++){ctx.rotate(Math.PI/6);rect('#3a2a2a',4.6,-.7,1.4,1.4);}
  ctx.restore();
  oval('#ffd25a',9,46,1.6,.8);oval('#ffd25a',39,47,1.4,.7);
}

// 12 · Clock tower. Steel hands are pinned through the gem at the dial centre.
export function clockTower(a,ctx){
  const {poly,rect,oval,line}=a;
  rect('#8a5a46',13,10,22,42);rect('#b97d58',15,12,4,40);rect('#6c4234',31,11,2.4,41);
  poly('#3e4a78',[[11,11],[24,0.4],[37,11]]);poly('#5c6aa8',[[15,11],[24,2.6],[24,11]]);
  rect('#d9a945',22.8,0,2.4,2);
  rect('#6c4234',8,40,32,12);rect('#a56b4d',9,41,30,1.2);
  for(let y=44;y<52;y+=2.6)line('#5a3428',.7,[[8,y],[40,y]]);
  for(const [x,r] of [[10.5,5],[37.5,5]]){
    oval('#c99a3e',x,36,r,r);oval('#8f6a2a',x,36,r*.55,r*.55);
    ctx.save();ctx.translate(x,36);for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);rect('#c99a3e',r-.4,-.9,1.6,1.8);}ctx.restore();
    oval('#e8c674',x,36,1.1,1.1);
  }
  oval('#3e2a22',24,20,9.2,9.2);oval('#f6ecd2',24,20,8,8);oval('#e7d9b8',24,20,6.6,6.6);
  for(let i=0;i<12;i++){
    const t=i*Math.PI/6,x=24+Math.cos(t)*6.9,y=20+Math.sin(t)*6.9;
    rect(i%3?'#6b5a4a':'#3e2a22',x-.5,y-.5,1,1);
  }
  rect('#3e2a22',23.4,13.2,1.2,7.2);
  line('#3e2a22',1.3,[[24,20],[29.6,23.6]]);
  rect('#2a3a5e',19.6,32,8.8,6);oval('#ffe08a',21.8,35,1,1.6);oval('#ffe08a',26.2,35,1,1.6);
  rect('#2a1d1a',21,44,6,8);oval('#2a1d1a',24,44,3,2.2);
}

// 13 · Sea-dragon palace. Two pearls: one in the upper pavilion, one in the hall.
export function dragonPalace(a,ctx){
  const {poly,rect,oval,line}=a;
  rect('#3f7f86',2,46,44,6);rect('#79c6bf',2,46,44,1.4);
  for(let x=3;x<46;x+=4)rect('#2f6268',x,48.6,2,2.4);
  rect('#c84a46',8,28,32,18);
  for(const x of [9,15,31,37])rect('#f2c55c',x,29,2,17);
  rect('#8f2d34',20,33,8,13);oval('#8f2d34',24,33,4,3);
  rect('#9fb0bd',17.5,30,1.6,16);rect('#9fb0bd',28.9,30,1.6,16);
  poly('#1f6f8a',[[1,28.6],[6,24],[42,24],[47,28.6],[44,27.4],[4,27.4]]);
  poly('#2b8fa8',[[4,24.4],[9,18],[39,18],[44,24.4]]);
  line('#9be3e8',1.2,[[6,24],[11,19],[37,19],[42,24]]);
  rect('#c84a46',15,11,18,8);rect('#f2c55c',16,12,1.6,7);rect('#f2c55c',30.4,12,1.6,7);
  poly('#1f6f8a',[[11,12],[15,7],[33,7],[37,12],[34,11],[14,11]]);
  poly('#2b8fa8',[[15,7.4],[19,3],[29,3],[33,7.4]]);
  rect('#f2c55c',23,0.6,2,2.8);oval('#ffe08a',24,1,1.4,1);
  oval('#fff6e6',24,14.6,3.2,3.2);oval('#ffe3b8',24,36.6,3,3);
  for(const [x,flip] of [[4,1],[44,-1]]){
    line('#ff8a7a',1.6,[[x,46],[x+flip,40],[x-flip*1.4,35],[x+flip*.6,31]]);
    line('#ff8a7a',1.2,[[x+flip,40],[x+flip*3,37]]);
  }
}

// 14 · Panda in a bamboo grove. One gem in the belly, one in the leaves.
export function pandaGrove(a,ctx){
  const {poly,rect,oval,line}=a;
  for(const x of [5,42]){
    rect('#4f9a4a',x,6,3,46);rect('#8fd36a',x+.5,6,1,46);
    for(let y=12;y<50;y+=7)rect('#2f6c34',x-.3,y,3.6,1);
  }
  for(const [x,y,t] of [[8,8,-.5],[10,12,-.2],[4,10,.6],[9,4,-.9],[44,8,.5],[40,12,.2],[46,4,.9],[39,5,-.3]]){
    ctx.save();ctx.translate(x,y);ctx.rotate(t);oval('#5fb04f',0,0,4.6,1.6);oval('#9ad97a',0,-.3,3.2,.7);ctx.restore();
  }
  oval('#5fb04f',8,9,3.6,3.2);oval('#5fb04f',41,9,3.6,3.2);
  rect('#4f9a4a',8,9,6,2);rect('#4f9a4a',34,9,8,2);
  oval('#f6f3ea',24,38,12.5,11.5);oval('#e6e0d0',24,41,8,7);
  oval('#2b2b33',13,44,5,5);oval('#2b2b33',35,44,5,5);oval('#efe8da',13,44.6,2.6,2.6);oval('#efe8da',35,44.6,2.6,2.6);
  poly('#2b2b33',[[13,30],[18,28],[20,34],[16,38],[12,36]]);poly('#2b2b33',[[35,30],[30,28],[28,34],[32,38],[36,36]]);
  line('#4f9a4a',2.2,[[14,40],[22,26]]);line('#8fd36a',.8,[[14.6,39.4],[22,26.4]]);
  oval('#f6f3ea',24,21,9,8);
  oval('#2b2b33',17,14.4,3,3);oval('#2b2b33',31,14.4,3,3);
  ctx.save();ctx.translate(20.4,20.6);ctx.rotate(-.5);oval('#2b2b33',0,0,2.4,1.6);ctx.restore();
  ctx.save();ctx.translate(27.6,20.6);ctx.rotate(.5);oval('#2b2b33',0,0,2.4,1.6);ctx.restore();
  oval('#ffffff',20.8,20.4,.7,.7);oval('#ffffff',27.2,20.4,.7,.7);
  oval('#2b2b33',24,24.4,1.4,1);line('#2b2b33',.6,[[22.8,26.2],[24,26.8],[25.2,26.2]]);
  oval('#ffb3b3',18.6,24.6,1.2,.7);oval('#ffb3b3',29.4,24.6,1.2,.7);
  rect('#7f8a8f',9,48,30,4);rect('#a9b4b8',9,48,30,1.1);
}

// 15 · Pyramid with two sealed chambers.
export function pyramid(a,ctx){
  const {poly,rect,oval,line}=a;
  poly('#c98f4e',[[1,50],[24,5],[47,50]]);
  ctx.save();ctx.beginPath();ctx.moveTo(1,50);ctx.lineTo(24,5);ctx.lineTo(47,50);ctx.closePath();ctx.clip();
  poly('#e2ad68',[[24,5],[24,50],[1,50]]);
  for(let y=10;y<50;y+=3.6)line('#a8733c',.7,[[0,y],[48,y]]);
  for(let y=11.8;y<50;y+=7.2)for(let x=(y%2)*3;x<48;x+=6)line('#b9824a',.5,[[x,y],[x,y+3.6]]);
  ctx.restore();
  poly('#ffd76a',[[24,5],[21.4,10],[26.6,10]]);poly('#fff0b8',[[24,5],[22.6,8],[24,8]]);
  rect('#5a3a22',18.6,18,10.8,9);rect('#7a5232',19.6,19,8.8,7);
  rect('#5a3a22',9.6,37.6,11,9.4);rect('#7a5232',10.6,38.6,9,7.4);
  line('#5a3a22',1.4,[[24,27],[24,31],[21,36],[20,38]]);
  for(const [x,y] of [[20.6,20.4],[27.4,20.4],[11.6,40],[19,40]])rect('#d9a945',x-.5,y,1,1.4);
  rect('#3a2616',21.6,44,4.8,6);poly('#3a2616',[[21,44],[24,41.4],[27,44]]);
  rect('#b07a44',0,50,48,2);rect('#e9c38a',0,50,48,.8);
  oval('#ffe08a',36,30,1.6,1.6);oval('#ffe08a',31,40,1.2,1.2);
}

// 16 · The star vault. A round steel door with a crown above it.
export function starVault(a,ctx){
  const {poly,rect,oval,line}=a;
  rect('#4a3f73',3,14,42,38);rect('#5d5190',5,16,38,34);
  for(const x of [3,40.6])rect('#d9b24a',x,14,4.4,38);
  for(const x of [3.8,41.4])for(let y=17;y<50;y+=5)rect('#fff0b0',x+.8,y,1.2,2.2);
  poly('#3a305e',[[1,15],[24,8.4],[47,15]]);line('#ffd76a',1.2,[[2,14.6],[24,8.8],[46,14.6]]);
  poly('#d9b24a',[[17,10.6],[17,4],[19.6,6.4],[22,2.4],[24,5.4],[26,2.4],[28.4,6.4],[31,4],[31,10.6]]);
  poly('#ffe08a',[[18,9.8],[18,5.6],[20,7.4],[22,4],[24,6.6],[26,4],[28,7.4],[30,5.6],[30,9.8]]);
  oval('#e84a5f',20,8.6,.9,.9);oval('#e84a5f',28,8.6,.9,.9);
  oval('#2f2752',24,31,13.6,13.6);oval('#d9b24a',24,31,12.4,12.4);oval('#3b3474',24,31,10.4,10.4);oval('#4a4290',24,31,8.6,8.6);
  for(let i=0;i<16;i++){const t=i*Math.PI/8;oval('#fff2b0',24+Math.cos(t)*11.4,31+Math.sin(t)*11.4,.7,.7);}
  oval('#ffd76a',24,31,3.6,3.6);oval('#fff2b0',23.2,30.2,1.2,1.2);
  rect('#9fb0bd',12.2,30.2,8,1.6);rect('#9fb0bd',27.8,30.2,8,1.6);
  rect('#9fb0bd',23.2,19.2,1.6,8);rect('#9fb0bd',23.2,34.8,1.6,8);
  for(const [x,y] of [[8,46],[40,46],[24,48.6]])star(a,x,y,1.8,5,.8,'#ffe08a');
  rect('#2f2752',3,50,42,2);rect('#d9b24a',3,50,42,.8);
  for(const [x,y] of [[10,20],[38,20],[9,40],[39,40]])star(a,x,y,1.3,4,.5,'#fff6d2');
}
