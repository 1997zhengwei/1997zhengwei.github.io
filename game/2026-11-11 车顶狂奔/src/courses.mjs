import {random} from './math.mjs';
export const WORLDS=[
 {id:'dunes',name:'日光沙海',en:'SUNLIT CONVOY',tag:'开阔公路 · 连续跳车',color:'#edab66',sky:'#80c9df',horizon:'#f6edcc',ground:'#eacb8b',rock:'#e4dfb8',dark:'#bd9b65',lanes:5,width:25,length:760,speed:13.8,curve:3.2,seed:3107},
 {id:'canyon',name:'赤岩悬桥',en:'CANYON CROSSING',tag:'峡谷桥梁 · 分流与摆锤',color:'#ba704d',sky:'#9bd1e2',horizon:'#efcfaa',ground:'#bd7655',rock:'#cf9972',dark:'#8a4e3d',lanes:3,width:16,length:910,speed:14.6,curve:7,seed:8209},
 {id:'alpine',name:'极地追风',en:'ALPINE EXPRESS',tag:'冰原弯道 · 雪林穿行',color:'#73b4cb',sky:'#91bfd9',horizon:'#e4eff1',ground:'#e7eef0',rock:'#a9c3ca',dark:'#6a91a3',lanes:5,width:24,length:1040,speed:15.2,curve:9,seed:17041}
];
export function roadX(course,s){return Math.sin(s/160)*course.curve+Math.sin(s/72)*course.curve*.24;}
export function roadSlope(course,s){return Math.cos(s/160)*course.curve/160+Math.cos(s/72)*course.curve*.24/72;}
export function makeCourse(world=0,stage=0){
 const base=WORLDS[world]||WORLDS[0],c={...base,world,stage,length:base.length+stage*95,speed:base.speed+stage*.45,seed:base.seed+stage*107,obstacles:[],hammers:[],gates:[],goal:null};
 const r=random(c.seed),lane=i=>(i-(c.lanes-1)/2)*4.35;
 // Pillars are physical dividers with open routes on both sides. The first is far enough away to learn the jump.
 const count=world===0?3:4;
 for(let i=0;i<count;i++){const s=210+i*(c.length-330)/count,li=(i+stage+(world===1?1:2))%c.lanes,x=roadX(c,s)+lane(li);c.obstacles.push({id:'pillar-'+i,s,x,w:world===1?3.3:2.85,d:3.2,h:9+ r()*5,type:'pillar'});}
 if(world!==0||stage>0){for(let i=0;i<(world===1?3:2);i++){const s=330+i*210;if(s<c.length-110)c.hammers.push({s,x:roadX(c,s),phase:i*1.9+stage*.6,period:3.8+i*.5,range:c.width*.45,length:7.6,pivot:12.8,radius:1.3});}}
 if(world===2||stage===2){for(let i=0;i<2;i++){const s=410+i*225;if(s<c.length-120)c.gates.push({s,x:roadX(c,s)+lane((i+stage)%c.lanes),w:4.2,d:1.4,bottom:5.05,top:5.72});}}
 c.roadEnd=c.length-22;c.goal={minS:c.length-8,maxS:c.length+24,x:roadX(c,c.length),w:c.width+7,y:3.82};
 c.par=Math.round(c.length/(c.speed+6.5)+12);return c;
}
export function hammerPosition(h,t){const theta=Math.sin(t*Math.PI*2/h.period+h.phase)*.85;return{x:h.x+Math.sin(theta)*h.range,y:h.pivot-Math.cos(theta)*h.length,s:h.s};}
