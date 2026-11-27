import {clamp} from './data.mjs';
import {START_RADIUS} from './course.mjs';
// Track +u points along world +X; the chase camera looks toward +Z, so screen right is -u.
export const screenToTrack=value=>-value;
export const trackToScreen=value=>-value;
export const steeringTarget=(current,screenDirection)=>clamp(current+screenToTrack(screenDirection)*.267,-.94,.94);
export const dragTarget=(start,deltaX,width)=>clamp(start+screenToTrack(deltaX)/Math.max(180,width*.64)*1.7,-.94,.94);
export function cameraLayout(radius,aspect,indoorChapter=null){const portrait=Math.max(1,.72/aspect),growth=clamp(Math.log2(Math.max(1,radius/START_RADIUS))/7,0,1),framing=1-growth*.24;return{distance:(radius*6.8+.5)*portrait*framing,height:Math.min((radius*4.5+.15)*Math.min(1.18,portrait)*framing,indoorChapter===0?7.4:indoorChapter===1?17:Infinity),framing};}
