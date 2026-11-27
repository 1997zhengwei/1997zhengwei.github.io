import * as THREE from './vendor/three.module.js';
import {roundedGeometry} from './starpath-art.mjs';

// A small, readable mascot built from reusable shapes, with independent joints.
// Its scale is visual only: movement and collision still use the same player origin.
export function makeAstronaut({shell='#f0f6f0',trim='#cbd9db',accent='#52cbbb'}={}) {
  const root=new THREE.Group();
  root.scale.setScalar(1.28);
  const sphere=new THREE.SphereGeometry(1,16,12);
  const capsule=new THREE.CapsuleGeometry(.12,.22,4,8);
  const box=roundedGeometry();
  const mat=(color,roughness=.5,metalness=.12)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const white=mat(shell),cream=mat(trim),teal=mat(accent),coral=mat('#f3aa72'),
    gold=mat('#ffd073'),dark=mat('#152e48',.19,.48),ink=mat('#203b50'),shine=mat('#ffffff',.15,.2);
  const glow=mat('#9ffff0',.3,.1);glow.emissive.set('#53d7d0');glow.emissiveIntensity=.4;
  function part(parent,geometry,material,pos,scale,shadow=false){
    const m=new THREE.Mesh(geometry,material);m.position.set(...pos);if(scale)m.scale.set(...scale);
    m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;
  }
  // The rounded suit and chunky boots read clearly at the game camera distance.
  part(root,sphere,white,[0,.59,0],[.43,.47,.32],true);
  part(root,box,dark,[0,.63,.30],[.51,.29,.11]);
  part(root,box,teal,[0,.66,.37],[.35,.11,.04]);
  part(root,box,gold,[.12,.54,.37],[.10,.09,.035]);
  part(root,box,glow,[-.11,.54,.37],[.12,.035,.035]);
  part(root,box,ink,[0,.30,0],[.65,.11,.45]);
  for(const x of [-.18,.18])part(root,box,cream,[x,.27,.27],[.16,.16,.08]);
  const legs=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.23,.34,0);root.add(leg);legs.push(leg);
    part(leg,box,white,[0,-.08,0],[.26,.31,.25]);
    part(leg,box,cream,[0,-.06,.14],[.25,.13,.055]);
    part(leg,box,dark,[0,-.25,.065],[.34,.23,.46],true);
    part(leg,box,teal,[0,-.22,.31],[.26,.06,.045]);
    part(leg,box,ink,[0,-.36,.055],[.36,.055,.47]);
  }
  const arms=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.43,.79,0);root.add(arm);arms.push(arm);
    const sleeve=part(arm,capsule,white,[side*.06,-.13,0],[1,1,1],true);sleeve.rotation.z=-side*.27;
    part(arm,sphere,teal,[side*.11,-.33,.015],[.14,.12,.14]);
    part(arm,box,cream,[side*.04,0,0],[.29,.17,.34]);
    part(arm,sphere,dark,[side*.11,-.39,.025],[.13,.11,.14]);
    part(arm,box,glow,[side*.07,-.18,.16],[.13,.055,.04]);
  }
  // A bright pack, canisters and flag make the silhouette distinct from behind.
  part(root,box,dark,[0,.65,-.35],[.60,.67,.29],true);
  part(root,box,white,[0,.68,-.51],[.46,.46,.12]);
  part(root,box,teal,[0,.92,-.51],[.49,.09,.12]);
  for(let j=0;j<3;j++)part(root,box,glow,[-.13+j*.13,.70,-.59],[.065,.21,.035]);
  part(root,box,gold,[0,.43,-.55],[.3,.09,.07]);
  for(const x of [-.28,.28]){
    part(root,sphere,white,[x,.56,-.39],[.11,.31,.11]);
    part(root,sphere,dark,[x,.38,-.39],[.10,.08,.10]);
    part(root,box,glow,[x,.58,-.49],[.045,.30,.03]);
  }
  const head=new THREE.Group();head.position.y=1.21;root.add(head);
  part(head,sphere,white,[0,0,0],[.55,.53,.48],true);
  part(head,sphere,cream,[0,.012,.400],[.465,.34,.14]);
  part(head,sphere,dark,[0,.015,.428],[.432,.30,.125]);
  part(head,sphere,teal,[0,-.20,.435],[.32,.055,.045]);
  const eyes=[];
  for(const side of [-1,1]){
    const eye=new THREE.Group();eye.position.set(side*.155,.055,.522);head.add(eye);eyes.push(eye);
    part(eye,sphere,shine,[0,0,0],[.070,.083,.035]);
    part(eye,sphere,ink,[0,-.01,.029],[.035,.046,.018]);
    part(head,sphere,coral,[side*.30,-.095,.492],[.055,.03,.018]);
    part(head,sphere,teal,[side*.53,-.015,0],[.09,.15,.14]);
  }
  const smile=new THREE.Mesh(new THREE.TorusGeometry(.105,.016,6,16,Math.PI),shine);
  smile.position.set(0,-.105,.538);smile.rotation.z=Math.PI;head.add(smile);
  part(head,sphere,shine,[-.24,.19,.498],[.10,.025,.013]);
  part(head,box,white,[0,.44,.11],[.25,.07,.49]);
  part(head,box,gold,[0,.485,.1],[.13,.025,.30]);
  part(head,box,glow,[-.24,.19,.524],[.13,.035,.018]);
  const antenna=new THREE.Group();antenna.position.set(.32,.43,-.02);head.add(antenna);
  part(antenna,box,dark,[.03,.13,0],[.035,.28,.035]);
  part(antenna,sphere,coral,[.03,.29,0],[.085,.085,.085]);
  return {root,head,arms,legs,antenna,eyes};
}
