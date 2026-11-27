import * as T from './vendor/three.module.js';
import {products} from './packing.mjs';

const models=new Map();
const surfaces=new Map();
const sphere=new T.SphereGeometry(1,24,16);
const cylinder=new T.CylinderGeometry(1,1,1,32);

function enamel(color,roughness=.39,metalness=0) {
  const key=[color,roughness,metalness].join(':');
  if(!surfaces.has(key)) surfaces.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));
  return surfaces.get(key);
}

function part(group,geometry,material,x,y,z) {
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  group.add(mesh);
  return mesh;
}

function slab(group,x,y,z,w,h,d,r,material) {
  const shape=new T.Shape(), a=w/2,b=h/2;
  shape.moveTo(-a+r,-b+r);shape.lineTo(a-r,-b+r);shape.lineTo(a-r,b-r);
  shape.lineTo(-a+r,b-r);shape.closePath();
  const shell=new T.ExtrudeGeometry(shape,{
    depth:d-2*r,bevelEnabled:true,bevelSegments:5,bevelSize:r,bevelThickness:r,curveSegments:4,
  });
  shell.translate(0,0,-d/2+r);
  return part(group,shell,material,x,y,z);
}

function oval(group,x,y,z,rx,ry,rz,material) {
  const mesh=part(group,sphere,material,x,y,z);
  mesh.scale.set(rx,ry,rz);
  return mesh;
}

function cup(group,x,y,z,rx,h,rz,material) {
  const mesh=part(group,cylinder,material,x,y,z);
  mesh.scale.set(rx,h,rz);
  return mesh;
}

function cord(group,points,radius,material) {
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  return part(group,new T.TubeGeometry(path,30,radius,9),material,0,0,0);
}

function lathe(group,profile,material,zScale=1) {
  const mesh=part(group,new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),32),material,0,0,0);
  mesh.scale.z=zScale;
  return mesh;
}

const gold=enamel('#dda34d',.29,.29);
const silver=enamel('#aab8bf',.24,.40);
const chalk=enamel('#fff1dc',.39);
const graphite=enamel('#263047',.47);
const dark=enamel('#171828',.40);
const light=enamel('#bdeecf',.22);

function coffee(model,color) {
  slab(model,-.226,-.011,-.15,.39,.89,.63,.08,color);
  slab(model,.115,-.428,0,.68,.13,.90,.048,color);
  slab(model,.129,-.334,.155,.60,.053,.65,.022,silver);
  for(let i=0;i<6;i++) slab(model,-.08+i*.085,-.302,.15,.026,.015,.53,.005,graphite);
  slab(model,.04,.307,.024,.85,.31,.88,.105,color);
  slab(model,.04,.314,.478,.64,.173,.05,.020,graphite);
  for(const [x,c] of [[-.167,light],[-.041,silver],[.175,gold]]) {
    oval(model,x,.314,.518,.036,.041,.022,c);
  }
  cup(model,.125,.133,.20,.154,.10,.146,silver);
  cup(model,.125,.058,.20,.043,.074,.045,graphite);
  const mug=lathe(model,[[0,-.294],[.118,-.294],[.151,-.242],[.163,-.106],[.157,-.096],
    [.136,-.098],[.127,-.238],[0,-.26]],chalk);
  mug.position.set(.116,0,.243);
  cup(model,.116,-.114,.243,.133,.01,.133,enamel('#60301d',.30));
  cord(model,[[.258,-.117,.257],[.363,-.142,.259],[.358,-.221,.263],[.25,-.263,.263]],.026,chalk);
}

