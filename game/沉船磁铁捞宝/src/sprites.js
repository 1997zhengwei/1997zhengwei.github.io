
export const ink = '#233561';

export function curve(ctx, data, fill, stroke = ink, line = .064) {
  const path = new Path2D(data);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;
    ctx.stroke(path);
  }
}

export function oval(ctx, x, y, rx, ry, fill, stroke, width = .056) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

export function pill(ctx, x, y, width, height, radius, fill, stroke, weight = .059) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = weight;
    ctx.stroke();
  }
}

export function star(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.quadraticCurveTo(x + radius * .19, y - radius * .19, x + radius * .78, y);
  ctx.quadraticCurveTo(x + radius * .19, y + radius * .17, x, y + radius);
  ctx.quadraticCurveTo(x - radius * .19, y + radius * .17, x - radius * .78, y);
  ctx.quadraticCurveTo(x - radius * .19, y - radius * .19, x, y - radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function sprite(draw) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.translate(96, 96);
  ctx.scale(87, 87);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx);
  return canvas;
}

const key = ctx => {
  ctx.rotate(-.34);
  curve(ctx,'M -.07 -.05 H .085 L .101 .34 L .256 .34 L .256 .49 L .037 .49 L -.07 .38 Z','#68d9cb');
  curve(ctx,'M -.02 .039 L -.012 .316 H .045',null,'#bbf9e3',.043);
  oval(ctx,0,-.23,.30,.29,'#52a9b9',ink);
  oval(ctx,0,-.25,.231,.225,'#76daca',null);
  oval(ctx,.004,-.242,.115,.108,'#2c5e91',ink,.040);
  curve(ctx,'M -.183 -.27 Q -.144 -.432 .003 -.438',null,'#c3f6dd',.047);
  oval(ctx,.195,-.169,.028,.028,'#ecfff3');
};

const gear = ctx => {
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate(i * Math.PI / 4);
    pill(ctx,-.11,-.48,.22,.245,.035,'#f7af55',ink,.052);
    ctx.restore();
  }
  oval(ctx,0,0,.383,.383,'#ed9553',ink,.061);
  oval(ctx,0,-.033,.305,.294,'#ffc974','#b76863',.042);
  oval(ctx,0,-.018,.149,.146,'#56759b',ink,.048);
  curve(ctx,'M -.23 -.172 Q -.18 -.255 -.082 -.282',null,'#fff3ad',.043);
  oval(ctx,.203,.119,.043,.043,'#ffe394');
};

const wheel = ctx => {
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate(i * Math.PI / 3);
    pill(ctx,-.065,-.53,.130,.585,.059,'#f0a75d',ink,.044);
    ctx.restore();
  }
  oval(ctx,0,0,.355,.354,null,ink,.142);
  oval(ctx,0,0,.355,.354,null,'#e4a96d',.080);
  oval(ctx,0,0,.105,.106,'#ffdc85',ink,.052);
  oval(ctx,-.034,-.037,.023,.023,'#fff9bd');
  curve(ctx,'M -.302 -.135 Q -.23 -.297 -.055 -.353',null,'#fff0ad',.029);
};

const bell = ctx => {
  oval(ctx,0,-.40,.110,.085,'#ffd27c',ink,.046);
  curve(ctx,'M -.346 .23 C -.240 .124 -.273 -.170 -.162 -.286 C -.075 -.386 .088 -.384 .17 -.286 C .276 -.164 .245 .119 .350 .231 Z','#ffbe67');
  curve(ctx,'M -.234 .161 C -.164 .067 -.206 -.188 -.119 -.254 Q -.018 -.344 .082 -.276 Q -.034 -.221 -.043 .132 Z','#ffe79d',null);
  oval(ctx,0,.24,.395,.101,'#d98265',ink,.068);
  oval(ctx,0,.240,.301,.046,'#ac656e',null);
  oval(ctx,.012,.325,.091,.073,'#ffe086',ink,.044);
  curve(ctx,'M -.340 .222 Q -.194 .163 -.085 .172',null,'#ffe39b',.039);
};

