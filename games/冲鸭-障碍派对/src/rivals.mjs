// Race-local random streams make bot decisions varied in play and reproducible in QA.
export function nextRandom(p){let x=p.rngState|0;x^=x<<13;x^=x>>>17;x^=x<<5;p.rngState=x>>>0;return p.rngState/4294967296;}
export function rivalProfile(id,raceSeed=1){
 const stream={rngState:((raceSeed>>>0)^0x9e3779b9)||1},tiers=['rookie','regular','regular','expert','expert','expert','technical','technical','technical','technical','technical'];
 for(let i=tiers.length-1;i>0;i--){const j=Math.floor(nextRandom(stream)*(i+1));[tiers[i],tiers[j]]=[tiers[j],tiers[i]];}
 const tier=id===0?'player':tiers[(id-1)%11];stream.rngState=((raceSeed>>>0)^Math.imul(id+1,0x85ebca6b))>>>0||1;
 const r=()=>nextRandom(stream),expert=tier==='expert',technical=tier==='technical',regular=tier==='regular',player=tier==='player';
 const skill=player?.99:expert?.91+r()*.07:technical?.85+r()*.09:regular?.72+r()*.11:.48+r()*.14;
 const pace=player?1:expert?.985+r()*.015:technical?.985+r()*.015:regular?.945+r()*.025:.905+r()*.035;
 const reaction=player?.1:expert?.1+r()*.05:technical?.13+r()*.07:regular?.22+r()*.1:.34+r()*.14;
 const risk=technical?.55+r()*.4:expert?.3+r()*.5:r();
 return {tier,skill,pace,reaction,startDelay:player?0:r()*(expert?.15:technical?.23:regular?.4:.7),risk,laneBias:(r()-.5)*3.8,divePreference:player?1:technical?.86+r()*.1:expert?.76+r()*.15:regular?.45+r()*.2:.2+r()*.2,diveAfter:technical?.18:.22,cornerFactor:technical?.25:expert?.45:regular?.6:.7,nextTrickAt:2.5+r()*2,trickInterval:technical?5+r()*2.5:expert?8+r()*4:Infinity,tricks:0,rngState:stream.rngState,nextMistakeAt:player?Infinity:5+r()*9,mistakeUntil:0,mistake:'',mistakes:0,throttle:1};
}
