import * as THREE from './vendor/three.module.js';
import {AURORA, GATE_Z} from './starpath-rules.mjs';

export const AURORA_COLORS={ink:'#33445e',white:'#f4f3ed',panel:'#d6d8e4',mint:'#84f3de',ice:'#aaddff',violet:'#b9a7df',ground:'#b7acd2',gold:'#f5d58c'};

// These models use planar gameplay coordinates. The low decks and bridge aprons
// are route markings; only the listed buildings and pillars are solid in rules.
export function buildAuroraArt({root,part,ring,textSprite,mat,optimizeTree}){
 const c=AURORA_COLORS,base=new THREE.Group();base.position.set(AURORA.base.x,0,AURORA.base.z);root.add(base);
 const block=(g,color,x,y,z,w,h,d,glow=0)=>part(g,'round',color,x,y,z,w,h,d,glow);
 const label=(g,text,x,y,z,w=3.5)=>{const t=textSprite(text,{width:w,color:'#eafdf8',bg:'#33445eef'});t.position.set(x,y,z);g.add(t);return t};
 const tags=[],lights=[];
 function tagged(g,text,x,y,z,w){const tag=label(g,text,x,y,z,w);tags.push({tag,g});return tag}
 function strip(g,x,y,z,w,d,color=c.mint){return block(g,color,x,y,z,w,.035,d,.23)}
 function deck(g,x,z,w,d){block(g,c.ink,x,.05,z,w,.13,d);block(g,c.panel,x,.13,z,w-.18,.1,d-.18);}
 function arrow(g,x,z,color=c.mint,scale=1){for(const side of [-1,1]){const m=strip(g,x+side*.19*scale,.215,z,.1*scale,.62*scale,color);m.rotation.y=side*-.6}}
 // Arrival: cream shelter on lavender ground, with an uninterrupted 8 m spine.
 deck(base,0,0,29,59);
 for(const side of [-1,1]){
  strip(base,side*13.75,.23,0,.12,57);block(base,c.white,side*14.25,.31,0,.28,.4,58);
  for(let i=0;i<9;i++)block(base,c.ink,side*12.3,.22,-25+i*6,.6,.04,.22);
  for(const dz of [-23,23]){part(base,'cylinder',c.white,side*13,2.2,dz,.10,4.4,.10);part(base,'ball',c.mint,side*13,4.42,dz,.22,.17,.22,.35)}
 }
 block(base,c.ink,0,.198,0,8,.05,58);for(const x of [-4.2,4.2])strip(base,x,.24,0,.12,58);
 for(let z=-25;z<=25;z+=5)arrow(base,0,z,c.mint,1.4);
 // A broad, flat observation deck reads as a central raised landmark without a
 // surprise height step. The hologram at its side previews all three missions.
 part(base,'cylinder',c.ink,0,.19,-2,6.2,.12,6.2);ring(base,6.05,c.mint,.65,.045).position.set(0,.27,-2);
 part(base,'cylinder',c.panel,0,.25,-2,5.7,.06,5.7);
 for(const side of [-1,1]){strip(base,side*4.2,.30,-2,.13,10);for(const z of [-6,2])arrow(base,side*2.5,z,c.mint,.8)}
 const holo=new THREE.Group();holo.position.set(7,.20,-12);base.add(holo);deck(holo,0,0,5.2,7);
 for(const [dz,ico]of [[2,'radar'],[0,'rover'],[-2,'vault']]){
  ring(holo,.5,c.mint,.6,.03).position.set(0,.31,dz);block(holo,c.ice,0,.6,dz,.30,.65,.30,.18);
  if(ico==='radar'){const m=part(holo,'ball',c.white,0,1.0,dz,.55,.10,.55);m.rotation.z=.35}
  if(ico==='rover')block(holo,c.white,0,.7,dz,.80,.35,.55);
  if(ico==='vault')for(const x of [-.45,.45])block(holo,c.violet,x,.73,dz,.18,.85,.24);
 }tagged(holo,'EXPEDITION ROUTE',0,1.55,-.1,4.3);
 for(const side of [-1,1]){
  const building=new THREE.Group();building.position.set(side*8,0,6);base.add(building);
  block(building,c.ink,0,.40,0,4.1,.6,3.8);block(building,c.white,0,1.6,-.25,4.0,2.2,3.2);
  block(building,c.panel,0,2.8,-.25,4.2,.30,3.5);strip(building,0,2.64,1.4,3.6,.10);
  block(building,c.ink,0,1.56,1.40,3.2,1.35,.12);block(building,c.ice,0,1.78,1.48,2.7,.64,.055,.09);
  for(const x of [-1.4,1.4]){block(building,c.white,x,1.25,1.5,.28,1.7,.18);strip(building,x,1.3,1.61,.08,.07)}
  if(side<0){for(const x of [-.8,0,.8]){part(building,'cylinder',c.mint,x,1.5,1.8,.21,.90,.21,.1);part(building,'cylinder',c.white,x,2.0,1.8,.24,.10,.24)}tagged(building,'O₂ TRAINING',0,3.35,0,4.2)}
  else{for(const x of [-.85,.85]){block(building,c.white,x,1.55,1.8,.85,.22,.25);block(building,c.ice,x+.24,1.6,1.8,.55,.12,.20,.15)}tagged(building,'AURORA WORKSHOP',0,3.35,0,4.8)}
  optimizeTree(building);
 }
 const command=new THREE.Group();command.position.set(-8,0,-14);base.add(command);
 block(command,c.ink,0,.35,0,4.4,.6,4.2);block(command,c.white,0,1.4,0,4.2,1.9,3.8);block(command,c.violet,0,2.5,0,4.5,.3,4.0);
 block(command,c.ink,0,1.7,1.94,3.5,.85,.12);block(command,c.mint,0,1.7,2.02,3.0,.46,.05,.15);
 part(command,'cylinder',c.ink,0,3.25,0,.13,1.4,.13);const commDish=part(command,'ball',c.white,0,4.0,0,1.15,.15,1.15);commDish.rotation.z=.35;
 tagged(command,'AURORA OUTPOST',0,4.9,0,5.3);optimizeTree(command);
 // Sloping aprons are thin enough to walk over on the existing planar collider.
 for(const dz of [-30,30]){const m=block(base,c.panel,0,.07,dz,8,.13,3.2);m.rotation.x=dz>0?.035:-.035;for(const x of [-4.1,4.1])strip(base,x,.18,dz,.12,3.2)}
 tagged(base,'AURORA OUTPOST · 660m',0,4.0,22,7.5);optimizeTree(base);

 // A readable fork: mint arrows lead left to the radar, ice rails stay central.
 const routes=new THREE.Group();root.add(routes);
 for(let d=699;d<1045;d+=6){const z=GATE_Z-d;strip(routes,-3.5,.02,z,.11,3,c.ice);strip(routes,3.5,.02,z,.11,3,c.ice);if(d<730||d>770)arrow(routes,0,z,c.mint,.9)}
 for(let i=0;i<9;i++){const t=i/8,x=-8*t,z=-728-20*t;const m=strip(routes,x,.03,z,.22,2.7);m.rotation.y=.38;}
 for(let i=0;i<8;i++){const t=i/7,x=-8+8*t,z=-759-20*t;const m=strip(routes,x,.03,z,.16,2.6);m.rotation.y=-.39;}
 // The transport railway frames the escort route; sleepers sit below the pilot.
 for(const x of [-2.65,2.65]){block(routes,c.ink,x,.01,-862,.21,.08,96);strip(routes,x,.07,-862,.10,96,c.ice)}
 for(let z=-815;z>-910;z-=3)block(routes,c.panel,0,-.015,z,6.1,.08,.32);
 // Roadside segmented bridge, with no raised beam crossing the walkable center.
 for(const z of [-793,-925]){
  deck(routes,0,z,8.8,14);for(const side of [-1,1]){block(routes,c.ink,side*4.65,.50,z,.25,.85,14);strip(routes,side*4.65,.96,z,.17,14,c.mint)}
  for(let j=-2;j<=2;j++)block(routes,c.white,0,.19,z+j*2.2,8.4,.04,.09);
 }
 optimizeTree(routes);

 const radar=new THREE.Group();radar.position.set(AURORA.radar.x,0,AURORA.radar.z);root.add(radar);
 part(radar,'cylinder',c.ink,0,.22,0,1.75,.44,1.75);part(radar,'cylinder',c.white,0,1.3,0,1.15,2.0,1.15);
 for(const x of [-.8,.8])strip(radar,x,1.25,1,.09,.06,c.mint);
 part(radar,'cylinder',c.ink,0,3.6,0,.3,3,.3);part(radar,'cylinder',c.white,0,4.4,0,.42,1.8,.42);
 const radarPower=new THREE.Group();radar.add(radarPower);for(const x of [-.86,.86])block(radarPower,c.mint,x,1.6,1.06,.10,1.5,.05,.4);radarPower.visible=false;
 const radarSpin=new THREE.Group();radarSpin.position.y=5.4;radar.add(radarSpin);
 const radarTilt=new THREE.Group();radarTilt.rotation.x=-.45;radarSpin.add(radarTilt);
 part(radarTilt,'ball',c.ink,0,0,0,1.0,.20,1.0);part(radarTilt,'ball',c.ice,0,.1,0,.9,.13,.9,.12);
 const petals=[];for(let i=0;i<4;i++){
  const pivot=new THREE.Group();pivot.rotation.y=i*Math.PI/2;radarTilt.add(pivot);
  const leaf=new THREE.Group();leaf.position.z=.72;pivot.add(leaf);
  block(leaf,c.ink,0,0,.62,1.2,.15,1.55);block(leaf,c.white,0,.08,.65,1.06,.12,1.42);strip(leaf,0,.16,.62,.08,1.25,c.mint);petals.push(leaf);
 }
 part(radarTilt,'cylinder',c.ink,0,.58,0,.055,1.2,.055);part(radarTilt,'ball',c.mint,0,1.21,0,.14,.14,.14,.35);
 const radarField=ring(radar,4.2,c.mint,.65,.045);radarField.position.y=.06;radarField.visible=false;
 const scan=new THREE.Group();radar.add(scan);const scanRay=strip(scan,0,.08,-7,.11,13,c.mint);scan.visible=false;
 const radarTag=tagged(radar,'RADAR ARRAY',0,7.7,0,5.8);optimizeTree(radar);

 const rover=new THREE.Group();rover.position.set(AURORA.roverStart.x,0,AURORA.roverStart.z);root.add(rover);
 block(rover,c.ink,0,.48,0,2.45,.6,3.6);block(rover,c.white,0,1.05,-.5,2.5,.8,2.0);
 block(rover,c.white,0,1.7,1.04,2.25,1.4,1.4);block(rover,c.ink,0,1.88,1.77,1.96,.70,.12);block(rover,c.ice,0,1.88,1.85,1.70,.49,.05,.12);
 strip(rover,0,2.43,1.03,1.9,.22,c.mint);block(rover,c.gold,0,.64,2.02,2.2,.23,.26);
 const wheels=[];for(const side of [-1,1])for(const z of [-1.2,0,1.2]){const joint=new THREE.Group();joint.position.set(side*1.35,.40,z);rover.add(joint);const wheel=part(joint,'cylinder',c.ink,0,0,0,.42,.33,.42);wheel.rotation.z=Math.PI/2;const cap=part(joint,'cylinder',c.panel,side*.19,0,0,.24,.06,.24);cap.rotation.z=Math.PI/2;wheels.push(joint)}
 for(const x of [-.67,.67]){part(rover,'cylinder',c.mint,x,1.5,-.76,.33,1.3,.33,.12);part(rover,'cylinder',c.white,x,2.20,-.76,.36,.14,.36);part(rover,'cylinder',c.white,x,.84,-.76,.36,.14,.36)}
 part(rover,'cylinder',c.ink,0,2.28,-1.2,.08,1.2,.08);part(rover,'ball',c.mint,0,2.91,-1.2,.17,.17,.17,.3);
 const solar=[];for(const side of [-1,1]){const wing=new THREE.Group();wing.position.set(side*.9,2.15,-.7);rover.add(wing);block(wing,c.white,side*.7,0,0,1.5,.12,2);block(wing,c.ink,side*.7,.075,0,1.34,.04,1.83);for(const z of [-.6,0,.6])strip(wing,side*.7,.105,z,1.2,.06,c.ice);solar.push({wing,side})}
 const roverField=ring(rover,8,c.mint,.58,.055);roverField.position.y=.045;
 const roverFill=new THREE.Mesh(new THREE.CircleGeometry(8,64),new THREE.MeshBasicMaterial({color:c.mint,transparent:true,opacity:.035,side:THREE.DoubleSide,depthWrite:false}));roverFill.rotation.x=-Math.PI/2;roverFill.position.y=.025;rover.add(roverFill);
 const roverTag=tagged(rover,'O₂ ENGINEERING ROVER',0,3.7,0,6.0);optimizeTree(rover);
 const disabledTag=label(rover,'ROVER DISABLED',0,3.7,0,5.4);disabledTag.visible=false;

 // A personal restart point is independent of a disabled rover's last position.
 // Wire outlines and a low floor ring cannot be mistaken for another solid car.
 const restart=new THREE.Group();restart.visible=false;root.add(restart);
 const restartRing=ring(restart,2.3,c.mint,.9,.07);restartRing.position.y=.055;
 const restartHolo=new THREE.Group();restart.add(restartHolo);
 const holoMaterial=new THREE.LineBasicMaterial({color:c.mint,transparent:true,opacity:.7,depthWrite:false});
 function holoBox(x,y,z,w,h,d){const boxGeometry=new THREE.BoxGeometry(w,h,d),edges=new THREE.EdgesGeometry(boxGeometry);boxGeometry.dispose();const outline=new THREE.LineSegments(edges,holoMaterial);outline.position.set(x,y,z);restartHolo.add(outline)}
 holoBox(0,.28,0,2.0,.32,2.7);holoBox(0,.62,.70,1.65,.48,.9);
 for(const x of [-.55,.55])holoBox(x,.65,-.61,.35,.66,.35);
 for(const side of [-1,1])for(const z of [-.9,.9]){const wheel=new THREE.Mesh(new THREE.RingGeometry(.20,.24,20),new THREE.MeshBasicMaterial({color:c.mint,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false}));wheel.rotation.y=Math.PI/2;wheel.position.set(side*1.07,.22,z);restartHolo.add(wheel)}
 const restartTag=label(restart,'RESTART ROVER',0,1.55,0,4.8);optimizeTree(restart);

 const forward=new THREE.Group();forward.position.set(AURORA.roverEnd.x,0,AURORA.roverEnd.z);root.add(forward);
 for(const side of [-1,1]){block(forward,c.ink,side*3.4,.16,0,.6,.3,5);part(forward,'cylinder',c.white,side*3.4,1.6,0,.11,3.1,.11);block(forward,c.white,side*3.4,3.2,0,.6,.2,4.6);strip(forward,side*3.4,3.32,0,.4,4.3)}
 const canopy=block(forward,c.white,0,3.2,0,7.4,.18,4.9);strip(forward,0,3.31,2.4,6.6,.10);
 const forwardRing=ring(forward,8,c.mint,.6,.06);forwardRing.position.y=.045;tagged(forward,'FORWARD O₂ OUTPOST',0,4.2,0,6.0);optimizeTree(forward);forward.visible=false;

 const ruins=new THREE.Group();ruins.position.set(AURORA.vault.x,0,AURORA.vault.z);root.add(ruins);
 for(const side of [-1,1]){
  part(ruins,'cylinder',c.ink,side*8,.12,0,1.6,.25,1.6);block(ruins,c.ink,side*8,2.75,0,2.0,5.4,2.2);block(ruins,c.panel,side*8,4.3,0,2.2,2.5,2.4);
  strip(ruins,side*8,3,1.24,.20,.08,c.violet);block(ruins,c.violet,side*8,3,1.23,.18,3.8,.07,.2);
  part(ruins,'crystal',c.ice,side*8,6.1,0,.43,1.0,.43,.12);
 }
 const lintel=new THREE.Group();ruins.add(lintel);
 block(lintel,c.ink,0,5.6,0,17.4,.65,2.1);block(lintel,c.white,0,5.95,0,17.8,.3,2.3);strip(lintel,0,5.55,1.12,14,.09,c.violet);
 const seal=ring(ruins,5.7,c.violet,.75,.07);seal.position.y=.03;
 for(let j=0;j<3;j++)for(const side of [-1,1]){const x=side*(11+j*2.2),z=(j-1)*7;block(ruins,c.ink,x,.42,z,1.4,.8,2);block(ruins,c.panel,x,.9,z,1.5,.15,2.1)}
 tagged(ruins,'AEGIS VAULT · MECHANICAL CORE',0,7.8,0,9.0);optimizeTree(ruins);
 const exit=new THREE.Group();exit.position.set(AURORA.exit.x,0,AURORA.exit.z);root.add(exit);ring(exit,3.2,c.gold,.6,.05);for(let i=0;i<4;i++)arrow(exit,0,4-i*2,c.gold,1.2);optimizeTree(exit);
 let state=null,deployment=0,completion=0,lastZ=AURORA.roverStart.z,restartAvailable=false;
 function sync(s,self){state=s||null;const r=state?.rover;if(r){rover.position.set(r.x,0,r.z);roverField.scale.setScalar((r.radius||8)/8);roverFill.scale.setScalar((r.radius||8)/8);roverField.visible=r.stage!=='failed';roverFill.visible=r.stage!=='failed';forward.visible=r.stage==='complete';roverTag.visible=r.stage!=='complete'}restartAvailable=!!r?.resume&&self?.aurora?.escort!==true&&['idle','failed','complete'].includes(r.stage);restart.visible=restartAvailable;if(restartAvailable)restart.position.set(r.resume.x,0,r.resume.z);radarField.visible=state?.radar.state==='complete';scan.visible=state?.radar.state==='active';}
 function render(dt,clock,me,overview=false){
  const radarState=state?.radar,roverState=state?.rover,open=radarState?.state==='complete'?1:radarState?.state==='active'?.25+.75*(radarState.progress/(radarState.required||18)):0;
  deployment=THREE.MathUtils.damp(deployment,open,4,dt);for(const petal of petals)petal.rotation.x=-(1-deployment)*1.15;
  radarPower.visible=open>.01;
  radarSpin.rotation.y+=dt*(radarState?.state==='complete'?.45:.13);radarTilt.position.y=deployment*.45;scan.rotation.y=clock*1.7;radarField.material.opacity=.4+Math.sin(clock*1.6)*.1;
  const goal=roverState?.stage==='complete'?1:0;completion=THREE.MathUtils.damp(completion,goal,3,dt);for(const {wing,side}of solar)wing.rotation.z=-side*(1-completion)*.9;
  forward.scale.y=.1+.9*completion;roverField.material.color.set(roverState?.health<.35?'#f3a7a2':c.mint);
  for(const wheel of wheels)wheel.rotation.x+=(lastZ-rover.position.z)*2.3;lastZ=rover.position.z;
  roverField.material.opacity=roverState?.stage==='paused'?.32:.46+Math.sin(clock*2)*.1;forwardRing.material.opacity=.5+Math.sin(clock*1.8)*.1;
  lintel.visible=overview||state?.guardian.state!=='active';seal.material.color.set(state?.guardian.coreOpen?c.gold:c.violet);seal.rotation.z=clock*.08;
  for(const {tag,g}of tags){const pos=new THREE.Vector3();g.getWorldPosition(pos);const distance=me?Math.hypot(me.x-pos.x,me.z-pos.z):0;tag.visible=!overview&&distance>4&&distance<37;}
  const roverNearby=!me||Math.hypot(me.x-rover.position.x,me.z-rover.position.z)<26;
  roverTag.visible=!overview&&!['complete','failed'].includes(roverState?.stage)&&roverNearby;
  disabledTag.visible=!overview&&roverState?.stage==='failed'&&roverNearby;
  const restartDistance=me?Math.hypot(me.x-restart.position.x,me.z-restart.position.z):0;
  restart.visible=restartAvailable&&(overview||!me||restartDistance<65);restartTag.visible=!overview&&restartDistance>3.5&&restartDistance<37;
  restartRing.material.opacity=.65+Math.sin(clock*2.4)*.18;restartHolo.position.y=.04+Math.sin(clock*2)*.035;
  base.visible=overview||!me||Math.abs(me.z-AURORA.base.z)<100;radar.visible=overview||!me||Math.abs(me.z-AURORA.radar.z)<125;ruins.visible=overview||!me||Math.abs(me.z-AURORA.vault.z)<110;
 }
 return {sync,render,base,radar,rover,restart,ruins,tags};
}

