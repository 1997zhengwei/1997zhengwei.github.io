import * as T from '../vendor/three.module.js';
import {M,mat,box,cylinder,sphere,torus,batchSurfaces,batch,textSprite,floorTexture,palm,plant} from './art.mjs';
import {HOTEL_PALETTE as P} from './palette.mjs';

export function buildVillaEstate(){
 const g=new T.Group(),palms=[];
 const coast=cylinder(g,0,-.45,-50.2,19.6,.3,mat('#f7dfad'));coast.scale.set(1.03,1,1);
 const earth=cylinder(g,0,-1.05,-50.2,19.3,1.0,mat('#eed6a0'));earth.scale.set(1.03,1,1);
 const lawn=cylinder(g,0,-.19,-50.2,17.5,.16,mat(P.lawn));
 box(g,0,.03,-48,27.4,.4,24.3,M.ivory,.25);
 box(g,0,.23,-48,26,.1,23.2,new T.MeshStandardMaterial({map:floorTexture('lobby'),roughness:.9}),.03);
 box(g,0,.325,-49,5.0,.02,22.8,mat(P.runner),.03);
 for(const x of [-2.55,2.55])box(g,x,.35,-49,.045,.035,22.9,M.gold,.015);
 for(let z=-21.1;z>=-37.2;z-=.52)box(g,0,.22,z,5.4,.12,.47,M.wood,.025);
 for(const x of [-2.58,2.58]){
  for(let z=-22;z>=-37;z-=2.8){cylinder(g,x,.82,z,.065,1.15,M.ivory);sphere(g,x,1.42,z,.1,M.gold);}
  box(g,x,1.05,-29,.055,.07,17.2,M.ivory,.025);
 }
 // A dedicated linen cabinet lets the villa housekeeper stay in this district.
 box(g,-10.8,1.13,-38.5,1.4,1.7,2.2,M.wood,.09);
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)box(g,-10.06,.63+row*.44,-39.15+col*.63,.08,.16,.45,col%2?M.white:M.teal,.03);
 const supplies=textSprite('别 墅 布 草','#fff3c5',.42,'#168ccb');supplies.position.set(-9.7,2.3,-38.5);g.add(supplies);
 for(const x of [-3,3]){cylinder(g,x,1.7,-37,.12,2.8,M.white);cylinder(g,x,.45,-37,.19,.22,M.gold);}
 box(g,0,3.1,-37,6.7,.2,.4,M.teal,.06);
 const sign=textSprite('海 景 别 墅','#fff1aa',.66,'#1397d8');sign.position.set(0,3.65,-37);g.add(sign);
 for(const [x,z,r] of [[-16,-42,0], [16,-41,.8],[-16,-57,1.4],[16,-58,2.6],[0,-66,.4]])palms.push(palm(g,x,z,1,r));
 for(const x of [-5.1,5.1]){plant(g,x,-38.3,.8);plant(g,x,-59,.8);}
 batchSurfaces(g);return {root:g,palms};
}

export function villaDetails(r){
 const g=new T.Group();
 if(!r.built){const sign=textSprite('海景地块','#fff7d3',.45,'#33a667');sign.position.set(0,.9,1.1);g.add(sign);return g;}
 // All additions use the approved green/orange/blue palette and leave the room open to view.
 box(g,0,.34,4.22,8.5,.12,.9,M.wood,.05);
 for(const x of [-4.05,4.05]){cylinder(g,x,1.53,3.95,.14,2.4,M.white);cylinder(g,x,.48,3.95,.2,.22,M.gold);sphere(g,x,2.8,3.95,.15,M.gold);}
 box(g,0,2.78,-3.7,9.4,.22,.55,M.wood,.08);
 for(const x of [-4.45,4.45])cylinder(g,x,1.55,-3.7,.17,2.4,M.white);
 const label=textSprite(['','SEAVIEW','GARDEN','LUXURY','ROYAL','PRESIDENT'][r.tier],'#fff4bf',.34,'#1c8dca');label.position.set(0,3.05,-3.75);g.add(label);
 if(r.tier>=2){plant(g,-3.6,3.65,.55);plant(g,3.6,3.65,.55);}
 if(r.tier>=3){for(const x of [-3.1,3.1]){cylinder(g,x,1.13,3.95,.055,1.3,M.gold);sphere(g,x,1.8,3.95,.17,M.ivory);}}
 if(r.tier>=4){
  for(const x of [-2.07,2.07])for(const z of [-2.9,1.0]){cylinder(g,x,1.96,z,.07,2.7,M.gold);sphere(g,x,3.34,z,.14,M.gold);}
  for(const x of [-2.07,2.07])box(g,x,3.28,-.95,.08,.1,3.9,M.gold,.025);
  for(const z of [-2.9,1.0])box(g,0,3.28,z,4.2,.1,.08,M.gold,.025);
 }
 if(r.tier===5){const gem=new T.Mesh(new T.OctahedronGeometry(.26),mat('#86e4fb',.24,.12));gem.position.set(0,3.38,-.95);g.add(gem);torus(g,0,3.4,-.95,.42,.025,M.gold);}
 batchSurfaces(g);return g;
}
