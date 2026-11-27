import {T,mat,box,ball,cyl,ring,tube,group,coloredGeometry} from './geometry.mjs';
const SKIN=['#f0c9a3','#d9a57c','#bc8159','#82563f','#f4d2b5','#a36d4d'];
const SHIRTS=['#d47038','#305b92','#298366','#b44c59','#7652a4','#d5cbbb','#447d97','#99623e'];
const HAIR=['#2e292a','#4a342a','#b27d3b','#242936','#a19b90','#653e30'];

// Adult proportions and restrained bevels, based on the reference's isometric crowds.
export function characterGeometry(style=0,role='guest'){
 const root=group(),owner=role==='owner',staff=role==='staff';
 const skin=mat(owner?'#d5ab87':SKIN[style%6],.95),hair=mat(owner?'#b7b9bb':HAIR[style%6],1);
 const jacket=mat(owner?'#9b63c3':style===25?'#8e253d':style===26?'#e98131':style===27?'#547da7':SHIRTS[style%8],.95);
 const pants=mat(style===26?'#34597b':style%3===0?'#252b3a':style%3===1?'#494254':'#55514a',1);
 const white=mat('#e4e4dd',.95),black=mat('#202531',.95),gold=mat('#dfb93d',.72,.06);
 const body=group(root),female=!staff&&!owner&&style%4===2;
 box(body,0,1.64,0,female?.69:.77,1.0,.42,jacket,.045);box(body,0,1.13,.015,.68,.3,.4,pants,.025);
 if(owner||style===25){
  box(body,0,1.68,-.222,.42,.86,.025,white,.008);
  for(const side of [-1,1]){const lapel=box(body,side*.23,1.84,-.25,.2,.57,.033,jacket,.01);lapel.rotation.z=side*.25;}
  box(body,0,1.92,-.267,.11,.33,.025,black,.005);for(const y of [1.52,1.33])ball(body,0,y,-.251,.026,gold,[1,1,.3]);box(body,.25,1.8,-.248,.12,.055,.018,gold,.002);
 }else if(style===26){
  box(body,0,1.42,-.241,.55,.52,.035,pants,.012);for(const x of [-.23,.23])box(body,x,1.86,-.235,.08,.55,.035,pants,.009);box(body,0,1.5,-.267,.26,.17,.025,mat('#527a9b'),.005);
 }else if(style===27){box(body,.25,1.85,-.23,.16,.08,.025,white,.005);box(body,0,1.9,-.236,.025,.44,.025,white,.002);}
 else{
  box(body,0,2.11,-.035,.46,.08,.38,style%3===0?white:jacket,.012);
  if(style%4===0)for(const y of [1.36,1.6,1.84])box(body,0,y,-.225,.67,.055,.018,mat('#e0ded2'),.003);
  if(style%4===1)box(body,.21,1.8,-.235,.18,.21,.02,mat('#a4b6c8'),.007);
  if(female)box(body,0,1.12,.01,.81,.43,.47,jacket,.025);
 }
 cyl(body,0,2.25,0,.12,.23,skin,.13,10);box(body,0,2.65,-.008,.55,.66,.47,skin,.075);
 for(const side of [-1,1])box(body,side*.285,2.63,.005,.075,.17,.12,skin,.025);
 if(owner){for(const side of [-1,1])box(body,side*.255,2.77,.085,.09,.34,.35,hair,.025);box(body,0,2.81,.22,.47,.25,.08,hair,.02);}
 else{
  box(body,0,2.96,.035,.59,.17,.48,hair,.035);for(const side of [-1,1])box(body,side*.257,2.82,.09,.09,.29,.35,hair,.015);
  if(style%4===0){const fringe=box(body,-.1,2.98,-.17,.4,.14,.22,hair,.025);fringe.rotation.z=.16;}
  if(female){box(body,0,2.67,.205,.6,.55,.19,hair,.04);ball(body,.05,2.89,.39,.19,hair,[.65,1.25,.8]);}
 }
 if(style%6===1||style===26){box(body,0,3.06,.02,.65,.15,.55,mat('#597ba5'),.025);box(body,0,2.99,-.27,.62,.05,.31,mat('#3d587d'),.012);}
 else if(style%6===3&&!staff&&!owner){box(body,0,3.06,.01,.75,.055,.63,mat('#c3a66c'),.012);box(body,0,3.18,.04,.45,.23,.42,mat('#d3b783'),.025);box(body,0,3.1,-.179,.45,.06,.025,black,.003);}
 for(const side of [-1,1]){box(body,side*.119,2.69,-.254,.053,.073,.022,black,.009);const brow=box(body,side*.119,2.8,-.245,.123,.025,.024,hair,.003);brow.rotation.z=-side*(style%3-.7)*.1;}
 box(body,0,2.6,-.276,.08,.11,.09,skin,.025);tube(body,[[-.074,2.49,-.247],[0,2.475,-.26],[.074,2.49,-.247]],.012,mat('#7c4941'));
 if(owner||style%6===0){for(const side of [-1,1]){const glasses=ring(body,side*.127,2.69,-.278,.101,.013,owner?gold:black,0);glasses.scale.set(1,.8,1);}box(body,0,2.69,-.28,.075,.018,.018,owner?gold:black,.002);}
 if(style%8===5)box(body,0,2.46,-.21,.33,.15,.17,hair,.03);
 for(const side of [-1,1]){
  const arm=group(root,side*.47,2.05,0);arm.userData.part=side<0?1:2;
  box(arm,0,-.23,0,.235,.51,.29,jacket,.035);box(arm,0,-.65,-.015,.18,.45,.22,(owner||style===25)?white:jacket,.025);box(arm,0,-.96,-.02,.18,.2,.19,skin,.032);
  if(owner||style===25)box(arm,0,-.86,-.018,.2,.07,.23,white,.009);
  const thigh=group(root,side*.2,1.1,0);thigh.userData.part=side<0?3:4;box(thigh,0,-.26,0,.255,.55,.29,pants,.025);
  const calf=group(root,side*.2,.56,0);calf.userData.part=side<0?5:6;box(calf,0,-.23,0,.225,.48,.25,pants,.021);box(calf,0,-.47,-.09,.28,.17,.45,style%3===0&&!staff&&!owner?white:black,.025);box(calf,0,-.545,-.09,.285,.035,.45,mat('#74777c'),.005);
  if(style===25&&side<0){box(arm,0,-.96,-.16,.24,.055,.35,white,.008);box(arm,0,-.925,-.16,.04,.012,.32,mat('#e6ba3f'),.003);}
  if(style===27&&side>0){tube(arm,[[0,-.85,-.06],[.15,-1.87,-.42]],.033,mat('#bba06b'));box(arm,.15,-1.89,-.42,.59,.11,.33,mat('#95783e'),.012);for(let j=0;j<7;j++)box(arm,-.1+j*.084,-1.99,-.42,.035,.14,.31,mat('#d3c08b'),.004);}
 }
 return coloredGeometry(root);
}