const cup = ctx => {
  for (const side of [-1,1]) {
    oval(ctx,side*.297,-.168,.156,.154,null,ink,.105);
    oval(ctx,side*.297,-.168,.156,.154,null,'#b1defd',.057);
  }
  pill(ctx,-.233,.320,.466,.111,.046,'#afc7ef',ink,.054);
  curve(ctx,'M -.063 .139 H .063 V .285 Q .177 .294 .200 .339 H -.203 Q -.178 .293 -.063 .285 Z','#e1e9ff',ink,.058);
  curve(ctx,'M -.301 -.301 H .301 C .271 -.003 .161 .163 .0 .163 C -.166 .163 -.273 .012 -.301 -.301 Z','#9bcfec');
  oval(ctx,0,-.301,.31,.072,'#e9fbff',ink,.057);
  oval(ctx,0,-.312,.235,.031,'#7aabd1');
  curve(ctx,'M -.223 -.203 Q -.201 -.074 -.119 -.010',null,'#eaffff',.047);
  star(ctx,.084,-.083,.082,'#fef0ab');
};

const watch = ctx => {
  oval(ctx,0,-.413,.104,.082,null,ink,.094);
  oval(ctx,0,-.413,.102,.081,null,'#ffe59c',.051);
  oval(ctx,0,-.020,.402,.389,'#ffb875',ink,.068);
  oval(ctx,0,-.037,.308,.291,'#fff6bf','#cd846e',.052);
  curve(ctx,'M 0 -.187 V -.032 L .120 .039',null,'#61528a',.063);
  oval(ctx,0,-.032,.036,.034,'#bd7b72');
  curve(ctx,'M -.3 -.164 Q -.272 -.257 -.174 -.314',null,'#fff6aa',.042);
  curve(ctx,'M -.134 .275 L 0 .184 L .134 .275 L 0 .414 Z','#ef84bf',ink,.050);
  curve(ctx,'M -.085 .264 L 0 .216 L .086 .264 H 0 Z','#ffbbdd',null);
};

const chest = ctx => {
  curve(ctx,'M -.466 -.073 H .466 V .291 Q .453 .397 .353 .403 H -.351 Q -.454 .397 -.466 .293 Z','#8c65c9');
  curve(ctx,'M -.474 -.067 Q -.474 -.338 -.195 -.343 H .18 Q .459 -.341 .476 -.067 Z','#b977d8');
  curve(ctx,'M -.398 -.200 Q -.290 -.304 -.152 -.303 H .152',null,'#e7abeb',.040);
  pill(ctx,-.47,-.085,.94,.089,.025,'#ffc585',ink,.046);
  for (const side of [-1,1]) {
    pill(ctx,side*.30-.055,-.222,.110,.575,.026,'#ffcf87',ink,.042);
    oval(ctx,side*.30,.234,.025,.023,'#fff3ad');
  }
  pill(ctx,-.121,-.027,.242,.204,.044,'#ffe69c',ink,.046);
  curve(ctx,'M -.080 .083 L 0 .025 L .080 .083 L 0 .155 Z','#f087c2','#9a578f',.025);
  star(ctx,.34,-.394,.115,'#ffe6a8');
};

function magnet(ctx) {
  const arc = 'M -.386 .245 V -.030 C -.386 -.515 .386 -.515 .386 -.030 V .245';
  curve(ctx,arc,null,'#3e416a',.323);
  curve(ctx,arc,null,'#ef7189',.224);
  curve(ctx,'M -.416 -.025 Q -.378 -.314 -.126 -.358',null,'#ffb4a3',.054);
  curve(ctx,'M .099 -.362 Q .258 -.305 .304 -.208',null,'#ffc3af',.038);
  for (const side of [-1,1]) {
    pill(ctx,side*.386-.141,.216,.282,.228,.043,'#cce6f6',ink,.054);
    curve(ctx,'M '+(side*.386-.092)+' .267 H '+(side*.386+.09),null,'#f6fbfa',.040);
  }
  oval(ctx,0,-.465,.107,.080,'#f9cf85',ink,.056);
  oval(ctx,0,-.464,.035,.030,'#63658c');
}

