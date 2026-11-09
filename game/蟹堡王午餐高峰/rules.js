(function(root){'use strict';
const C={charge:1.5,flight:.8,min:240,range:300,tolerance:30,perfect:11,startX:155,y:350};
const orders=[{name:'Patrick',who:'patrick',x:360,count:1,amp:0},{name:'Squidward',who:'squidward',x:450,count:1,amp:0},{name:'Patrick',who:'patrick',x:400,count:2,amp:0},{name:'Squidward',who:'squidward',x:380,count:1,amp:20},{name:'Patrick',who:'patrick',x:450,count:1,amp:24},{name:'Patrick',who:'patrick',x:400,count:2,amp:24}];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const charge=seconds=>clamp(seconds/C.charge);
const landing=q=>C.min+C.range*clamp(q);
const target=(index,t)=>{const o=orders[index];return o.x+o.amp*Math.sin(t*1.65+index)};
const trajectory=(x,p)=>({x:C.startX+(x-C.startX)*clamp(p),y:C.y-145*4*clamp(p)*(1-clamp(p))});
const fresh=()=>({index:0,stack:0,lives:3,score:0,combo:0,bestCombo:0,perfects:0,throws:0,phase:'ready',shot:null,last:null});
function launch(s,q,t){if(s.phase!=='ready')return false;s.phase='flight';s.throws++;s.shot={x:landing(q),plate:target(s.index,t+C.flight),at:t};return true;}
function resolve(s){if(s.phase!=='flight')return null;const d=s.shot.x-s.shot.plate,hit=Math.abs(d)<=C.tolerance,perfect=Math.abs(d)<=C.perfect;let points=0,served=false;
 if(hit){s.combo++;s.bestCombo=Math.max(s.combo,s.bestCombo);if(perfect)s.perfects++;points=(perfect?150:100)+Math.min(s.combo-1,5)*20;s.score+=points;s.stack++;served=s.stack===orders[s.index].count;}else{s.lives--;s.combo=0;}
 s.last={hit,perfect,points,served,d};s.phase='reaction';return s.last;}
function advance(s){if(s.phase!=='reaction')return;if(!s.lives){s.phase='lost';return}if(s.last.served){s.index++;s.stack=0;}s.phase=s.index===orders.length?'won':'ready';s.shot=null;}
const api={C,orders,clamp,charge,landing,target,trajectory,fresh,launch,resolve,advance};if(typeof module!=='undefined')module.exports=api;else root.RushRules=api;
})(typeof window!=='undefined'?window:this);
