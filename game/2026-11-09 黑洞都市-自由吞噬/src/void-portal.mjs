import * as T from '../vendor/three.module.js';

// The opening, inward-curving wall and throat are actual 3D surfaces below the street.
// No background picture or opaque disk is laid over the city.
export function createVoidPortal(color='#ac8bff',accent='#e0d4ff'){
 const root=new T.Group(),flow={time:{value:0},pulse:{value:0},tint:{value:new T.Color(color)},accent:{value:new T.Color(accent)}};
 const profile=[];
 for(let n=0;n<=48;n++){
  const t=n/48,r=.065+.94*Math.pow(1-t,1.65),y=-.025-5.6*t;
  profile.push(new T.Vector2(r,y));
 }
 const wallMaterial=new T.ShaderMaterial({side:T.DoubleSide,uniforms:flow,vertexShader:`
  varying vec3 vLocal; void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
 `,fragmentShader:`
  uniform float time,pulse; uniform vec3 tint,accent; varying vec3 vLocal;
  void main(){
   float depth=clamp((-vLocal.y-.025)/5.6,0.,1.);
   float angle=atan(vLocal.z,vLocal.x);
   float coil=angle*3.+depth*28.+time*1.15;
   float thread=pow(max(0.,sin(coil)),24.);
   float veins=pow(max(0.,sin(angle*19.-depth*13.+time*.25)),36.);
   float strata=pow(max(0.,cos(depth*68.-time*1.8)),30.);
   float lip=exp(-depth*24.);
   float shade=.26+.74*pow(max(0.,cos(angle-2.15)),2.);
   vec3 stone=mix(vec3(.025,.032,.054),tint*.13,lip)*shade;
   vec3 energy=tint*(thread*.23+veins*.09+strata*.045)*(1.-depth)*( .65+pulse*.65);
   vec3 col=(stone+energy+accent*lip*.16)*pow(1.-depth,1.8);
   gl_FragColor=vec4(col,1.);
  }
 `});
 const wall=new T.Mesh(new T.LatheGeometry(profile,80),wallMaterial);root.add(wall);
 const throat=new T.Mesh(new T.CircleGeometry(.07,32),new T.MeshBasicMaterial({color:'#000001',side:T.DoubleSide}));throat.rotation.x=-Math.PI/2;throat.position.y=-5.63;root.add(throat);
 const lipProfile=[[.967,-.09],[.978,.025],[1.005,.085],[1.043,.09],[1.075,.035],[1.105,.005]].map(([r,y])=>new T.Vector2(r,y));
 const rim=new T.Mesh(new T.LatheGeometry(lipProfile,80),new T.MeshStandardMaterial({color:'#0c101e',metalness:.65,roughness:.25,envMapIntensity:.5,side:T.DoubleSide}));rim.receiveShadow=true;root.add(rim);
 const edge=new T.Mesh(new T.TorusGeometry(.991,.012,6,80),new T.MeshBasicMaterial({color:accent}));edge.rotation.x=-Math.PI/2;edge.position.y=.054;root.add(edge);
 const diskMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:flow,vertexShader:`
  varying vec2 vPlane;void main(){vPlane=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
 `,fragmentShader:`
  uniform float time,pulse;uniform vec3 tint,accent;varying vec2 vPlane;
  void main(){
   float r=length(vPlane),a=atan(vPlane.y,vPlane.x);
   float band=exp(-pow((r-1.075)*22.,2.));
   float streak=pow(max(0.,sin(a*4.-time*1.8+(r-1.)*24.)),9.);
   float fine=pow(max(0.,sin(a*31.+time*2.4+r*45.)),18.);
   float fade=smoothstep(.99,1.025,r)*(1.-smoothstep(1.12,1.26,r));
   float alpha=fade*band*(.07+streak*.45+fine*.12)*(1.+pulse*.55);
   gl_FragColor=vec4(mix(tint,accent,streak*.7),alpha);
  }
 `});
 const disk=new T.Mesh(new T.RingGeometry(.99,1.27,96,4),diskMaterial);disk.rotation.x=-Math.PI/2;disk.position.y=.075;root.add(disk);
 const arcs=new T.Group();root.add(arcs);
 for(let n=0;n<3;n++){
  const arc=new T.Mesh(new T.TorusGeometry(1.12+n*.035,.009,5,64,Math.PI*(.48+n*.07)),new T.MeshBasicMaterial({color:n===1?accent:color,transparent:true,opacity:n===1?.66:.42,depthWrite:false}));
  arc.rotation.set(-Math.PI/2,.035*n,n*2.1);arc.position.y=.11+n*.018;arcs.add(arc);
 }
 const count=56,seeds=new Float32Array(count*3);for(let n=0;n<count;n++){seeds[n*3]=n/count;seeds[n*3+1]=(n*.6180339)%1;seeds[n*3+2]=(n*.4142135)%1;}
 const dustGeometry=new T.BufferGeometry();dustGeometry.setAttribute('position',new T.BufferAttribute(seeds,3));
 const dustMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:flow,vertexShader:`
  uniform float time,pulse; varying float vFade;
  void main(){
   float f=fract(position.x+time*(.065+pulse*.018));
   float r=mix(1.15,.07,pow(f,.65));
   float a=position.y*6.283+f*16.-time*.3;
   vec3 p=vec3(cos(a)*r,.11-5.5*f,sin(a)*r);
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
   gl_PointSize=clamp((19.+position.z*15.)/max(1.,-mv.z),1.,2.3);
   vFade=(1.-f)*(.3+position.z*.6);
  }
 `,fragmentShader:`
  uniform vec3 tint,accent;varying float vFade;
  void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(mix(tint,accent,.65),vFade*(1.-d*d));}
 `});
 const dust=new T.Points(dustGeometry,dustMaterial);dust.frustumCulled=false;root.add(dust);
 const orbit=new T.Mesh(new T.TorusGeometry(1.32,.013,6,80,Math.PI*1.65),new T.MeshBasicMaterial({color:accent,transparent:true,opacity:.65,depthWrite:false}));orbit.rotation.set(-1.48,.04,.15);orbit.position.y=.16;root.add(orbit);
 const relation=new T.Mesh(new T.TorusGeometry(1.2,.012,5,64,Math.PI*1.6),new T.MeshBasicMaterial({color:'#91e4bf',transparent:true,opacity:.72,depthWrite:false}));relation.rotation.x=-Math.PI/2;relation.position.y=.09;relation.visible=false;root.add(relation);
 const shield=new T.Mesh(new T.TorusGeometry(1.17,.009,5,64),new T.MeshBasicMaterial({color:'#c6e8ff',transparent:true,opacity:.7,depthWrite:false}));shield.rotation.x=-Math.PI/2;shield.position.y=.1;shield.visible=false;root.add(shield);
 function setLook(nextColor,nextAccent,kind='plain'){
  flow.tint.value.set(nextColor);flow.accent.value.set(nextAccent);edge.material.color.set(nextAccent);
  arcs.children.forEach((a,i)=>a.material.color.set(i===1?nextAccent:nextColor));orbit.material.color.set(nextAccent);orbit.visible=['orbit','royal','rainbow'].includes(kind);
 }
 function update(time,pulse=0){flow.time.value=time;flow.pulse.value=pulse;arcs.rotation.y=time*.22;orbit.rotation.z=.15+Math.sin(time*.2)*.06;relation.rotation.z=time*.12;shield.material.opacity=.52+Math.sin(time*4)*.16;}
 setLook(color,accent);return{root,rim,orbit,relation,shield,setLook,update};
}
