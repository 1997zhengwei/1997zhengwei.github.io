import * as T from '../vendor/three.module.js';
import {TYPES,careFor} from './config.mjs';
import {M,box,cylinder,torus,label,material} from './art.mjs';

const chrome=material('#e3e6cf',.17,.82),carbon=material('#263645',.38,.35);
const led=new T.MeshStandardMaterial({color:'#d7fbff',emissive:'#81cfff',emissiveIntensity:1.3,roughness:.2});

export function addLuxuryBody(g,c){
  const t=TYPES[c.type];if(!t.care)return;
  const {w,l,h}=t;
  for(const sign of [-1,1]){
    box(g,sign*w*.49,.76,0,.035,.04,l*.6,chrome,.008);
    box(g,sign*w*.24,.87,l*.523,w*.22,.05,.025,led,.008);
  }
  if(t.care==='rims'){
    for(const sign of [-1,1]){
      box(g,sign*w*.24,1.035,l*.34,w*.2,.035,.45,carbon,.025);
      box(g,sign*w*.29,.47,l*.51,w*.2,.16,.045,carbon,.025);
      box(g,sign*.3,h+.024,-.08,.09,.025,l*.43,chrome,.01);
      box(g,sign*w*.35,1.03,-l*.4,.06,.26,.08,carbon,.01);
    }
    box(g,0,1.19,-l*.42,w*.91,.075,.26,carbon,.025);
    box(g,0,.38,-l*.49,w*.77,.09,.32,carbon,.02);
  }else if(t.care==='crystal'){
    box(g,0,.75,l*.526,w*.64,.34,.04,chrome,.035);
    for(let i=-5;i<=5;i++)box(g,i*.105,.75,l*.553,.025,.28,.024,carbon,.002);
    box(g,0,h+.025,-.03,w*.53,.025,l*.26,M.glass,.025);
    for(const sign of [-1,1])box(g,sign*w*.45,1.05,0,.024,.025,l*.3,chrome,.004);
    box(g,0,1.065,l*.35,.07,.07,.12,M.gold,.015);
  }else{
    box(g,0,.66,l*.523,w*.81,.2,.05,chrome,.025);
    for(const z of [-l*.3,l*.3])for(const sign of [-1,1])box(g,sign*w*.5,.65,z,.08,.26,.8,carbon,.03);
    box(g,0,h+.025,-.12,w*.55,.025,l*.32,M.glass,.02);
    for(const sign of [-1,1])box(g,sign*w*.53,.37,0,.25,.08,l*.58,chrome,.025);
    box(g,0,.84,-l*.52,w*.75,.06,.03,led,.01);
  }
}

export class LuxuryVisual{
  constructor(root,c){
    this.root=root;this.t=TYPES[c.type];this.care=careFor(c);const {w,l,h}=this.t;
    this.badge=label(root,'VIP',0,h+.65,0,.34,'#fff4c4','#8b6734');
    this.haloMaterial=new T.MeshBasicMaterial({color:'#ffdb83',transparent:true,opacity:.3,depthWrite:false});
    this.halo=torus(root,0,.2,0,1.8,.035,this.haloMaterial);this.halo.scale.set(1,1.4,1);
    this.echo=torus(root,0,.21,0,2.1,.026,this.haloMaterial);this.echo.scale.set(1,1.4,1);
    this.pillarMaterial=new T.MeshBasicMaterial({color:'#ffe7ab',transparent:true,opacity:.08,side:T.DoubleSide,depthWrite:false});this.pillars=new T.Group();root.add(this.pillars);
    for(const sign of [-1,1]){const p=new T.Mesh(new T.CylinderGeometry(.06,.35,3.6,12,1,true),this.pillarMaterial);p.position.set(sign*1.6,1.8,0);this.pillars.add(p);}
    this.careMaterial=new T.MeshBasicMaterial({color:this.care.color,transparent:true,opacity:.8,depthWrite:false});
    this.rims=[];if(this.t.care==='rims')for(const sign of [-1,1])for(const z of [-l*.31,l*.31]){const rim=torus(root,sign*w*.535,.43,z,.29,.025,this.careMaterial,0);rim.rotation.y=Math.PI/2;this.rims.push(rim);}
    this.scan=new T.Mesh(new T.BoxGeometry(w*.9,.025,.23),this.careMaterial);root.add(this.scan);
    this.steamMaterial=new T.MeshBasicMaterial({color:'#e1fff3',transparent:true,opacity:.24,depthWrite:false});this.steam=new T.InstancedMesh(new T.SphereGeometry(1,8,5),this.steamMaterial,8);this.steam.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(this.steam);
    this.dummy=new T.Object3D();
    for(const o of [this.halo,this.echo,this.pillars,this.scan,this.steam,...this.rims])o.traverse(child=>{child.userData.noShadow=true;child.castShadow=false;});
  }
  update(c,time,servicing=false){
    const special=c.state==='work'&&c.phase===3,entry=c.vipIntro||0;
    this.badge.visible=!c.paid;this.badge.position.y=this.t.h+.65+Math.sin(time*2+c.seed)*.05;
    this.halo.visible=this.echo.visible=!c.paid||c.glow>0;this.haloMaterial.opacity=entry>0?.6:.18;
    const pulse=1+(entry>0?Math.sin(time*5)*.06:.015*Math.sin(time*2));this.halo.scale.set(pulse,pulse*1.4,1);const wave=1+(time*.55%1)*.25;this.echo.scale.set(wave,wave*1.4,1);
    this.pillars.visible=entry>0;this.pillarMaterial.opacity=.06+.06*Math.sin(Math.min(1,entry/3.2)*Math.PI);
    for(let i=0;i<this.rims.length;i++){const done=c.paid||special&&c.progress>=(i+1)/4,active=special&&i===Math.min(3,Math.floor(c.progress*4));this.rims[i].visible=done||active;this.rims[i].scale.setScalar(active?1.08+Math.sin(time*13)*.09:1);}
    this.scan.visible=special&&this.t.care==='crystal';if(this.scan.visible){const row=Math.min(9,Math.floor((c.progress*2%1)*10)),p=this.root.userData.surfaceCells[row*6+3];this.scan.position.set(0,p.y+.07,p.z);}
    this.steam.visible=special&&servicing&&this.t.care==='cabin';if(this.steam.visible){for(let i=0;i<8;i++){const age=(time*.6+i*.127)%1,sign=i%2?1:-1;this.dummy.position.set(sign*(this.t.w*.35+age*.25),1.1+age*1.5,(c.progress<.5?.6:-.65)+Math.sin(i*2.4)*.25);this.dummy.scale.setScalar(Math.sin(age*Math.PI)*(.16+age*.28));this.dummy.updateMatrix();this.steam.setMatrixAt(i,this.dummy.matrix);}this.steam.instanceMatrix.needsUpdate=true;}
  }
  dispose(){this.badge.material.map.dispose();this.badge.material.dispose();this.haloMaterial.dispose();this.pillarMaterial.dispose();this.careMaterial.dispose();this.steamMaterial.dispose();this.steam.dispose();}
}
