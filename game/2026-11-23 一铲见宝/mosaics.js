import {blueShip,goldenGlass,coralShell,harvestMill,moonDial} from './expedition-walls.js';
import {bronzeDing,frostCastle,lavaTemple,clockTower,dragonPalace,pandaGrove,pyramid,starVault} from './vault-walls.js';
// Each sampled square of the drawing becomes a physical brick. Transparent pixels
// are openings all the way through the wall, including the space under the bridges.
const cols=48, rows=58, drawingHeight=52, sample=6;
export const cell=.205, bottom=.18, wallX=.63;
export function world(x,y){
  return {x:wallX+(x-cols/2)*cell,y:bottom+(drawingHeight-y)*rows/drawingHeight*cell};
}

function artist(ctx){
  function polygon(color,points){
    ctx.fillStyle=color;ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
  }
  function oval(color,x,y,rx,ry){
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
  }
  function line(color,width,points){
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  }
  function rect(color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  return {poly:polygon,oval,line,rect};
}

function sunGate(a,ctx){
  const {poly,oval,line,rect}=a;
  // A winged sun above an open temple arch. The carved edge is part of the silhouette.
  const outline=[[1,52],[1,43],[3,43],[3,24],[1,22],[0,14],[2,7],[10,12],[15,13],[19,11],[21,7],[27,7],[29,11],[33,13],[38,12],[46,7],[48,14],[47,22],[45,24],[45,43],[47,43],[47,52],[34,52],[34,39],[32,35],[28,31],[24,30],[20,31],[16,35],[14,39],[14,52]];
  poly('#9b422d',outline);
  ctx.save();ctx.clip();
  rect('#ec9350',1,23,46,29);
  for(const x of [2,35]){
    rect('#bf552f',x,31,11,19);rect('#ffbf72',x+2,31,3,18);
    rect('#ec8d45',x+6,31,3,18);
    for(let k=0;k<3;k++)poly('#ad4d32',[[x+2,32+k*5],[x+5,34+k*5],[x+9,31+k*5],[x+9,33+k*5],[x+5,36+k*5],[x+2,34+k*5]]);
    rect('#854631',x-1,46,13,2);rect('#ffbd69',x-1,48,13,2);
  }
  rect('#773e38',1,27,46,2);rect('#ffd88a',1,24,46,2);
  for(const mirror of [false,true]){
    ctx.save();if(mirror){ctx.translate(48,0);ctx.scale(-1,1);}
    poly('#ffcb55',[[0,7],[10,12],[19,14],[23,18],[23,25],[13,25],[4,21],[1,17]]);
    poly('#187d82',[[1,12],[10,16],[21,18],[23,21],[13,20],[3,16]]);
    poly('#254c62',[[2,17],[10,20],[19,21],[17,23],[10,22],[4,20]]);
    line('#fff4b2',1.4,[[2,9],[10,13],[17,15]]);
    ctx.restore();
  }
  oval('#8e4630',24,17,9,10);oval('#ffc951',24,16,8,9);oval('#db6b36',24,16,6.4,7.4);
  oval('#ff973e',24,16,5.5,6.5);
  poly('#994f34',[[24,9],[29,16],[24,23],[19,16]]);
  poly('#ffe68b',[[24,10],[28,16],[24,21],[20,16]]);
  poly('#fff8cf',[[24,10],[24,16],[20,16]]);
  for(let k=0;k<6;k++)rect(k%2?'#237779':'#ffcb67',4+k*7,26,4,1);
  ctx.restore();
}

function tideTowers(a,ctx){
  const {poly,rect,oval,line}=a;
  for(const mirror of [false,true]){
    ctx.save();if(mirror){ctx.translate(48,0);ctx.scale(-1,1);}
    const tower=[[1,52],[1,48],[3,46],[3,27],[1,25],[1,22],[4,20],[5,14],[3,10],[6,11],[7,5],[9,8],[12,2],[13,8],[17,6],[16,11],[20,13],[21,16],[19,18],[15,17],[13,20],[13,24],[16,26],[14,30],[14,46],[17,48],[17,52]];
    poly('#164455',tower);ctx.save();ctx.clip();
    rect('#25877d',3,4,12,44);rect('#5cc3a0',5,10,5,38);
    for(let y=28;y<46;y+=4){
      line('#287f78',1.5,[[3,y],[7,y+2],[11,y],[15,y+2]]);
      line('#9ce2b4',1,[[5,y],[7,y+1],[10,y]]);
    }
    poly('#b4eab2',[[5,10],[10,6],[14,9],[16,12],[20,14],[20,15],[14,14],[11,17],[8,22],[5,21],[8,16]]);
    poly('#1d6368',[[7,13],[10,10],[14,10],[16,12],[12,12],[9,16]]);
    rect('#fff2a3',13,12,3,2);rect('#253f51',15,12,1,1);
    rect('#f7c678',2,23,14,2);rect('#92debd',1,26,15,1.5);
    rect('#e1cf83',1,47,16,2);rect('#459f8a',1,50,16,2);
    ctx.restore();ctx.restore();
  }
  poly('#20556a',[[12,24],[17,25],[21,26],[27,26],[31,25],[36,24],[36,31],[30,32],[26,34],[22,34],[18,32],[12,31]]);
  poly('#77d2a9',[[12,25],[19,27],[29,27],[36,25],[36,28],[29,30],[19,30],[12,28]]);
  line('#ebd588',1.3,[[13,29],[21,31],[27,31],[35,29]]);
  poly('#f8df8d',[[24,25],[28,29],[24,33],[20,29]]);
  oval('#139c99',24,29,2,2);
}

function starKeep(a,ctx){
  const {poly,rect,line,oval}=a;
  const silhouette=[[0,52],[0,46],[3,46],[3,36],[5,36],[5,29],[8,29],[8,25],[10,25],[10,29],[13,29],[13,19],[15,19],[15,15],[17,15],[17,19],[19,19],[19,10],[21,10],[21,6],[24,1],[27,6],[27,10],[29,10],[29,19],[31,19],[31,15],[33,15],[33,19],[35,19],[35,29],[38,29],[38,25],[40,25],[40,29],[43,29],[43,36],[45,36],[45,46],[48,46],[48,52]];
  poly('#493268',silhouette);ctx.save();ctx.clip();
  rect('#7550a7',2,11,44,41);rect('#8c6bc5',5,19,38,30);
  for(const [x,y] of [[4,35],[12,25],[19,11],[29,25],[37,35]]){
    rect('#b99ddf',x,y,3,20);rect('#594384',x+5,y,2,21);
    for(let k=0;k<3;k++)rect('#574076',x+2,y+2+k*7,1.6,3);
  }
  for(const y of [39,44,49]){
    rect('#5a417e',0,y,48,1.4);rect('#c4a5cf',0,y+1.4,48,1);
    for(let k=0;k<5;k++)poly('#9a79b4',[[k*10+3,y+3],[k*10+6,y+2],[k*10+8,y+3.5],[k*10+6,y+4]]);
  }
  rect('#bb8ece',20,4,8,8);line('#ffe29b',1.7,[[18,11],[24,6],[30,11]]);
  oval('#55417b',24,27,9,9);oval('#d6a770',24,27,7.3,7.3);oval('#564783',24,27,6.2,6.2);
  poly('#ffdd94',[[24,19],[25.5,24],[31,27],[26,29],[24,35],[22,29],[17,27],[22,25]]);
  poly('#e9e3ff',[[24,22],[27,27],[24,31],[21,27]]);poly('#91b7e3',[[24,22],[27,27],[24,27]]);
  ctx.restore();
}

function draw(index){
  const canvas=document.createElement('canvas');canvas.width=cols*sample;canvas.height=rows*sample;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.scale(sample,sample*rows/drawingHeight);
  [sunGate,tideTowers,starKeep,blueShip,goldenGlass,coralShell,harvestMill,moonDial,
   bronzeDing,frostCastle,lavaTemple,clockTower,dragonPalace,pandaGrove,pyramid,starVault][index](artist(ctx),ctx);
  return ctx;
}
export function wallThumbnail(index){
  return draw(index).canvas.toDataURL();
}
export function sampleWall(index){
  const ctx=draw(index),canvas=ctx.canvas;
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data, tiles=[];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const i=((y*sample+3)*canvas.width+x*sample+3)*4;
    if(pixels[i+3]<128)continue;
    const color=(pixels[i]<<16)|(pixels[i+1]<<8)|pixels[i+2];
    tiles.push({col:x,row:rows-1-y,color,...world(x+.5,(y+.5)*drawingHeight/rows)});
  }
  return {tiles,cols,rows};
}