function fish(color, underside, fins) {
  return ctx => {
    curve(ctx,'M -.324 -.04 Q -.53 -.259 -.65 -.178 Q -.70 -.112 -.58 .011 Q -.695 .163 -.631 .237 Q -.507 .277 -.328 .075 Z',fins,'#284d7a',.052);
    curve(ctx,'M -.378 .014 C -.280 -.247 -.016 -.298 .198 -.215 C .397 -.150 .490 -.048 .433 .069 C .356 .264 .016 .291 -.222 .181 Q -.316 .113 -.378 .014 Z',color,'#284d7a',.057);
    curve(ctx,'M -.292 .080 Q -.127 .254 .147 .202 Q .339 .151 .379 .063 Q .116 .122 -.116 .096 Z',underside,null);
    curve(ctx,'M -.127 -.166 Q -.143 -.259 -.289 -.211 Q -.204 -.146 -.165 -.106 Z',fins,'#46628a',.040);
    curve(ctx,'M -.13 .054 Q -.010 .101 -.119 .189 Q -.220 .172 -.234 .127 Z',fins,null);
    oval(ctx,.251,-.074,.102,.104,'#fff9e9','#375278',.033);
    oval(ctx,.274,-.061,.053,.059,'#385077');
    oval(ctx,.288,-.084,.019,.020,'#fff');
    curve(ctx,'M .355 .094 Q .392 .112 .420 .076',null,'#565780',.025);
  };
}

const seal = ctx => {
  curve(ctx,'M -.412 -.231 L -.082 -.444 L .317 -.333 L .443 -.107 L .346 .292 L -.054 .416 L -.401 .206 Z','#9a7acb');
  curve(ctx,'M -.385 -.208 L -.082 -.405 L .294 -.306 L .39 -.11 L .307 .245 L -.054 .346 L -.345 .172 Z','#c5b2ed','#7566ac',.042);
  curve(ctx,'M -.245 .121 Q -.104 -.113 .023 .003 Q .171 .127 .284 -.122 M -.217 .220 Q -.08 .055 .017 .155 Q .147 .255 .243 .097',null,'#7366ad',.07);
  star(ctx,-.153,-.228,.115,'#fef1d5');
};

const sextant = ctx => {
  curve(ctx,'M -.342 -.255 L -.34 .31 Q -.002 .525 .396 .169 L -.342 -.255 Z','#e8a365');
  curve(ctx,'M -.34 .286 Q -.003 .439 .348 .166',null,'#ffdb9a',.106);
  curve(ctx,'M -.345 -.238 L -.134 .32 M -.349 -.23 L .116 .287',null,'#ffd390',.088);
  curve(ctx,'M -.434 -.27 L .214 -.363',null,ink,.141);
  curve(ctx,'M -.435 -.27 L .202 -.364',null,'#ffe1ac',.081);
  oval(ctx,-.192,-.045,.075,.067,'#ffefaf',ink,.07);
};

const lamp = ctx => {
  oval(ctx,0,-.358,.159,.16,null,'#885482',.098);
  pill(ctx,-.246,-.261,.49,.565,.11,'#a86cc3');
  pill(ctx,-.182,-.164,.364,.38,.075,'#85dedc','#626da0',.050);
  curve(ctx,'M -.135 -.095 L -.016 .162 L .061 -.074 Z','#bff7e9',null);
  pill(ctx,-.294,.238,.588,.138,.050,'#ebb284',ink);
  pill(ctx,-.274,-.307,.548,.118,.052,'#f5a2b4',ink);
  star(ctx,.23,-.09,.105,'#fff2bb');
};

const amulet = ctx => {
  oval(ctx,0,-.367,.085,.092,null,ink,.10);
  oval(ctx,0,-.369,.084,.084,null,'#b1f3da',.053);
  curve(ctx,'M -.351 -.095 L -.054 -.352 L .352 -.108 L .238 .204 L -.043 .414 L -.283 .185 Z','#83dacf');
  curve(ctx,'M -.233 -.107 L -.051 -.239 L .239 -.091 L .137 .151 L -.038 .273 L -.186 .143 Z','#52a7be','#4d779f',.042);
  curve(ctx,'M -.228 -.107 L -.051 -.239 L .239 -.091 L -.022 .046 Z','#a2e7dd',null);
  star(ctx,.056,.100,.091,'#dffce3');
};

const anchor = ctx => {
  oval(ctx,0,-.365,.118,.092,null,ink,.122);
  oval(ctx,0,-.365,.116,.092,null,'#d2e5fc',.065);
  const body='M 0 -.30 V .425 M -.24 -.153 H .24 M -.37 .126 Q -.264 .424 0 .435 Q .258 .433 .377 .130';
  curve(ctx,body,null,ink,.160);
  curve(ctx,body,null,'#adcdf2',.095);
  curve(ctx,'M -.459 .214 L -.393 .053 L -.264 .140 Z M .458 .22 L .394 .052 L .263 .143 Z','#c7e5fb',ink,.050);
  oval(ctx,-.03,.274,.036,.048,'#eef7ff');
};