function perfume(model) {
  const glass=enamel('#ec609e',.22,.11);
  lathe(model,[[0,-.466],[.22,-.46],[.34,-.42],[.42,-.355],[.42,-.08],
    [.365,.005],[.197,.13],[.118,.18],[.115,.221],[0,.221]],glass,.93);
  lathe(model,[[0,-.435],[.25,-.434],[.362,-.389],[.367,-.338],[0,-.338]],enamel('#ffb0c8',.18,.12),1.07);
  cup(model,0,.217,0,.148,.093,.16,gold);
  slab(model,0,.348,0,.38,.209,.37,.07,gold);
  slab(model,0,.444,0,.303,.045,.305,.018,chalk);
  slab(model,0,-.183,.386,.412,.264,.034,.013,chalk);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    oval(model,Math.sin(a)*.061,-.18+Math.cos(a)*.065,.415,.041,.037,.019,glass);
  }
  oval(model,0,-.18,.423,.027,.027,.015,gold);
  oval(model,-.267,-.205,.29,.045,.131,.024,enamel('#ffd6e4',.21));
}

function headphones(model,color) {
  cord(model,[[-.36,-.18,0],[-.356,.119,0],[-.237,.349,0],[0,.423,0],[.237,.349,0],[.356,.119,0],[.36,-.18,0]],.063,color);
  cord(model,[[-.274,.177,-.025],[-.181,.302,-.024],[0,.342,-.023],[.181,.302,-.024],[.274,.177,-.025]],.040,graphite);
  for(const direction of [-1,1]){
    const x=direction*.323;
    const pad=slab(model,x,-.196,.034,.269,.493,.44,.093,graphite);
    pad.rotation.z=direction*.08;
    const shell=slab(model,x+direction*.04,-.175,.18,.211,.415,.37,.078,color);
    shell.rotation.z=direction*.08;
    oval(model,x+direction*.05,-.172,.371,.066,.119,.028,silver);
    oval(model,x+direction*.05,-.162,.397,.039,.075,.015,enamel('#bf9dec',.35));
  }
}

function wrappedTin(model,color,kind) {
  slab(model,0,0,0,.94,.87,.58,.16,color);
  slab(model,0,-.016,.257,.95,.91,.102,.043,gold);
  slab(model,0,-.002,.313,.86,.79,.11,.049,color);
  if(kind==='cookies') {
    for(const [x,y] of [[-.148,-.063],[.128,.043]]){
      oval(model,x,y,.382,.151,.232,.025,enamel('#fcce70'));
      for(const [dx,dy] of [[-.037,.06],[.045,-.031],[.028,.10],[-.059,-.104]]){
        oval(model,x+dx,y+dy,.407,.013,.026,.006,enamel('#835032'));
      }
    }
  }else{
    for(let i=0;i<2;i++){
      oval(model,-.11+i*.18,.015,.382,.106,.247,.017,enamel('#d0f0a0')).rotation.z=(i-.5)*.76;
    }
    cord(model,[[-.14,-.25,.404],[-.028,-.07,.408],[.18,.18,.401]],.011,chalk);
  }
}

function cocoa(model) {
  const wrapper=enamel('#9b4b34');
  slab(model,0,-.028,0,.85,.90,.46,.089,wrapper);
  slab(model,0,.175,.237,.75,.518,.05,.019,enamel('#5a3129'));
  for(let y=0;y<3;y++)for(let x=0;x<2;x++){
    slab(model,-.173+x*.346,.02+y*.157,.275,.304,.129,.045,.018,enamel('#79463a'));
  }
  slab(model,0,-.19,.248,.83,.071,.068,.029,gold);
  slab(model,0,-.345,.259,.57,.13,.043,.018,chalk);
  oval(model,0,-.345,.288,.092,.046,.015,wrapper);
}

function speaker(model,color) {
  slab(model,0,0,0,.82,.88,.73,.166,color);
  slab(model,0,0,.311,.74,.76,.212,.099,graphite);
  for(const [y,r] of [[.178,.108],[-.135,.203]]){
    const ring=oval(model,0,y,.419,r*1.11,r,.029,silver);
    ring.scale.y*=1.04;
    oval(model,0,y,.437,r*.94,r*.86,.034,dark);
    oval(model,0,y,.467,r*.45,r*.40,.021,color);
  }
  for(let i=0;i<3;i++)oval(model,-.071+i*.071,-.372,.382,.014,.014,.013,light);
}

