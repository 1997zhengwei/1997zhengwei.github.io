import {baySize,exit,zoneAt} from './rooms.js';
const ns='http://www.w3.org/2000/svg';
function draw(parent,type,attrs){
  const node=document.createElementNS(ns,type);
  for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);
  parent.append(node);return node;
}
export function floorplan(svg,s,detailed=false){
  svg.replaceChildren();
  const {bounds,bays,walls,props}=s.room,pad=detailed?.85:1.1;
  svg.setAttribute('viewBox',[bounds.left-pad,bounds.back-pad,bounds.right-bounds.left+2*pad,bounds.front-bounds.back+2*pad+1.5].join(' '));
  const fills=new Map();
  const pins=[];
  for(const b of bays){
    fills.set(b,draw(svg,'rect',{x:b.x-baySize/2,y:b.z-baySize/2,width:baySize,height:baySize,fill:'#304c68'}));
  }
  if(detailed)for(const p of props){const [x,z,w,d]=p.rect;draw(svg,'rect',{x:x-w/2,y:z-d/2,width:w,height:d,rx:.09,fill:'#547087'});}
  for(const wall of walls){
    const [x,z,w,d]=wall.rect;draw(svg,'rect',{x:x-w/2,y:z-d/2,width:w,height:d,fill:'#a9c7db',stroke:'#a9c7db','stroke-width':detailed?.026:.22});
  }
  for(const b of bays){
    if(detailed){
      draw(svg,'text',{x:b.x,y:b.z+.39,fill:'#f3f7fb','text-anchor':'middle','font-size':1.24,'font-weight':650}).textContent=b.name;
    }
  }
  for(const relic of s.relics){
    const bay=zoneAt(s.room,relic.x,relic.z),x=bay.x+2.55,z=bay.z-2.4,r=detailed?.61:.84;
    const node=draw(svg,'path',{d:'M '+x+' '+(z-r)+' l '+r+' '+r+' '+(-r)+' '+r+' '+(-r)+' '+(-r)+' Z',fill:'#ffd16b'});
    pins.push({node,relic});
  }
  let keyPin=null,gateBar=null;
  if(s.room.key){const bay=zoneAt(s.room,s.room.key.x,s.room.key.z),r=detailed?.5:.75;
    keyPin=draw(svg,'rect',{x:bay.x-2.55-r,y:bay.z-2.4-r*.7,width:r*2,height:r*1.4,rx:.15,fill:'#3ad6ff'});}
  if(s.room.gate){const [x,z,w,d]=s.room.gate.rect;gateBar=draw(svg,'rect',{x:x-w/2-.15,y:z-d/2-.15,width:w+.3,height:d+.3,fill:'#ff4b5c'});}
  draw(svg,'rect',{x:exit.x-.95,y:exit.z+.07,width:1.9,height:.85,rx:.19,fill:'#7af4c3'});
  const marker=draw(svg,'circle',{r:detailed?.43:.90,stroke:'#143247','stroke-width':.14,fill:'#72ecff'});
  let prev,lastCount=-1;
  const update=()=>{
    if(keyPin)keyPin.style.display=s.keyTaken?'none':'';
    if(gateBar)gateBar.setAttribute('fill',s.gateOpen?'#4dff9a':'#ff4b5c');
    if(lastCount!==s.secured){for(const {node,relic} of pins)node.style.display=relic.taken?'none':'';lastCount=s.secured;}
    const here=zoneAt(s.room,s.x,s.z);
    if(prev!==here){
      if(prev)fills.get(prev).setAttribute('fill','#304c68');
      if(here)fills.get(here).setAttribute('fill','#346e83');
      prev=here;
    }
    marker.setAttribute('cx',s.x.toFixed(2));marker.setAttribute('cy',s.z.toFixed(2));
    return here?.name||'接应车';
  };
  update();return update;
}
