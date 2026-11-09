// Presentation only: route costs, survival rules and save format remain independent.
export const biomes=[
 {id:'coral',name:'Coral Keys',route:'coast',sky:'#a9dfdc',deep:'#138f9a',shallow:'#79ddc6',sun:'#fff0ce',fog:.007,detail:'Turquoise shallows · palms & coral'},
 {id:'sunset',name:'Amber Archipelago',route:'coast',sky:'#edbc99',deep:'#387d88',shallow:'#e0c99c',sun:'#ffd0a0',fog:.009,detail:'Golden water · sandstone sea arches'},
 {id:'ice',name:'Glacier Passage',route:'coast',sky:'#b9cce1',deep:'#315f8b',shallow:'#a6d8e9',sun:'#e5f1ff',fog:.009,detail:'Cold blue currents · drifting icebergs'},
 {id:'wreck',name:'Wreckwood Reach',route:'salvage',sky:'#829b9c',deep:'#254e5c',shallow:'#72958b',sun:'#d9dfcd',fog:.016,detail:'Sea mist · broken masts & wrecks'},
 {id:'volcanic',name:'Ember Strait',route:'salvage',sky:'#ba9789',deep:'#3c5364',shallow:'#9c8173',sun:'#ffbc91',fog:.011,detail:'Black basalt · ember vents & ash'},
 {id:'moon',name:'Moonlit Ruins',route:'salvage',sky:'#535d90',deep:'#273965',shallow:'#786da9',sun:'#c7d1ff',fog:.012,detail:'Violet tides · luminous ancient gates'}
];
export function forRoute(s,route,stop=s.journey.stops){const offset=(stop+Math.floor(stop/4))%3;return biomes[(route==='salvage'?3:0)+offset]}
export function current(s){const j=s.journey,stop=j.mode==='harbor'?Math.max(0,j.stops-1):j.stops;return forRoute(s,j.route||'coast',stop)}
