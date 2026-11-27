import test from 'node:test';
import assert from 'node:assert/strict';
import {UI} from '../src/ui.mjs';
import {makeCourse} from '../src/courses.mjs';

function result(runs,world,stage){
 const host={innerHTML:''};
 const ui={save:{runs},root:{querySelector:()=>host}};
 UI.prototype.overlay.call(ui,'won',{course:makeCourse(world,stage),stars:()=>3,time:28,landings:8});
 return host.innerHTML;
}

test('a single route clear invites the next stage and shows all three completion marks',()=>{
 const html=result({'0-0':{stars:1}},0,0);
 assert.match(html,/路段 1，通过！/);
 assert.match(html,/挑战路段 2 \/ 3/);
 assert.match(html,/本地图已通过 1 个路段，共 3 个/);
 assert.doesNotMatch(html,/<h2>地图通关！/);
});

test('the third route alone does not show map complete or move to another map',()=>{
 const html=result({'1-2':{stars:2}},1,2);
 assert.match(html,/挑战路段 1 \/ 3/);
 assert.doesNotMatch(html,/<h2>地图通关！/);
});

test('three saved clears show a finished map with a map-selection primary action',()=>{
 const html=result({'2-0':{stars:1},'2-1':{stars:2},'2-2':{stars:3}},2,2);
 assert.match(html,/<h2>地图通关！/);
 assert.match(html,/本地图已通过 3 个路段，共 3 个/);
 assert.match(html,/data-action="next">返回地图选择/);
 assert.doesNotMatch(html,/挑战路段 4/);
});
