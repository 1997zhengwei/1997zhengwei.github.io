import {AURORA,dist} from './starpath-rules.mjs';
export const missionSpecs=state=>[
 {id:'radar',name:'01 · Light the radar',text:'Clear the radar high ground. Approach the console and tap Activate.',point:AURORA.radar},
 {id:'escort',name:'02 · Bring the power home',text:'Stay beside the rover to move. Its blue field restores oxygen. Stop to fight, then continue.',point:state.aurora?.rover&&['moving','paused'].includes(state.aurora.rover.stage)?state.aurora.rover:(state.aurora?.rover.resume||AURORA.roverStart)},
 {id:'guardian',name:'03 · Open the ancient vault',text:'Dodge marked attacks. Fire at the bright core when its armor opens.',point:AURORA.vault},
];
export function missionContext(state,me){
 const a=state.self.aurora||{},rover=state.aurora?.rover;
 for(const [i,m]of missionSpecs(state).entries()){
  if(a[m.id]||i>0&&!a[missionSpecs(state)[i-1].id])continue;
  if(m.id==='guardian'&&state.aurora?.guardian.state==='active')continue;
  if(dist(m.point,me)<7)return{type:'aurora',target:m.id,label:m.id==='radar'?(state.aurora?.radar.state==='active'?'Scanning…':'Activate radar'):m.id==='guardian'?'Awaken guardian':['moving','paused'].includes(rover?.stage)?'Repair rover':'Start rover'};
 }
 return null;
}
export function missionHTML(state){
 const a=state.self.aurora||{},list=missionSpecs(state);
 return `<span class="eyebrow">CHAPTER TWO · SAVED CHECKPOINTS</span><h2>Awaken the outpost.</h2><p>Each mission stays completed. Return to Aurora to repair and refit. Your next login starts at your secured base.</p>${list.map((m,i)=>`<button class="card" data-mission="${m.id}" ${i>0&&!a[list[i-1].id]?'disabled':''}><div><b>${a[m.id]?'✓ ':''}${m.name}</b><small>${m.text}</small></div><span>${a[m.id]?'Saved ✓':'Mark →'}</span></button>`).join('')}<p class="note">LV ${state.self.level} / 45 · ${a.guardian?'Third-base route discovered. The next chapter is not built yet.':'Complete the current objective to open the next route.'}</p><button class="secondary" id="backBase">Back to base menu</button>`;
}
