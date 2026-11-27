export class MineAudio {
  constructor(){this.enabled=true;this.ctx=null;this.active=new Set();}
  unlock(){if(!this.enabled)return;try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});}catch{}}
  tone(freq,duration=.1,type='sine',volume=.05,slide=1,delay=0){if(!this.enabled||!this.ctx||document.hidden)return;const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(freq,start);osc.frequency.exponentialRampToValueAtTime(Math.max(20,freq*slide),start+duration);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.009);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+duration+.02);this.active.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();this.active.delete(osc);};}
  hit(type){this.tone(type==='dirt'?180:570,.065,'triangle',.07,.38);this.tone(80,.05,'sine',.05,.6);}
  loot(type){if(type==='diamond'){this.tone(880,.18,'sine',.055,1.5);this.tone(1320,.22,'sine',.035,1, .065);}else if(type==='gold')this.tone(690,.12,'sine',.05,1.3);else this.tone(340,.06,'triangle',.035,1.1);}
  blast(chain){this.tone(87+Math.min(chain,6)*8,.32,'triangle',.1,.2);this.tone(42,.4,'sine',.13,.5);this.tone(240,.09,'sawtooth',.018,.12);}
  win(){[523,659,784,1046].forEach((f,i)=>this.tone(f,.35,'sine',.065,1,i*.105));}
  resupply(){[659,880,1046].forEach((f,i)=>this.tone(f,.19,'sine',.045,1,i*.085));}
  stop(){for(const n of this.active){try{n.stop();}catch{}}this.active.clear();}
}
