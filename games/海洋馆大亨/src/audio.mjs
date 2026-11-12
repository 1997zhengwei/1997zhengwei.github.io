export class OceanAudio{
 constructor(){this.ctx=null;this.muted=false;this.last=0;}
 unlock(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.16;this.master.connect(this.ctx.destination);const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),a=buffer.getChannelData(0);let last=0;for(let i=0;i<a.length;i++){last=(last+Math.random()*.1-.05)/1.025;a[i]=last;}this.noise=this.ctx.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;this.filter=this.ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=500;const gain=this.ctx.createGain();gain.gain.value=.17;this.noise.connect(this.filter).connect(gain).connect(this.master);this.noise.start();}if(this.ctx.state==='suspended')this.ctx.resume();}
 setMuted(m){this.muted=m;if(this.master)this.master.gain.setTargetAtTime(m?0:.16,this.ctx.currentTime,.04);}
 tone(freq,duration=.1,volume=.35,type='sine',delay=0){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.7,t+duration);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g).connect(this.master);o.start(t);o.stop(t+duration+.02);}
 catch(){this.tone(740,.12);this.tone(1150,.18,.25,'sine',.07);}
 sale(){if(!this.ctx||this.ctx.currentTime-this.last<.15)return;this.last=this.ctx.currentTime;this.tone(1300,.12,.18);this.tone(1700,.18,.12,'sine',.06);}
 build(){[523,659,784,1047].forEach((f,i)=>this.tone(f,.3,.35,'sine',i*.09));}
 splash(){this.tone(130,.35,.55,'triangle');this.tone(260,.18,.3,'sine',.05);}
 tick(water){if(this.filter)this.filter.frequency.setTargetAtTime(water?170:620,this.ctx.currentTime,.3);}
 suspend(){this.ctx?.suspend();}
}
