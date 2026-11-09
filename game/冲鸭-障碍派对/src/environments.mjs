import * as T from '../vendor/three.module.js';
export const THEMES={
 cloud:{sky:'#54d8fb',fog:'#8be5ff',floor:'#13bce9',fleck:'#28c8ef',edge:'#2874d5',rail:'#ffcf24',accent:'#f83e91',light:'#fffaf4'},
 ice:{sky:'#718bc6',fog:'#b6d9ee',floor:'#a9e3ec',fleck:'#d5f8ff',edge:'#6ba1c4',rail:'#e6fbff',accent:'#7289ea',light:'#e1f8ff'},
 neon:{sky:'#161b3e',fog:'#36315d',floor:'#34436c',fleck:'#3b4d78',edge:'#25294b',rail:'#70e7ed',accent:'#d771ef',light:'#d6e5ff'},
 lava:{sky:'#622e3b',fog:'#ba6553',floor:'#ae7963',fleck:'#bf8b72',edge:'#65494a',rail:'#ffd07d',accent:'#e86f64',light:'#ffe7c6'}
};
// Distant landmarks are scenery only: the bright, bounded platforms remain the race route.
export function buildEnvironment(g,theme,course,{box,ball,cyl,torus,grp,add}){
 const motion=[],kind=course.theme,t=THEMES[kind];
 if(kind==='cloud'){
  for(let i=0;i<38;i++){const cloud=grp(g,(i%2?-1:1)*(24+(i*7)%20),-4+(i%3)*2,22-i*10);for(let j=0;j<4;j++)ball(cloud,(j-1.5)*2,Math.sin(j+i)*.3,0,2.1,'#ffffff',1.5,.65,1);}
  for(const [x,y,z,color]of[[-14,8,-30,'#ff709c'],[15,11,-50,'#ffd348'],[-18,13,-87,'#9e8cff'],[18,8,-119,'#ff729f']]){const b=grp(g,x,y,z);ball(b,0,0,0,1.7,color,.85,1.15,.85);cyl(b,0,-2.8,0,.018,3.3,'#d2f2fc');box(b,0,-4.65,0,.8,.55,.65,'#ffe8b2',.1);}
 }else if(kind==='ice'){
  for(let i=0;i<30;i++){const side=i%2?1:-1,z=8-i*12,x=side*(19+i%4*5),height=7+i%5*3;const mountain=add(g,new T.ConeGeometry(6+i%3,height,5),'#a8b9df',x,height/2-7,z);mountain.rotation.y=i;add(g,new T.ConeGeometry(3+i%2,height*.46,5),'#e7f8ff',x,height*.72-7,z);for(let j=0;j<3;j++){const crystal=add(g,new T.OctahedronGeometry(1,0),j%2?'#b8eff5':'#a8c2f2',side*(10+j*1.6),-.5, z+j);crystal.scale.set(.7,2.2+j,.8);crystal.rotation.z=side*(.2+j*.1);}}
  for(let k=0;k<3;k++){const shape=new T.PlaneGeometry(100,9,40,3),pos=shape.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin(pos.getX(i)*.08+k)*6);shape.computeVertexNormals();const m=new T.MeshBasicMaterial({color:['#88ffe3','#aaadff','#72d6ff'][k],side:T.DoubleSide,transparent:true,opacity:.18,depthWrite:false});const aurora=new T.Mesh(shape,m);aurora.position.set(0,18+k*5,-75-k*90);g.add(aurora);motion.push({kind:'aurora',g:aurora,k});}
  for(const w of course.winds)for(let i=0;i<6;i++){const flake=add(g,new T.OctahedronGeometry(.07),'#ffffff',-7+i*2.5,1.5+i%3,(w.z1+w.z2)/2+i*3);motion.push({kind:'snow',g:flake,origin:flake.position.clone()});}
 }else if(kind==='neon'){
  for(let i=0;i<32;i++){const side=i%2?1:-1,x=side*(15+i%4*5),z=10-i*12,height=5+i%6*2;box(g,x,height/2-3,z,4,height,5,'#252844',.2);for(let j=0;j<height-1;j+=2)box(g,x,height/2-3+j-height/2,z+2.52,2.8,.17,.04,i%2?'#ae8eea':'#73c7da',.02,{glow:.45});box(g,x,height-3,z,4.2,.12,5.2,t.rail,.04,{glow:.5});}
  for(let z=-45;z>course.finish;z-=63){for(const s of[-1,1])box(g,s*10.3,4,z,.25,8,.4,'#9a6ae3',.06,{glow:.4});box(g,0,8,z,21,.2,.4,'#73d9eb',.06,{glow:.5});}
  for(let i=0;i<7;i++){const r=torus(g,(i%2?1:-1)*20,6,-20-i*46,3,.1,'#a58fe9');r.rotation.y=.5;motion.push({kind:'ring',g:r,k:i});}
 }else{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#cb5032';c.fillRect(0,0,128,128);for(let i=0;i<22;i++){c.strokeStyle=i%2?'#ffb95e':'#ef7840';c.lineWidth=i%3+2;c.beginPath();c.moveTo(i*19%128,0);c.bezierCurveTo(i*7%128,40,i*31%128,80,i*43%128,128);c.stroke();}const tex=new T.CanvasTexture(canvas);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.repeat.set(8,48);const river=new T.Mesh(new T.PlaneGeometry(130,course.start-course.finish+120),new T.MeshBasicMaterial({map:tex}));river.rotation.x=-Math.PI/2;river.position.set(0,-7,course.finish/2);g.add(river);motion.push({kind:'lava',texture:tex});
  for(let i=0;i<30;i++){const s=i%2?1:-1,x=s*(14+i%4*6),z=5-i*12;const rock=add(g,new T.DodecahedronGeometry(3+i%3),'#60424b',x,-3,z);rock.rotation.set(i*.3,i,0);if(i%3===0){cyl(g,x,1,z,1.1,8,'#98715d',1.3);box(g,x,5,z,3,.6,3,'#d4ae85');box(g,x,.3,z,3,.5,3,'#d4ae85');}}
  for(let z=-15;z>course.finish;z-=29)for(const s of[-1,1]){cyl(g,s*9,1,z,.13,2,'#6d4451');const fire=add(g,new T.OctahedronGeometry(.5),'#ffd16d',s*9,2.2,z,{glow:.7});fire.scale.set(.65,1.3,.65);motion.push({kind:'fire',g:fire,k:z});}
 }
 return {update(time){for(const q of motion){if(q.kind==='lava')q.texture.offset.y=time*.012;else if(q.kind==='aurora'){q.g.rotation.z=Math.sin(time*.15+q.k)*.04;}else if(q.kind==='snow'){q.g.position.x=q.origin.x+Math.sin(time*.7+q.origin.z)*1.7;q.g.position.y=q.origin.y+Math.sin(time+q.origin.x)*.2;}else if(q.kind==='ring')q.g.rotation.z=time*.08+q.k;else if(q.kind==='fire'){q.g.scale.y=1.3+Math.sin(time*9+q.k)*.18;}}}};
}
