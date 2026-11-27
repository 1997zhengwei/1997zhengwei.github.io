// Keep every building's touch target distinct, even when a tall model covers a nearby plot.
export function placeMarkers(sites,{width,top,bottom}){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const nodes=sites.map(s=>({id:s.id,w:s.markerWidth||50,h:s.markerHeight||40,x:clamp(s.p.x,(s.markerWidth||50)/2+4,width-(s.markerWidth||50)/2-4),y:clamp(s.p.y,top,bottom)}));
  for(let pass=0;pass<40;pass++){
    let moved=false;
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,ox=(a.w+b.w)/2+6-Math.abs(dx),oy=(a.h+b.h)/2+6-Math.abs(dy);
      if(ox<=0||oy<=0)continue;
      moved=true;
      if(ox<oy){const d=(dx<0?-1:1)*(ox/2+.1);a.x-=d;b.x+=d;}
      else{const d=(dy<0?-1:1)*(oy/2+.1);a.y-=d;b.y+=d;}
      for(const n of[a,b]){n.x=clamp(n.x,n.w/2+4,width-n.w/2-4);n.y=clamp(n.y,top,bottom);}
    }
    if(!moved)break;
  }
  return new Map(nodes.map(n=>[n.id,n]));
}