// A true mechanical guardian: four servo legs, twin hammer arms, an iris of
// sliding armor plates and an emissive core. Its plates stay on their own pivots.
export function createAuroraGuardian({part,optimizeTree}){
 const c=AURORA_COLORS,root=new THREE.Group(),chassis=new THREE.Group();root.add(chassis);
 const b=(g,col,x,y,z,w,h,d,glow=0)=>part(g,'round',col,x,y,z,w,h,d,glow);
 b(chassis,c.ink,0,2.15,0,2.8,2.0,1.7);b(chassis,c.white,0,3.0,-.2,3.0,.45,1.9);b(chassis,c.violet,0,2.0,-.95,2.3,1.7,.2);
 for(const side of [-1,1])for(const z of [-.62,.62]){
  b(chassis,c.ink,side*1.28,.78,z,.42,1.65,.45);part(chassis,'ball',c.panel,side*1.28,1.35,z,.34,.34,.34);
  b(chassis,c.white,side*1.54,.32,z,.75,.44,.9);b(chassis,c.ice,side*1.54,.43,z+.46,.44,.10,.035,.15);
 }
 const core=part(chassis,'crystal',c.mint,0,2.3,1.12,.52,.7,.21,.5);
 const rim=part(chassis,'hex',c.ink,0,2.3,1.02,.88,.22,.88);rim.rotation.x=Math.PI/2;
 part(chassis,'crystal',c.mint,0,2.3,1.22,.43,.59,.16,.5);
 b(chassis,c.ink,0,3.50,-.1,1.60,.56,1.15);b(chassis,c.white,0,3.78,-.14,1.72,.15,1.23);b(chassis,c.gold,0,3.5,.51,1.20,.12,.06,.15);
 for(const side of [-1,1]){b(chassis,c.violet,side*.6,3.94,-.1,.17,.30,.6);part(chassis,'cylinder',c.ink,side*.9,3.25,-.4,.07,.45,.07)}
 const plates=[];for(const side of [-1,1]){
  const plate=new THREE.Group();plate.position.set(side*.45,2.3,1.33);root.add(plate);b(plate,c.white,0,0,0,.92,1.5,.23);b(plate,c.violet,side*.28,0,.13,.16,1.26,.05);plates.push({plate,side});
 }
 const hammers=[];for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*1.70,2.65,0);root.add(arm);part(arm,'ball',c.ink,0,0,0,.38,.38,.38);b(arm,c.panel,side*.15,-.62,.1,.52,1.35,.64);
  b(arm,c.ink,side*.23,-1.25,.22,.84,.70,1.18);b(arm,c.white,side*.23,-1.24,.24,.94,.56,1.28);b(arm,c.violet,side*.23,-1.24,.92,.70,.35,.10);hammers.push({arm,side});
 }
 optimizeTree(root);let opening=0;
 return {root,height:4.55,update(e,dt,clock){opening=THREE.MathUtils.damp(opening,e.coreOpen?1:0,10,dt);for(const {plate,side}of plates){plate.position.x=side*(.45+opening*.80);plate.rotation.y=side*opening*.38}core.rotation.z=clock*.5;core.material.emissiveIntensity=e.coreOpen?.65:.13;for(const {arm,side}of hammers){arm.rotation.x=!e.coreOpen&&e.coreRemaining<1.8?.32:!e.coreOpen&&e.coreRemaining<4?-1.0:Math.sin(clock*2+side)*.04;arm.rotation.z=side*opening*.12}}};
}
