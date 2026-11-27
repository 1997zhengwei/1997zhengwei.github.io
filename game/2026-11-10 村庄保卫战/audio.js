export class VillageAudio{
  constructor(){this.enabled=true;this.ctx=null;this.nodes=new Set();this.lastShot=0;}
  unlock(){if(!this.enabled)return;try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});}catch{}}
  tone(f,d=.12,kind='sine',v=.035,slide=1,delay=0){if(!this.enabled||!this.ctx||document.hidden)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain(),at=c.currentTime+delay;o.type=kind;o.frequency.setValueAtTime(f,at);o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),at+d);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(v,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(g);g.connect(c.destination);o.start(at);o.stop(at+d+.02);this.nodes.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.nodes.delete(o);};}
  build(){this.tone(180,.08,'square',.022,.6);this.tone(360,.09,'triangle',.02,1.2,.055);}
  bell(){[392,587,784].forEach((f,i)=>this.tone(f,.65,'sine',.055/(i+1),.995,i*.018));}
  shoot(){if(this.ctx&&this.ctx.currentTime-this.lastShot>.15){this.lastShot=this.ctx.currentTime;this.tone(850,.045,'triangle',.012,.36);}}
  hurt(){this.tone(110,.11,'triangle',.025,.5);}
  burst(){this.tone(58,.35,'triangle',.09,.25);this.tone(150,.12,'sawtooth',.02,.2);}
  dawn(){[523,659,784].forEach((f,i)=>this.tone(f,.28,'sine',.045,1,i*.12));}
  win(){[392,523,659,784,1046].forEach((f,i)=>this.tone(f,.48,'sine',.06,1,i*.14));}
  lose(){this.tone(196,.35,'triangle',.05,.75);this.tone(147,.5,'sine',.05,.9,.25);}
  stop(){for(const o of this.nodes){try{o.stop();}catch{}}this.nodes.clear();}
}
