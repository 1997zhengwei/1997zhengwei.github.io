const beat = 60 / 116;
const melody = [
  [76,0,79,81,79,0,76,74], [72,0,76,79,77,0,76,0],
  [74,0,77,81,79,0,77,76], [74,0,71,74,76,0,79,0],
  [81,0,84,83,79,0,76,79], [77,0,81,79,76,0,74,0],
  [76,0,74,72,74,0,77,0], [74,0,71,74,72,0,0,0],
];
const harmony = [[48,67], [45,67], [50,69], [43,65], [48,67], [41,64], [50,69], [43,65]];

export function makeMusic(context) {
  const output = context.createGain();
  output.gain.value = .72;
  output.connect(context.destination);
  let time = 0;
  let step = 0;
  let wasAudible = true;
  function pluck(note, at, length, level, type) {
    const voice=context.createOscillator(), volume=context.createGain();
    voice.type=type;
    voice.frequency.value=440*2**((note-69)/12);
    volume.gain.setValueAtTime(.0001,at);
    volume.gain.linearRampToValueAtTime(level,at+.013);
    volume.gain.exponentialRampToValueAtTime(.0001,at+length);
    voice.connect(volume).connect(output);
    voice.start(at);
    voice.stop(at+length+.02);
  }
  return {
    tick(audible) {
      if (context.state!=='running') return;
      if (audible!==wasAudible) {
        output.gain.setTargetAtTime(audible ? .72 : 0,context.currentTime,.045);
        wasAudible=audible;
      }
      if (!audible) { time=0; return; }
      if (time<context.currentTime) time=context.currentTime+.025;
      while (time<context.currentTime+.16) {
        const bar=Math.floor(step/8), eighth=step%8;
        const note=melody[bar][eighth], [bass,pad]=harmony[bar];
        if (note) pluck(note,time,.22,eighth%4===0?.021:.015,'sine');
        if (eighth===0||eighth===4) pluck(bass+(eighth===4?7:0),time,.32,.011,'sine');
        if (eighth===2||eighth===6) pluck(pad,time,.18,.009,'triangle');
        time+=beat*.5; step=(step+1)%(melody.length*8);
      }
    }
  };
}
