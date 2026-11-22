const muteKey='shovel-treasure-muted';
export function audioKit(button){
  let ac=null, bus=null, noiseBuffer=null, motor=null, mute=false;
  try{mute=localStorage.getItem(muteKey)==='1';}catch{}
  function reflect(){button.textContent=mute?'×':'♪';button.setAttribute('aria-pressed',String(!mute));}
  reflect();
  function wake(){
    if(mute||!window.AudioContext)return;
    if(!ac){
      ac=new AudioContext();bus=ac.createGain();bus.gain.value=.66;bus.connect(ac.destination);
      noiseBuffer=ac.createBuffer(1,Math.floor(ac.sampleRate*.34),ac.sampleRate);
      const buf=noiseBuffer.getChannelData(0);
      for(let i=0;i<buf.length;i++)buf[i]=(Math.random()*2-1)*(.45+.55*(1-i/buf.length));
      const voice=ac.createOscillator(),filter=ac.createBiquadFilter(), volume=ac.createGain();
      voice.type='sawtooth';voice.frequency.value=58;filter.type='lowpass';filter.frequency.value=187;
      volume.gain.value=0;voice.connect(filter).connect(volume).connect(bus);voice.start();
      motor={voice,volume};
    }
    if(ac.state==='suspended')ac.resume().catch(()=>{});
  }
  button.onclick=()=>{
    mute=!mute;try{localStorage.setItem(muteKey,mute?'1':'0');}catch{}
    reflect();if(!mute)wake();if(bus)bus.gain.value=mute?0:.66;
    if(!mute)tone(610,.12,.07);
  };
  function tone(hz,length,level,offset=0,type='triangle'){
    if(mute||ac?.state!=='running')return;
    const t=ac.currentTime+offset,o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.value=hz;
    g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(level,t+.007);
    g.gain.exponentialRampToValueAtTime(.001,t+length);o.connect(g).connect(bus);
    o.start(t);o.stop(t+length+.03);
  }
  function grit(vol,frequency,length,delay=0){
    if(mute||ac?.state!=='running')return;
    const t=ac.currentTime+delay,n=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
    n.buffer=noiseBuffer;f.type='lowpass';f.frequency.value=frequency;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+length);
    n.connect(f).connect(g).connect(bus);n.start(t);n.stop(t+length+.02);
  }
  let running=-1,contacting=false;
  function hum(active,contact){
    if(ac?.state!=='running')return;
    const state=active?1:0;if(state===running&&contact===contacting)return;
    running=state;contacting=contact;const t=ac.currentTime;
    motor.voice.frequency.setTargetAtTime(contact?82:58,t,.075);
    motor.volume.gain.setTargetAtTime(active?.036:0,t,.065);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hum(false,false);});
  return {wake,hum,
    chip(){grit(.24,1600,.074);tone(137,.062,.08);},
    collapse(n){grit(Math.min(.7,.24+n*.017),650,.30);grit(.23,920,.20,.12);tone(63,.24,.15,0,'sine');},
    loosen(){[523,659,784].forEach((x,i)=>tone(x,.19,.095,i*.057));},
    pickup(){tone(988,.12,.095);tone(1480,.18,.08,.065);},
    prize(){[523,659,784,1047,1319].forEach((x,i)=>tone(x,.34,.12,i*.079));},
    coin(){tone(1568,.09,.07);tone(2093,.16,.06,.055);},
    pay(){tone(1760+Math.random()*180,.06,.035);},
    glug(){[330,392,494,660].forEach((x,i)=>tone(x,.11,.07,i*.05,'sine'));},
    fuse(){grit(.13,5200,.3);},
    boom(){grit(.95,420,.75);grit(.45,1900,.22);tone(52,.6,.32,0,'sine');tone(78,.35,.18,.02,'sine');},
    clack(){grit(.05,2600,.035);tone(260+Math.random()*140,.035,.025,0,'square');},
    crunch(){grit(.09,700,.07);},
    clank(){tone(1870,.09,.05,0,'square');tone(2490,.14,.04,.01,'triangle');grit(.06,5000,.05);},
    reveal(){[1047,1319,1568,2093,2637].forEach((x,i)=>tone(x,.42,.06,i*.06,'sine'));grit(.08,6000,.5);},
    star(i){tone([784,988,1319][i]||1319,.3,.11);tone(([784,988,1319][i]||1319)*1.5,.25,.05,.03,'sine');},
    count(){tone(1200+Math.random()*300,.03,.025,0,'square');},
  };
}
