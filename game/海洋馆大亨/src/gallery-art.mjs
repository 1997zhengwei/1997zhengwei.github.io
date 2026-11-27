import {T} from './art.mjs';

// Reuse six tank models. No duplicate tanks or extra gallery segments are created.
export class TankGrowthView{
 constructor(tanks){this.tanks=tanks;this.scale=new T.Vector3();}
 update(sim,dt){for(const d of sim.definitions){const m=this.tanks[d.id],h=d.heightScale,s=d.r/d.baseRadius,k=m.growthReady?1-Math.exp(-dt*6):1;this.scale.set(s,h,s);m.root.scale.lerp(this.scale,k);m.root.position.x=T.MathUtils.lerp(m.root.position.x,d.x,k);m.root.position.z=d.z;m.root.position.y=.205*(1-m.root.scale.y);m.visual={...d,x:m.root.position.x,r:d.baseRadius*m.root.scale.x,heightScale:m.root.scale.y};m.growthReady=true;}}
}
