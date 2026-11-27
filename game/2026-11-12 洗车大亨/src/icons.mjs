// Tabler Icons 3.51.0, MIT. Paths are unmodified library assets.
export const iconHTML=(name,cls='ui-icon')=>`<img class="${cls}" src="./assets/ui/${name}.svg" alt="" draggable="false">`;
export function setIcon(el,name){if(!el||el.dataset.currentIcon===name)return;el.innerHTML=iconHTML(name);el.dataset.currentIcon=name;}
export function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>setIcon(el,el.dataset.icon));}
