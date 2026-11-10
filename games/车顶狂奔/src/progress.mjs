export const STAGES_PER_MAP=3;

// A saved finish counts regardless of its star rating; maps keep separate progress.
export function mapProgress(runs,world){
 const passed=Array.from({length:STAGES_PER_MAP},(_,stage)=>Number(runs?.[`${world}-${stage}`]?.stars)>=1);
 const count=passed.filter(Boolean).length;
 return{passed,count,complete:count===STAGES_PER_MAP,nextStage:Math.max(0,passed.indexOf(false))};
}

export function nextMapStage(runs,world,currentStage){
 const progress=mapProgress(runs,world);
 if(progress.complete)return null;
 for(let step=1;step<=STAGES_PER_MAP;step++){
  const stage=(currentStage+step)%STAGES_PER_MAP;
  if(!progress.passed[stage])return stage;
 }
 return progress.nextStage;
}
