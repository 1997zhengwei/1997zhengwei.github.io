import {T,mat,box,cyl,ball,group,batch,mesh} from './geometry.mjs';

// Non-playable streetscape, following the reference's city-block setting.
export function createCity(parent){
 const root=group(parent),staticRoot=group(root);
 box(staticRoot,0,-.2,-4,145,.12,170,mat('#6b7181'),.01);
 for(const [x,z,w,d]of [[32,-8,12,145],[0,48,105,13]])box(staticRoot,x,-.105,z,w,.07,d,mat('#424855'),.008);
 for(let z=-71;z<=47;z+=10)box(staticRoot,32,-.06,z,.13,.015,4.8,mat('#c1c7c7'),.002);
 for(const x of [-25.6,25.6])box(staticRoot,x,-.075,-9,2.7,.14,110,mat('#a3a8ac'),.015);
 for(let z=-60;z<=37;z+=3.6)for(const x of [-25.6,25.6])box(staticRoot,x,.005,z,2.64,.018,3.5,mat('#aeb4b8'),.004);
 const building=(x,z,w,d,h,color)=>{
  box(staticRoot,x,h/2-.08,z,w,h,d,mat(color),.035);box(staticRoot,x,h+.15,z,w+.5,.36,d+.5,mat('#abb7c3'),.02);
  for(let y=2.1;y<h-1;y+=3.2){for(let xx=x-w/2+1.55;xx<x+w/2-1;xx+=2.8){box(staticRoot,xx,y,z+d/2+.025,1.7,2,.08,mat((Math.round(xx+y)%3)?'#6e91a8':'#a1b4ba'),.006);box(staticRoot,xx,y-1.05,z+d/2+.08,1.96,.12,.2,mat('#b6c0c6'),.004);}for(let zz=z-d/2+1.6;zz<z+d/2-1;zz+=3.4)box(staticRoot,x+w/2+.025,y,zz,.08,2,2.1,mat('#7795a8'),.006);}
  box(staticRoot,x,.85,z+d/2+.08,3.2,1.75,.12,mat('#4d687f'),.01);
 };
 building(-35,-43,14,18,15,'#7c899b');building(-36,-17,16,19,12,'#7f879d');building(-35,13,14,20,17,'#777e92');
 building(-14,-73,18,13,12,'#687a92');building(13,-74,20,14,15,'#72869b');
 for(const z of [-47,-13,22]){cyl(staticRoot,-25,2.45,z,.055,5,mat('#4d5c70'),.055,10);box(staticRoot,-25,4.93,z,.55,.15,.55,mat('#dce7df'),.025);box(staticRoot,-25,.07,z,1.45,.2,1.45,mat('#8a959e'),.025);}
 box(staticRoot,0,-.06,59,30,.12,9,mat('#a8acb1'),.03);
 for(const x of [-10,10]){box(staticRoot,x,.17,59,3.4,.42,3.4,mat('#6a8a64'),.03);cyl(staticRoot,x,1.6,59,.16,3,mat('#886f53'),.13,7);for(let i=0;i<7;i++){const a=i*Math.PI*2/7,leaf=box(staticRoot,x+Math.sin(a)*.75,3.2,59+Math.cos(a)*.75,.42,.13,2.5,mat(i%2?'#4e9168':'#65a177'),.035);leaf.rotation.set(.12,a,.16);}}
 cyl(staticRoot,0,.3,59,2.75,.65,mat('#8c9da9'),2.7,40);cyl(staticRoot,0,.65,59,2.35,.08,mat('#66b7ce',.36),2.35,40);cyl(staticRoot,0,.93,59,.52,.65,mat('#a5b6c0'),.45,16);cyl(staticRoot,0,1.55,59,.09,1.1,mat('#b7e4e9'),.19,12);ball(staticRoot,0,2.15,59,.19,mat('#c5eaee'));
 batch(staticRoot);return root;
}
