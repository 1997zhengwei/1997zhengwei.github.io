import {T,group,box,softBox,ball,drum,ring,rod,facet,bake,tau} from './geometry.js';
import {foyer} from './rooms.js';
import {tileFloor,sign,bankStack,contact,glassPanel,screen,carpet,glow} from './graphics.js';

const navy='#263d5c',edge='#435b79',steel='#8ba7bd',sky='#bad8ed',ivory='#e3f0f5',gold='#f6b633',dark='#192942';
const alloy=m=>{m.userData.finish='alloy';return m;};
const polish=m=>{m.userData.finish='polished';return m;};
function disc(p,x,y,z,r,thick,color,n=32){const m=drum(p,x,y,z,r,r,thick,color,n);m.rotation.x=Math.PI/2;return m;}
function stripe(p,x,z,w,d,color,y=.024){return box(p,x,y,z,w,.009,d,color);}
function safeDrawers(p,x,y,z,cols,rows,w){
  const h=.46,unit=w/cols;box(p,x,y+rows*h/2,z,w+.14,rows*h+.17,.25,navy);
  for(let row=0;row<rows;row++)for(let i=0;i<cols;i++){
    const xx=x+(i-(cols-1)/2)*unit,yy=y+(row+.5)*h;
    box(p,xx,yy,z+.132,unit-.025,h-.028,.046,(i+row)%3===0?'#7199b8':'#85a9c2');
    box(p,xx-.10,yy+.04,z+.167,.115,.043,.024,ivory);
    alloy(disc(p,xx+.086,yy-.022,z+.164,.037,.027,navy,10));
  }
}
function plant(p,x,y,z,s=1){
  const g=group(p,x,y,z);g.scale.setScalar(s);
  drum(g,0,.18,0,.25,.20,.36,'#dde0d8',8);drum(g,0,.37,0,.26,.26,.07,ivory,8);drum(g,0,.41,0,.218,.218,.025,'#534c4f',8);
  for(let i=0;i<9;i++){
    const a=i*2.4,h=.51+(i%4)*.13,spread=.12+(i%3)*.07,dx=Math.sin(a),dz=Math.cos(a);
    rod(g,[0,.4,0],[dx*spread,.4+h*.70,dz*spread],.018,'#3b785e',5);
    const l=facet(g,dx*spread,.43+h*.65,dz*spread,.24,h*.72,.18,['#4d956d','#72ae79','#37816b'][i%3]);
    l.rotation.z=-dx*.49;l.rotation.x=dz*.49;
  }
}
function paper(p,x,y,z,rot=0){
  const a=group(p,x,y,z);a.rotation.y=rot;box(a,0,0,0,.36,.035,.47,'#d6e8ec');
  for(let i=0;i<3;i++)box(a,-.02,.021,-.13+i*.07,.23-i*.025,.004,.015,'#7e98ab');
}
function monitor(p,decor,x,y,z){
  box(p,x,y+.035,z,.41,.07,.27,navy);box(p,x,y+.18,z,.085,.27,.08,edge);
  box(p,x,y+.44,z,.79,.46,.067,dark);screen(decor,x,y+.45,z+.039,.70,.36);
  box(p,x,y+.036,z+.34,.57,.047,.19,'#425569');
  for(let j=0;j<2;j++)for(let i=0;i<6;i++)box(p,x-.215+i*.079,y+.064,z+.295+j*.064,.053,.009,.032,steel);
}
function cashTable(p,decor,x,z,w,d,index){
  box(p,x,.17,z,w+.065,.30,d+.065,'#4b6480');
  box(p,x,.59,z,w,.67,d,'#466586');
  for(const side of [-1,1]){
    box(p,x+side*(w*.5-.09),.59,z,.13,.81,d+.06,steel);
    box(p,x+side*.21*w,.57,z+d*.5+.012,w*.36,.46,.04,'#365674');
    box(p,x+side*.21*w,.68,z+d*.5+.04,.20,.033,.035,'#98b8ca');
  }
  box(p,x,.953,z,w+.10,.12,d+.10,'#93a9bb');polish(softBox(p,x,1.035,z,w+.14,.085,d+.14,ivory));
  if(index===0){
    monitor(p,decor,x-.22,1.072,z-.22);paper(p,x+.37,1.097,z+.20,-.23);
    bankStack(p,x+.28,1.073,z-.29,.76,2);
    const xx=x-w*.5+.07,zz=z-d*.5+.08;
    for(const q of [-.45,.45])box(p,xx,1.48,zz+d*.5+q,.045,.77,.045,steel);
    box(p,xx,1.87,zz+d*.5,.055,.046,.97,steel);
    glassPanel(decor,xx,1.49,zz+d*.5,.91,.68,Math.PI/2);
    for(let k=0;k<3;k++){const spine=box(p,x+.21+k*.096,1.25,zz+.13,.078,.37,.26,['#457da0','#dba044','#385772'][k]);spine.rotation.z=-.06*k;}
  }else{
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){
      const px=x+(i-1)*.49,pz=z+(j-.5)*.39;
      bankStack(p,px,1.07,pz,.91,2+(i+j*2)%4);
    }
    if(d>1.60){
      paper(p,x-.33,1.10,z+.61,-.16);
      const zz=z-d*.5+.12;
      for(const dx of [-.68,.68]){box(p,x+dx,1.55,zz,.055,.96,.085,steel);box(p,x+dx,1.11,zz,.18,.08,.24,navy);}
      box(p,x,2.02,zz,1.42,.05,.07,steel);glassPanel(decor,x,1.61,zz,1.34,.75);
      sign(decor,x-.18,1.88,zz+.012,.70,.155,'CASH  02','','#263e5c','#edc34e');
    }
  }
}
function marineCase(p,decor,x,z,w,d,index){
  if(index===0){cashTable(p,decor,x,z,w,d,0);return;}
  box(p,x,.39,z,w,.76,d,'#386474');box(p,x,.80,z,w+.08,.11,d+.09,'#92bac0');
  for(const a of [-1,1])for(const b of [-1,1])box(p,x+a*(w*.5-.06),.43,z+b*(d*.5-.08),.11,.78,.12,'#bed0cc');
  if(index===1){
    const g=group(p,x,.86,z);box(g,0,.15,0,1.11,.26,.71,'#986b45');box(g,0,.32,0,1.16,.08,.76,'#c79e64');
    for(const s of [-1,1])box(g,s*.38,.25,0,.08,.52,.80,'#4c6b76');
    const buoy=ring(g,-.15,.42,0,.26,.09,'#f67e42',24);buoy.rotation.x=-Math.PI/2;
    for(const s of [-1,1])box(g,-.15+s*.24,.43,0,.12,.13,.14,ivory);
  }else{
    const boat=group(p,x,.90,z);boat.rotation.y=.18;
    ball(boat,0,.22,0,1.21,.42,.48,'#d5e2db');box(boat,.07,.50,0,.58,.28,.34,'#407a92');
    box(boat,.04,.65,0,.69,.055,.41,'#f3cb73');rod(boat,[-.35,.26,0],[-.35,.93,0],.023,steel);
  }
}
function clockCase(p,decor,x,z,w,d,index){
  if(index===0){cashTable(p,decor,x,z,w,d,0);return;}
  box(p,x,.44,z,w,.86,d,'#485473');box(p,x,.88,z,w+.08,.12,d+.08,'#a89b76');
  box(p,x,.992,z,w-.05,.10,d-.05,'#293c56');
  for(const s of [-1,1]){
    const cx=x+s*.24,r=s>0?.30:.21;
    drum(p,cx,1.10,z,r,r,.15,'#dca744',12);
    for(let k=0;k<10;k++){const a=k*tau/10;box(p,cx+Math.sin(a)*r,1.10,z+Math.cos(a)*r,.11,.13,.115,'#eabc68').rotation.y=a;}
    drum(p,cx,1.20,z,.11,.11,.11,edge,12);
  }
}
function cashVault(p,decor,x,z){
  // The open recess and the hinged steel plate have real depth in the follow camera.
  disc(p,x,1.24,z-.12,1.22,.34,dark);alloy(ring(p,x,1.24,z+.08,1.15,.11,steel,48));
  disc(p,x,1.24,z+.10,1.018,.07,'#253e51');
  for(let i=0;i<4;i++)for(let j=0;j<2;j++){
    bankStack(p,x+(i-1.5)*.38,.66,z+.36+j*.33,.78,2+(i*3+j)%5);
  }
  for(const s of [-1,1]){box(p,x+s*1.44,1.09,z,.28,2.21,.64,edge);box(p,x+s*1.44,1.92,z+.34,.17,.12,.08,'#80e4e0');}
  box(p,x,2.55,z,3.27,.33,.60,navy);
  sign(decor,x,2.54,z+.307,2.25,.32,'VAULT  01','',navy,'#72ddd6');
  const pivot=group(decor,x+1.05,1.26,z+.24),leaf=group(pivot,-1.05,0,0);
  alloy(disc(leaf,0,0,0,1.08,.34,'#506d8a',48));alloy(disc(leaf,0,0,.196,.95,.09,'#355570',48));ring(leaf,0,0,.265,.80,.043,steel,40);
  for(let k=0;k<10;k++){const a=k*tau/10;disc(leaf,.92*Math.sin(a),.92*Math.cos(a),.235,.045,.045,'#b9d2df',8);}
  alloy(ring(leaf,0,0,.34,.34,.065,'#ffcf53',28));for(let i=0;i<6;i++){const a=i*tau/6;rod(leaf,[0,0,.34],[.34*Math.cos(a),.34*Math.sin(a),.34],.035,gold);}
  disc(leaf,0,0,.34,.11,.14,gold,16);
  for(const s of [-1,1]){box(leaf,.80,s*.48,.04,.46,.15,.37,steel);box(leaf,.99,s*.48,.08,.12,.23,.41,gold);}
  bake(leaf);return pivot;
}
function dial(p,x,y,z){
  disc(p,x,y,z,.91,.16,navy,40);disc(p,x,y,z+.10,.80,.10,'#e5e7d6',40);alloy(ring(p,x,y,z+.17,.84,.073,gold,40));
  for(let k=0;k<12;k++){const a=k*tau/12;box(p,x+Math.sin(a)*.65,y+Math.cos(a)*.65,z+.17,.044,.14,.035,navy).rotation.z=-a;}
  rod(p,[x,y,z+.19],[x+.36,y+.17,z+.19],.055,navy);
}
function lobby(p,decor,cfg){
  const [bx,bz,bw,bd]=foyer.bench;
  box(p,bx,.35,bz,bw-.10,.11,.45,edge);
  for(const side of [-1,1]){
    const x=bx+side*.425;
    alloy(box(p,x,.19,bz,.10,.39,.43,steel));alloy(box(p,x,.045,bz,.38,.06,.51,steel));
    polish(softBox(p,x,.49,bz,.80,.18,bd,cfg.theme==='tide'?'#37929b':'#3f78ba'));
    const back=softBox(p,x,.73,bz-.25,.79,.49,.15,'#376b9d');back.rotation.x=-.12;
    box(p,x+side*.40,.59,bz,.055,.22,.39,edge);
  }
  const [x,z,w,d]=foyer.desk;
  softBox(p,x,.20,z,w,.39,d,edge);softBox(p,x,.54,z,w-.08,.48,d-.07,'#5d88ad');
  softBox(p,x,.84,z,w+.04,.13,d+.02,ivory);
  plant(p,x+.22,.92,z-.10,.72);paper(p,x-.32,.94,z+.07,.19);
  sign(decor,x,.55,z+d*.5+.004,.80,.22,'SECURITY','','#294b6c','#7de7e6');
  contact(decor,bx,bz,bw*1.60,bd*2.21,.40);contact(decor,x+.05,z+.10,w*1.64,d*1.75,.43);
}
export const palettes={
  sun:{wall:'#6e3b35',trim:'#e0b85a',panel:'#4f2a27',ground:'#2a2f45',bench:'#9b2f3c'},
  tide:{wall:'#5b3d29',trim:'#d1aa6c',panel:'#3f2a1c',ground:'#173040',bench:'#2f7d8a'},
  clock:{wall:'#4a4466',trim:'#c9a04f',panel:'#332f4c',ground:'#221f38',bench:'#5b3f7a'},
  candy:{wall:'#c94f86',trim:'#ffe1f0',panel:'#9c3466',ground:'#2f1d40',bench:'#5bc8b0'}
};
function bayWall(p,cfg,{rect,side}){
  const [x,z,w,d]=rect,vertical=w<d,length=vertical?d:w,pal=palettes[cfg.theme];
  const tall=side==='back',h=tall?2.06:side==='inner'?.72:1.0;
  box(p,x,h/2,z,w,h,d,pal.wall);box(p,x,h+.025,z,w+.04,.09,d+.04,pal.trim);
  const n=Math.ceil(length/2.5);
  for(let i=0;i<n;i++){
    const offset=length*((i+.5)/n-.5),px=x+(vertical?0:offset),pz=z+(vertical?offset:0);
    if(tall){box(p,px,1.20,pz+.14,length/n-.12,.64,.035,pal.panel);box(p,px,1.62,pz+.16,length/n-.30,.055,.04,pal.trim);
      if(cfg.theme==='candy')for(let k=0;k<3;k++)box(p,px-.5+k*.5,.5,pz+.14,.12,.6,.03,['#5be3b8','#ffd24a','#62a8ff'][k]);}
    else if(vertical)box(p,px,.38,pz,.30,.055,length/n-.10,pal.trim);
    else box(p,px,.38,pz,length/n-.10,.055,.30,pal.trim);
  }
}
// Candy factory showcase: pink counter with giant sweets on top.
function candyCase(p,decor,x,z,w,d,index){
  softBox(p,x,.42,z,w,.82,d,'#ff8fc0');box(p,x,.86,z,w+.08,.08,d+.08,'#ffe1f0');
  for(let i=0;i<3;i++)box(p,x-w/2+.2+i*(w-.4)/2,.42,z+d/2+.01,.1,.7,.02,['#5be3b8','#ffd24a','#62a8ff'][i]);
  if(index===1){
    for(const s of [-1,1]){const jx=x+s*w*.24;drum(p,jx,1.12,z,.26,.26,.46,'#e4f6ff',14);drum(p,jx,1.38,z,.28,.28,.06,'#ff5d8f',14);
      for(let k=0;k<7;k++)ball(p,jx+Math.sin(k*2.3)*.14,.96+k*.05,z+Math.cos(k*2.3)*.14,.13,.13,.13,['#ff5d8f','#ffd24a','#5be3b8','#62a8ff','#c48af5'][k%5]);}
  }else{
    for(const s of [-1,1]){const lx=x+s*w*.25;rod(p,[lx,.9,z],[lx,1.55,z],.03,'#ffffff');
      for(let k=0;k<4;k++){const c=drum(p,lx,1.72,z+.01*k,.32-k*.07,.32-k*.07,.06,['#ff5d8f','#ffd24a','#5be3b8','#62a8ff'][k],20);c.rotation.x=Math.PI/2;}}
  }
}
function fittings(p,decor,cfg,bay,prop,index){
  const [x,z,w,d]=prop.rect;contact(decor,x+.10,z+.06,w*1.57,d*1.52,.42);
  if(prop.type==='plant'){plant(p,x,0,z,1.32);return;}
  if(prop.type==='file'){
    box(p,x,.65,z,w,1.29,d,edge);
    box(p,x,1.32,z,w+.06,.10,d+.05,steel);
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const px=x+side*(w/2+.012),pz=z+(i-1)*d/3;
      box(p,px,.70,pz,.045,.83,d/3-.06,'#6e8da0');box(p,px+side*.032,.88,pz,.055,.045,.19,ivory);
    }return;
  }
  if(prop.type==='cargo'){
    if(cfg.theme==='sun'){cashTable(p,decor,x,z,w,d,1);return;}
    box(p,x,.10,z,w,.19,d,edge);
    const crate=cfg.theme==='candy'?'#ffb3d6':cfg.theme==='clock'?'#8a6a9a':'#b18959',strap=cfg.theme==='candy'?'#5bc8b0':'#4a6876';
    for(let i=0;i<2;i++){
      const zz=z+(i-.5)*d*.48;softBox(p,x,.49,zz,w-.10,.61,d*.45,crate);
      for(const side of [-1,1])box(p,x+side*w*.27,.49,zz,.075,.65,d*.46,strap);
    }
    softBox(p,x+.1,1.05,z-.1,w*.5,.5,d*.4,crate);return;
  }
  if(prop.type==='station'){cashTable(p,decor,x,z,w,d,0);return;}
  const exhibit=cfg.theme==='sun'?cashTable:cfg.theme==='tide'?marineCase:cfg.theme==='candy'?candyCase:clockCase;
  exhibit(p,decor,x,z,w,d,1+index%2);
}
function furnishBay(root,cfg,bay){
  const p=group(root),decor=group(root),{x,z}=bay;
  box(p,x,-.18,z,9,.34,9,edge);tileFloor(decor,cfg,x,z);
  if(bay.role==='display'||bay.role==='vault'||bay.role==='entry')carpet(decor,cfg.theme,x,z+(bay.role==='entry'?.6:0),1.7,bay.role==='entry'?7.6:8.6);
  if(bay.role==='junction')carpet(decor,cfg.theme,x,z,1.7,8.6,Math.PI/2);
  // A warm ceiling lamp pool in every room; the corners stay in shadow.
  glow(decor,x,.03,z,7.6,cfg.theme==='candy'?'#ff9fd0':cfg.theme==='tide'?'#ffc98a':'#ffd99a',.38);
  for(const [i,prop] of cfg.props.filter(item=>item.bay===bay).entries())fittings(p,decor,cfg,bay,prop,i);
  if(bay.role==='entry')lobby(p,decor,cfg);
  if(bay.role==='entry'||bay.role==='junction'){
    for(const door of cfg.doors){
      const neighbor=door.a===bay?door.b:door.b===bay?door.a:null;
      if(!neighbor)continue;
      const dx=Math.sign(neighbor.x-x),dz=Math.sign(neighbor.z-z);
      const arrow=dx<0?'←':dx>0?'→':dz<0?'↑':'↓';
      const plaque=sign(decor,x+dx*3.14,.046,z+dz*3.12,2.58,.51,arrow+' '+neighbor.name,'','#405e78','#85cbd9');
      plaque.rotation.x=-Math.PI/2;
    }
  }
  if(bay.role==='vault'){
    for(const sign of [-1,1]){safeDrawers(p,x+sign*3.02,.24,z-4.34,3,3,2.30);plant(p,x+sign*3.82,0,z-3.83,.91);}
  }
  if(bay.role==='rail'){
    stripe(p,x,z-.85,4.49,.23,'#556982');
    for(const dz of [-.13,.13])stripe(p,x,z-.85+dz,4.54,.038,gold,.04);
  }
  if(cfg.theme==='clock'&&bay.role==='vault')dial(p,x-3.03,1.55,z-4.07);
  if(cfg.theme==='tide'&&bay.role==='vault')for(const side of [-1,1]){
    disc(p,x+side*3.06,1.50,z-4.06,.40,.13,'#76bad2');alloy(ring(p,x+side*3.06,1.50,z-3.97,.41,.065,'#e4ba77',28));
  }
  // Flush wayfinding plaques stay legible from inside without crossing the doorway.
  const label=sign(decor,x+1.75,.027,z+3.42,1.98,.47,bay.name,'','#3b5971',cfg.theme==='clock'?'#f3ce83':'#8de2d9');
  label.rotation.x=-Math.PI/2;
  bake(p);
}
function doorMark(p,door){
  const {x,z,gap,vertical,isExit}=door,g=group(p,x,.023,z);
  if(vertical)g.rotation.y=Math.PI/2;
  stripe(g,0,0,gap,.22,'#738ea3',0);
  for(const side of [-1,1]){
    const px=side*(gap/2+.09);box(g,px,.48,0,.18,.93,.31,edge);box(g,px,.95,0,.20,.07,.33,isExit?'#86f4c8':'#a0dce4');
    stripe(g,side*(gap/2-.27),0,.38,.09,isExit?'#85edbe':'#dae8ec',.012);
  }
}
function car(p){
  const v=group(p,1.35,-.13,8.83);v.rotation.y=-.045;
  for(const x of [-1.12,1.07])for(const s of [-1,1]){
    const z=s*.71;disc(v,x,.40,z,.35,.20,'#1d293b',20);alloy(disc(v,x,.40,z+s*.10,.18,.05,'#9eb3c1',16));disc(v,x,.4,z+s*.13,.08,.03,edge,12);
  }
  softBox(v,0,.58,0,3.35,.44,1.52,'#19398a');polish(softBox(v,-.12,.91,0,3.0,.47,1.53,'#2454ca'));
  softBox(v,-.48,1.24,0,2.20,.53,1.44,'#214dbc');softBox(v,-.52,1.54,0,2.28,.13,1.48,'#3872e4');
  for(const s of [-1,1]){
    box(v,.2,1.23,s*.735,.66,.39,.04,'#193959');box(v,-.60,1.23,s*.735,.75,.38,.04,'#254970');
    box(v,-.87,1.31,s*.76,.13,.15,.015,'#5591b3').rotation.z=-.31;
    box(v,-.05,.96,s*.788,.19,.035,.04,ivory);box(v,0,.73,s*.79,2.93,.055,.036,'#70b6ef');
    box(v,1.29,.83,s*.72,.31,.14,.11,'#f8e7aa');box(v,-1.46,.81,s*.70,.15,.24,.09,'#e65955');
    box(v,-1.25,1.64,s*.47,.095,.16,.095,navy);box(v,.27,1.64,s*.47,.095,.16,.095,navy);
  }
  const wind=box(v,.79,1.20,0,.13,.52,1.35,'#477d9c');wind.rotation.z=.35;
  softBox(v,1.24,.97,0,.82,.13,1.47,'#407ce5');softBox(v,1.65,.55,0,.12,.12,1.50,steel);
  for(const x of [-1.25,.27])box(v,x,1.73,0,.075,.09,1.20,navy);
  box(v,-.63,1.77,0,.78,.22,.66,'#242f4c');for(const x of [-.92,-.34])box(v,x,1.89,0,.052,.035,.67,steel);
  bake(v);return v;
}
function patrolPaint(p,cfg){
  for(const {path} of cfg.patrols)for(let i=0;i<path.length;i++){
    const [x,z]=path[i],[a,b]=path[(i+1)%path.length],len=Math.hypot(a-x,b-z);
    const m=stripe(p,(x+a)/2,(z+b)/2,.075,len,'#eb77bd',.031);m.rotation.y=Math.atan2(a-x,b-z);
    drum(p,x,.036,z,.155,.155,.012,'#f28fca',20);
  }
}
function precinct(p,cfg){
  const {left,right,back}=cfg.bounds;
  box(p,0,-.63,0,100,.68,140,palettes[cfg.theme].ground);
  box(p,0,-.28,10.0,58,.24,4.85,'#3a4258');
  for(let i=-4;i<=4;i++)stripe(p,0,8.5+i*.36,2.8,.17,'#e0eaf0',-.134);
  for(let i=-7;i<=7;i++)stripe(p,i*3.32,10.61,1.28,.065,'#e6dbc2',-.134);
  box(p,0,-.17,7.52,44,.17,.51,'#a6b7ca');box(p,0,-.025,7.44,2.20,.12,.59,'#b8c7d1');
  for(let i=-1;i<=1;i++){
    const x=i*8.9,h=2.6+(i+1)*.44;
    box(p,x,h/2-.18,back-5.21,7.42,h,3.20,'#617a92');box(p,x,h-.12,back-5.21,7.55,.16,3.32,edge);
    for(let j=-2;j<=2;j++)box(p,x+j*1.20,h-.97,back-3.59,.70,.78,.04,'#a2bed0');
  }
  if(cfg.yard){
    const [c,r]=cfg.yard,x=c*9,z=2.75-r*9;
    if(cfg.theme==='sun'){
      box(p,x,-.21,z,8.58,.15,8.58,'#81a996');
      for(const s of [-1,1]){plant(p,x+s*2.71,-.1,z+s*2.01,1.90);plant(p,x-s*2.23,-.1,z+s*2.42,1.19);}
      drum(p,x,-.045,z,1.62,1.75,.20,steel,24);drum(p,x,.070,z,1.52,1.52,.07,'#69b5c3',28);
      drum(p,x,.26,z,.40,.61,.44,ivory,8);
      const art=facet(p,x,1.15,z,1.28,1.75,1.14,gold);art.rotation.z=.30;art.rotation.y=.38;
    }else{
      box(p,x,-.20,z,8.70,.13,8.70,'#569bb3');
      for(let i=0;i<18;i++)stripe(p,x+Math.sin(i*15.8)*3.67,z+Math.cos(i*5.24)*3.69,.53+i%4*.23,.044,'#82bcce',-.124);
      for(const s of [-1,1]){drum(p,x+s*3.65,.18,z,.16,.23,1.18,'#876f54',12);ring(p,x+s*3.62,.59,z,.28,.079,'#e9a358');}
    }
  }
  for(const x of [left-2.05,right+2.05])for(let z=back+1.72;z<6;z+=5.40)plant(p,x,-.30,z,1.45);
}
export function makeSet(root,cfg){
  const walls=group(root),decor=group(root);
  precinct(walls,cfg);for(const wall of cfg.walls)bayWall(walls,cfg,wall);
  for(const door of cfg.doors)doorMark(walls,door);
  patrolPaint(walls,cfg);bake(walls);
  for(const bay of cfg.bays)furnishBay(root,cfg,bay);
  const rear=group(root),v=cfg.vault;
  const vault=cashVault(rear,decor,v.x,v.z-4.40);bake(rear);
  const van=car(root);contact(decor,1.36,8.84,4.4,2.08,.56);
  const pad=group(root,0,.077,7.37);
  for(const z of [-.33,.04,.40])for(const s of [-1,1])box(pad,s*.15,.015,z,.39,.031,.088,'#73ffcb').rotation.y=s*.50;
  bake(pad,false);
  let hand;if(cfg.theme==='clock'){
    hand=group(root,v.x-3.03,1.55,v.z-3.83);rod(hand,[0,-.10,0],[0,.63,0],.043,'#bd7137');bake(hand,false);
  }
  return {car:van,pad,hand,vault};
}


