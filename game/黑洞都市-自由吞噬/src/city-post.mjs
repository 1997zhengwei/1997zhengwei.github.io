import * as T from '../vendor/three.module.js';

// One color/depth pass adds local occlusion without changing game-space geometry.
export class CityPost{
 constructor(renderer,camera){
  this.renderer=renderer;this.target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthTexture:new T.DepthTexture(1,1,T.UnsignedIntType),samples:2});
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  this.material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tColor:{value:this.target.texture},tDepth:{value:this.target.depthTexture},inverseProjection:{value:camera.projectionMatrixInverse},projection:{value:camera.projectionMatrix},sampleCount:{value:12}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
   uniform sampler2D tColor; uniform sampler2D tDepth;
   uniform mat4 inverseProjection; uniform mat4 projection;
   uniform float sampleCount; varying vec2 vUv;
   vec3 viewPoint(vec2 uv){float d=texture2D(tDepth,uv).r;vec4 p=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
   void main(){
    vec3 color=texture2D(tColor,vUv).rgb;
    if(texture2D(tDepth,vUv).r<.99998){
     vec3 p=viewPoint(vUv),normal=normalize(cross(dFdx(p),dFdy(p)));if(normal.z<0.)normal=-normal;
     float radius=.95,occlusion=0.;vec2 uvRadius=vec2(projection[0][0],projection[1][1])*radius/max(-p.z,.1)*.5;
     for(int i=0;i<12;i++){if(float(i)>=sampleCount)break;float n=float(i),a=n*2.3999632,spread=.28+.72*sqrt((n+.5)/sampleCount);vec2 uv=clamp(vUv+vec2(cos(a),sin(a))*uvRadius*spread,vec2(.001),vec2(.999));vec3 delta=viewPoint(uv)-p;float d=length(delta);float horizon=max(dot(normal,delta/max(d,.001))-.09,0.);occlusion+=horizon*(1.-smoothstep(.05,radius*2.,d));}
     color*=1.-min(.32,occlusion/sampleCount*1.65);
    }
    color*=vec3(1.015,1.,.985);float vignette=1.-dot(vUv-.5,vUv-.5)*.065;
    gl_FragColor=vec4(color*vignette,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
  const quad=new T.Mesh(new T.PlaneGeometry(2,2),this.material);quad.frustumCulled=false;this.scene.add(quad);
 }
 resize(width,height){this.target.setSize(width,height);this.material.uniforms.sampleCount.value=width<800?8:12;}
 render(scene,camera){this.renderer.setRenderTarget(this.target);this.renderer.render(scene,camera);this.renderer.setRenderTarget(null);this.renderer.render(this.scene,this.camera);}
}
