import {createState,Simulation} from './simulation.mjs';
import {storeSnapshot} from './stores.mjs';
import {staffLimit} from './business.mjs';
import {IDS,STAFF,PRODUCTS,TILL,productsFor} from './config.mjs';
// Explicit visual fixture. It never reads or writes the normal game save.
export function createShowroom(mode='expanded',load=14){
 const s=createState(1221);s.started=true;s.money=2500;
 Object.assign(s.stats,{revenue:6800,units:210,customers:98,harvested:300,restocked:300});
 s.stars=4;if(mode==='seaside'||mode==='night')s.storeId=mode;s.expansions.north=s.expansions.warehouse=true;s.upgrades.bag=2;
 s.player.x=2;s.player.z=3;s.registerCash=170;
 for(const id of IDS){const g=s.goods[id];Object.assign(g,{unlocked:true,source:24,stock:20,level:1});if(PRODUCTS[id].ingredient){g.input=4;g.output=6;}}
 s.wheat.source=24;
 const station={tomato:PRODUCTS.tomato.pickup,cashier:TILL.service,fresh:PRODUCTS.egg.pickup,baker:[-6.3,-17],juicer:PRODUCTS.juice.input};
 for(const role in STAFF){s.staffLevels[role]=1;s.employees.push({id:'staff-'+role,role,x:station[role][0],z:station[role][1],angle:0,bag:{},path:[],walk:0,timer:0,task:'',action:''});}
 for(const [i,id]of IDS.entries()){const p=productsFor(s)[id];s.customers.push({id:'customer-'+s.nextId++,x:p.shop[0],z:p.shop[1],angle:Math.PI/2,bag:{},path:[],walk:0,timer:0,task:'',action:'',style:i*3,order:[{id,qty:2}],index:0,picked:0,stage:'shop',wait:0,scan:0,bill:0,totalItems:0,age:0});}
 if(mode==='growth'){s.stars=3;s.goods.flower.unlocked=false;s.stats.revenue=14000;s.stats.customers=180;s.money=25000;}
 if(mode==='flagship'){s.stars=5;s.money=35000;s.stats.revenue=32000;s.stats.customers=340;for(const g of Object.values(s.goods)){g.level=2;g.sold=30;}}
 if(mode==='customers'){for(let i=7;i<24;i++){const base=s.customers[i%7];s.customers.push({...structuredClone(base),id:'customer-'+s.nextId++,style:i*2,x:1+(i%5)*3.2,z:3-Math.floor(i/5)*3,bag:{},bill:0,totalItems:0});}}
 if(mode==='rush'){s.stars=5;s.money=60000;const sim=new Simulation(s);for(const role in STAFF){s.staffLevels[role]=2;while(s.employees.filter(a=>a.role===role).length<staffLimit(s,role))sim.hireExtra(role);}sim.hireManager();s.customers=[];for(let i=0;i<25;i++){const c=sim.newCustomer();c.x=1+i%5*3.2;c.z=7-Math.floor(i/5)*3.5;}sim.refreshRoutes();}
 if(mode==='network'){s.storeId='night';s.stars=5;s.money=90000;for(const g of Object.values(s.goods)){g.level=2;g.sold=30;}for(const theme of ['corner','seaside']){const old=createShowroom(theme==='corner'?'flagship':'seaside');old.stars=5;old.money=30000;const sim=new Simulation(old);sim.hireManager();old.manager.level=theme==='corner'?2:1;old.dividendCash=theme==='corner'?960:540;s.stores[theme]=storeSnapshot(old);}}
 if(mode==='storage'){s.money=5000;s.customers=[];s.spawnTimer=999;s.player.x=17;s.player.z=8.5;s.player.bag={flower:13};for(const g of Object.values(s.goods))g.stock=40;}
 if(mode==='production'){s.money=3000;s.player.x=7;s.player.z=-20;s.employees=s.employees.filter(a=>a.role!=='juicer');s.staffLevels.juicer=0;s.goods.juice.stock=s.goods.juice.input=s.goods.juice.output=0;s.goods.tomato.source=32;}
 if(mode==='stack'){load=[6,14,22].includes(load)?load:14;s.upgrades.bag=(load-6)/4;s.player.x=.5;s.player.z=6;s.player.angle=-.8;s.player.bag={tomato:load};}
 return s;
}
