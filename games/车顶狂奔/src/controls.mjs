export function touchLayout({width=1280,maxTouchPoints=0,coarse=false,anyCoarse=false}={}){
 return width<=760||maxTouchPoints>0||coarse||anyCoarse;
}

export function crouchGate(course,player){
 return course.gates.find(g=>g.s-player.s>=-7&&g.s-player.s<=85&&Math.abs(g.x-player.x)<g.w/2+5)||null;
}
