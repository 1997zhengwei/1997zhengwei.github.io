import * as T from '../vendor/three.module.js';

export function roundedSlab(width,height,radius,depth,bevel=.046) {
  const x=width/2,y=height/2,r=Math.min(radius,x,y);
  const outline=new T.Shape();
  outline.moveTo(-x+r,-y);
  outline.lineTo(x-r,-y); outline.quadraticCurveTo(x,-y,x,-y+r);
  outline.lineTo(x,y-r); outline.quadraticCurveTo(x,y,x-r,y);
  outline.lineTo(-x+r,y); outline.quadraticCurveTo(-x,y,-x,y-r);
  outline.lineTo(-x,-y+r); outline.quadraticCurveTo(-x,-y,-x+r,-y);
  const geometry=new T.ExtrudeGeometry(outline,{
    depth,curveSegments:5,steps:1,bevelSegments:3,bevelSize:bevel,bevelThickness:bevel,
  });
  geometry.translate(0,0,-depth/2);
  return geometry;
}

export function carvedStone(variant) {
  const profiles=[
    [[-.97,-.29],[-.97,.23],[-.63,.68],[.23,.78],[.80,.61],[1,.09],[.76,-.60],[-.43,-.75]],
    [[-.91,-.55],[-.94,.08],[-.65,.66],[-.02,.87],[.67,.70],[.95,.38],[.97,-.38],[.55,-.77],[-.24,-.85]],
    [[-.98,-.18],[-.73,.41],[-.16,.73],[.59,.65],[1,.25],[.91,-.38],[.43,-.70],[-.52,-.68]],
  ];
  const points=profiles[variant];
  const shape=new T.Shape();
  const weighted=(a,b)=>[a[0]*.83+b[0]*.17,a[1]*.83+b[1]*.17];
  const start=weighted(points.at(-1),points[0]);
  shape.moveTo(...start);
  points.forEach((point,i)=>{
    const before=weighted(point,points[(i+points.length-1)%points.length]);
    const after=weighted(point,points[(i+1)%points.length]);
    shape.lineTo(...before);
    shape.quadraticCurveTo(point[0],point[1],after[0],after[1]);
  });
  shape.closePath();
  const geometry=new T.ExtrudeGeometry(shape,{
    depth:.50,curveSegments:5,steps:1,bevelSegments:3,bevelSize:.104,bevelThickness:.14,
  });
  geometry.translate(0,0,-.20);
  return geometry;
}

export function mineralPatches() {
  const bands=[
    [[-.75,.31],[-.57,.52],[-.15,.59],[.12,.51],[.53,.54],[.72,.36],[.30,.31],[-.05,.37],[-.43,.31]],
    [[-.65,-.32],[-.25,-.25],[.12,-.32],[.51,-.25],[.63,-.43],[.46,-.55],[.01,-.56],[-.35,-.48]],
  ];
  return bands.map(points=>{
    const path=new T.Shape(points.map(([x,y])=>new T.Vector2(x,y)));
    return new T.ShapeGeometry(path);
  });
}

export function brilliantGem() {
  const count=8;
  const rings=[[.66,.68],[1,.07],[.30,-.56]].map(([radius,z],index)=>
    Array.from({length:count},(_,i)=>{
      const turn=(i+(index===2?.50:0))*Math.PI*2/count+Math.PI/8;
      return [Math.cos(turn)*radius,Math.sin(turn)*radius,z];
    }));
  const position=[],color=[];
  function face(a,b,c,brightness) {
    for(const v of [a,b,c]){
      position.push(...v);
      color.push(brightness,brightness,brightness);
    }
  }
  const gleams=[1,.91,.77,.90,1,.86,.68,.80];
  for(let i=0;i<count;i++){
    const j=(i+1)%count;
    face([0,0,.68],rings[0][i],rings[0][j],1);
    for(let l=0;l<rings.length-1;l++){
      const a=rings[l],b=rings[l+1],shade=gleams[i]* (l===1?.84:1);
      face(a[i],b[i],b[j],shade);
      face(a[i],b[j],a[j],shade*.91);
    }
    face([0,0,-.76],rings[2][j],rings[2][i],.71);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(color,3));
  geometry.computeVertexNormals();
  return geometry;
}
