import * as T from '../vendor/three.module.js';

// A small shared cel ramp keeps the entire world in one illustrated palette.
const ramp=new Uint8Array([92,92,92,255, 160,160,160,255, 222,222,222,255, 255,255,255,255]);
const gradient=new T.DataTexture(ramp,4,1,T.RGBAFormat);
gradient.minFilter=gradient.magFilter=T.NearestFilter;
gradient.generateMipmaps=false;
gradient.needsUpdate=true;
export function artMaterial(options={}){
 const {roughness,metalness,clearcoat,clearcoatRoughness,flatShading,...surface}=options;
 return new T.MeshToonMaterial({gradientMap:gradient,...surface});
}

// Signs are authored here rather than using borrowed artwork or remote fonts.
export function signTexture(title,color='#f05a44',kind='shop'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;
 const x=canvas.getContext('2d');x.fillStyle='#fff9df';x.fillRect(0,0,512,192);
 x.fillStyle=color;x.fillRect(8,8,496,176);x.strokeStyle='#263651';x.lineWidth=8;x.strokeRect(4,4,504,184);
 x.fillStyle='#fff9df';x.textBaseline='middle';x.textAlign='center';
 x.font='900 57px "Microsoft YaHei",Arial,sans-serif';x.fillText(title,256,83,440);
 x.font='700 18px Arial,sans-serif';x.fillText(kind==='shop'?'SMALL TOWN · BIG DAY':'LITTLE THINGS, BIG ADVENTURES',256,141,438);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
}
