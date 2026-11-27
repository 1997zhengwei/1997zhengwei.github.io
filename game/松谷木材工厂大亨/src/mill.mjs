export const STATIONS = {
  inbound: {name:'原木运输', operator:'运输调度', cost:100, base:90, icon:'truck',
    effect:'增加原木储备和每车载量，逐级缩短车程。'},
  saw: {name:'锯切生产', operator:'锯台师傅', cost:165, base:135, icon:'saw',
    effect:'加快锯切，提升出板量。高等级提高售价。'},
  dispatch: {name:'装车发货', operator:'叉车班长', cost:230, base:160, icon:'fork',
    effect:'扩大载重，缩短装车时间。高等级提高售价。'},
  finish: {name:'后加工设备', operator:'后加工技师', cost:265, base:180, icon:'finish',
    effect:'提高每批产量，缩短后加工时间。'},
  yard: {name:'扩建料场', base:145, icon:'stack',
    effect:'开放一座实体料垛，新增 18 件容量。'}
};

export const CONTRACTS = [
  {name:'林站首单', units:12, price:12, bonus:60, rank:'新手厂长'},
  {name:'谷仓修缮', units:24, price:15, bonus:130, rank:'熟练厂长'},
  {name:'山居营造', units:36, price:18, bonus:245, rank:'银牌锯坊'},
  {name:'溪桥木料', units:48, price:21, bonus:400, rank:'松谷名厂'},
  {name:'山线车站', units:72, price:25, bonus:720, rank:'木业大亨'}
];

const savedKey = 'pine-ridge-mill-v1';
const maximumLevel = {inbound:15,saw:15,dispatch:15,yard:7,finish:15};
const mainStations=['inbound','saw','dispatch'];
const cycleStations=['inbound','saw','finish','dispatch'];
const integer = (value, low, high) => Math.max(low, Math.min(high, Number.isFinite(value) ? Math.floor(value) : low));
const positive = (value) => integer(value,0,1e12);
const clamp = (v) => Math.max(0,Math.min(1,v));

export function contractAt(index,region=null) {
  if(region&&region.id!=='pine'){
    const base=CONTRACTS[index%CONTRACTS.length];
    const round=Math.floor(index/CONTRACTS.length);
    return {name:round?region.area+'合约 '+(index+1):region.demand[index],
      units:region.size+index*12,price:Math.round((base.price+round*12)*region.scale),
      bonus:Math.round((base.bonus+round*700)*region.scale),rank:base.rank};
  }
  if (index < CONTRACTS.length) return CONTRACTS[index];
  const round = index - CONTRACTS.length;
  return {name:'松谷长约 '+(round+1), units:90+18*round,
    price:28+3*round,bonus:950+round*260,rank:'木业大亨'};
}

export class Mill {
  constructor(storage = null, notify = () => {}, region=null, checkpoint=null) {
    this.storage = storage;
    this.notify = notify;
    this.region=region;
    this.finish=region?.finish??null;
    this.stations=this.finish?cycleStations:mainStations;
    this.saveTimer = 0;
    this.state = {
      cash:85, logs:0, rough:0, planks:0, shipped:0, sawn:0, trucks:0, peak:0, revenue:0, refined:0,
      contract:0, filled:0, firstSeen:false, sound:true,
      levels:{inbound:1,saw:1,dispatch:1,yard:1,finish:1},
      crew:{inbound:false,saw:false,dispatch:false,finish:false},
      auto:{inbound:true,saw:true,dispatch:true,finish:true},
      jobs:{inbound:null,saw:null,dispatch:null,finish:null}
    };
    this.restore(checkpoint);
  }

  get order() { return contractAt(this.state.contract,this.region); }
  get logsCap() { return 12+2*Math.min(9,this.state.levels.inbound-1); }
  get boardsCap() { return 36+18*(this.state.levels.yard-1); }
  get batch() { return 5+Math.min(9,this.state.levels.saw); }
  get roughCap(){return Math.min(56,18+6*this.state.levels.yard);}
  get finishCap(){return this.finish?this.finish.cap+Math.min(10,this.state.levels.finish-1):0;}
  get truckCap() { return 12+6*Math.min(7,this.state.levels.dispatch-1); }
  get minShip(){return this.finish?.ratio===2?4:6;}
  get valueFactor(){return 1+Math.max(0,this.state.levels.dispatch-8)*.06+Math.max(0,this.state.levels.saw-9)*.035;}
  get reservedBoards() {
    const job=this.state.jobs[this.finish?'finish':'saw'];
    return job ? job.total-job.done : 0;
  }

  stationConfig(station){
    if(station!=='finish')return STATIONS[station];
    return this.finish?{
      ...STATIONS.finish,name:this.finish.building==='HEAT KILN'?'热风循环窑':this.finish.building==='PLANER'?'精刨生产线':'承重梁压机',
      operator:this.finish.operator,base:this.finish.base,cost:this.finish.crew
    }:null;
  }