const poseGLSL=`
attribute float part;attribute float aWalk;attribute float aSit;attribute float aCarry;attribute float aPhase;attribute float aCheer;uniform float motionTime;
vec3 rX(vec3 v,float a){return vec3(v.x,cos(a)*v.y-sin(a)*v.z,sin(a)*v.y+cos(a)*v.z);}
vec3 rZ(vec3 v,float a){return vec3(cos(a)*v.x-sin(a)*v.y,sin(a)*v.x+cos(a)*v.y,v.z);}
float stride(){return sin(motionTime*8.6+aPhase)*aWalk;}
float armX(float side){return mix(-side*stride()*.36+aCarry*.91+aSit*.18,2.35+sin(motionTime*11.+aPhase)*.09,aCheer);}
float armZ(float side){return -side*aCarry*.3*(1.-aCheer)+side*aCheer*(.52+.21*(.5+.5*sin(motionTime*12.+aPhase)));}
vec3 pose(vec3 p){float side=(part==1.||part==3.||part==5.)?-1.:1.;
 if(part>2.5){vec3 hip=vec3(side*.2,1.1,0.);if(part>4.5){vec3 knee=vec3(side*.2,.56,0.);p=knee+rX(p-knee,-1.4*aSit);}p=hip+rX(p-hip,side*stride()*.5+1.4*aSit);}
 else if(part>.5){vec3 shoulder=vec3(side*.47,2.05,0.);p=shoulder+rZ(rX(p-shoulder,armX(side)),armZ(side));}
 p.y-=aSit*.33;p.y+=abs(sin(motionTime*8.6+aPhase))*.035*aWalk;return p;}
vec3 poseN(vec3 n){float side=(part==1.||part==3.||part==5.)?-1.:1.;if(part>2.5){if(part>4.5)n=rX(n,-1.4*aSit);return rX(n,side*stride()*.5+1.4*aSit);}if(part>.5)return rZ(rX(n,armX(side)),armZ(side));return n;}
`;

export class CrowdRenderer{
 constructor(scene){this.time={value:0};this.batches=[];this.dummy=new T.Object3D();
  for(let i=0;i<28;i++){
   const geometry=characterGeometry(i,i===24?'owner':i>24?'staff':'guest');
   const values={aWalk:new Float32Array(100),aSit:new Float32Array(100),aCarry:new Float32Array(100),aPhase:new Float32Array(100),aCheer:new Float32Array(100)};
   for(const [k,v] of Object.entries(values))geometry.setAttribute(k,new T.InstancedBufferAttribute(v,1));
   const compile=shader=>{shader.uniforms.motionTime=this.time;shader.vertexShader=poseGLSL+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=pose(transformed);').replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=poseN(objectNormal);');};
   const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.96,metalness:0});material.onBeforeCompile=compile;material.customProgramCacheKey=()=>'cinema-adult-rig-v3';
   const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});depth.onBeforeCompile=compile;depth.customProgramCacheKey=()=>'cinema-adult-rig-depth-v3';
   const mesh=new T.InstancedMesh(geometry,material,100);mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=mesh.receiveShadow=true;mesh.customDepthMaterial=depth;mesh.frustumCulled=false;scene.add(mesh);this.batches.push({mesh,...values,count:0});
  }
 }
 begin(time){this.time.value=time;for(const b of this.batches)b.count=0;}
 add(style,x,y,z,angle=0,walking=false,seated=false,carry=0,seed=0,cheering=0){const b=this.batches[style],i=b.count++;if(i>=100)return;this.dummy.position.set(x,y,z);this.dummy.rotation.set(0,angle,0);const scale=style<24?.93+(style%5)*.025:1;this.dummy.scale.setScalar(scale);this.dummy.updateMatrix();b.mesh.setMatrixAt(i,this.dummy.matrix);b.aWalk[i]=walking?1:0;b.aSit[i]=typeof seated==='number'?seated:seated?1:0;b.aCarry[i]=Math.min(1,carry||0);b.aPhase[i]=seed*.73;b.aCheer[i]=cheering;}
 end(){for(const b of this.batches){b.mesh.count=Math.min(100,b.count);b.mesh.instanceMatrix.needsUpdate=true;for(const k of ['aWalk','aSit','aCarry','aPhase','aCheer'])b.mesh.geometry.attributes[k].needsUpdate=true;}}
}
