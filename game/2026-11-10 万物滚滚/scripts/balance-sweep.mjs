import {createRace,stepRace,canCollect,result} from '../src/rules.mjs';
import {expectedAt} from '../src/course.mjs';
const profiles={solo:[]};
const seeds=[71,333,991];const rows=[];
for(const [profile,skills] of Object.entries(profiles))for(const course of ['sunny','playdate','golden'])for(const seed of seeds)for(const style of ['middle','relaxed']){
 const w=createRace(course,seed);w.mode='play';w.players.slice(1).forEach((p,i)=>p.skill=skills[i]);let nextDecision=0,target=0;
 for(let tick=0;tick<10801&&w.mode==='play';tick++){
  const p=w.players[0],f=expectedAt(w.track,p.s);if(style==='relaxed'&&w.time>nextDecision){nextDecision=w.time+2.4;let best=-Infinity;for(const u of [-.534,-.267,0,.267,.534]){let score=-Math.abs(u-p.u)*.45;for(const item of w.track.items){if((item.takenBy&1)||item.s<p.s||item.s>p.s+p.speed*2.8+p.radius*2)continue;const dx=Math.abs(item.u-u)*f.width;if(dx<p.radius+item.r*.75)score+=(canCollect(p,item)?Math.cbrt(item.volume):-.6*item.r)/(1+(item.s-p.s)/Math.max(1,p.speed));}if(score>best){best=score;target=u;}}}
  const obstacle=w.track.obstacles.find(o=>o.s>p.s&&o.s-p.s<p.radius+o.r*.65+p.speed*.32&&Math.abs(o.u-p.u)*f.width<p.radius+o.r*1.2);
  const input={targetU:style==='middle'?0:target,power:p.energy===100,jump:!!obstacle};stepRace(w,1/60,input);
 }
 const r=result(w);rows.push({profile,course,seed,style,score:r.score,seconds:+r.time.toFixed(1),bumps:r.bumps,diameter:Math.round(r.diameter)});
}
const summaries=[];for(const profile of Object.keys(profiles))for(const style of ['middle','relaxed']){const a=rows.filter(r=>r.profile===profile&&r.style===style);summaries.push({profile,style,meanScore:Math.round(a.reduce((s,r)=>s+r.score,0)/a.length),meanTime:+(a.reduce((s,r)=>s+r.seconds,0)/a.length).toFixed(1),scores:a.map(r=>r.score).join(',')});}
console.log(JSON.stringify({summaries,rows},null,2));