  restore(checkpoint=null) {
    try {
      const data = checkpoint??JSON.parse(this.storage?.getItem(savedKey) ?? 'null');
      if (!data || data.version !== 1) return;
      const s = this.state;
      for (const key of ['cash','shipped','sawn','trucks','peak','contract','filled','revenue','refined']) s[key]=positive(data[key]);
      for (const key of Object.keys(s.levels)) s.levels[key]=integer(data.levels?.[key],1,maximumLevel[key]);
      for (const key of Object.keys(s.crew)) {
        s.crew[key] = data.crew?.[key] === true;
        s.auto[key] = data.auto?.[key] !== false;
      }
      s.logs=integer(data.logs,0,this.logsCap);
      s.planks=integer(data.planks,0,this.boardsCap);
      s.rough=this.finish?integer(data.rough,0,this.roughCap):0;
      s.firstSeen=data.firstSeen===true;
      s.sound=data.sound!==false;
      s.filled=Math.min(s.filled,this.order.units-1);
      for (const key of this.stations) {
        const job = data.jobs?.[key];
        if (job && Number.isFinite(job.elapsed) && job.elapsed>=0 && job.duration>=2 &&
            job.duration<=20 && job.elapsed<job.duration && Number.isInteger(job.total) &&
            job.total>0 && job.total<=54 && Number.isInteger(job.done) && job.done>=0 && job.done<=job.total) {
          s.jobs[key]={elapsed:job.elapsed,duration:job.duration,total:job.total,done:job.done};
          if(key==='dispatch'){
            s.jobs[key].picked=integer(job.picked??job.done,job.done,job.total);
            s.jobs[key].loadFrom=integer(job.loadFrom,0,this.boardsCap-1);
          }else if(key==='saw')s.jobs[key].loadFrom=integer(job.loadFrom??s.logs,0,this.logsCap-1);
          else if(key==='finish')s.jobs[key].loadFrom=integer(job.loadFrom??s.rough,0,this.roughCap);
        }
      }
    } catch {}
  }

  save() {
    try { this.storage?.setItem(savedKey,JSON.stringify({version:1,...this.state})); } catch {}
  }

  info(station) {
    const s=this.state, job=s.jobs[station];
    if (job) return {ready:false,text:({inbound:'运输中',saw:'锯切中',finish:this.finish?.label,dispatch:'装运中'})[station], progress:clamp(job.elapsed/job.duration)};
    if (station==='inbound' && s.logs>=this.logsCap) return {ready:false,text:'原木已满',progress:1};
    if (station==='saw' && s.logs===0) return {ready:false,text:'等待原木',progress:0};
    if (station==='saw'&&(this.finish?s.rough+this.batch>this.roughCap:s.planks+this.batch>this.boardsCap))
      return {ready:false,text:this.finish?'毛板区已满':'堆场空间不足',progress:1};
    if(station==='finish'){
      if(!this.finish||s.rough<this.finish.ratio)return {ready:false,text:'等待毛板',progress:0};
      if(s.planks>=this.boardsCap)return {ready:false,text:'成品仓已满',progress:1};
      return {ready:true,text:this.finish.name,progress:0};
    }
    if (station==='dispatch' && s.planks<this.minShip) return {ready:false,text:'待装 '+s.planks+'/'+this.minShip,progress:s.planks/this.minShip};
    return {ready:true,text:station==='inbound'?'叫原木车':station==='saw'?'启动锯台':'装车发货',progress:0};
  }

  start(station) {
    if (!this.stations.includes(station) || !this.info(station).ready) return false;
    const s=this.state, level=s.levels[station], job={elapsed:0,done:0,total:0,duration:0};
    if (station==='inbound') {
      job.total=Math.min(this.logsCap-s.logs,4+2*Math.min(9,level));
      job.duration=7.7-(level-1)*.34;
      s.firstSeen=true;
    } else if (station==='saw') {
      job.total=this.batch;
      job.duration=6.2-(level-1)*.235;
      job.loadFrom=s.logs-1;
      s.logs--;
      s.sawn++;
    } else if(station==='finish'){
      const recipe=this.finish;
      job.total=Math.min(this.finishCap,Math.floor(s.rough/recipe.ratio),this.boardsCap-s.planks);
      job.duration=recipe.seconds-(recipe.seconds-3.2)*(level-1)/14;
      job.loadFrom=s.rough;
      s.rough-=job.total*recipe.ratio;
    } else {
      job.total=Math.min(s.planks,this.truckCap);
      job.duration=9.2-(level-1)*.31;
      job.picked=0;
    }
    s.jobs[station]=job;
    this.notify({type:'start',station});
    this.save();
    return true;
  }

