const palettes=[['#f4c49f','#e19caf','#6d7caa'],['#845a45','#7dbac6','#58687d'],['#e9ac7d','#e9bf60','#6b9386'],['#ffd7b1','#938ac8','#80698e'],['#aa7456','#7bb49a','#687bb6'],['#eacbad','#da8c66','#6a91a1'],['#b78466','#a0a9d3','#897d67'],['#78513f','#d7b77e','#68788f']];
const people=[
 ['邻居奶奶','bun','none','cardigan','basket',.91,1.08,'#d5d3c7',2.3],
 ['散步爷爷','short','none','vest','basket',1.01,1.05,'#d4d2c5',2.35],
 ['晨跑青年','short','band','sport','basket',1.05,.88,'#41372f',3.05],
 ['海边游客','short','straw','floral','cart',1.02,1.05,'#6d4b37',2.55],
 ['上班族','short','none','suit','tote',1.12,.91,'#40342e',2.95],
 ['卷发姐姐','curly','none','dress','basket',1.02,.99,'#744a38',2.65],
 ['背包学生','pony','headphones','hoodie','tote',.93,.9,'#554132',2.9],
 ['条纹衫邻居','bob','none','stripe','cart',1.0,1.0,'#4a342b',2.7],
 ['画家','short','beret','overall','basket',1.04,.94,'#715742',2.55],
 ['冬帽青年','short','beanie','puffer','tote',1.05,1.06,'#39332f',2.65],
 ['双辫姑娘','braid','ribbon','dress','basket',.95,.9,'#553c30',2.7],
 ['休闲大叔','bald','none','polo','cart',1.0,1.18,'#544539',2.45],
 ['园艺爱好者','short','bucket','overall','basket',1.02,1.02,'#8a6b48',2.6],
 ['棒球帽少年','short','cap','sport','tote',.88,.87,'#42362f',3.0],
 ['围巾姐姐','bob','none','coat','cart',1.08,.97,'#9b744a',2.65],
 ['银发绅士','short','beret','suit','basket',1.08,.94,'#dbd8ce',2.45],
 ['丸子头女孩','doublebun','none','hoodie','basket',.9,.94,'#513c32',2.8],
 ['度假女士','bob','straw','dress','tote',1.04,1.02,'#a17b46',2.55],
 ['牛仔青年','short','cap','overall','cart',1.12,1.0,'#4d372d',2.85],
 ['温柔阿姨','curly','none','cardigan','basket',.97,1.11,'#72513e',2.4],
 ['音乐爱好者','short','headphones','stripe','tote',1.05,.92,'#382f2a',2.85],
 ['扎马尾青年','pony','none','sport','cart',1.02,.9,'#74523d',3.05],
 ['暖色毛衣客人','bob','beanie','stripe','basket',1.0,1.05,'#b88f57',2.55],
 ['衬衫客人','short','none','vest','cart',1.1,1.04,'#4c3b2e',2.7]
];
export function customerProfile(style=0){const n=Math.abs(Math.floor(style))%48,p=people[n%24],c=palettes[(n*3+Math.floor(n/24))%palettes.length];return {name:p[0],hair:p[1],hat:p[2],wear:p[3],shopping:p[4],height:p[5],build:p[6],hairColor:p[7],pace:p[8],skin:c[0],shirt:c[1],pants:c[2],glasses:n%6===1||n%8===4,sunglasses:n%24===3||n%24===17,backpack:n%24===6||n%24===13,scarf:n%24===14||n%24===22,moustache:n%24===1||n%24===15};}