const crown = ctx => {
  curve(ctx,'M -.426 .11 L -.478 -.261 L -.171 -.047 L 0 -.389 L .188 -.051 L .478 -.262 L .427 .119 Q .103 .234 -.427 .11 Z','#ffc268');
  pill(ctx,-.413,.100,.828,.192,.060,'#e79c62',ink,.070);
  curve(ctx,'M -.32 .157 H .295',null,'#ffe495',.046);
  curve(ctx,'M -.115 .055 L 0 -.082 L .115 .055 L 0 .186 Z','#cc78a8',ink,.045);
  oval(ctx,-.288,.194,.028,.027,'#fff2b0');
  oval(ctx,.277,.193,.028,.027,'#fff2b0');
  star(ctx,.17,-.311,.111,'#fdf3b0');
};

const clock = ctx => {
  oval(ctx,0,-.389,.109,.087,null,ink,.094);
  oval(ctx,0,-.389,.100,.080,null,'#f6d5a1',.052);
  oval(ctx,0,.024,.411,.391,'#a48ddd',ink,.075);
  oval(ctx,0,.024,.324,.303,'#dac9ef','#7865ab',.053);
  star(ctx,-.074,-.040,.159,'#fff5ba');
  curve(ctx,'M .035 -.172 V .033 L .184 .101',null,'#7c60a6',.062);
  star(ctx,-.357,-.263,.121,'#fff2b6');
};

const kingKey = ctx => {
  ctx.rotate(-.35);
  curve(ctx,'M -.070 -.051 H .077 L .101 .310 L .276 .308 V .459 H .061 L -.073 .354 Z','#ffce7d');
  curve(ctx,'M -.277 -.169 L -.247 -.350 L -.083 -.346 L .013 -.463 L .139 -.351 L .277 -.328 L .302 -.132 L .162 -.010 L -.121 -.011 Z','#f7cd81',ink,.070);
  curve(ctx,'M -.151 -.201 L .004 -.340 L .176 -.199 L .010 -.067 Z','#91e8d9','#8c6694',.041);
  star(ctx,.004,-.218,.082,'#fff8d5');
  star(ctx,.24,-.343,.091,'#fff8ca');
};

const coralHarp = ctx => {
  curve(ctx,'M -.39 .34 Q -.37 -.13 -.12 -.44 Q .05 -.57 .16 -.29 Q .24 -.17 .41 -.23 L .30 .33 Q -.04 .49 -.39 .34 Z','#eb7e93',ink,.07);
  curve(ctx,'M -.26 .25 Q -.16 -.29 -.04 -.34 Q .1 -.10 .30 -.12 L .21 .25 Z','#303c69',ink,.055);
  curve(ctx,'M -.15 -.25 L -.15 .25 M -.04 -.32 L -.04 .25 M .07 -.19 L .07 .25 M .18 -.12 L .18 .25',null,'#fff0bc',.028);
  curve(ctx,'M -.32 .36 Q .02 .43 .26 .34',null,'#ffc084',.075);
  star(ctx,.30,-.32,.118,'#fff1b6');
};

const tideCompass = ctx => {
  oval(ctx,0,-.437,.102,.08,null,'#dbb378',.058);
  oval(ctx,0,0,.444,.427,'#efbb75',ink,.074);
  oval(ctx,0,0,.350,.331,'#287291','#b6e6ca',.047);
  ctx.rotate(.52);
  curve(ctx,'M 0 -.29 L .077 -.044 L .267 0 L .077 .048 L 0 .29 L -.077 .048 L -.267 0 L -.077 -.044 Z','#daffe9',ink,.039);
  curve(ctx,'M 0 -.29 L .071 -.041 L 0 .027 L -.072 -.043 Z','#79d9b8',null);
  oval(ctx,0,0,.051,.051,'#ffe497',ink,.038);
};

