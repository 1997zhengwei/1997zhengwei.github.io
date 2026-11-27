import * as T from '../vendor/three.module.js';
import { bottom, cell, cols, rows, worldX, worldY } from './flow.js';

export const sandFace = .54;
const sandBack = -.57;
const subdivisions = 2;
const threshold = .5;

function paintStrata(canvas,site) {
  const ctx=canvas.getContext('2d');
  const {width:w,height:h}=canvas;
  const bright=new T.Color(site.sand);
  const deep=new T.Color(site.deep);
  const color=new T.Color();
  const warm=new T.Color('#ffe9b7');
  const shade=new T.Color('#965b61');
  const brightFace=bright.clone().lerp(warm,.32);
  const depthFace=bright.clone().lerp(deep,.58);
  const grade=ctx.createLinearGradient(0,0,w*.32,h);
  grade.addColorStop(0,brightFace.getStyle());
  grade.addColorStop(.65,bright.getStyle());
  grade.addColorStop(1,depthFace.getStyle());
  ctx.fillStyle=grade;
  ctx.fillRect(0,0,w,h);

  for(let layer=0;layer<8;layer++){
    const y=(layer+.63)*h/8;
    const phase=.79+layer*.77;
    const amplitude=17+(layer%3)*8;
    const horizon=(x,offset)=>y+offset+Math.sin(x*.016+phase)*amplitude+
      Math.sin(x*.006+phase*1.3)*31;
    const thickness=29+(layer%4)*8;
    ctx.beginPath();
    ctx.moveTo(0,horizon(0,0));
    for(let x=9;x<w+9;x+=9)ctx.lineTo(x,horizon(x,0));
    for(let x=w;x>=0;x-=9)ctx.lineTo(x,horizon(x,thickness+3*Math.sin(x*.021)));
    ctx.closePath();
    const depth=(layer+1)/8;
    color.copy(brightFace).lerp(depthFace,depth);
    color.lerp(layer%3===0?warm:shade,layer%3===0?.25:.18);
    ctx.fillStyle=color.getStyle();
    ctx.fill();
  }

  let seed=773013;
  function noise(){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    return seed/4294967296;
  }
  for(let i=0;i<133;i++){
    const x=noise()*w,y=noise()*h;
    const size=3+noise()**2*18;
    const light=i%4!==1;
    color.copy(light?warm:shade).lerp(bright,.32);
    ctx.fillStyle=color.getStyle();
    ctx.globalAlpha=(light?.18:.13)+noise()*.10;
    ctx.beginPath();
    ctx.ellipse(x,y,size,size*(.58+noise()*.35),noise()*2,0,Math.PI*2);
    ctx.fill();
  }
  for(let i=0;i<1700;i++){
    const x=noise()*w,y=noise()*h;
    ctx.fillStyle=i%5===0?'#956958':'#fff8d5';
    ctx.globalAlpha=.13;
    ctx.fillRect(x,y,.6+noise()*1.8,.7+noise()*1.65);
  }
  ctx.globalAlpha=1;
}

