export const EQUIPMENT=[
 {id:'courier',slot:'backpack',name:'帆布速递包',price:180,color:'#9e937d',tier:1,detail:'基础帆布、软包卷口与简单织带。轻便实用，外观朴素。永久外观，可独立搭配。'},
 {id:'holo-pack',slot:'backpack',name:'冰川光导包',price:420,color:'#73deee',tier:3,detail:'磨砂蓝外壳、发光导轨与金属扣件。永久外观，可独立搭配。'},
 {id:'expedition',slot:'backpack',name:'极夜远征包',price:900,color:'#caabf8',tier:5,detail:'双侧补给筒、紫金织带和徽章。永久外观，长线收藏。'},
 {id:'mint-step',slot:'trail',name:'薄荷踏光',price:260,color:'#b8f4b6',detail:'奔跑时留下淡绿足迹，起落间有轻盈光点。永久特效。'},
 {id:'cyan-streak',slot:'trail',name:'电光疾影',price:620,color:'#75e4ff',detail:'青蓝速度光带与短暂足环，跨楼时在身后拉出流光。永久特效。'},
 {id:'aurora',slot:'trail',name:'极光流星',price:1200,color:'#d0acff',detail:'青紫渐变星点与环形落脚光，随实际跑动产生。永久特效。'},
 {id:'compass',slot:'tool',name:'探路罗盘',price:480,color:'#e7c376',detail:'永久道具。装备后小地图显示通向宝箱的参考路线，实际障碍仍需自己通过。'},
 {id:'feather',slot:'tool',name:'轻羽护符',price:760,color:'#b5eed1',detail:'永久道具。每局抵消第一次掉落的扣命，之后掉落照常扣1命；被抓仍立即失败。'},
 {id:'smoke',slot:'tool',name:'烟雾投掷器',price:1080,color:'#c8b4f1',detail:'永久道具。每局可用1次：T或道具按钮，使12米内追兵停步3秒。每局重新装填。'}
];
export const DEFAULT_LOADOUT={backpack:'outfit',trail:'none',tool:'none'};
export function equipmentById(id){return EQUIPMENT.find(i=>i.id===id);}
export function normalizeEquipment(raw={}){
 const ownedItems=[...new Set((Array.isArray(raw.ownedItems)?raw.ownedItems:[]).filter(id=>equipmentById(id)))],loadout={...DEFAULT_LOADOUT};
 for(const slot of Object.keys(loadout)){const id=raw.loadout?.[slot];if(ownedItems.includes(id)&&equipmentById(id)?.slot===slot)loadout[slot]=id;else if(id==='none')loadout[slot]='none';}
 return {ownedItems,loadout};
}
export function buyEquipment(save,id){const item=equipmentById(id);if(!item)return false;if(!save.ownedItems.includes(id)){if(save.coins<item.price)return false;save.coins-=item.price;save.ownedItems.push(id);}save.loadout[item.slot]=id;return true;}
export function unequip(save,slot){if(!(slot in DEFAULT_LOADOUT))return false;save.loadout[slot]=DEFAULT_LOADOUT[slot];return true;}
export function huntReward(w){return {base:16,lives:w.hunt.lives*2,clean:w.stats.falls===0?3:0,pace:w.clock<45?3:0};}
