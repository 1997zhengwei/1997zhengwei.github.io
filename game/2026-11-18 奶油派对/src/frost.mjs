import {COLORS,clamp,linearRgb,targetId} from './recipes.mjs';
const WRAP=v=>((v%1)+1)%1;
export class FrostGrid {
  constructor(w=128,h=52){this.w=w;this.h=h;this.a=new Float32Array(w*h);this.s=new Float32Array(w*h);this.d=new Float32Array(w*h);this.c=new Float32Array(w*h*3);this.revision=0;}
  fill(rgb,alpha=1,smooth=0){for(let i=0;i<this.a.length;i++){this.a[i]=alpha;this.s[i]=smooth;this.d[i]=.073;this.c.set(rgb,i*3);}this.revision++;}
  visit(u,v,ru,rv,fn){u=WRAP(u);v=clamp(v);const cx=u*this.w,cy=v*(this.h-1),rx=Math.ceil(ru*this.w),ry=Math.ceil(rv*(this.h-1));
    for(let y=Math.max(0,Math.floor(cy)-ry);y<=Math.min(this.h-1,Math.ceil(cy)+ry);y++)for(let k=Math.floor(cx)-rx;k<=Math.ceil(cx)+rx;k++){
      const dx=(k-cx)/Math.max(.001,ru*this.w),dy=(y-cy)/Math.max(.001,rv*(this.h-1));const d=dx*dx+dy*dy;if(d>1)continue;
      const x=(k%this.w+this.w)%this.w;fn(y*this.w+x,(1-d)**.65);
    }
    this.revision++;
  }
  pipe(u,v,rgb,amount=1,ru=.032,rv=.082){this.visit(u,v,ru,rv,(i,f)=>{const old=this.a[i],q=clamp(amount*f),blend=old<.02?1:clamp(q*.9);this.a[i]=clamp(old+(1-old)*q);this.s[i]*=1-q;this.d[i]=Math.max(.162*f**.77,this.d[i]*(1-.06*q));
    for(let j=0;j<3;j++)this.c[i*3+j]+=(rgb[j]-this.c[i*3+j])*blend;
  });}
  smooth(u,v,amount=1,ru=.06,rv=.19){this.visit(u,v,ru,rv,(i,f)=>{if(this.a[i]>.06)this.s[i]=clamp(this.s[i]+amount*f);});}
  snapshot(){return {a:this.a.slice(),s:this.s.slice(),d:this.d.slice(),c:this.c.slice()};}
  restore(t){if(t.a.length!==this.a.length||t.c.length!==this.c.length)throw Error('Frost snapshot size mismatch');this.a.set(t.a);this.s.set(t.s);this.d.set(t.d);this.c.set(t.c);this.revision++;}
  stats(recipe,surface='side'){
    let coverage=0,match=0,smoothness=0,weight=0;
    for(let y=0;y<this.h;y++){const target=linearRgb(COLORS[targetId(recipe,y/(this.h-1),surface)].hex);const area=surface==='top'?Math.max(.02,y/(this.h-1)):1;
      for(let x=0;x<this.w;x++){const i=y*this.w+x,a=clamp(this.a[i]/.75),cr=i*3;const d=Math.hypot(this.c[cr]-target[0],this.c[cr+1]-target[1],this.c[cr+2]-target[2]);coverage+=a*area;match+=a*clamp(1-d*1.45)*area;smoothness+=a*this.s[i]*area;weight+=area;}
    }
    return {coverage:coverage/weight,match:match/weight,smoothness:smoothness/weight};
  }
}
export class CakeFrost {
  constructor(recipe){this.recipe=recipe;this.side=new FrostGrid();this.top=new FrostGrid(128,25);this.top.fill(linearRgb(COLORS[recipe.top].hex),1,.8);this.history=[];}
  beginStroke(){this.history.push({side:this.side.snapshot(),top:this.top.snapshot()});if(this.history.length>10)this.history.shift();}
  undo(){const t=this.history.pop();if(!t)return false;this.side.restore(t.side);this.top.restore(t.top);return true;}
  stats(){const s=this.side.stats(this.recipe),t=this.top.stats(this.recipe,'top');return {coverage:s.coverage*.84+t.coverage*.16,sideCoverage:s.coverage,match:s.match*.84+t.match*.16,smoothness:s.smoothness*.84+t.smoothness*.16};}
  result(free=false){const s=this.stats(),score=Math.round(clamp(free?s.coverage*.55+s.smoothness*.45:s.match*.58+s.coverage*.25+s.smoothness*.17)*100);return {...s,score,stars:score>=90?3:score>=70?2:score>=42?1:0,coins:12+Math.round(score*.3)};}
  fillTarget(){for(let y=0;y<this.side.h;y++){const rgb=linearRgb(COLORS[targetId(this.recipe,y/(this.side.h-1))].hex);for(let x=0;x<this.side.w;x++){const i=y*this.side.w+x;this.side.a[i]=1;this.side.s[i]=1;this.side.d[i]=.073;this.side.c.set(rgb,i*3);}}this.side.revision++;this.top.s.fill(1);this.top.revision++;}
}
