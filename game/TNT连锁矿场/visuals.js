import * as THREE from './vendor/three.module.js';

// A small, byte-target bloom pipeline. No float textures, external shaders,
// gameplay clocks, camera changes or input interception are involved.
export class CaveBloom {
  constructor(renderer){
    this.renderer=renderer;this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);this.camera.position.z=1;
    this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial());this.scene.add(this.quad);
    const vertexShader='varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
    const material=(fragmentShader,uniforms)=>new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms,depthTest:false,depthWrite:false});
    this.extract=material(`varying vec2 vUv;uniform sampler2D image;void main(){vec3 c=texture2D(image,vUv).rgb;float b=max(max(c.r,c.g),c.b);float dark=min(min(c.r,c.g),c.b);float k=smoothstep(.77,.99,b)*smoothstep(.2,.6,b-dark);gl_FragColor=vec4(c*k,1.);}`,{image:{value:null}});
    this.blur=material(`varying vec2 vUv;uniform sampler2D image;uniform vec2 stepSize;void main(){vec3 c=texture2D(image,vUv).rgb*.227027;c+=texture2D(image,vUv+stepSize*1.384615).rgb*.316216;c+=texture2D(image,vUv-stepSize*1.384615).rgb*.316216;c+=texture2D(image,vUv+stepSize*3.230769).rgb*.070270;c+=texture2D(image,vUv-stepSize*3.230769).rgb*.070270;gl_FragColor=vec4(c,1.);}`,{image:{value:null},stepSize:{value:new THREE.Vector2()}});
    this.composite=material(`varying vec2 vUv;uniform sampler2D image;uniform sampler2D glow;void main(){vec3 c=texture2D(image,vUv).rgb;vec3 b=texture2D(glow,vUv).rgb;c=clamp(c+b*.16,0.,1.);float edge=pow(abs(vUv.x-.5)*1.65,2.);c*=1.-edge*.035;gl_FragColor=vec4(c,1.);#include <colorspace_fragment>\n}`,{image:{value:null},glow:{value:null}});
    // Chunk directives must start on their own source line.
    this.composite.fragmentShader=this.composite.fragmentShader.replace('#include','\n#include');
    const options={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,stencilBuffer:false};
    this.source=new THREE.WebGLRenderTarget(1,1,{...options,depthBuffer:true});this.a=new THREE.WebGLRenderTarget(1,1,options);this.b=new THREE.WebGLRenderTarget(1,1,options);
  }
  resize(width,height){const dpr=this.renderer.getPixelRatio();this.source.setSize(Math.max(1,Math.round(width*dpr)),Math.max(1,Math.round(height*dpr)));this.w=Math.max(1,Math.round(width*dpr*.38));this.h=Math.max(1,Math.round(height*dpr*.38));this.a.setSize(this.w,this.h);this.b.setSize(this.w,this.h);}
  pass(mat,target){this.quad.material=mat;this.renderer.setRenderTarget(target);this.renderer.render(this.scene,this.camera);}
  render(scene,camera){const r=this.renderer;r.setRenderTarget(this.source);r.render(scene,camera);this.extract.uniforms.image.value=this.source.texture;this.pass(this.extract,this.a);this.blur.uniforms.image.value=this.a.texture;this.blur.uniforms.stepSize.value.set(2/this.w,0);this.pass(this.blur,this.b);this.blur.uniforms.image.value=this.b.texture;this.blur.uniforms.stepSize.value.set(0,2/this.h);this.pass(this.blur,this.a);this.composite.uniforms.image.value=this.source.texture;this.composite.uniforms.glow.value=this.a.texture;this.pass(this.composite,null);}
}

