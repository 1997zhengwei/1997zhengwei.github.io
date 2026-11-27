// All audio is synthesized locally. No recordings, external assets, or autoplay.
export class RailwayAudio {
  constructor(){this.enabled=true;this.ctx=null;this.master=null;this.nextRail=0;this.music=false;this.nextMusic=0;this.noteIndex=0;}
  unlock(){
    if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.20;this.master.connect(this.ctx.destination);}
    if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
  }
  setEnabled(v){this.enabled=v;if(this.master&&this.ctx){this.master.gain.setTargetAtTime(v?.20:0,this.ctx.currentTime,.08);}if(v)this.unlock();}
  tone(freq,time=.12,type='sine',gain=.3,delay=0,slide=0){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+time);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+time);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+time+.02);
  }
  place(){this.tone(520,.065,'triangle',.22);this.tone(260,.065,'square',.025,.018);}
  remove(){this.tone(240,.07,'triangle',.17,0,130);}
  click(){this.tone(660,.06,'sine',.12);}
  blocked(){this.tone(145,.14,'triangle',.20,0,95);}
  power(){[330,494,660].forEach((n,i)=>this.tone(n,.2,'triangle',.18,i*.06));}
  gem(){[784,1175,1568].forEach((n,i)=>this.tone(n,.28,'sine',.25,i*.07));}
  pickup(){[392,494,587].forEach((n,i)=>this.tone(n,.19,'triangle',.23,i*.075));this.tone(155,.19,'sine',.3,0,190);}
  whistle(){this.tone(784,.35,'sine',.18);this.tone(988,.32,'sine',.11,.07);}
  win(){[523,659,784,1047].forEach((n,i)=>this.tone(n,.45,'triangle',.24,i*.12));[262,330,392].forEach(n=>this.tone(n,.7,'sine',.12,.4));}
  fail(){[330,294,220].forEach((n,i)=>this.tone(n,.25,'triangle',.19,i*.14));}
  tick(now,running){
    if(!this.ctx||!this.enabled||document.hidden)return;
    if(running&&now>this.nextRail){this.nextRail=now+.22;this.tone(95,.045,'triangle',.17);this.tone(180,.028,'triangle',.07,.06);}
    if(this.music&&now>this.nextMusic){
      this.nextMusic=now+1.1;
      const notes=[392,0,494,587,0,494,440,0,330,0,392,494,0,392,330,0];const n=notes[this.noteIndex++%notes.length];
      if(n){this.tone(n,.85,'sine',.035);this.tone(n/2,1.05,'sine',.025);}
    }
  }
}
