import * as T from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from '../vendor/utils/BufferGeometryUtils.js';
import {clamp} from './math.mjs';

const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),identity=new T.Quaternion();
export const COURIER={name:'越隙领航员',number:'07',height:1.91};
const material=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
export function courierPalette(){
 return{orange:material('#ec642d',.62),ivory:material('#f3eee1',.43,.12),fabric:material('#293c4a',.92),rubber:material('#14252e',.88),metal:material('#7d959d',.28,.82),glass:new T.MeshPhysicalMaterial({color:'#285c73',emissive:'#143748',emissiveIntensity:.25,roughness:.15,metalness:.42,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.25}),teal:new T.MeshStandardMaterial({color:'#9bf5dd',emissive:'#43caae',emissiveIntensity:.48,roughness:.25,metalness:.3}),strap:material('#536872',.92)};
}
const rounded=(w,h,d,r=.025)=>new RoundedBoxGeometry(w,h,d,2,Math.min(r,w*.38,h*.38,d*.38));
const mesh=(geometry,mat)=>{const m=new T.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;return m;};

// Every visible piece is authored here. The CC0 rig supplies only motion transforms.
export function createCourier(rig){
 const root=new T.Group();root.name='ConvoyCourier07';root.scale.setScalar(rig.scale);const bones={},palette=courierPalette(),batches=new Map();
 for(const data of rig.bones){const bone=new T.Bone();bone.name=data.name;bone.position.fromArray(data.position);bone.quaternion.fromArray(data.quaternion);bone.scale.fromArray(data.scale);bones[data.name]=bone;}
 for(const data of rig.bones)(data.parent?bones[data.parent]:root).add(bones[data.name]);
 root.updateMatrixWorld(true);
 const rest=name=>bones[name].getWorldPosition(v());
 function piece(bone,mat,geometry,position,scale=[1,1,1],quaternion=identity){
  const transform=new T.Matrix4().compose(position instanceof T.Vector3?position:v(...position),quaternion,v(...scale));
  transform.premultiply(bones[bone].matrixWorld.clone().invert());geometry.applyMatrix4(transform);
  const key=bone+':'+mat;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(geometry.index?geometry.toNonIndexed():geometry);if(geometry.index)geometry.dispose();
 }
 const box=(bone,mat,size,pos,r=.02)=>piece(bone,mat,rounded(...size,r),pos);
 const oval=(bone,mat,size,pos)=>piece(bone,mat,new T.SphereGeometry(1,16,12),pos,size);
 const tube=(bone,mat,a,b,r1,r2=r1)=>{const delta=b.clone().sub(a);piece(bone,mat,new T.CylinderGeometry(r2,r1,delta.length(),14),a.clone().add(b).multiplyScalar(.5),[1,1,1],new T.Quaternion().setFromUnitVectors(v(0,1,0),delta.normalize()));};
 const torus=(bone,mat,pos,radius,tubeSize=.012,rotation=identity)=>piece(bone,mat,new T.TorusGeometry(radius,tubeSize,8,32),pos,[1,1,1],rotation);
 function attach(bone,object,position){object.position.copy(position instanceof T.Vector3?position:v(...position));object.updateMatrixWorld(true);bones[bone].attach(object);return object;}

 // Tapered flight jacket, layered neck seal, asymmetric chest plate and harness.
 const ring=[[-.65,-1],[.65,-1],[1,-.65],[1,.65],[.65,1],[-.65,1],[-1,.65],[-1,-.65]],levels=[[1.01,.155,.112],[1.06,.177,.13],[1.28,.238,.145],[1.40,.245,.125],[1.445,.191,.105]],positions=[],uv=[],indices=[];
 for(let j=0;j<levels.length;j++){const[y,w,d]=levels[j];for(let i=0;i<ring.length;i++){positions.push(ring[i][0]*w,y,ring[i][1]*d);uv.push(i/8,j/4);}if(j<levels.length-1)for(let i=0;i<8;i++){const a=j*8+i,b=j*8+(i+1)%8;indices.push(a,b,a+8,b,b+8,a+8);}}
 for(let i=1;i<7;i++){indices.push(0,i+1,i,32,32+i,33+i);}for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];const jacket=new T.BufferGeometry();jacket.setAttribute('position',new T.Float32BufferAttribute(positions,3));jacket.setAttribute('uv',new T.Float32BufferAttribute(uv,2));jacket.setIndex(indices);jacket.computeVertexNormals();piece('spine_03','orange',jacket,[0,0,0]);
 oval('pelvis','fabric',[.18,.12,.125],[0,.96,.012]);box('spine_01','rubber',[.355,.067,.255],[0,1.035,.008]);box('spine_01','metal',[.058,.05,.023],[0,1.037,.147]);
 oval('neck_01','rubber',[.087,.075,.083],[0,1.495,.015]);
 box('spine_03','ivory',[.35,.19,.032],[.015,1.315,.152]);box('spine_03','fabric',[.125,.091,.011],[.065,1.33,.177]);
 // Geometric 07 insignia; no bitmap decals or borrowed clothing.
 for(const [x,y,w,h]of[[.031,1.355,.029,.007],[.031,1.307,.029,.007],[.013,1.331,.006,.05],[.049,1.331,.006,.05],[.086,1.355,.035,.007],[.099,1.331,.007,.049]])box('spine_03','ivory',[w,h,.006],[x,y,.186],.001);
 for(const side of[-1,1]){box('spine_03','strap',[.036,.35,.025],[side*.142,1.25,.164]);box('spine_03','metal',[.053,.045,.018],[side*.142,1.18,.184]);box('spine_03','ivory',[.037,.052,.008],[side*.142,1.4,.186]);}
 box('spine_03','teal',[.045,.012,.015],[-.064,1.32,.177]);box('spine_03','fabric',[.17,.065,.021],[-.025,1.12,.143]);

 // Independent sleeves, articulated gloves, cargo trousers and knee protection.
 const bootPistons=[];
 for(const side of['l','r']){
  const sign=side==='l'?1:-1,shoulder=rest('upperarm_'+side),elbow=rest('lowerarm_'+side),wrist=rest('hand_'+side),hip=rest('thigh_'+side),knee=rest('calf_'+side),ankle=rest('foot_'+side);
  oval('upperarm_'+side,'orange',[.087,.09,.09],shoulder);tube('upperarm_'+side,'orange',shoulder,elbow,.082,.067);oval('lowerarm_'+side,'rubber',[.066,.061,.063],elbow);
  tube('lowerarm_'+side,'fabric',elbow,wrist,.066,.045);const reflect=shoulder.clone().lerp(elbow,.34);tube('upperarm_'+side,'ivory',reflect,reflect.clone().lerp(elbow,.18),.084);
  const forearm=elbow.clone().lerp(wrist,.68);oval('lowerarm_'+side,'orange',[.058,.06,.062],forearm);
  const middle=rest('middle_02_'+side),handCenter=wrist.clone().lerp(middle,.45);oval('hand_'+side,'rubber',[.055,.08,.042],handCenter);box('hand_'+side,'ivory',[.075,.046,.032],[handCenter.x,handCenter.y,handCenter.z-.029]);
  for(const finger of['index','middle','ring','pinky']){const a=rest(finger+'_01_'+side),b=rest(finger+'_03_'+side);tube('hand_'+side,'rubber',a,b,.014,.012);}
  tube('thigh_'+side,'fabric',hip,knee,.098,.075);oval('thigh_'+side,'fabric',[.1,.1,.104],hip);
  const pocket=hip.clone().lerp(knee,.44);box('thigh_'+side,'orange',[.059,.15,.13],[pocket.x+sign*.082,pocket.y,pocket.z]);box('thigh_'+side,'ivory',[.064,.025,.12],[pocket.x+sign*.084,pocket.y+.047,pocket.z+.004]);
  oval('calf_'+side,'rubber',[.078,.072,.075],knee);tube('calf_'+side,'fabric',knee,ankle,.072,.054);box('calf_'+side,'ivory',[.12,.13,.06],[knee.x,knee.y-.026,knee.z+.067]);box('calf_'+side,'orange',[.066,.07,.012],[knee.x,knee.y-.023,knee.z+.103]);
  box('calf_'+side,'orange',[.096,.05,.075],[ankle.x,ankle.y+.125,ankle.z]);
  const foot='foot_'+side,x=ankle.x,z=ankle.z+.066;
  box(foot,'rubber',[.172,.065,.31],[x,.043,z],.022);box(foot,'orange',[.174,.025,.295],[x,.078,z],.012);box(foot,'fabric',[.145,.135,.245],[x,.135,z-.015],.028);box(foot,'ivory',[.151,.085,.115],[x,.123,z+.097],.025);
  for(const xoff of[-.081,.081]){tube(foot,'metal',v(x+xoff,.087,z-.09),v(x+xoff,.155,z-.09),.009);box(foot,'teal',[.012,.021,.048],[x+xoff,.066,z+.045],.004);}
  for(let i=0;i<3;i++)box(foot,'strap',[.115,.013,.018],[x,.195-i*.018,z+.033-i*.018],.004);
  const suspension=new T.Group();suspension.name='heel-suspension-'+side;const heel=mesh(rounded(.13,.025,.075,.009),palette.metal);heel.position.y=.012;suspension.add(heel);attach(foot,suspension,[x,.07,z-.10]);bootPistons.push(suspension);
 }

 // Full helmet: curved visor, ceramic shell, orange crown, ear hardware and beacon.
 const helmetY=1.694;
 oval('head','ivory',[.185,.215,.183],[0,helmetY,.036]);oval('head','rubber',[.162,.083,.151],[0,1.551,.047]);
 piece('head','glass',new T.SphereGeometry(1,36,20,Math.PI*.13,Math.PI*.74,Math.PI*.28,Math.PI*.42),[0,helmetY,.041],[.192,.22,.19]);
 box('head','orange',[.05,.025,.24],[0,1.899,.023],.01);box('head','orange',[.044,.12,.02],[0,1.83,-.123],.01);box('head','ivory',[.24,.025,.07],[0,1.568,.168],.012);
 for(const side of[-1,1]){const q=new T.Quaternion().setFromAxisAngle(v(0,0,1),Math.PI/2);piece('head','rubber',new T.CylinderGeometry(.067,.067,.038,20),[side*.178,1.67,.023],[1,1,1],q);piece('head','ivory',new T.CylinderGeometry(.052,.052,.043,20),[side*.195,1.67,.023],[1,1,1],q);box('head','orange',[.014,.047,.035],[side*.221,1.67,.023],.005);}
 box('head','fabric',[.026,.087,.025],[-.15,1.826,-.034],.006);oval('head','teal',[.018,.018,.018],[-.15,1.874,-.034]);
 tube('head','teal',v(-.115,1.718,.196),v(-.061,1.734,.217),.004);

 // Exposed time gyroscope, not a cloth backpack. Three rings animate during focus.
 box('spine_03','fabric',[.235,.36,.105],[0,1.268,-.169]);
 for(const side of[-1,1]){box('spine_03','metal',[.025,.4,.035],[side*.154,1.29,-.194],.007);box('spine_03','orange',[.06,.05,.07],[side*.154,1.455,-.195],.009);}
 const gyro=new T.Group();gyro.name='time-gyroscope';
 const rotors=[];
 for(let i=0;i<3;i++){const rotor=new T.Group();rotor.rotation.set(i===1?.67:0,i===2?.85:0,i*.5);const rim=mesh(new T.TorusGeometry(.125-i*.026,.012,8,36),i===0?palette.orange:i===1?palette.metal:palette.teal);rotor.add(rim);gyro.add(rotor);rotors.push(rotor);}
 const core=mesh(new T.SphereGeometry(.041,16,12),palette.teal);gyro.add(core);attach('spine_03',gyro,[0,1.295,-.256]);
 const cells=[];for(let i=0;i<3;i++){const cell=mesh(rounded(.042,.029,.017,.005),palette.teal.clone());attach('spine_03',cell,[(i-1)*.058,1.087,-.234]);cells.push(cell);}
 // Side-mounted tether reel and luminous wrist instrument.
 const hip=rest('thigh_r');torus('thigh_r','metal',[hip.x-.092,hip.y-.08,hip.z+.035],.043,.009,new T.Quaternion().setFromAxisAngle(v(0,1,0),Math.PI/2));box('thigh_r','orange',[.036,.12,.095],[hip.x-.09,hip.y-.095,hip.z+.013]);
 const wrist=rest('hand_l').lerp(rest('lowerarm_l'),.2);box('lowerarm_l','ivory',[.10,.055,.085],[wrist.x,wrist.y,wrist.z+.029]);box('lowerarm_l','glass',[.071,.035,.008],[wrist.x,wrist.y,wrist.z+.077]);
 for(let i=0;i<3;i++)box('lowerarm_l','teal',[.012,.021,.004],[wrist.x+(i-1)*.019,wrist.y,wrist.z+.083],.002);

 for(const[key,geometries]of batches){const[bone,mat]=key.split(':'),combined=mergeGeometries(geometries);const m=mesh(combined,palette[mat]);m.name='courier-'+bone+'-'+mat;bones[bone].add(m);for(const g of geometries)g.dispose();}
 root.userData.design='Original courier geometry; CC0 motion skeleton only';
 return{root,bones,palette,rotors,cells,bootPistons,update(dt,{focus=0,active=false,impact=0}={}){for(let i=0;i<rotors.length;i++){rotors[i].rotation.z+=dt*(active?5.3:1.0)*(i%2?-1:1);if(i>0)rotors[i].rotation.y+=dt*(active?2.2:.25);}for(let i=0;i<cells.length;i++)cells[i].material.emissiveIntensity=focus>(i+.2)/3?(active?1.5:.5):.03;for(const heel of bootPistons)heel.scale.y=1-clamp(-impact*1.5,0,.45);}};
}