function sparklingBottle(model,color) {
  lathe(model,[[0,-.476],[.266,-.475],[.331,-.442],[.333,-.071],[.303,.026],
    [.168,.146],[.12,.246],[.118,.415],[0,.419]],color,1.16);
  cup(model,0,.322,0,.134,.205,.161,gold);
  cup(model,0,.432,0,.161,.088,.182,gold);
  cup(model,0,-.205,0,.337,.204,.392,chalk);
  oval(model,0,-.202,.397,.126,.064,.016,gold);
  oval(model,-.226,-.18,.316,.027,.142,.015,light);
}

function candles(model) {
  slab(model,0,-.37,0,.98,.207,.71,.077,enamel('#b64162'));
  for(const [x,h,c] of [[-.30,.574,'#f4bd61'],[0,.68,'#c989db'],[.30,.50,'#e87383']]){
    cup(model,x,h/2-.315,0,.118,h,.209,enamel(c,.24));
    cup(model,x,h-.31,0,.106,.04,.19,chalk);
    cup(model,x,h-.277,0,.015,.062,.018,graphite);
  }
}

function jam(model,color) {
  lathe(model,[[0,-.473],[.29,-.473],[.401,-.43],[.433,-.34],[.433,.152],[.37,.267],[.355,.304],[0,.307]],color,.87);
  cup(model,0,.326,0,.394,.148,.365,gold);
  cup(model,0,.416,0,.413,.078,.382,chalk);
  slab(model,0,-.131,.379,.61,.281,.049,.023,chalk);
  for(const [x,y] of [[-.067,-.13],[.074,-.14],[0,-.202]]){
    oval(model,x,y,.408,.062,.062,.02,enamel('#a13167'));
  }
  oval(model,-.025,-.068,.412,.075,.024,.01,enamel('#457a5b')).rotation.z=.38;
}

function camera(model,color) {
  slab(model,0,-.051,0,.94,.735,.64,.12,color);
  slab(model,0,.014,.285,.89,.575,.24,.106,chalk);
  slab(model,-.287,.186,.415,.196,.145,.095,.033,silver);
  slab(model,-.287,.195,.466,.135,.094,.040,.017,light);
  const barrel=cup(model,.117,-.033,.425,.243,.218,.281,graphite);
  barrel.rotation.x=Math.PI/2;
  oval(model,.117,-.033,.552,.202,.246,.077,silver);
  oval(model,.117,-.033,.620,.160,.192,.056,dark);
  oval(model,.117,-.033,.665,.105,.128,.024,enamel('#508e9c',.18,.20));
  oval(model,.076,.025,.684,.032,.046,.012,light);
  slab(model,.254,.359,0,.182,.116,.231,.050,graphite);
}

function kettle(model,color) {
  lathe(model,[[0,-.467],[.20,-.467],[.31,-.414],[.34,-.306],[.34,-.047],[.286,.131],[.217,.21],[0,.228]],color,1.36);
  cup(model,0,.216,0,.238,.074,.306,silver);
  oval(model,0,.281,0,.093,.073,.111,graphite);
  cord(model,[[-.23,-.266,.029],[-.392,-.125,.012],[-.387,.062,0],[-.407,.252,0],[-.455,.272,0]],.047,silver);
  cord(model,[[.228,.128,-.036],[.368,.173,-.045],[.446,.091,-.063],[.432,-.068,-.048],[.29,-.195,-.036]],.046,graphite);
  oval(model,-.146,-.114,.411,.039,.127,.019,light);
}

function lamp(model,color) {
  lathe(model,[[0,-.48],[.31,-.48],[.36,-.43],[.33,-.31],[.23,-.24],[.13,-.04],[.11,.10],[0,.12]],color,1.05);
  lathe(model,[[0,.09],[.42,.09],[.48,.14],[.44,.23],[.36,.34],[.25,.43],[.13,.47],[0,.48]],chalk,1.01);
  lathe(model,[[.39,.098],[.465,.127],[.47,.171],[.454,.195]],enamel('#ffdf9d'),1.02);
  oval(model,.006,.462,0,.072,.037,.09,gold);
  oval(model,0,-.337,.329,.05,.046,.035,gold);
}