const prism = ctx => {
  curve(ctx,'M -.43 .21 L -.46 -.08 L -.31 -.28 L -.13 -.11 L -.07 .25 Z','#a893f1',ink,.055);
  curve(ctx,'M -.13 .27 L -.24 -.20 L -.045 -.53 L .184 -.37 L .24 .20 L .09 .40 Z','#9877e5',ink,.063);
  curve(ctx,'M -.045 -.53 L .01 -.19 L .184 -.37 Z M .01 -.19 L .09 .40 L .24 .20 L .184 -.37 Z','#c8b8ff',null);
  curve(ctx,'M .14 .27 L .28 -.17 L .47 -.23 L .48 .04 L .31 .35 Z','#8ce7f2',ink,.054);
  star(ctx,.415,-.39,.134,'#fff1bf');
};

const regalia = ctx => {
  ctx.rotate(-.46);
  pill(ctx,-.074,-.213,.148,.815,.058,'#ffcc65',ink,.056);
  curve(ctx,'M -.023 -.12 V .47',null,'#fff4be',.044);
  curve(ctx,'M -.26 -.36 L -.22 -.57 L 0 -.72 L .23 -.57 L .26 -.36 L 0 -.16 Z','#ffe19a',ink,.063);
  curve(ctx,'M -.178 -.407 L 0 -.624 L .174 -.407 L 0 -.249 Z','#dc719f',ink,.045);
  star(ctx,-.015,-.457,.13,'#ffe8b7');
};

const abyssVault = ctx => {
  curve(ctx,'M -.70 -.05 Q -.70 -.52 -.40 -.59 L .30 -.65 Q .63 -.59 .70 -.19 L .69 .38 L .30 .58 L -.60 .51 L -.74 .34 Z','#f8bd50',ink,.076);
  curve(ctx,'M -.60 .06 L .29 .14 L .69 -.05 L .69 .38 L .30 .57 L -.60 .51 Z','#c9893e',ink,.055);
  curve(ctx,'M -.70 -.05 Q -.65 -.47 -.42 -.52 L .26 -.58 Q .17 -.43 .31 .09 L -.60 .03 Z','#233a6d',ink,.048);
  curve(ctx,'M -.55 .19 L .26 .27 L .26 .47 L -.55 .41 Z','#3e4a7d',ink,.044);
  curve(ctx,'M .38 .19 L .63 .065 L .61 .32 L .39 .43 Z','#684d79',ink,.046);
  curve(ctx,'M -.70 -.07 L .30 .03 L .70 -.17 L .69 -.045 L .29 .16 L -.68 .08 Z','#ffe49c',ink,.046);
  curve(ctx,'M -.43 -.16 L -.45 -.32 L -.30 -.22 L -.21 -.39 L -.09 -.23 L .061 -.34 L .022 -.13 Q -.24 -.072 -.43 -.16 Z','#ffd367','#f6a350',.045);
  curve(ctx,'M -.245 .09 L -.087 .10 L .018 .26 L -.102 .394 L -.282 .29 Z','#ffdf8b',ink,.051);
  oval(ctx,-.132,.252,.059,.073,'#54d8d7',ink,.035);
  star(ctx,-.62,-.44,.178,'#fff7cb');
  star(ctx,.63,-.52,.152,'#fff7cb');
};

export function openVault(ctx, amount) {
  curve(ctx,'M -.73 .06 L .31 .18 L .70 -.14 L .68 .38 L .30 .58 L -.60 .51 L -.73 .34 Z','#d68f3e',ink,.075);
  curve(ctx,'M -.55 .23 L .22 .30 L .24 .47 L -.55 .42 Z','#354875',ink,.044);
  curve(ctx,'M .38 .23 L .63 .05 L .61 .31 L .39 .43 Z','#664c7d',ink,.044);
  curve(ctx,'M -.73 .05 L -.43 -.31 L .69 -.22 L .70 -.14 L .31 .18 Z','#342f52','#ffd66a',.068);
  for (const [x,y] of [[-.41,-.033],[-.17,-.075],[.04,-.016],[.28,-.06],[.45,-.15]]) {
    oval(ctx,x,y,.105,.056,'#ffe896','#d78945',.027);
  }
  curve(ctx,'M -.47 -.024 L -.36 -.19 L -.23 -.04 L -.34 .051 Z','#8cf3e3','#496c9e',.040);
  ctx.save();
  ctx.translate(.66,-.22);
  ctx.rotate(amount * .72);
  ctx.translate(-.66,.22);
  curve(ctx,'M -.72 -.045 Q -.69 -.53 -.40 -.59 L .30 -.65 Q .63 -.59 .70 -.19 L .31 .10 Z','#f2b750',ink,.072);
  curve(ctx,'M -.62 -.07 Q -.57 -.49 -.36 -.51 L .27 -.56 Q .37 -.34 .31 .027 Z','#33436f',ink,.046);
  curve(ctx,'M -.43 -.16 L -.45 -.32 L -.30 -.22 L -.21 -.39 L -.09 -.23 L .061 -.34 L .022 -.13 Z','#ffd367',null);
  ctx.restore();
  curve(ctx,'M -.245 .12 L -.087 .14 L .018 .29 L -.102 .40 L -.282 .32 Z','#ffdf8b',ink,.05);
  oval(ctx,-.132,.27,.059,.073,'#54d8d7',ink,.035);
}

