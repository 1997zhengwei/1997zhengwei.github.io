export class ParkAudio{
 constructor(){this.muted=false;this.context=null;this.clock=0;this.note=0;this.ride=false;}
 unlock(){try{if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.15;this.master.connect(this.context.destination);const count=this.context.sampleRate*2,buf=this.context.createBuffer(1,count,this.context.sampleRate),data=buf.getChannelData(0);for(let i=0;i<count;i++)data[i]=(Math.random()*2-1);const noise=this.context.createBufferSource();noise.buffer=buf;noise.loop=true;this.filter=this.context.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=400;this.wind=this.context.createGain();this.wind.gain.value=0;noise.connect(this.filter).connect(this.wind).connect(this.master);noise.start();}if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch{}}
 tone(freq,length=.15,volume=.16,type='sine',delay=0){if(!this.context||this.muted)return;const t=this.context.currentTime+delay,osc=this.context.createOscillator(),gain=this.context.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+length);osc.connect(gain).connect(this.master);osc.start(t);osc.stop(t+length+.02);}
 click(){this.tone(660,.08,.18);}
 reward(){[523,659,784,1047].forEach((f,i)=>this.tone(f,.3,.25,'sine',i*.09));}
 build(){[262,330,392,523,659].forEach((f,i)=>this.tone(f,.45,.3,'triangle',i*.07));}
 setMuted(v){this.muted=v;if(this.master)this.master.gain.setTargetAtTime(v?0:.15,this.context.currentTime,.04);}
 tick(dt,active,speed=0){if(!this.context)return;if(this.wind){this.wind.gain.setTargetAtTime(active?Math.min(.9,speed/75):0,this.context.currentTime,.15);this.filter.frequency.setTargetAtTime(250+speed*16,this.context.currentTime,.15);}if(this.muted)return;this.clock+=dt;if(this.clock>.37&&!active){this.clock%=.37;const notes=[523,0,659,784,659,523,440,0,494,587,698,587,494,0,392,0,440,523,659,523,440,392,349,0,392,494,587,784,659,587,523,0];const f=notes[this.note++%notes.length];if(f)this.tone(f,.35,.035,'triangle');}}
 suspend(){if(this.context)this.context.suspend().catch(()=>{});}
 resume(){if(this.context)this.context.resume().catch(()=>{});}
}
