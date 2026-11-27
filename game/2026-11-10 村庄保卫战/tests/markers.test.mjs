import test from'node:test';import assert from'node:assert/strict';import{placeMarkers}from'../markers.mjs';
test('overlapping farm and tower remain distinct phone touch targets',()=>{
  const sites=[{id:'bellwatch',p:{x:217,y:355}},{id:'wheat-field',p:{x:209,y:350}},{id:'pumpkin',p:{x:140,y:360}}];
  const layout=placeMarkers(sites,{width:400,top:169,bottom:345});
  for(const a of layout.values())for(const b of layout.values())if(a.id!==b.id)assert.ok(Math.abs(a.x-b.x)>=55||Math.abs(a.y-b.y)>=45);
  for(const a of layout.values()){assert.ok(a.y<=345&&a.y>=169);assert.ok(a.x>=29&&a.x<=371);}
  assert.deepEqual(layout,placeMarkers(sites,{width:400,top:169,bottom:345}));
});