function cookingPot(model,color) {
  lathe(model,[[0,-.446],[.282,-.444],[.344,-.404],[.386,-.268],[.395,.094],[0,.095]],color,1.33);
  lathe(model,[[0,.11],[.399,.105],[.412,.153],[.364,.205],[.25,.264],[.07,.282],[0,.285]],color,1.35);
  lathe(model,[[.369,.086],[.4,.095],[.407,.144],[.394,.155]],silver,1.34);
  for(const d of [-1,1]){
    cord(model,[[.337*d,-.066,0],[.458*d,-.05,0],[.465*d,.043,0],[.341*d,.05,0]],.032,graphite);
  }
  oval(model,0,.31,0,.088,.053,.101,gold);
  oval(model,-.205,-.111,.477,.042,.12,.024,enamel('#b9a1eb'));
}

function controller(model,color) {
  slab(model,0,.094,0,.74,.71,.47,.16,color);
  for(const d of [-1,1]){
    const grip=oval(model,d*.306,-.126,-.01,.165,.33,.24,color);
    grip.rotation.z=d*.36;
    const bumper=slab(model,d*.238,.384,-.028,.217,.16,.29,.047,graphite);
    bumper.rotation.z=d*-.16;
    oval(model,d*.115,-.07,.245,.075,.154,.033,graphite);
  }
  slab(model,-.277,.182,.253,.146,.092,.052,.018,graphite);
  slab(model,-.277,.182,.258,.043,.301,.053,.019,graphite);
  for(const [x,y,c] of [[.25,.224,'#70d9ca'],[.348,.221,'#ffc46f'],[.299,.33,'#f586b5'],[.299,.113,'#fff3cd']]){
    oval(model,x,y,.263,.026,.078,.026,enamel(c));
  }
  oval(model,0,.138,.261,.023,.041,.012,light);
}

function sportsWatch(model,color) {
  for(const d of [-1,1]){
    slab(model,0,d*.28,-.029,.425,.374,.25,.072,color);
    for(let i=0;i<3;i++)slab(model,0,d*(.282+i*.043),.100,.13,.020,.027,.008,graphite);
  }
  slab(model,0,0,.039,.776,.464,.42,.106,graphite);
  slab(model,0,0,.249,.636,.366,.062,.028,silver);
  slab(model,0,0,.286,.547,.301,.048,.022,dark);
  slab(model,0,.027,.314,.311,.021,.016,.006,light);
  oval(model,0,-.059,.315,.069,.044,.012,enamel('#41bab7'));
  oval(model,.394,0,.039,.039,.043,.061,gold);
}

function succulent(model,color) {
  lathe(model,[[0,-.471],[.245,-.47],[.287,-.412],[.349,-.123],[.374,-.095],[.374,-.028],[0,-.023]],enamel('#ce775e'),1.33);
  cup(model,0,-.023,0,.324,.04,.414,enamel('#6b4d38'));
  const greens=['#3e8c63','#66a979','#89bb70','#5aa466','#a0c477'];
  for(let i=0;i<12;i++){
    const a=i*2.399, tall=i>6;
    const leaf=oval(model,Math.cos(a)*(tall?.12:.22),tall?.188:.10,Math.sin(a)*(tall?.115:.21),
      tall?.086:.113,tall?.232:.150,.075,i===11?color:enamel(greens[i%greens.length]));
    leaf.rotation.z=-Math.cos(a)*(tall?.43:.81);
    leaf.rotation.x=Math.sin(a)*.50;
  }
}

function flashDrive(model,color) {
  const key=new T.Group();model.add(key);key.rotation.z=.29;
  slab(key,0,-.107,0,.455,.661,.41,.092,color);
  slab(key,0,.292,0,.339,.296,.26,.034,silver);
  for(const d of [-1,1])slab(key,d*.073,.348,.131,.042,.083,.026,.010,dark);
  oval(key,0,-.263,.215,.056,.062,.026,light);
  cord(key,[[-.126,-.407,-.01],[-.189,-.52,-.01],[0,-.543,-.01],[.174,-.512,-.01],[.126,-.413,-.01]],.033,graphite);
}

