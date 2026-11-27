export class HotelAudio{
 constructor(muted=false){this.muted=muted;this.ctx=null;}
 unlock(){if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});}
 tone(f,time=.13,delay=0,type='sine',volume=.035){if(this.muted||!this.ctx)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.009);g.gain.exponentialRampToValueAtTime(.0001,t+time);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+time+.02);}
 play(kind){if(kind==='money'){[659,880,1108].forEach((f,i)=>this.tone(f,.19,i*.055));}else if(kind==='goal'||kind==='build'||kind==='title'){[523,659,784,1046].forEach((f,i)=>this.tone(f,.32,i*.09,'sine',.04));}else if(kind==='clean'){this.tone(880,.18);this.tone(1175,.22,.08);}else if(kind==='checkin'){this.tone(783,.22);this.tone(1046,.27,.09);}}
}