export function createSand() {
  const canvas=document.createElement('canvas');
  canvas.width=768; canvas.height=816;
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  const surface=new T.MeshBasicMaterial({map:texture,vertexColors:true,toneMapped:false});
  const edges=new T.MeshStandardMaterial({vertexColors:true,roughness:.85,side:T.DoubleSide});
  const mesh=new T.Mesh(new T.BufferGeometry(),[surface,edges]);
  mesh.frustumCulled=false;
  const upper=new T.Color(), deep=new T.Color(), tint=new T.Color();
  const clayWall=new T.Color('#9a4a36');
  const stepsX=(cols+1)*subdivisions,stepsY=(rows+1)*subdivisions;
  const countX=stepsX+1;
  let paintedSite;

  function rebuild(land,site) {
    if(paintedSite!==site){
      paintStrata(canvas,site);
      texture.needsUpdate=true;
      paintedSite=site;
    }
    upper.set(site.sand);
    deep.set(site.deep);
    const position=[],color=[],uv=[],wallPosition=[],wallColor=[],wallUV=[];
    function solid(c,r) {
      // Ice (4) is drawn as separate blocks, so the sand surface treats it as a hole.
      return c>=0&&r>=0&&c<cols&&r<rows&&land[r*cols+c]!==0&&land[r*cols+c]!==4 ? 1 : 0;
    }
    const clayAt=(c,r)=>c>=0&&r>=0&&c<cols&&r<rows&&land[r*cols+c]===3 ? 1 : 0;
    const clayField=new Float32Array((cols+2)*(rows+2));
    for(let r=-1;r<=rows;r++){
      for(let c=-1;c<=cols;c++){
        clayField[(r+1)*(cols+2)+c+1]=clayAt(c,r)*.5+
          (clayAt(c-1,r)+clayAt(c+1,r)+clayAt(c,r-1)+clayAt(c,r+1))*.125;
      }
    }
    // Red clay tint at a world position (bilinear over the cell grid).
    function clayTint(x,y) {
      const c=x/cell+cols/2-.5, r=rows-.5-(y-bottom)/cell;
      const loC=Math.floor(c),loR=Math.floor(r),u=c-loC,v=r-loR;
      const at=(a,b)=>clayField[(Math.max(-1,Math.min(rows,b))+1)*(cols+2)+Math.max(-1,Math.min(cols,a))+1];
      const k=(at(loC,loR)*(1-u)+at(loC+1,loR)*u)*(1-v)+(at(loC,loR+1)*(1-u)+at(loC+1,loR+1)*u)*v;
      return Math.min(1,k*1.15);
    }
    const field=new Float32Array((cols+2)*(rows+2));
    for(let r=-1;r<=rows;r++){
      for(let c=-1;c<=cols;c++){
        field[(r+1)*(cols+2)+c+1]=solid(c,r)*.60+
          (solid(c-1,r)+solid(c+1,r)+solid(c,r-1)+solid(c,r+1))*.078+
          (solid(c-1,r-1)+solid(c+1,r-1)+solid(c-1,r+1)+solid(c+1,r+1))*.022;
      }
    }
    const density=(c,r)=>field[(r+1)*(cols+2)+c+1]??0;
    // Subsamples interpolate the same cells that stop water and the digging tool.
    function sample(c,r) {
      const loC=Math.floor(c),loR=Math.floor(r);
      const u=c-loC,v=r-loR;
      const top=density(loC,loR)*(1-u)+density(loC+1,loR)*u;
      const down=density(loC,loR+1)*(1-u)+density(loC+1,loR+1)*u;
      return top*(1-v)+down*v;
    }
    const nodes=[];
    for(let r=0;r<=stepsY;r++){
      for(let c=0;c<=stepsX;c++){
        const cc=c/subdivisions-1, rr=r/subdivisions-1;
        nodes.push({x:worldX(cc),y:worldY(rr),density:sample(cc,rr),edge:false});
      }
    }

    function vertex(x,y,z,light) {
      const relativeDepth=Math.max(0,Math.min(1,1-(y-bottom)/(rows*cell)));
      const stripe=.96+Math.sin(relativeDepth*31+x*.71)*.06;
      tint.copy(upper).lerp(deep,.24+relativeDepth*.48).multiplyScalar(light*stripe);
      const k=clayTint(x,y);
      if(k>0)tint.lerp(clayWall.clone().multiplyScalar(light*stripe),k*.85);
      wallPosition.push(x,y,z);
      wallColor.push(tint.r,tint.g,tint.b);
      wallUV.push(0,0);
    }
    function front(a,b,c) {
      for(const p of [a,b,c]){
        const ramp=p.edge?.94:1;
        position.push(p.x,p.y,sandFace);
        const k=clayTint(p.x,p.y);
        color.push(ramp*(1-k*.22),ramp*(1-k*.56),ramp*(1-k*.64));
        uv.push(p.x/(cols*cell)+.5,(p.y-bottom)/(rows*cell));
      }
    }
    function side(from,to) {
      const dx=to.x-from.x,dy=to.y-from.y;
      const length=Math.hypot(dx,dy);
      if(length<.001)return;
      const shiftX=.112*dy/length,shiftY=-.112*dx/length;
      const a=[from.x,from.y,sandFace,.94];
      const b=[to.x,to.y,sandFace,.94];
      const c=[to.x+shiftX,to.y+shiftY,sandFace-.13,.72];
      const d=[from.x+shiftX,from.y+shiftY,sandFace-.13,.72];
      const e=[c[0]+shiftX*.27,c[1]+shiftY*.27,sandBack,.45];
      const f=[d[0]+shiftX*.27,d[1]+shiftY*.27,sandBack,.45];
      for(const p of [a,d,c,a,c,b,d,f,e,d,e,c])vertex(...p);
    }
    function clipped(a,b,c) {
      const polygon=[];
      let old=c;
      for(const current of [a,b,c]){
        const wasSolid=old.density>threshold, isSolid=current.density>threshold;
        if(wasSolid!==isSolid){
          const s=(threshold-old.density)/(current.density-old.density);
          polygon.push({x:old.x+(current.x-old.x)*s,y:old.y+(current.y-old.y)*s,edge:true});
        }
        if(isSolid)polygon.push(current);
        old=current;
      }
      for(let i=1;i+1<polygon.length;i++)front(polygon[0],polygon[i],polygon[i+1]);
      for(let i=0;i<polygon.length;i++){
        const p=polygon[i],q=polygon[(i+1)%polygon.length];
        if(p.edge&&q.edge)side(p,q);
      }
    }
    for(let r=0;r<stepsY;r++){
      for(let c=0;c<stepsX;c++){
        const i=r*countX+c;
        const a=nodes[i],b=nodes[i+countX],d=nodes[i+1],e=nodes[i+countX+1];
        if(Math.min(a.density,b.density,d.density,e.density)>threshold){
          front(a,b,e);front(a,e,d);
        }else if(Math.max(a.density,b.density,d.density,e.density)>threshold){
          clipped(a,b,e);clipped(a,e,d);
        }
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(position.concat(wallPosition),3));
    geometry.setAttribute('color',new T.Float32BufferAttribute(color.concat(wallColor),3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uv.concat(wallUV),2));
    geometry.addGroup(0,position.length/3,0);
    geometry.addGroup(position.length/3,wallPosition.length/3,1);
    geometry.computeVertexNormals();
    mesh.geometry.dispose();
    mesh.geometry=geometry;
  }

  // Darkens the sand face where the wet map (cols x rows, red channel) is high.
  function setWet(wetMap) {
    surface.onBeforeCompile=shader=>{
      shader.uniforms.wetMap={value:wetMap};
      shader.fragmentShader=`uniform sampler2D wetMap;
${shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
  float soak=texture2D(wetMap,vMapUv).r;
  diffuseColor.rgb*=mix(vec3(1.0),vec3(.68,.6,.6),soak);`)}`;
    };
    surface.needsUpdate=true;
    // Channel walls get darker wet streaks too; their UVs are unused, so map world position to the grid.
    edges.onBeforeCompile=shader=>{
      shader.uniforms.wetMap={value:wetMap};
      shader.vertexShader=`varying vec2 vWetUv;
${shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vWetUv=vec2(position.x/${(cols*cell).toFixed(3)}+.5,(position.y-${bottom.toFixed(3)})/${(rows*cell).toFixed(3)});`)}`;
      shader.fragmentShader=`uniform sampler2D wetMap;
varying vec2 vWetUv;
${shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  diffuseColor.rgb*=mix(vec3(1.0),vec3(.58,.5,.5),texture2D(wetMap,vWetUv).r);`)}`;
    };
    edges.needsUpdate=true;
  }

  return {mesh,rebuild,setWet};
}
