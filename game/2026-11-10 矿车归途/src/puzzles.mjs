import {key,tracksFromRoutes,copyLayout} from './rail-engine.mjs';
const route=(...points)=>{const out=[];for(let i=0;i<points.length;i++){if(!i){out.push(points[i]);continue;}const a=out.at(-1),b=points[i],dx=Math.sign(b[0]-a[0]),dz=Math.sign(b[1]-a[1]);if(dx&&dz)throw new Error('Route segment must be orthogonal');for(let j=1;j<=Math.abs(b[0]-a[0])+Math.abs(b[1]-a[1]);j++)out.push([a[0]+dx*j,a[1]+dz*j]);}return out;};
function puzzle(data){
  const full=tracksFromRoutes(data.routes,data.cars,data.exit);for(const [k,t]of Object.entries(data.special||{}))full[k]={...full[k],...t};
  const fixed={};for(const p of [...data.cars.map(c=>c.p),data.exit,...(data.anchors||[]),...Object.entries(full).filter(([,t])=>t.ports.length>=3).map(([k])=>k.split(',').map(Number))]){const k=key(p);if(!full[k])throw new Error(`Fixed cell ${k} absent`);fixed[k]={...full[k],fixed:true};}
  const solution=Object.fromEntries(Object.entries(full).filter(([k])=>!fixed[k]).map(([k,t])=>[k,{...t}]));
  return {...data,blocked:data.blocked||[],water:data.water||[],fixed,solution,solutionSwitches:data.solutionSwitches||{},budget:Object.keys(solution).length+(data.spare||0)};
}
export const PUZZLES=[
  puzzle({id:'1-1',title:'The First Connection',chapter:'Meadow Railway',w:7,h:5,exit:[6,2],cars:[{id:1,p:[0,2],dir:'E'}],
    instruction:'Join the white rail ends. Then press Play.',hint:'One carriage, one engine. Fill the gap between them.',
    routes:[route([0,2],[6,2])],anchors:[[1,2],[5,2]],blocked:[[2,0],[5,0],[0,4],[5,4]]}),
  puzzle({id:'1-2',title:'Around the Bend',chapter:'Meadow Railway',w:7,h:6,exit:[6,1],cars:[{id:1,p:[0,4],dir:'E'}],
    instruction:'Paint tracks around the rocks. Rails bend as you drag.',hint:'Go up through the opening in the middle, then head toward the engine.',
    routes:[route([0,4],[2,4],[2,1],[6,1])],anchors:[[1,4],[5,1]],blocked:[[3,2],[3,3],[3,4],[3,5],[0,1],[5,4]]}),
  puzzle({id:'1-3',title:'First Means First',chapter:'Meadow Railway',w:8,h:6,exit:[7,2],cars:[{id:1,p:[0,1],dir:'E'},{id:2,p:[4,4],dir:'E'}],
    instruction:'Join the white rail ends. The junction merges automatically.',hint:'The plain white junction joins both incoming tracks automatically. Car 2 is closer: give it a winding route so car 1 arrives first.',
    routes:[route([0,1],[5,1],[5,2],[7,2]),route([4,4],[6,4],[6,5],[3,5],[3,3],[5,3],[5,2],[7,2])],
    anchors:[[1,1],[5,2],[6,2],[5,4]],blocked:[[0,4],[1,4],[2,1],[6,0]].filter(p=>!(p[0]===2&&p[1]===1)),spare:0}),
  puzzle({id:'1-4',title:'One Junction, Two Trains',chapter:'Meadow Railway',w:8,h:7,exit:[7,3],cars:[{id:1,p:[0,1],dir:'E'},{id:2,p:[0,5],dir:'E'}],
    instruction:'Two cars, one junction. They cannot share it at the same time.',hint:'Equal-length approaches collide. Route car 2 through the southern bend.',
    routes:[route([0,1],[4,1],[4,3],[7,3]),route([0,5],[2,5],[2,6],[4,6],[4,3],[7,3])],anchors:[[1,1],[1,5],[4,3],[5,3],[6,3]],blocked:[[3,0],[6,1],[1,3],[6,5]],spare:0}),
  puzzle({id:'1-5',title:'The Last Few Rails',chapter:'Meadow Railway',w:8,h:7,exit:[7,2],cars:[{id:1,p:[0,2],dir:'E'},{id:2,p:[1,5],dir:'E'}],
    instruction:'The white junction is automatic. Just connect both routes.',hint:'No switch to set here. Follow the white arrows into the shared track. Car 1 can go straight; give car 2 a longer route from below.',
    routes:[route([0,2],[7,2]),route([1,5],[3,5],[3,6],[5,6],[5,2],[7,2])],anchors:[[1,2],[6,2],[2,5]],blocked:[[0,5],[2,3],[3,3],[4,3],[6,4]]}),
  puzzle({id:'2-1',title:'A Redstone Crossing',chapter:'Redstone Valley',w:8,h:7,exit:[7,3],cars:[{id:1,p:[0,1],dir:'E'},{id:2,p:[1,5],dir:'E'}],
    instruction:'The redstone gate holds a car for two beats.',hint:'Use the marked gate on car 2’s approach. The delay changes the arrival order.',
    routes:[route([0,1],[4,1],[4,3],[7,3]),route([1,5],[4,5],[4,3],[7,3])],anchors:[[1,1],[3,5],[4,4],[4,3],[6,3]],signals:{'4,4':2},blocked:[[0,4],[1,4],[2,3],[6,1],[6,5]]}),
  puzzle({id:'2-2',title:'Three Tickets Home',chapter:'Redstone Valley',w:8,h:7,exit:[7,3],cars:[{id:1,p:[0,1],dir:'E'},{id:2,p:[0,3],dir:'E'},{id:3,p:[1,5],dir:'E'}],
    instruction:'Build the whole railway before starting: 1, then 2, then 3.',hint:'Car 1 needs the northern approach. Car 2 takes the middle detour; car 3 goes around the bottom.',
    routes:[route([0,1],[4,1],[4,3],[7,3]),route([0,3],[2,3],[2,2],[3,2],[3,3],[7,3]),route([1,5],[2,5],[2,6],[5,6],[5,3],[7,3])],
    anchors:[[1,1],[1,3],[2,5],[4,3],[5,3],[6,3]],blocked:[[0,5],[6,1],[6,5]],signals:{'3,2':2,'3,6':3}}),
  puzzle({id:'2-3',title:'Through the Mountain',chapter:'Redstone Valley',w:8,h:7,exit:[7,2],cars:[{id:1,p:[0,1],dir:'E'},{id:2,p:[0,5],dir:'E'}],
    instruction:'Tunnel mouths are linked. A carriage keeps going at the other end.',hint:'Car 1 uses the paired tunnel. Car 2 needs the longer southern route.',
    routes:[route([0,1],[2,1]),route([4,1],[5,1],[5,2],[7,2]),route([0,5],[5,5],[5,2],[7,2])],anchors:[[1,1],[2,1],[4,1],[5,2],[6,2],[1,5]],
    special:{'2,1':{ports:'EW'},'4,1':{ports:'EW'}},tunnels:[{a:[2,1],b:[4,1],dirA:'W',dirB:'E'}],blocked:[[3,0],[3,1],[3,2],[3,3],[6,5],[6,4]]}),
  puzzle({id:'2-4',title:'Choose the Long Way',chapter:'Redstone Valley',w:8,h:7,exit:[7,3],cars:[{id:1,p:[0,1],dir:'E'},{id:2,p:[0,5],dir:'E'}],
    instruction:'Tap SHORT / LONG to choose car 2’s route.',hint:'The short branch makes car 2 too early. Use the lower loop and the marked gate.',
    routes:[route([0,1],[4,1],[4,3],[7,3]),route([0,5],[2,5],[2,6],[5,6],[5,3],[7,3]),route([2,5],[5,5])],
    anchors:[[1,1],[1,5],[2,5],[5,5],[5,3],[6,3]],special:{'2,5':{stem:'W',switch:0,switchable:true,branchNames:['SHORT','LONG']}},solutionSwitches:{'2,5':1},signals:{'3,6':1},blocked:[[0,3],[1,3],[6,1],[6,5]]}),
  puzzle({id:'2-5',title:'The Evening Express',chapter:'Redstone Valley',w:9,h:7,exit:[8,3],cars:[{id:1,p:[0,1],dir:'E'},{id:2,p:[0,3],dir:'E'},{id:3,p:[0,5],dir:'E'}],
    instruction:'Three carriages. Two junctions. One final departure.',hint:'Compare the lengths of all three routes. The bottom car must make the longest journey.',
    routes:[route([0,1],[5,1],[5,3],[8,3]),route([0,3],[2,3],[2,2],[4,2],[4,3],[8,3]),route([0,5],[2,5],[2,6],[6,6],[6,3],[8,3])],
    anchors:[[1,1],[1,3],[1,5],[5,3],[6,3],[7,3]],signals:{'3,2':2,'3,6':2},blocked:[[0,0],[2,0],[7,1],[7,5],[0,6]]}),
];

export function solvedLayout(l){return copyLayout(l.solution);}
