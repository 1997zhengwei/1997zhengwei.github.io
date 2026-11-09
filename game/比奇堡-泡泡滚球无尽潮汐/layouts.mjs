// Seeded arrangements: distinct route geometry plus shuffled caches, current and hazards.
export const LAYOUT_NAMES=['Coral Crossroads','Drift Lanes','Market Pockets','Shell Ring'];
export function generateLayout(s,rand){const variant=Math.floor(rand(s)*4),turn=Math.floor(rand(s)*4),flip=rand(s)>.5?-1:1;
 const transform=(x,z)=>{x*=flip;for(let i=0;i<turn;i++){const old=x;x=-z;z=old;}return {x,z};};
 const angle=rand(s)*Math.PI*2,caches=[];
 for(let i=0;i<3;i++){const a=angle+i*Math.PI*2/3,r=15.5+rand(s)*3;let p={x:Math.sin(a)*r,z:Math.cos(a)*r};if(Math.hypot(p.x,p.z-8)<8)p.z-=6;caches.push({...p,id:i,opened:false,medical:i===1});}
 const routes=variant===0?[[{x:0,z:23},{x:0,z:-23}],[{x:-23,z:0},{x:23,z:0}]]:variant===1?[-12,0,12].map(x=>[transform(x,-23),transform(x,23)]):variant===2?[[{x:-18,z:-14},{x:18,z:-14},{x:18,z:14},{x:-18,z:14},{x:-18,z:-14}]]:[Array.from({length:17},(_,i)=>({x:Math.sin(i*Math.PI/8)*17,z:Math.cos(i*Math.PI/8)*17}))];
 const clusters=caches.map(c=>({x:c.x,z:c.z}));clusters.push({x:0,z:1},{x:0,z:10});
 const hazards=[];for(let i=0;i<(s.biome===1?5:4);i++){let candidate;for(let attempt=0;attempt<60;attempt++){candidate={x:(rand(s)-.5)*40,z:(rand(s)-.5)*40,r:s.biome===1?2.8:2.2,offset:rand(s)*10,phase:'idle'};if(Math.hypot(candidate.x,candidate.z-8)>7&&Math.hypot(candidate.x,candidate.z+8)>9&&caches.every(c=>Math.hypot(c.x-candidate.x,c.z-candidate.z)>5)&&hazards.every(h=>Math.hypot(h.x-candidate.x,h.z-candidate.z)>6))break;}hazards.push(candidate);}
 return {variant,name:LAYOUT_NAMES[variant],turn,flip,caches,routes,clusters,hazards,current:{x:(rand(s)>.5?1:-1)*11,z:(rand(s)-.5)*14,w:7,h:12,dx:rand(s)>.5?.6:-.6,dz:-.4},landmarkSide:rand(s)>.5?1:-1};
}
