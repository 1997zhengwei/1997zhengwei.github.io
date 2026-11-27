import{OBSTACLES}from'./campaign.mjs';

export function wallBounds(b){
 const across=b.lane===0||b.lane===3;
 return{x:b.x,z:b.z,w:across?3.8:.65,d:across?.65:3.8,height:[0,1.4,1.75,1.85,2,2.15][b.level],id:b.id,kind:'wall'};
}
export function coverBounds(r){
 const solids=OBSTACLES.map((o,i)=>({...o,w:o.w+.3,d:o.d+.3,height:3.6,id:`house-${i}`,kind:'house'}));
 for(const b of r.builds)if(b.hp>0&&b.level&&b.type!=='farm')solids.push(b.type==='wall'?wallBounds(b):{x:b.x,z:b.z,w:b.type==='tower'?1.6:1.5,d:1.5,height:b.type==='tower'?4.2:2,id:b.id,kind:'building'});
 return solids;
}
// Entry into an axis-aligned prism. Endpoints on a face do not create repeated impacts.
export function segmentEntry(from,to,rect,radius=0,vertical=true){
 let low=0,high=1;
 const axes=[['x',rect.x-rect.w/2-radius,rect.x+rect.w/2+radius],['z',rect.z-rect.d/2-radius,rect.z+rect.d/2+radius]];
 if(vertical)axes.push(['y',0,rect.height]);
 for(const[key,min,max]of axes){const a=from[key]||0,delta=(to[key]||0)-a;if(Math.abs(delta)<1e-9){if(a<min||a>max)return null;continue;}let t0=(min-a)/delta,t1=(max-a)/delta;if(t0>t1)[t0,t1]=[t1,t0];low=Math.max(low,t0);high=Math.min(high,t1);if(low>high)return null;}
 return high>.0001&&low<.99999?Math.max(0,low):null;
}
export function blockingWall(r,from,to,ignoreId=null){
 let first=null,at=Infinity;
 for(const b of r.builds)if(b.type==='wall'&&b.hp>0&&b.id!==ignoreId){const t=segmentEntry(from,to,wallBounds(b),.2,false);if(t!==null&&t<at){first=b;at=t;}}
 return first;
}
export function meleeClear(r,from,to,ignoreWallId=null,climb=false){
 if(!climb&&blockingWall(r,from,to,ignoreWallId))return false;
 return!OBSTACLES.some(o=>segmentEntry(from,to,o,.05,false)!==null);
}
export function targetHeight(target){return target.id==='bell'||target.max===240?.9:target.type==='wall'?Math.min(1.1,wallBounds(target).height*.7):1.2+(target.climb||0);}
export function projectilePoint(a,t,target=null){
 const tx=target?.x??a.tx,tz=target?.z??a.tz,ty=target?targetHeight(target):a.ty;
 return{x:a.x+(tx-a.x)*t,y:a.y+(ty-a.y)*t+Math.sin(Math.PI*t)*(a.arc||0),z:a.z+(tz-a.z)*t};
}
export function traceProjectile(r,a,start=0,end=1,target=null,solids=coverBounds(r)){
 const tx=target?.x??a.tx,tz=target?.z??a.tz,ty=target?targetHeight(target):a.ty;
 const height=t=>a.y+(ty-a.y)*t+Math.sin(Math.PI*t)*(a.arc||0);
 let first=null,firstT=Infinity;
 for(const rect of solids){
  if(rect.id===a.sourceId)continue;let lo=start,hi=end,valid=true;
  for(const[key,center,size]of[['x',rect.x,rect.w],['z',rect.z,rect.d]]){
   const origin=a[key],delta=(key==='x'?tx:tz)-origin,min=center-size/2,max=center+size/2;
   if(Math.abs(delta)<1e-9){if(origin<min||origin>max){valid=false;break;}}
   else{let t0=(min-origin)/delta,t1=(max-origin)/delta;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi){valid=false;break;}}
  }
  if(!valid||hi<.00001||lo>1||hi<0)continue;lo=Math.max(0,lo);hi=Math.min(1,hi);
  // A positive sine arc is concave: its minimum over this interval is at an endpoint.
  const y0=height(lo),y1=height(hi);if(Math.min(y0,y1)>rect.height+.0001)continue;
  let at=lo;if(y0>rect.height){let left=lo,right=hi;for(let i=0;i<15;i++){const mid=(left+right)/2;if(height(mid)>rect.height)left=mid;else right=mid;}at=right;}
  if(at<firstT){firstT=at;first=rect;}
 }
 return first?{...first,point:projectilePoint(a,firstT,target)}:null;
}
export function makeProjectile(from,target,source='hero'){
 return{x:from.x,z:from.z,y:source==='tower'?3.2:source==='skeleton'?1.3:1.65,tx:target.x,tz:target.z,ty:targetHeight(target),arc:source==='tower'?2.6:source==='volley'?3.3:.12,source,sourceId:from.id||null,targetId:target.id||'bell'};
}
export function aimBlock(r,from,target,source='hero',solids=coverBounds(r)){
 const hit=traceProjectile(r,makeProjectile(from,target,source),0,1,null,solids);
 return hit&&hit.id!==(target.id||'bell')?hit:null;
}
export function wallReach(from,wall){const b=wallBounds(wall);return Math.hypot(Math.max(0,Math.abs(from.x-b.x)-b.w/2),Math.max(0,Math.abs(from.z-b.z)-b.d/2));}
