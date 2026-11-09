import * as THREE from './vendor/three.module.js';
import {pixelMiner} from './pixel-miner.js';
const loadImage=src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=new URL(src,import.meta.url).href;});
// Keep bootstrap deterministic. If an asset cannot load, the original
// procedural material remains available; game rules never depend on images.
const[atlas,portrait]=await Promise.all([loadImage('./assets/mine-atlas-v04.png'),loadImage('./assets/miner-v06.png')]);
const cells={dirt:[0,0],stone:[1,0],coal:[2,0],gold:[3,0],diamond:[0,1],tnt:[1,1],bedrock:[2,1],cache:[3,1]};
export class PaintedTiles{
  constructor(){this.ready=!!atlas;this.cache=new Map();}
  material(type){if(!atlas)return null;if(this.cache.has(type))return this.cache.get(type);const [col,row]=cells[type],c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(atlas,col*atlas.width/4,row*atlas.height/2,atlas.width/4,atlas.height/2,0,0,256,256);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=2;const face=new THREE.MeshBasicMaterial({map:texture,alphaTest:.32}),side=new THREE.MeshLambertMaterial({color:{dirt:0x8b5726,stone:0x123e5c,coal:0x697582,gold:0x8d916e,diamond:0x719d9c,tnt:0xb42e18,bedrock:0x10263c,cache:0x8f551b}[type]});const mats=[side,side,side,side,face,side];this.cache.set(type,mats);return mats;}
  miner(){
    if(!portrait)return pixelMiner();
    const scan=document.createElement('canvas');scan.width=portrait.width;scan.height=portrait.height;const g=scan.getContext('2d',{willReadFrequently:true});g.drawImage(portrait,0,0);const pixels=g.getImageData(0,0,scan.width,scan.height).data;let left=scan.width,top=scan.height,right=0,bottom=0;
    for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(pixels[(y*scan.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    left=Math.max(0,left-4);top=Math.max(0,top-4);right=Math.min(scan.width-1,right+4);bottom=Math.min(scan.height-1,bottom+4);const aspect=(right-left+1)/(bottom-top+1),canvas=document.createElement('canvas');canvas.height=256;canvas.width=Math.round(256*aspect);const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(portrait,left,top,right-left+1,bottom-top+1,0,0,canvas.width,canvas.height);
    const texture=new THREE.CanvasTexture(canvas);texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.16,depthWrite:false}));sprite.scale.set(1.5*aspect,1.5,1);sprite.position.set(0,.63,.3);return sprite;
  }
}