export function createFirstPersonGear(){
 const root=new T.Group();root.name='courier-first-person';const palette=courierPalette(),hands=[],cells=[];
 for(const side of[-1,1]){
  const hand=new T.Group();hand.position.set(side*.47,-.43,-.74);hand.rotation.set(-.30,side*.18,side*-.26);root.add(hand);hands.push(hand);
  const part=(geometry,mat,x,y,z)=>{const m=mesh(geometry,palette[mat]);m.position.set(x,y,z);hand.add(m);return m;};
  part(rounded(.145,.28,.13,.033),'orange',0,-.18,.10);part(rounded(.15,.047,.14,.012),'ivory',0,-.065,.055);part(rounded(.12,.14,.10,.03),'rubber',0,.015,0);
  part(rounded(.105,.05,.034,.01),'ivory',0,.03,.053);
  for(let i=0;i<4;i++)part(rounded(.022,.06,.041,.009),'rubber',(i-1.5)*.027,.074,-.018);
  if(side===-1){part(rounded(.13,.071,.036,.012),'fabric',0,-.09,.139);part(rounded(.105,.048,.008,.005),'glass',0,-.09,.163);for(let i=0;i<4;i++){const cell=part(rounded(.014,.027,.004,.002),'teal',(i-1.5)*.022,-.09,.17);cell.material=palette.teal.clone();cells.push(cell);}}
 }
 return{root,hands,update(time,p,focus,active,impact,portrait=false){const speed=Math.min(1,Math.hypot(p.relX,p.relS)/8),air=p.grounded?0:1;for(let i=0;i<hands.length;i++){const h=hands[i],side=i===0?-1:1;h.position.y=-.49+Math.sin(time*13+i*Math.PI)*speed*.045+air*.11-impact*.35+(active&&i===0?.18:0);h.position.x=side*((portrait?.30:.48)+(active&&i===0?-.08:0)+Math.cos(time*6.5)*speed*.013);h.rotation.x=-.30+air*.4+(active&&i===0?.5:0);}for(let i=0;i<cells.length;i++)cells[i].material.emissiveIntensity=focus>(i+.2)/4?(active?1.7:.6):.02;}};
}
