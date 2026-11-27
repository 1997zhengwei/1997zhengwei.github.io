// A little department-store jingle. Sound starts with the first user gesture.
export function storeAudio(enabled){
  let ctx, bus, beat=0, next=0;
  const hz=n=>440*2**((n-69)/12);
  function tone(n,start,len,volume,wave='sine',slide=0){
    if(!ctx||!enabled||ctx.state!=='running')return;
    const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+start;
    osc.type=wave;osc.frequency.setValueAtTime(hz(n),t);
    if(slide)osc.frequency.exponentialRampToValueAtTime(hz(n+slide),t+len);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,t+len);
    osc.connect(gain);gain.connect(bus);osc.start(t);osc.stop(t+len+.03);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  return {
    unlock(){
      if(!enabled)return;
      try{
        if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();bus=ctx.createGain();bus.gain.value=.65;bus.connect(ctx.destination);}
        if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      }catch{}
    },
    set(value){enabled=value;if(bus)bus.gain.setTargetAtTime(value?.65:0,ctx.currentTime,.015);},
    tick(dt,fast=false){
      if(!ctx||!enabled||ctx.state!=='running')return;
      next-=dt;if(next>0)return;next=fast?.15:.2;
      if(beat%2===0)tone(beat%4?60:36,0,.06,fast?.05:.03,'square',-12);
      const motif=[79,0,76,0,74,76,0,71,74,0,78,0,79,0,0,0];
      if(motif[beat%16])tone(motif[beat%16],0,.13,.022,'triangle');
      if(beat%4===0)tone([48,53,50,55][(beat>>2)%4],0,.24,.041,'sine');
      beat++;
    },
    play(key,n=0){
      const up=Math.min(12,Math.max(0,n-1))*1;
      if(key==='pickup'){tone(83+up,0,.11,.09);tone(90+up,.055,.16,.08);}
      if(key==='scan'){tone(86+Math.min(14,n*2),0,.09,.08,'square');}
      if(key==='kaching'){[88,95,100].forEach((k,i)=>tone(k,.05*i,.18,.11,'triangle'));tone(103,.18,.5,.08);}
      if(key==='siren'){for(let i=0;i<4;i++){tone(76,i*.24,.12,.07,'sawtooth',5);tone(81,i*.24+.12,.12,.07,'sawtooth',-5);}}
      if(key==='wobble'){tone(64,0,.12,.07,'triangle',3);tone(62,.12,.14,.07,'triangle',-3);}
      if(key==='crash'){for(let i=0;i<5;i++)tone(60-i*3,i*.05,.14,.09,'square',-6);}
      if(key==='dash'){tone(55,0,.22,.09,'sawtooth',19);}
      if(key==='ram'){tone(43,0,.2,.14,'square',-8);tone(79,.05,.18,.08,'triangle',-12);}
      if(key==='charge'){tone(67,0,.12,.07,'triangle',4);tone(71,.12,.18,.07,'triangle',5);}
      if(key==='check'){tone(84,0,.08,.08);tone(91,.07,.14,.08);}
      if(key==='sale'||key==='tv'){[72,79,83,91].forEach((n,i)=>tone(n,.072*i,.23,.10,'triangle'));}
      if(key==='bump'||key==='drop'){tone(49,0,.17,.10,'triangle',-10);}
      if(key==='paid'){[76,79,83,88,91].forEach((n,i)=>tone(n,.075*i,.25,.10,'triangle'));}
      if(key==='upgrade'){[74,81,86,90].forEach((n,i)=>tone(n,.065*i,.20,.095,'triangle'));}
      if(key==='protect'){tone(69,0,.14,.08,'triangle');tone(81,.048,.23,.075);}
      if(key==='closed'){tone(67,0,.28,.08);tone(60,.19,.40,.06);}
      if(key==='tick')tone(82,0,.08,.043);
    }
  };
}