  quote(station) {
    const level=this.state.levels[station];
    const info=this.stationConfig(station);
    return !info||level>=maximumLevel[station]?null:
      Math.round(info.base*(station==='yard'?1.58:1.37)**(level-1)*(this.region?.scale??1)/5)*5;
  }

  upgrade(station) {
    const cost=this.quote(station);
    if (cost===null || this.state.cash<cost) return false;
    this.state.cash-=cost;
    this.state.levels[station]++;
    this.notify({type:'upgrade',station});
    this.save();
    return true;
  }

  hire(station) {
    const cost=this.hirePrice(station);
    const s=this.state;
    if (!cost || s.crew[station] || s.cash<cost) return false;
    s.cash-=cost;
    s.crew[station]=true;
    s.auto[station]=true;
    this.notify({type:'hire',station});
    this.save();
    return true;
  }

  hirePrice(station){
    const cost=this.stationConfig(station)?.cost;
    return cost?Math.round(cost*Math.sqrt(this.region?.scale??1)/5)*5:null;
  }

  toggle(station) {
    if (!this.state.crew[station]) return false;
    this.state.auto[station]=!this.state.auto[station];
    this.save();
    return true;
  }

  step(dt) {
    const s=this.state;
    const active=s.jobs;
    for (const station of this.stations) {
      const job=active[station];
      if (!job) continue;
      const before=job.elapsed/job.duration;
      job.elapsed=Math.min(job.duration,job.elapsed+dt);
      const p=job.elapsed/job.duration;
      if (station==='saw' && before<.43 && p>=.43) this.notify({type:'cut'});
      if(station==='dispatch'){
        while(job.picked<job.total&&p>=this.pickupTime(job.picked,job.total)){
          const quantity=Math.min(6,job.total-job.picked);
          job.loadFrom=s.planks-1;
          job.picked+=quantity;
          s.planks-=quantity;
        }
      }
      while (job.done<job.total && p+1e-8>=this.deliveryTime(station,job.done,job.total)) {
        if (station==='inbound') s.logs++;
        else if (station==='saw'&&this.finish)s.rough++;
        else if (station==='saw'||station==='finish') {
          s.planks++;
          if(station==='finish')s.refined++;
          s.peak=Math.max(s.peak,s.planks);
        }
        job.done++;
        this.notify({type:'piece',station,job,progress:p});
      }
      if (p>=1) {
        active[station]=null;
        if (station==='dispatch') this.collect(job);
        else this.notify({type:'end',station,total:job.total});
        this.save();
      }
    }
    for (const station of this.stations) {
      if(active[station]||!s.crew[station]||!s.auto[station]||!this.info(station).ready)continue;
      if(station==='dispatch'&&s.planks<this.truckCap){
        const stalled=this.boardsCap-s.planks<(this.finish?2:this.batch);
        const finishing=this.finish&&(active.finish||s.rough>=this.finish.ratio);
        const materialExhausted=!finishing&&s.logs===0&&!active.saw&&!active.inbound&&!(s.crew.inbound&&s.auto.inbound);
        if(!stalled&&!materialExhausted)continue;
      }
      this.start(station);
    }
    this.saveTimer+=dt;
    if (this.saveTimer>=1) {this.saveTimer=0;this.save();}
  }

  deliveryTime(station,index,total) {
    if (station==='inbound') return .31+.43*(index+1)/total;
    if (station==='saw') return .68+.29*(index+1)/total;
    if (station==='finish')return .54+.43*(index+1)/total;
    return .31+.46*(Math.floor(index/6)+.87)/Math.ceil(total/6);
  }

  pickupTime(index,total){
    return .29+.48*(Math.floor(index/6)+.27)/Math.ceil(total/6);
  }

  collect(job) {
    const s=this.state;
    let remaining=job.total;
    let payout=0;
    const finished=[];
    while (remaining>0) {
      const order=this.order;
      const count=Math.min(remaining,order.units-s.filled);
      payout+=count*Math.round(order.price*this.valueFactor);
      remaining-=count;
      s.shipped+=count;
      s.filled+=count;
      if (s.filled>=order.units) {
        payout+=order.bonus;
        finished.push({...order});
        s.contract++;
        s.filled=0;
      }
    }
    s.cash+=payout;
    s.revenue+=payout;
    s.trucks++;
    this.notify({type:'sale',payout,total:job.total,finished});
  }

  estimate() {
    const count=Math.min(this.state.planks,this.truckCap);
    let remaining=count,payment=0,orderIndex=this.state.contract,filled=this.state.filled;
    while (remaining>0) {
      const order=contractAt(orderIndex,this.region);
      const used=Math.min(remaining,order.units-filled);
      payment+=used*Math.round(order.price*this.valueFactor);
      remaining-=used;filled+=used;
      if (filled===order.units) {payment+=order.bonus;filled=0;orderIndex++;}
    }
    return payment;
  }
}
