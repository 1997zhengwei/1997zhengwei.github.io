import * as T from '../vendor/three.module.js';

// The same scene and cameras drive management and riding. The final image receives
// local depth occlusion and a restrained HDR glow; the HTML interface is untouched.
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export class ParkRenderer{
 constructor(renderer){
  this.renderer=renderer;
  const float=renderer.extensions.has('EXT_color_buffer_float');
  this.color=new T.WebGLRenderTarget(1,1,{type:float?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true});
  this.color.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  this.color.samples=Math.min(2,renderer.capabilities.maxSamples);
  this.bloomA=new T.WebGLRenderTarget(1,1,{type:float?T.HalfFloatType:T.UnsignedByteType,depthBuffer:false});
  this.bloomB=this.bloomA.clone();this.temp=this.bloomA.clone();
  this.screen=new T.Scene();this.camera=new T.Camera();
  this.quad=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial());this.quad.frustumCulled=false;this.screen.add(this.quad);
  this.extract=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{tColor:{value:null},threshold:{value:float?1.05:.78},texel:{value:new T.Vector2(1,1)}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D tColor;uniform float threshold;uniform vec2 texel;void main(){vec3 c=texture2D(tColor,vUv).rgb;c=max(c,texture2D(tColor,vUv+texel).rgb);c=max(c,texture2D(tColor,vUv-texel).rgb);c=max(c,texture2D(tColor,vUv+texel*vec2(1.,-1.)).rgb);float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*max(0.,l-threshold)/(l+.0001),1.);}`});
  this.blur=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{tColor:{value:null},direction:{value:new T.Vector2()}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D tColor;uniform vec2 direction;void main(){vec3 c=texture2D(tColor,vUv).rgb*.227027;c+=texture2D(tColor,vUv+direction*1.384615).rgb*.316216;c+=texture2D(tColor,vUv-direction*1.384615).rgb*.316216;c+=texture2D(tColor,vUv+direction*3.230769).rgb*.070270;c+=texture2D(tColor,vUv-direction*3.230769).rgb*.070270;gl_FragColor=vec4(c,1.);}`});
  this.finish=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:true,uniforms:{tColor:{value:null},tDepth:{value:null},tBloom:{value:null},inverseProjection:{value:new T.Matrix4()},resolution:{value:new T.Vector2(1,1)},glow:{value:.15},aoStrength:{value:.48}},vertexShader:vertex,fragmentShader:`
   varying vec2 vUv;uniform sampler2D tColor,tDepth,tBloom;uniform mat4 inverseProjection;uniform vec2 resolution;uniform float glow,aoStrength;
   vec3 point(vec2 uv){float d=texture2D(tDepth,uv).x;vec4 p=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
   void main(){
    vec3 color=texture2D(tColor,vUv).rgb;float depth=texture2D(tDepth,vUv).r;float ao=0.;
    if(depth<.99999){vec3 p=point(vUv);vec3 normal=normalize(cross(dFdx(p),dFdy(p)));vec2 pixel=1./resolution;
     for(int i=0;i<8;i++){float a=float(i)*2.399963;float radius=3.5+float(i%3)*4.;vec2 uv=vUv+vec2(cos(a),sin(a))*pixel*radius;vec3 delta=point(uv)-p;float distance=length(delta);float facing=max(0.,dot(normal,delta)/(distance+.001)-.08);float range=1.-smoothstep(.15,2.1,distance);ao+=facing*range;}
     color*=1.-min(.36,ao/8.*aoStrength*2.8);
    }
    color+=texture2D(tBloom,vUv).rgb*glow;
    // Keep hue and detail in the highlights while giving the park richer midtones.
    float luminance=dot(color,vec3(.2126,.7152,.0722));color=mix(vec3(luminance),color,1.07);
    vec2 uv=vUv-.5;color*=1.-dot(uv,uv)*.09;
    gl_FragColor=vec4(max(color,vec3(0.)),1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 }
 resize(){const size=this.renderer.getDrawingBufferSize(new T.Vector2());this.color.setSize(size.x,size.y);const w=Math.max(1,Math.floor(size.x/4)),h=Math.max(1,Math.floor(size.y/4));for(const t of [this.bloomA,this.bloomB,this.temp])t.setSize(w,h);this.finish.uniforms.resolution.value.copy(size);this.extract.uniforms.texel.value.set(1/size.x,1/size.y);}
 pass(material,target){this.quad.material=material;this.renderer.setRenderTarget(target);this.renderer.render(this.screen,this.camera);}
 render(scene,camera,night){
  const r=this.renderer,oldTone=r.toneMapping;r.toneMapping=T.NoToneMapping;
  r.setRenderTarget(this.color);r.render(scene,camera);
  this.extract.uniforms.tColor.value=this.color.texture;this.pass(this.extract,this.bloomA);
  this.blur.uniforms.tColor.value=this.bloomA.texture;this.blur.uniforms.direction.value.set(1.0/this.bloomA.width,0);this.pass(this.blur,this.temp);
  this.blur.uniforms.tColor.value=this.temp.texture;this.blur.uniforms.direction.value.set(0,1.0/this.bloomA.height);this.pass(this.blur,this.bloomB);
  this.blur.uniforms.tColor.value=this.bloomB.texture;this.blur.uniforms.direction.value.set(2/this.bloomA.width,0);this.pass(this.blur,this.temp);
  this.blur.uniforms.tColor.value=this.temp.texture;this.blur.uniforms.direction.value.set(0,2/this.bloomA.height);this.pass(this.blur,this.bloomB);
  r.toneMapping=oldTone;
  const u=this.finish.uniforms;u.tColor.value=this.color.texture;u.tDepth.value=this.color.depthTexture;u.tBloom.value=this.bloomB.texture;u.inverseProjection.value.copy(camera.projectionMatrixInverse);u.glow.value=.08+night*1.05;
  this.pass(this.finish,null);
 }
}

export function makeStudioEnvironment(renderer,scene){
 const room=new T.Scene();room.background=new T.Color('#b8cee3');
 const enclosure=new T.Mesh(new T.BoxGeometry(20,16,20),new T.MeshBasicMaterial({color:'#b8cee3',side:T.BackSide}));room.add(enclosure);
 for(const [x,y,z,w,h,c]of [[-6,6,0,4,8,[4,4.1,4.3]],[5,5,-4,5,5,[2.3,2.5,3]],[-2,7,5,4,3,[3.8,3.2,2.4]]]){
  const lamp=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(...c),side:T.DoubleSide}));lamp.position.set(x,y,z);lamp.lookAt(0,0,0);room.add(lamp);
 }
 const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(room,.08,.1,50);scene.environment=env.texture;scene.environmentIntensity=.5;pmrem.dispose();
 room.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
 return env;
}
