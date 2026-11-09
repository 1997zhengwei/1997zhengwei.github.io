(function(root,factory){if(typeof module==='object')module.exports=factory();else root.FlipRules=factory();})(typeof window==='undefined'?this:window,function(){
  const C={startX:106,startY:303,flight:.9,gravity:820,minX:190,maxX:548,chargeSeconds:1.4,tolerance:31,perfect:11,targets:[345,457,395]};
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const landing=q=>C.minX+(C.maxX-C.minX)*clamp(q,0,1);
  const chargeFor=x=>clamp((x-C.minX)/(C.maxX-C.minX),0,1);
  function pose(q,t){t=clamp(t,0,C.flight);return{x:C.startX+(landing(q)-C.startX)*t/C.flight,y:C.startY-C.gravity*C.flight*t/2+C.gravity*t*t/2,rotation:t/C.flight*Math.PI*2};}
  function create(){return{phase:'ready',paused:false,charge:0,time:0,served:0,lives:3,score:0,target:C.targets[0],feedback:'Hold to aim. Release in the green zone!',last:null};}
  function begin(s){if(s.phase==='ready'&&!s.paused){s.charge=0;s.phase='charging';return true;}return false;}
  function release(s){if(s.phase==='charging'&&!s.paused){s.phase='flying';s.time=0;return true;}return false;}
  function cancel(s){if(s.phase==='charging'){s.phase='ready';s.charge=0;}}
  function pause(s,value){cancel(s);s.paused=value;}
  function tick(s,dt){if(s.paused)return;dt=clamp(dt,0,.05);if(s.phase==='charging'){s.charge=clamp(s.charge+dt/C.chargeSeconds,0,1);}else if(s.phase==='flying'){s.time+=dt;if(s.time>=C.flight){const delta=landing(s.charge)-s.target;const hit=Math.abs(delta)<=C.tolerance;s.last={hit,delta,perfect:Math.abs(delta)<=C.perfect};if(hit){s.served++;s.score+=s.last.perfect?150:100;s.feedback=s.last.perfect?'Perfect flip! +150':'Order up! +100';}else{s.lives--;s.feedback=delta<0?'Too short — hold a little longer.':'Too far — release a little sooner.';}s.phase='resolving';s.time=0;}}else if(s.phase==='resolving'){s.time+=dt;if(s.time>=1.2){if(s.served===3||s.lives===0){s.phase='result';}else{s.target=C.targets[s.served];s.phase='ready';s.charge=0;s.time=0;}}}}
  return{C,clamp,landing,chargeFor,pose,create,begin,release,cancel,pause,tick};
});