function thermos(model,color) {
  lathe(model,[[0,-.476],[.325,-.474],[.409,-.436],[.429,-.37],[.429,.245],[.381,.297],[.289,.316],[0,.33]],color,1);
  cup(model,0,.336,0,.385,.075,.385,silver);
  lathe(model,[[0,.372],[.39,.371],[.39,.435],[.29,.463],[0,.466]],graphite);
  cup(model,0,-.443,0,.395,.056,.395,graphite);
  oval(model,-.244,-.058,.339,.034,.228,.018,chalk);
  cord(model,[[.026,.442,0],[.123,.481,0],[.19,.459,0],[.175,.410,0]],.041,gold);
}

function catMug(model,color) {
  lathe(model,[[0,-.448],[.238,-.445],[.317,-.349],[.351,.20],[.335,.249],
    [.28,.243],[.278,.173],[.249,-.309],[0,-.328]],color,1.12);
  for(const d of [-1,1]){
    const ear=oval(model,d*.207,.245,.164,.089,.149,.069,color);
    ear.rotation.z=d*.3;
    oval(model,d*.098,.012,.38,.023,.037,.016,graphite);
  }
  cord(model,[[.308,.147,.009],[.476,.123,.018],[.464,-.097,.028],[.326,-.239,.025]],.042,color);
  oval(model,0,-.04,.395,.032,.019,.015,graphite);
  oval(model,-.17,-.055,.371,.046,.025,.012,chalk);
  oval(model,.17,-.055,.371,.046,.025,.012,chalk);
}

function foxCushion(model,color) {
  oval(model,0,-.09,0,.435,.344,.295,color);
  for(const d of [-1,1]){
    oval(model,.263*d,.218,.01,.124,.235,.116,color).rotation.z=-d*.35;
    oval(model,.273*d,.255,.089,.052,.118,.043,chalk).rotation.z=-d*.35;
    const cheek=oval(model,.151*d,-.13,.214,.212,.138,.079,chalk);
    cheek.rotation.z=-d*.28;
    cord(model,[[.104*d,-.015,.263],[.169*d,-.037,.273],[.211*d,.006,.258]],.013,graphite);
  }
  oval(model,0,-.143,.3,.056,.037,.035,graphite);
}

export function merchandise(id,pitch) {
  if(!models.has(id)){
    const item=products[id],model=new T.Group(), color=enamel(item.color);
    switch(item.kind){
      case 'coffee':coffee(model,color);break;
      case 'audio':headphones(model,color);break;
      case 'bottle':id==='perfume'?perfume(model):sparklingBottle(model,color);break;
      case 'cookies':
      case 'tea':wrappedTin(model,color,item.kind);break;
      case 'cocoa':cocoa(model);break;
      case 'speaker':speaker(model,color);break;
      case 'candles':candles(model);break;
      case 'jam':jam(model,color);break;
      case 'camera':camera(model,color);break;
      case 'kettle':kettle(model,color);break;
      case 'lamp':lamp(model,color);break;
      case 'pot':cookingPot(model,color);break;
      case 'pad':controller(model,color);break;
      case 'watch':sportsWatch(model,color);break;
      case 'plant':succulent(model,color);break;
      case 'drive':flashDrive(model,color);break;
      case 'thermos':thermos(model,color);break;
      case 'mug':catMug(model,color);break;
      case 'plush':foxCushion(model,color);break;
    }
    const bounds=new T.Box3().setFromObject(model);
    const center=bounds.getCenter(new T.Vector3()), extent=bounds.getSize(new T.Vector3());
    const fitted=new T.Group();
    model.position.copy(center).negate();
    fitted.add(model);
    fitted.scale.set((item.w*pitch-.063)/extent.x,(item.h*pitch-.039)/extent.y,.81);
    models.set(id,fitted);
  }
  return models.get(id).clone();
}
