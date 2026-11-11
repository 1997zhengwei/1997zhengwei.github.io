export class Audio{
 constructor(){this.ctx=null;this.mute=false;this.last=0;}
 unlock(){try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();}catch{}}
 play(type,stackCount=0){if(this.mute||!this.ctx)return;const now=this.ctx.currentTime;if(now-this.last<.065)return;this.last=now;const tones={pickup:[660,.045],restock:[440,.055],cash:[880,.1],sale:[1100,.07],build:[660,.22],delivery:[530,.16]},[freq,length]=tones[type]||[440,.05];const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq*(type==='pickup'?1+Math.min(18,stackCount)*.035:1),now);osc.frequency.exponentialRampToValueAtTime(type==='build'?1320:freq*.8,now+length);gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+length);osc.connect(gain).connect(this.ctx.destination);osc.start(now);osc.stop(now+length);}
}
