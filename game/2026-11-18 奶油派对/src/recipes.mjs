export const COLORS = {
  cream:{name:'香草奶油',hex:'#fff0d8'}, maple:{name:'枫糖焦糖',hex:'#be7139'},
  pumpkin:{name:'南瓜奶油',hex:'#f18a26'}, berry:{name:'蔓越莓',hex:'#d32668'},
  rose:{name:'草莓慕斯',hex:'#eb4b94'}, lilac:{name:'香芋奶油',hex:'#863dcb'},
  sky:{name:'蓝莓奶油',hex:'#5489ed'}, mint:{name:'开心果',hex:'#81c853'},
  cocoa:{name:'巧克力',hex:'#63402f'}, white:{name:'鲜奶油',hex:'#fffaf0'}
};
export const RECIPES = [
 {id:'lavender',name:'莓果晚霞',tag:'香芋 · 蓝莓 · 草莓',bands:['lilac','sky','rose'],top:'rose',radius:.94,height:1.72,shape:'round',decor:'berry'},
 {id:'harvest',name:'丰收三重奏',tag:'香草 · 南瓜 · 蔓越莓',bands:['cream','pumpkin','berry'],top:'cream',radius:.98,height:1.55,shape:'round',decor:'berry',hint:'按住挤奶油，上下滑动。蛋糕会自己转。'},
 {id:'pumpkin-pie',name:'感恩节南瓜派',tag:'酥皮 · 南瓜 · 奶油',bands:['maple','pumpkin','cream'],top:'pumpkin',radius:1.12,height:1.04,shape:'pie',decor:'pumpkin'},
 {id:'mint',name:'开心果云朵',tag:'香草 · 开心果 · 香草',bands:['cream','mint','cream'],top:'mint',radius:.99,height:1.60,shape:'round',decor:'leaf'},
 {id:'cranberry',name:'蔓越莓丝绒',tag:'巧克力 · 蔓越莓 · 奶油',bands:['cocoa','berry','white'],top:'berry',radius:.94,height:1.72,shape:'round',decor:'berry'},
 {id:'maple',name:'枫糖秋日',tag:'焦糖 · 香草 · 焦糖',bands:['maple','cream','maple'],top:'cream',radius:1.06,height:1.23,shape:'pie',decor:'leaf'},
 {id:'pastel',name:'彩虹感恩派对',tag:'蓝莓 · 草莓 · 开心果 · 香芋',bands:['sky','rose','mint','lilac'],top:'sky',radius:.97,height:1.83,shape:'round',decor:'stars'},
 {id:'feast',name:'丰收盛宴',tag:'南瓜 · 蔓越莓 · 香草 · 枫糖',bands:['pumpkin','berry','cream','maple'],top:'cream',radius:1.05,height:1.63,shape:'scallop',decor:'turkey'},
];
export const TOPPINGS = [
 {id:'cream',name:'奶油花',icon:'cream'}, {id:'berry',name:'蔓越莓',icon:'berry'},
 {id:'leaf',name:'枫叶糖',icon:'leaf'}, {id:'pumpkin',name:'小南瓜',icon:'pumpkin'},
 {id:'pecan',name:'碧根果',icon:'pecan'}, {id:'stars',name:'糖珠',icon:'stars'}
];
export function paletteFor(recipe,free=false){return [...new Set(free?Object.keys(COLORS):[...recipe.bands,recipe.top])];}
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function linearRgb(hex){const n=parseInt(hex.replace('#',''),16);return [n>>16&255,n>>8&255,n&255].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});}
export function targetId(recipe,v,surface='side'){return surface==='top'?recipe.top:recipe.bands[Math.min(recipe.bands.length-1,Math.floor(clamp(v)*recipe.bands.length))];}
