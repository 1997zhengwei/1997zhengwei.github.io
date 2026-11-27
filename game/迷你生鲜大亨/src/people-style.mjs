import {box,sphere,cylinder,torus,mat,M} from './art.mjs';
export function ownerUniform(g,d){const c=mat(d.color),trim=mat(d.trim||'#fff0a6',.4,d.tier>=3?.15:0);
 if(d.tier<3){sphere(g,0,1.96,-.035,.405,M.white,[1,.42,1]);box(g,0,1.91,.31,.64,.075,.34,c,.06);}
 if(d.tier===0){box(g,0,1.02,.25,.49,.49,.055,mat('#08795e'),.04);box(g,0,.96,.29,.27,.17,.025,trim,.015);}
 if(d.tier===1){box(g,0,.94,.27,.59,.55,.07,c,.045);for(const x of [-.22,.22]){box(g,x,1.24,.26,.1,.32,.06,trim,.02);sphere(g,x,1.1,.315,.04,M.gold);}for(const x of [-.16,.16])box(g,x,.94,.32,.23,.17,.03,mat('#245f8a'),.015);}
 if(d.tier===2){for(let i=0;i<3;i++)box(g,0,.98+i*.09,.25,.61,.032,.035,trim,.008);for(const x of [-.19,.19]){const lapel=box(g,x,1.27,.26,.25,.15,.06,trim,.015);lapel.rotation.z=x>0?-.4:.4;}box(g,0,1.13,.31,.11,.25,.055,mat('#ef9e72'),.02);}
 if(d.tier>=3){box(g,0,.86,-.08,.76,.67,.51,c,.1);box(g,0,1.15,.25,.34,.4,.045,M.white,.025);for(const x of [-.22,.22]){const lapel=box(g,x,1.2,.29,.16,.38,.055,trim,.025);lapel.rotation.z=x>0?.22:-.22;}box(g,0,1.16,.3,.08,.27,.04,trim,.02);for(let i=0;i<3;i++)sphere(g,.26,.86+i*.11,.3,.035,trim);}
 if(d.tier===3){cylinder(g,0,2.01,0,.48,.08,mat('#2d3b52'));cylinder(g,0,2.25,0,.34,.43,mat('#2d3b52'));cylinder(g,0,2.1,0,.35,.12,trim);}
 if(d.tier===4){box(g,0,1.04,-.3,.84,.99,.09,mat('#503976'),.04);for(const x of [-.4,.4])box(g,x,1.04,-.36,.065,.94,.035,trim,.01);cylinder(g,0,2.02,0,.43,.15,trim);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;cylinder(g,Math.sin(a)*.36,2.2,Math.cos(a)*.36,.065,.3,trim,.025);sphere(g,Math.sin(a)*.36,2.37,Math.cos(a)*.36,.075,mat('#95e4e6'),[.8,1.2,.8]);}sphere(g,-.27,1.27,.31,.09,trim,[1,1,.3]);}
}
export function customerDetails(g,p){const hair=mat(p.hairColor),shirt=mat(p.shirt),light=mat('#fff4df');
 if(p.hair!=='bald')sphere(g,0,1.91,-.08,.405,hair,[1,.48,1]);
 if(p.hair==='bob')sphere(g,0,1.73,-.19,.42,hair,[1,.9,.66]);
 if(p.hair==='pony'){sphere(g,0,1.88,-.4,.2,hair);sphere(g,0,1.61,-.49,.19,hair,[.7,1.4,.7]);}
 if(p.hair==='bun')sphere(g,0,2.03,-.28,.2,hair);
 if(p.hair==='doublebun')for(const x of [-.32,.32])sphere(g,x,2,-.15,.18,hair);
 if(p.hair==='braid')for(const x of [-.34,.34])for(let i=0;i<3;i++)sphere(g,x,1.66-i*.14,-.11,.115,hair);
 if(p.hair==='curly')for(let i=0;i<7;i++){const a=i*Math.PI*2/7;sphere(g,Math.sin(a)*.33,1.96,Math.cos(a)*.29-.05,.17,hair);}
 if(p.hat==='straw'||p.hat==='bucket'){cylinder(g,0,2.03,0,.51,.08,mat('#f0dca3'));cylinder(g,0,2.18,0,.36,.25,mat('#f0dca3'),.31);cylinder(g,0,2.09,0,.37,.07,mat(p.shirt));}
 if(p.hat==='cap'){sphere(g,0,2,-.04,.42,shirt,[1,.42,1]);box(g,0,1.96,.35,.59,.06,.34,shirt,.04);}
 if(p.hat==='beanie'){sphere(g,0,2,-.03,.43,shirt,[1,.7,1]);cylinder(g,0,1.95,0,.44,.11,light);sphere(g,0,2.3,0,.12,shirt);}
 if(p.hat==='beret'){const b=sphere(g,-.05,2.06,0,.43,shirt,[1,.35,1]);b.rotation.z=.15;cylinder(g,-.05,2.23,0,.025,.13,shirt);}
 if(p.hat==='band')cylinder(g,0,1.9,0,.445,.1,light);
 if(p.hat==='ribbon'){sphere(g,-.13,2.01,-.27,.13,shirt,[1.4,.65,.5]);sphere(g,.13,2.01,-.27,.13,shirt,[1.4,.65,.5]);}
 if(p.hat==='headphones'){torus(g,0,1.78,-.03,.45,.045,mat('#41546a'),0);for(const x of [-.44,.44])sphere(g,x,1.72,0,.13,mat('#edbd6a'),[.5,1.2,1]);}
 if(p.glasses||p.sunglasses){for(const x of [-.16,.16]){box(g,x,1.68,.407,.25,.17,.04,mat('#4a545c'),.035);box(g,x,1.68,.433,.18,.11,.01,mat(p.sunglasses?'#526a78':'#badce0'),.025);}box(g,0,1.68,.42,.08,.035,.03,mat('#4a545c'),.01);}
 if(p.moustache)for(const x of [-.07,.07])sphere(g,x,1.52,.39,.075,hair,[1.25,.45,.3]);
 if(p.wear==='dress'){cylinder(g,0,.72,0,.47,.43,shirt,.32);box(g,0,.96,.25,.66,.05,.06,light,.01);}
 if(p.wear==='stripe'||p.wear==='sport')for(let i=0;i<3;i++)box(g,0,.9+i*.12,.252,.65,.035,.03,light,.008);
 if(p.wear==='suit'||p.wear==='vest'){box(g,0,1.12,.26,.32,.39,.03,light,.025);box(g,0,1.12,.29,.065,.25,.025,mat('#6b6c9f'),.01);for(const x of [-.23,.23]){const l=box(g,x,1.2,.28,.17,.27,.03,shirt,.015);l.rotation.z=x>0?.25:-.25;}}
 if(p.wear==='overall'){box(g,0,.99,.27,.5,.48,.05,mat('#5682a0'),.04);for(const x of [-.2,.2])box(g,x,1.24,.26,.08,.31,.06,mat('#5682a0'),.012);}
 if(p.wear==='hoodie')torus(g,0,1.54,-.16,.35,.075,shirt,0);
 if(p.wear==='coat'||p.wear==='cardigan'){box(g,0,.79,-.025,.8,.41,.5,shirt,.08);for(let i=0;i<3;i++)sphere(g,0,.87+i*.13,.27,.028,light);}
 if(p.wear==='puffer')for(let i=0;i<3;i++)box(g,0,.86+i*.16,.26,.67,.045,.05,mat('#d6c5a9'),.015);
 if(p.wear==='floral')for(const [x,y]of [[-.19,1.15],[.18,.94],[.12,1.23]])sphere(g,x,y,.27,.045,light,[1,1,.25]);
 if(p.scarf){torus(g,0,1.38,0,.25,.075,mat('#eab36e'));box(g,.19,1.18,.29,.15,.4,.055,mat('#eab36e'),.02);}
 if(p.backpack){box(g,0,1.04,-.37,.55,.6,.25,mat('#c2966e'),.1);for(const x of [-.28,.28])box(g,x,1.16,.235,.055,.44,.04,mat('#d4aa7e'),.015);}
}
