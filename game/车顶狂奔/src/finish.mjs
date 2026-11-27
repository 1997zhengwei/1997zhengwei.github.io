import * as T from '../vendor/three.module.js';

// One small screen pass: depth contact shading, soft highlight glow, and peripheral speed blur.
// The centre stays sharp so a faster-looking camera never obscures the landing point.
export class FinishPass {
 constructor(renderer){
  this.renderer=renderer;this.low=false;this.samples=Math.min(2,renderer.capabilities.maxSamples||0);
  this.target=new T.WebGLRenderTarget(1,1,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});
  this.target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);this.target.samples=this.samples;
  this.uniforms={image:{value:this.target.texture},depthImage:{value:this.target.depthTexture},resolution:{value:new T.Vector2(1,1)},inverseProjection:{value:new T.Matrix4()},speedBlur:{value:0},quality:{value:1},warmth:{value:0},clock:{value:0}};
  this.material=new T.ShaderMaterial({uniforms:this.uniforms,depthTest:false,depthWrite:false,toneMapped:true,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`
    varying vec2 vUv;
    uniform sampler2D image;uniform sampler2D depthImage;
    uniform vec2 resolution;uniform mat4 inverseProjection;
    uniform float speedBlur,quality,warmth,clock;
    vec3 positionAt(vec2 uv){float d=texture2D(depthImage,uv).x;vec4 v=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return v.xyz/v.w;}
    float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
    void main(){
     vec2 pixel=1./resolution,centre=vUv-.5;vec3 base=texture2D(image,vUv).rgb;
     float peripheral=smoothstep(.12,.62,length(centre*vec2(1.,.8)));
     if(speedBlur>.0001){vec3 moving=base;for(int i=1;i<=3;i++){float t=float(i)/3.;moving+=texture2D(image,vUv-centre*speedBlur*t).rgb;}base=mix(base,moving*.25,peripheral*.76);}
     float d=texture2D(depthImage,vUv).x;
     if(quality>.5&&d<.9997){
      vec3 p=positionAt(vUv),n=normalize(cross(dFdx(p),dFdy(p)));if(n.z<0.)n=-n;
      float radius=clamp(resolution.y*.72/max(1.,-p.z),2.,15.),occlusion=0.;
      for(int i=0;i<6;i++){float a=float(i)*1.04719755+.27;vec2 offset=vec2(cos(a),sin(a))*pixel*radius;vec3 delta=positionAt(vUv+offset)-p;float distance=length(delta);occlusion+=max(0.,dot(n,delta)-.06)/(.12+distance)*(1.-smoothstep(.1,1.65,distance));}
      base*=1.-clamp(occlusion*.11,0.,.24);
     }
     vec3 glow=vec3(0.);for(int i=0;i<4;i++){float a=float(i)*1.5707963;vec3 tap=texture2D(image,vUv+vec2(cos(a),sin(a))*pixel*(quality>.5?6.:3.)).rgb;glow+=tap*max(0.,lum(tap)-1.35)/max(1.,lum(tap));}
     base+=glow*.026;
     float l=lum(base);base=mix(vec3(l),base,1.11);
     base*=mix(vec3(.94,.985,1.055),vec3(1.025,1.008,.965),clamp(l*.7,0.,1.));
     base.r+=warmth*.025*clamp(l,0.,1.);base*=1.-peripheral*.065;
     gl_FragColor=vec4(max(vec3(0.),base),1.);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`});
  this.scene=new T.Scene();this.quad=new T.Mesh(new T.PlaneGeometry(2,2),this.material);this.quad.frustumCulled=false;this.scene.add(this.quad);this.camera=new T.Camera();this.size=new T.Vector2();
 }
 resize(){this.renderer.getDrawingBufferSize(this.size);this.target.setSize(this.size.x,this.size.y);this.uniforms.resolution.value.copy(this.size);}
 setQuality(low){this.low=low;this.uniforms.quality.value=low?0:1;const samples=low?0:this.samples;if(this.target.samples!==samples){this.target.samples=samples;this.target.dispose();}}
 render(scene,camera,motion,{world=0,menu=false,time=0}={}){
  this.uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);this.uniforms.speedBlur.value=menu?0:(motion?.blur||0);this.uniforms.warmth.value=world===2?0:.45;this.uniforms.clock.value=time;
  this.renderer.setRenderTarget(this.target);this.renderer.render(scene,camera);this.stats={...this.renderer.info.render};this.renderer.setRenderTarget(null);this.renderer.render(this.scene,this.camera);
 }
}
