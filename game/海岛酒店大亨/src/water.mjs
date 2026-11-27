import * as T from '../vendor/three.module.js';

// Lightweight animated caustics. No frame buffers or external textures are needed.
export function seaMaterial(){
 return new T.ShaderMaterial({
  uniforms:{time:{value:0}},
  vertexShader:`varying vec2 worldXZ;varying float wave;
  uniform float time;
  void main(){vec3 p=position;wave=sin(p.x*.22+time*.7)*.055+cos(p.y*.24-time*.5)*.04;p.z+=wave;vec4 world=modelMatrix*vec4(p,1.);worldXZ=world.xz;gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader:`varying vec2 worldXZ;varying float wave;uniform float time;
  void main(){
   vec2 q=worldXZ;float radius=length(q/vec2(1.23,1.1));float nearShore=1.-smoothstep(26.,46.,radius);
   vec3 deep=vec3(.025,.57,.77),shallow=vec3(.21,.79,.83);vec3 colour=mix(deep,shallow,nearShore);
   vec2 uv=q*.62+vec2(time*.045,time*.023);float caustic=abs(sin(uv.x+sin(uv.y*1.7)))*abs(cos(uv.y+sin(uv.x*1.25)));
   float line=pow(1.-caustic,15.);colour+=vec3(.025,.045,.035)*line*nearShore;
   float ripple=sin(radius*2.7-time*1.4+sin(atan(q.y,q.x)*8.)*.3);colour+=vec3(.025,.035,.025)*smoothstep(.9,1.,ripple)*nearShore*.6;
   colour+=wave*.14;gl_FragColor=vec4(colour,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`
 });
}

export function poolMaterial(){
 return new T.ShaderMaterial({uniforms:{time:{value:0}},
  vertexShader:`varying vec2 poolUV;varying vec2 worldXZ;void main(){poolUV=uv;vec4 p=modelMatrix*vec4(position,1.);worldXZ=p.xz;gl_Position=projectionMatrix*viewMatrix*p;}`,
  fragmentShader:`varying vec2 poolUV;varying vec2 worldXZ;uniform float time;
  void main(){vec2 p=worldXZ*1.8+vec2(time*.13,time*.06);float cell=abs(sin(p.x+sin(p.y)))*abs(cos(p.y+sin(p.x*.85)));float light=pow(1.-cell,16.);
  float edge=smoothstep(.24,.5,max(abs(poolUV.x-.5),abs(poolUV.y-.5)));vec3 colour=mix(vec3(.015,.47,.78),vec3(.12,.73,.91),edge);colour+=vec3(.17,.19,.13)*light;colour+=vec3(.015,.025,.02)*sin(worldXZ.x*4.+worldXZ.y*3.-time*.8);gl_FragColor=vec4(colour,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
}
