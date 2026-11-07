import {STATIONS,PADS,TOWERS} from './starpath-rules.mjs';
import {towerStats} from './frontier-balance.mjs';
const finite=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
// Only shared infrastructure persists. Combat, spawn warnings and active boss
// attacks restart cleanly; they are never replayed onto returning explorers.
export function snapshotOutpost(w){return {id:w.id,builtStations:[...w.builtStations],stations:w.stations.filter(s=>s.hp>0).map(({id,hp,level})=>({id,hp,level})),towers:w.towers.filter(t=>t.hp>0).map(({id,pad,type,owner,hp,level,tier})=>({id,pad,type,owner,hp,level,tier:tier||1}))};}
export function restoreOutpost(w,data){
 w.builtStations=new Set((data?.builtStations||[]).filter(id=>STATIONS.some(s=>s.id===id)));
 for(const old of data?.stations||[]){const s=w.stations.find(s=>s.id===old.id);if(!s||!(old.hp>0))continue;s.level=old.level===2?2:1;s.radius=s.level===2?10:7;s.maxHp=160+s.zone*60+(s.level===2?120:0);s.hp=finite(old.hp,1,s.maxHp);w.builtStations.add(s.id);}
 const occupied=new Set();for(const old of data?.towers||[]){const pad=PADS.find(p=>p.id===old.pad);if(!pad||!TOWERS[old.type]||occupied.has(pad.id)||!(old.hp>0))continue;occupied.add(pad.id);
  const t={id:w.uid++,pad:pad.id,type:old.type,owner:typeof old.owner==='string'?old.owner:'',x:pad.x,z:pad.z,level:finite(Math.floor(old.level),1,5),tier:finite(Math.floor(old.tier)||1,1,3),cd:.6};t.maxHp=towerStats(t).maxHp;t.hp=finite(old.hp,1,t.maxHp);w.towers.push(t);
 }
}