// Laser fence: two emitter posts and a glowing beam that blinks before switching on.
export function laserRig(root,l){
  const g=group(root),len=Math.hypot(l.bx-l.ax,l.bz-l.az),ang=Math.atan2(l.bx-l.ax,l.bz-l.az);
  for(const [x,z] of [[l.ax,l.az],[l.bx,l.bz]]){
    drum(g,x,.45,z,.12,.15,.9,'#2a2f45',10);drum(g,x,.92,z,.15,.15,.06,'#ff3b4b',10);
    for(const y of [.3,.6])disc(g,x,y,z,.06,.2,'#ff6b6b',8).rotation.y=ang;
  }
  bake(g);
  const mat=new T.MeshBasicMaterial({color:'#ff2a3d',transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
  const beams=[.3,.6].map(y=>{
    const holder=group(root,(l.ax+l.bx)/2,y,(l.az+l.bz)/2);holder.rotation.y=ang;
    const m=new T.Mesh(new T.CylinderGeometry(.035,.035,len,6),mat);m.userData.disposable=true;m.rotation.x=Math.PI/2;holder.add(m);
    return m;
  });
  const floor=glow(root,(l.ax+l.bx)/2,.04,(l.az+l.bz)/2,1,'#ff2a3d',.5);
  floor.rotation.z=ang;floor.scale.set(1.2,len*1.05,1);
  return {beams,mat,floor};
}
// Barred gate across a doorway, with a key-card reader that turns green.
export function gateRig(root,gate){
  const {door}=gate,g=group(root,door.x,0,door.z);if(door.vertical)g.rotation.y=Math.PI/2;
  const bars=group(g);
  box(bars,0,1.55,0,door.gap,.14,.2,'#3a4258');box(bars,0,.12,0,door.gap,.1,.2,'#3a4258');
  for(let i=0;i<9;i++){const x=-door.gap/2+.2+i*(door.gap-.4)/8;drum(bars,x,.82,0,.05,.05,1.42,'#c9d0de',8);drum(bars,x,1.62,0,.01,.07,.16,'#ffd24a',6);}
  bake(bars);
  const reader=group(g,door.gap/2+.25,.95,.2);box(reader,0,0,0,.26,.38,.1,'#22283a');bake(reader);
  const light=glow(g,door.gap/2+.25,1.2,.27,.5,'#ff3b4b',.95,false);
  const pad=glow(g,0,.05,0,2.6,'#ff3b4b',.25);pad.scale.set(1.4,.5,1);
  return {bars,light,pad};
}