export class CaveJewels {
  constructor(){
    this.diamondGeo=new THREE.OctahedronGeometry(1,0);this.goldGeo=new THREE.IcosahedronGeometry(1,0);this.coalGeo=new THREE.DodecahedronGeometry(1,0);
    this.materials={diamond:new THREE.MeshPhongMaterial({color:0x55ebf8,emissive:0x063b51,emissiveIntensity:.55,specular:0xffffff,shininess:100,flatShading:true}),gold:new THREE.MeshPhongMaterial({color:0xffd563,emissive:0x593307,emissiveIntensity:.25,specular:0xfff2bd,shininess:80,flatShading:true}),coal:new THREE.MeshPhongMaterial({color:0x344b5d,specular:0x7496ad,shininess:30,flatShading:true})};
    const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');let g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#ffffff');g.addColorStop(.1,'#f0ffff');g.addColorStop(.32,'#adffff44');g.addColorStop(1,'#adffff00');x.fillStyle=g;x.fillRect(0,0,64,64);x.fillStyle='#eaffff';x.beginPath();x.moveTo(32,1);x.quadraticCurveTo(35,29,63,32);x.quadraticCurveTo(35,35,32,63);x.quadraticCurveTo(29,35,1,32);x.quadraticCurveTo(29,29,32,1);x.fill();this.starMap=new THREE.CanvasTexture(c);this.starMat=new THREE.SpriteMaterial({map:this.starMap,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});this.stars=[];
  }
  cluster(type,r,c){if(!this.materials[type])return null;const group=new THREE.Group(),positions=[[-.24,.19,.18],[.18,.27,.17],[.26,-.17,.22],[-.19,-.21,.2]];
    if(!this.painted)positions.forEach(([x,y,s],i)=>{const geo=type==='diamond'?this.diamondGeo:type==='gold'?this.goldGeo:this.coalGeo,m=new THREE.Mesh(geo,this.materials[type]);m.position.set(x,y,.39+s*.4);m.rotation.set((r+c+i)*.35,(r*3+c+i)*.46,i*.5);m.scale.set(s,type==='diamond'?s*1.35:s*.8,s*.65);group.add(m);});
    if(type!=='coal'){const sprite=new THREE.Sprite(this.starMat.clone());sprite.position.set(.2,.3,.68);sprite.scale.setScalar(.36);group.add(sprite);this.stars.push({sprite,phase:(r*2.71+c*1.79)%6.2});}
    return group;
  }
  reset(){for(const s of this.stars)s.sprite.material.dispose();this.stars=[];}
  update(t,reduced){for(const s of this.stars){const wave=(t+s.phase)%6.2,k=Math.max(0,1-Math.abs(wave-.45)/.45);s.sprite.material.opacity=reduced?.24:k*.9;s.sprite.material.rotation=reduced?0:wave*.35;}}
}

export class CaveAtmosphere {
  constructor(scene){this.group=new THREE.Group();scene.add(this.group);this.crystalGeo=new THREE.ConeGeometry(1,1,5);this.particlesGeo=new THREE.BufferGeometry();this.positions=new Float32Array(72*3);this.base=[];for(let i=0;i<72;i++){const x=Math.sin(i*82.31)*3.8,y=((i*1.718)%28)-25,z=-.7;this.base.push([x,y,z]);this.positions.set([x,y,z],i*3);}this.particlesGeo.setAttribute('position',new THREE.BufferAttribute(this.positions,3));this.dust=new THREE.Points(this.particlesGeo,new THREE.PointsMaterial({color:0xa6eee1,size:.035,transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(this.dust);}
  load(rows,biome){for(const m of this.group.children){if(m.geometry!==this.crystalGeo)m.geometry?.dispose();m.material?.dispose();}this.group.clear();const amber=biome===1;
    for(let r=1;r<rows+2;r+=4){const side=r%3===1?-1:1;for(let j=0;j<4;j++){const m=new THREE.Mesh(this.crystalGeo,new THREE.MeshPhongMaterial({color:amber?0xbd8b33:0x168ba1,emissive:amber?0x372407:0x073943,emissiveIntensity:.45,shininess:45,transparent:true,opacity:.55,flatShading:true}));m.position.set(side*(3.0+j*.23),-r*1.04+.3+j*.17,-.92);m.rotation.z=side*(.25+j*.18);m.scale.set(.24+j*.02,1.05+j*.28,.28);this.group.add(m);}}
    for(const side of[-1,1]){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(side*.2,4,-.83),new THREE.Vector3(side*3.2,-5,-.83),new THREE.Vector3(side*1.1,-5,-.83)]);geo.setIndex([0,1,2]);const beam=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:amber?0xffed8b:0xafffe8,transparent:true,opacity:.015,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));this.group.add(beam);}
  }
  update(t,reduced){if(reduced)return;for(let i=0;i<this.base.length;i++){const[x,y,z]=this.base[i];this.positions[i*3]=x+Math.sin(t*.3+i)*.08;this.positions[i*3+1]=y+Math.sin(t*.15+i*3)*.2;this.positions[i*3+2]=z;}this.particlesGeo.attributes.position.needsUpdate=true;}
}
