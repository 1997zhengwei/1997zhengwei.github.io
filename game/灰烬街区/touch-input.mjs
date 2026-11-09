// Each control owns one pointer. Releasing the movement finger must never
// release the attack finger, or let another touch take over a captured stick.
function captureControl(element,enabled,start,move,stop){
 let pointer=null;
 function reset(){const previous=pointer;pointer=null;stop();if(previous!==null&&element.hasPointerCapture(previous))element.releasePointerCapture(previous);}
 element.addEventListener('pointerdown',e=>{if(pointer!==null||!enabled()||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();pointer=e.pointerId;element.setPointerCapture(pointer);start(e);});
 element.addEventListener('pointermove',e=>{if(e.pointerId===pointer)move(e);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,e=>{if(e.pointerId===pointer)reset();});
 return {reset,get active(){return pointer!==null;}};
}
export function bindAttackButton(element,enabled,strike){
 element.setAttribute('aria-pressed','false');
 return captureControl(element,enabled,e=>{element.classList.add('pressed');element.setAttribute('aria-pressed','true');strike();},()=>{},()=>{element.classList.remove('pressed');element.setAttribute('aria-pressed','false');});
}
export function bindMoveStick(element,enabled,onMove){
 const knob=element.querySelector('i');
 const move=e=>{const b=element.getBoundingClientRect(),dx=e.clientX-(b.x+b.width/2),dy=e.clientY-(b.y+b.height/2),l=Math.max(32,Math.hypot(dx,dy)),v={x:dx/l,y:dy/l};onMove(v);knob.style.transform='translate('+v.x*28+'px,'+v.y*28+'px)';};
 return captureControl(element,enabled,move,move,()=>{onMove({x:0,y:0});knob.style.transform='';});
}
