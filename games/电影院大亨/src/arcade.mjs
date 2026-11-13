import {T,mat,glow,box,cyl,ball,group,batch,sign} from './geometry.mjs';
import {ARCADE_SLOTS} from './data.mjs';

export class ArcadeRenderer {
 constructor(parent){
  this.cabinets=ARCADE_SLOTS.map((p,i)=>{
   const root=group(parent,p.x,0,13.7),body=group(root),color=['#7562bd','#3da7ae','#ca567b'][i];
   box(body,0,.19,0,1.86,.35,1.78,mat('#24354c'),.12);
   box(body,0,1.1,-.18,1.65,1.75,1.35,mat(color),.13);
   box(body,0,2.65,-.37,1.72,1.55,1.03,mat(color),.12);
   box(body,0,3.62,-.36,1.85,.37,1.18,mat('#26354e'),.09);
   sign(body,['MOON RALLY','STAR DANCE','PIXEL QUEST'][i],0,3.63,.25,1.69,.28,'#fff0be',color,56);
   for(const side of [-1,1]){box(body,side*.84,2.35,.17,.06,2.43,.06,glow(['#b2a1ef','#90f1d8','#ffb4cc'][i],.8),.02);box(body,side*.88,3.66,.27,.05,.2,.04,glow('#f3d78a',.6));}
   box(body,0,1.9,.42,1.82,.25,.94,mat('#283a57'),.08);
   box(body,0,2.68,.17,1.42,1.06,.085,mat('#142335'),.07);
   cyl(body,-.41,2.12,.61,.045,.34,mat('#526779'));ball(body,-.41,2.31,.61,.1,mat('#edbd67'));
   for(const x of [.15,.43])cyl(body,x,2.06,.61,.1,.09,mat(x<.3?'#a8e5c4':'#ef86a6'));
   box(body,0,.87,.52,.22,.12,.045,mat('#efc978'),.02);sign(body,'PLAY',0,1.24,.52,.86,.23,'#e4deb2',color,50);
   batch(body);
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=180;
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
   const screen=new T.Mesh(new T.PlaneGeometry(1.29,.9),new T.MeshBasicMaterial({map:texture,toneMapped:false}));screen.position.set(0,2.68,.22);root.add(screen);
   const light=new T.PointLight(['#ad8dff','#65f0d0','#ff8cbb'][i],2,4);light.position.set(0,2.5,1);root.add(light);
   return{root,canvas,texture,light,last:-1,index:i};
  });
 }
 update(s,time){for(const c of this.cabinets){c.root.visible=c.index<(s.upgrades.arcade||0);if(!c.root.visible)continue;const playing=s.guests.some(g=>g.arcade===c.index&&g.phase==='playing'),frame=Math.floor(time*10);c.light.intensity=playing?4+Math.sin(time*8):1.5;if(frame===c.last)continue;c.last=frame;
   const q=c.canvas.getContext('2d');q.fillStyle='#10253e';q.fillRect(0,0,256,180);
   for(let j=0;j<18;j++){q.fillStyle=j%3?'#597195':'#dfc284';q.fillRect((j*71)%256,((j*31+time*(playing?23:7))%180),2,2);}
   q.strokeStyle=['#a9a1ee','#82e8d0','#f2a4c2'][c.index];q.lineWidth=2;
   for(let j=0;j<5;j++){const y=(j*38+time*32)%180;q.beginPath();q.moveTo(110-y*.48,y);q.lineTo(146+y*.48,y);q.stroke();}
   const x=128+Math.sin(time*(playing?2.7:.6)+c.index)*45;q.fillStyle='#ffd686';q.beginPath();q.moveTo(x,115);q.lineTo(x-14,142);q.lineTo(x,135);q.lineTo(x+14,142);q.closePath();q.fill();
   q.font='bold 15px Nunito, sans-serif';q.textAlign='center';q.fillStyle='#e2f3e6';q.fillText(playing?'READY · GO!':'INSERT COIN',128,24);
   q.fillStyle='#192b4130';for(let y=0;y<180;y+=4)q.fillRect(0,y,256,1);c.texture.needsUpdate=true;
  }}
}
