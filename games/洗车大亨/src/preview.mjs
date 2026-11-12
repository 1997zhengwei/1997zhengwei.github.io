import * as T from '../vendor/three.module.js';
import {STYLE_DEFS} from './config.mjs';
import {mechanic} from './art.mjs';
export class StylePreview{
constructor(env){this.env=env;this.renderer=null;this.spin=0;}
show(canvas,id){this.clear();if(!canvas)return;this.canvas=canvas;const scene=this.scene=new T.Scene();scene.environment=this.env;scene.add(new T.HemisphereLight('#fff9ee','#6d9f99',1.6));const sun=new T.DirectionalLight('#ffffff',2.2);sun.position.set(-3,5,5);scene.add(sun);const renderer=this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=.95;const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);const aspect=rect.width/rect.height;this.camera=new T.OrthographicCamera(-1.5*aspect,1.5*aspect,1.5,-1.5,.1,30);this.camera.position.set(3,2.6,5);this.camera.lookAt(0,1,0);const style=STYLE_DEFS.find(d=>d.id===id);this.person=mechanic(scene,style?.color,true,id);this.person.root.rotation.y=this.spin;let px=null;canvas.onpointerdown=e=>{px=e.clientX;canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(px!==null){this.spin+=(e.clientX-px)*.016;this.person.root.rotation.y=this.spin;px=e.clientX;}};canvas.onpointerup=canvas.onpointercancel=()=>px=null;}
frame(time){if(this.renderer){this.person.update(time,false);this.renderer.render(this.scene,this.camera);}}
clear(){if(this.renderer){this.scene.traverse(o=>{if(o.isMesh&&o.geometry.type==='BufferGeometry')o.geometry.dispose();if(o.isSprite){o.material.map?.dispose();o.material.dispose();}});this.renderer.dispose();this.renderer=null;}this.canvas=null;}
}
