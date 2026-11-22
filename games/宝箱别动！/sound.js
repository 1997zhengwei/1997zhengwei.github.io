// All sound is synthesised. The sneaking tune only advances while the thief moves:
// let go of the screen and the band freezes mid-bar, like a game of "red light, green light".
export function makeAudio(enabled){
  let ctx,volume,music,noise,beat=0,clock=0,heart=0;
  function unlock(){
    if(!enabled)return;
    try{if(!ctx){ctx=new AudioContext();volume=ctx.createGain();volume.gain.value=.22;volume.connect(ctx.destination);
        music=ctx.createGain();music.gain.value=.55;music.connect(volume);
        const len=ctx.sampleRate*.5;noise=ctx.createBuffer(1,len,ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;}
      if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch{}
  }
  const ready=()=>enabled&&ctx?.state==='running';
  function note(f,d,delay=0,type='sine',level=.28,end=f,out=volume,cutoff=0){
    if(!ready())return;
    const tone=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;
    tone.type=type;tone.frequency.setValueAtTime(f,t);if(end!==f)tone.frequency.exponentialRampToValueAtTime(end,t+d);
    g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(level,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+d);
    let node=tone;
    if(cutoff){const f2=ctx.createBiquadFilter();f2.type='lowpass';f2.frequency.value=cutoff;tone.connect(f2);node=f2;}
    node.connect(g);g.connect(out);tone.start(t);tone.stop(t+d+.02);
  }
  function hiss(d,delay=0,level=.3,from=1800,to=400,type='bandpass'){
    if(!ready())return;
    const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime+delay;
    src.buffer=noise;f.type=type;f.frequency.setValueAtTime(from,t);f.frequency.exponentialRampToValueAtTime(to,t+d);f.Q.value=1.2;
    g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    src.connect(f);f.connect(g);g.connect(volume);src.start(t);src.stop(t+d+.02);
  }
  // E minor sneak: walking pizzicato bass and a tiptoe melody on the off-beats.
  const hz=n=>440*Math.pow(2,(n-69)/12);
  const bass=[40,null,43,null,45,null,46,47, 40,null,43,null,47,null,46,45];
  const tune=[null,64,null,67,null,66,null,64, null,71,null,70,67,null,64,null];
  const tune2=[null,76,null,79,null,78,null,76, null,83,82,null,79,null,76,null];
  function tick(dt,moving,tension,variant=0){
    if(!ready())return;
    heart-=dt;
    if(tension>.05&&heart<=0){heart=.52-tension*.2;note(62,.12,0,'sine',.55,48);note(58,.14,.13,'sine',.4,44);}
    if(!moving){clock=Math.min(clock,.05);return;}
    clock-=dt;
    while(clock<=0){
      const step=beat%16,b=bass[step],m=(variant%2?tune2:tune)[step];
      if(b)note(hz(b),.16,0,'triangle',.5,hz(b)*.98,music);
      if(m)note(hz(m),.1,0,'square',.13,hz(m),music,1700);
      if(step%4===2)hiss(.04,0,.06,6000,4000,'highpass');
      beat++;clock+=.205;
    }
  }
  return {unlock,tick,set(value){enabled=value;if(volume)volume.gain.value=value ? .22 : 0;if(value)unlock();},
    play(k){
      if(k==='coin'){note(988,.08);note(1480,.12,.05);}
      if(k==='relic'){[659,831,988,1318].forEach((v,i)=>note(v,.2,i*.065,'sine',.44));note(1976,.4,.28,'sine',.15);}
      if(k==='hide'){note(180,.09,0,'triangle',.5,70);hiss(.08,0,.12,900,300);}
      if(k==='warning')note(330,.17,0,'triangle',.29,485);
      if(k==='caught'){[392,370,349,294].forEach((v,i)=>note(v,i===3?.7:.28,i*.3,'sawtooth',.22,i===3?v*.85:v*.97,volume,1200));}
      if(k==='escape'){[523,659,784,1047].forEach((v,i)=>note(v,.25,i*.10,'triangle',.36));note(1568,.5,.42,'sine',.2);}
      if(k==='step')note(115,.044,0,'triangle',.10,62);
      if(k==='puzzle'){note(300,.16,0,'triangle',.35,360);note(380,.22,.2,'triangle',.35,520);}
      if(k==='shrug'){note(420,.14,0,'triangle',.3,340);note(330,.24,.16,'triangle',.3,250);}
      if(k==='bark'){for(let i=0;i<2;i++){note(420,.09,i*.16,'square',.25,250,volume,1500);hiss(.08,i*.16,.25,1400,500);}}
      if(k==='zap'){note(1200,.35,0,'sawtooth',.25,90,volume,3000);hiss(.3,0,.2,4000,800);}
      if(k==='key'){note(1046,.09,0,'square',.15,1046,volume,2500);note(1568,.16,.1,'square',.15,1568,volume,2500);}
      if(k==='gate'){note(110,.5,0,'sawtooth',.18,70,volume,500);hiss(.5,0,.15,600,200);[784,988].forEach((v,i)=>note(v,.15,.35+i*.1,'triangle',.3));}
      if(k==='toss')hiss(.25,0,.2,800,3000);
      if(k==='decoy'){[2093,2637,2093].forEach((v,i)=>note(v,.08,i*.07,'sine',.25));}
      if(k==='star')note(1318,.25,0,'triangle',.4,1760);
      if(k==='buy'){note(1318,.06,0,'square',.15,1318,volume,3000);note(1760,.2,.07,'triangle',.35);hiss(.1,.02,.12,5000,3000,'highpass');}
      if(k==='click')note(700,.04,0,'triangle',.2,500);
      if(k==='honk'){note(392,.18,0,'square',.15,392,volume,1500);note(330,.25,.2,'square',.15,330,volume,1500);}
      if(k==='laserOn')note(1500,.08,0,'square',.06,1700,volume,4000);
    }};
}
