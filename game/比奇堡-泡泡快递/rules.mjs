export const orders=[{name:'Patrick',item:'Lunch delivery',x:-4,y:1.65,mass:.25,angle:-20,q:.325},{name:'Gary',item:'A crunchy snack',x:0,y:2.55,mass:.1,angle:0,q:.555},{name:'Squidward',item:'Clarinet care kit',x:4,y:3.35,mass:.55,angle:20,q:.9}];
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const charge=seconds=>clamp(seconds/1.6);
export const lift=(q,mass)=>.8+q*3.2-mass*.75;
export const radius=q=>.36+q*.55;
export const landingX=angle=>Math.tan(angle*Math.PI/180)*11;
export function point(angle,q,mass,p){return {x:landingX(angle)*p,y:lift(q,mass)+Math.sin(p*Math.PI)*.9,z:6-11*p}}
export const obstacles=[{x:-2.0,z:.5,y:.55,r:.67,label:'low coral'},{x:2,z:.5,y:.6,r:.65,label:'low coral'},{x:-2,z:.5,y:3.9,r:.55,label:'arch crown'},{x:-3.8,z:.5,y:2.2,r:.42,label:'arch pillar'},{x:1.7,z:-1.7,y:.8,r:.6,label:'coral garden'}];
export const fresh=()=>({index:0,lives:4,score:0,perfects:0,throws:0,phase:'ready',shot:null,last:null});
export function predict(index,angle,q){const o=orders[index],x=landingX(angle),y=lift(q,o.mass),dx=x-o.x,dy=y-o.y;let obstacle=null,collisionAt=1;for(let i=1;i<=60;i++){const p=point(angle,q,o.mass,i/60);for(const ob of obstacles){if(Math.hypot(p.x-ob.x,p.y-ob.y,p.z-ob.z)<radius(q)+ob.r){obstacle=ob;collisionAt=i/60;break}}if(obstacle)break}const hit=!obstacle&&Math.abs(dx)<=.8&&Math.abs(dy)<=.42,perfect=hit&&Math.abs(dx)<=.25&&Math.abs(dy)<=.15;return {hit,perfect,dx,dy,obstacle,collisionAt,x,y}}
export function launch(s,angle,q,time){if(s.phase!=='ready')return false;s.shot={angle,q,time,result:predict(s.index,angle,q)};s.throws++;s.phase='flight';return true}
export function resolve(s){if(s.phase!=='flight')return null;const r=s.shot.result;s.last=r;if(r.hit){s.score+=r.perfect?200:150;if(r.perfect)s.perfects++}else s.lives--;s.phase='reaction';return r}
export function advance(s){if(s.phase!=='reaction')return;if(!s.lives){s.phase='lost';return}if(s.last.hit)s.index++;s.phase=s.index===3?'won':'ready';s.shot=null}
