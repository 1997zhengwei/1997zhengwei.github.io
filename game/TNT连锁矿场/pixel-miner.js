import * as THREE from './vendor/three.module.js';
// Integer-grid sprite: large face, few colours and nearest-neighbour sampling
// deliberately replace tiny painted details at mobile viewing sizes.
export function pixelMiner(){
  const c=document.createElement('canvas');c.width=40;c.height=48;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const box=(a,b,w,h,color)=>{x.fillStyle=color;x.fillRect(a,b,w,h);};
  const ink='#173b3f',skin='#ffd397',shade='#e5a067',cyan='#22d6d0',light='#9ffff0',blue='#276bb8';
  // Backpack and boots silhouette.
  box(3,27,9,16,ink);box(4,28,7,13,'#a86b38');box(5,30,5,2,'#e6b260');
  box(10,36,16,10,ink);box(10,44,8,4,ink);box(22,44,8,4,ink);box(11,44,6,2,'#a97038');box(23,44,6,2,'#cf984d');
  // Cyan shirt, blue overalls and a broad gold buckle.
  box(8,26,21,12,ink);box(10,27,16,10,cyan);box(10,27,4,8,light);box(24,28,3,7,'#08a4b0');
  box(11,35,7,9,blue);box(21,35,6,9,blue);box(12,36,2,7,'#53a9eb');box(22,36,2,7,'#53a9eb');box(10,34,17,3,'#76502d');box(17,34,5,3,'#ffe48b');box(18,35,3,1,'#af7b2b');
  // Big square face with explicit high-contrast eyes and mouth.
  box(8,10,20,18,ink);box(9,11,18,16,skin);box(9,12,3,14,shade);box(24,14,3,12,'#f2b579');
  box(10,12,16,3,'#8b552d');box(11,15,3,2,'#8b552d');box(12,17,4,5,'#fff8da');box(21,17,4,5,'#fff8da');box(14,18,2,3,ink);box(23,18,2,3,ink);box(17,22,4,2,'#e7a366');box(15,25,9,2,ink);box(16,25,6,1,'#fff9db');
  // Orange helmet, pale stripe and readable lamp.
  box(9,2,17,2,ink);box(6,4,23,7,ink);box(4,10,27,4,ink);box(10,3,15,2,'#ffe76c');box(7,5,21,6,'#ffae23');box(8,5,6,4,'#ffdd4e');box(26,6,2,5,'#e88417');box(5,11,25,2,'#ffdc58');box(17,5,8,6,'#637f83');box(18,6,6,4,'#fffbc3');box(19,6,4,2,'#ffffff');
  // Gloved arms and an intentionally chunky pixel pickaxe.
  box(5,30,5,11,ink);box(6,31,3,7,skin);box(5,37,5,5,'#bb7735');box(26,24,7,9,ink);box(27,25,5,6,skin);box(28,24,5,4,'#c98b42');
  for(const[a,b]of[[29,27],[31,23],[33,19],[35,15]]){box(a,b,3,6,ink);box(a+1,b,1,5,'#e5b96b');}
  box(27,10,12,4,ink);box(25,12,5,5,ink);box(36,12,4,6,ink);box(28,11,10,2,'#e5fff0');box(26,13,4,2,'#b5dedc');box(37,13,2,4,'#7aacbc');
  const texture=new THREE.CanvasTexture(c);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.5,depthWrite:false}));sprite.scale.set(1.3,1.56,1);sprite.position.set(0,.64,.3);return sprite;
}