export const treasuresArt = [
  key, gear, wheel, bell, cup, watch, chest, seal, sextant, lamp, amulet, anchor, crown, clock, kingKey,
  coralHarp, tideCompass, prism, regalia, abyssVault,
].map(sprite);
export const treasureIcons = treasuresArt.map(canvas => canvas.toDataURL());
export const magnetArt = sprite(magnet);
export const workshopIcons = [
  magnet,
  ctx => {
    pill(ctx,-.38,-.37,.77,.568,.113,'#69c7cd',ink);
    oval(ctx,.003,-.083,.273,.252,'#f4b969',ink);
    oval(ctx,.002,-.083,.185,.175,'#ffe1a6','#a17482',.041);
    oval(ctx,.002,-.083,.056,.057,'#a87681',ink,.038);
    curve(ctx,'M .043 .116 Q .338 .343 .225 .471 Q .172 .560 .090 .492',null,ink,.103);
    curve(ctx,'M .043 .107 Q .338 .343 .225 .471 Q .172 .560 .090 .492',null,'#f0bb6d',.051);
    star(ctx,-.323,.315,.123,'#fbb777');
  },
  ctx => {
    oval(ctx,0,.009,.463,.331,null,'#638cb3',.065);
    oval(ctx,0,.009,.370,.259,null,'#80d9ca',.091);
    oval(ctx,0,.009,.245,.169,null,'#d6a9d8',.087);
    star(ctx,.104,-.017,.126,'#efbc8a');
  },
  ctx => {
    curve(ctx,'M -.377 -.325 Q -.028 -.478 .379 -.323 L .343 .095 Q .251 .305 0 .465 Q -.296 .294 -.354 .080 Z','#82cad4');
    curve(ctx,'M -.288 -.236 Q .024 -.362 .289 -.24 L .249 .061 Q .187 .223 0 .346 Q -.214 .231 -.269 .047 Z','#a4edda','#6a91b9',.047);
    curve(ctx,'M -.145 .023 L -.023 .127 L .171 -.085',null,'#5f81ad',.077);
  },
  ctx => {
    curve(ctx,'M -.458 .422 Q -.205 .247 .002 .35 Q .252 .248 .459 .422 Q .294 .547 -.301 .531 Z','#79bbba',ink,.057);
    curve(ctx,'M -.256 .368 L -.170 -.239 H .151 L .254 .368 Z','#fff1c7',ink,.059);
    curve(ctx,'M -.223 .172 L -.19 -.031 Q -.029 .017 .181 -.103 L .217 .118 Q -.029 .211 -.223 .172 Z','#ed9382',null);
    pill(ctx,-.206,-.356,.397,.151,.057,'#ffd783',ink,.048);
    curve(ctx,'M -.31 -.354 L .002 -.527 L .287 -.354 Z','#e68b88',ink,.053);
    pill(ctx,-.076,.199,.147,.170,.028,'#6887ab',ink,.034);
    star(ctx,.369,-.27,.161,'#ffe09a');
  },
].map(draw => sprite(draw).toDataURL());
export const fishArt = [
  fish('#ffc461','#ffe3a0','#f19569'),
  fish('#82d9ba','#bbedd1','#62bdb7'),
  fish('#f6a1ae','#ffd0cc','#ee789f'),
  fish('#8acafa','#c0e6ff','#739ee1'),
  fish('#baa5ed','#e1d4ff','#a089d8'),
].map(sprite);
