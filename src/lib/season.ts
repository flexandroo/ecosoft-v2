/**
 * Seasonal decor. Pages are static, so the season is decided in the browser
 * before first paint: an inline script sets `data-season` on <html>, and all
 * seasonal markup stays hidden (via the `halloween:` Tailwind variant) unless
 * that attribute is present. The decor turns itself on and off by date —
 * no rebuild or deploy needed.
 *
 * Preview any day with `?season=halloween`, hide with `?season=off`
 * (remembered for the browser tab).
 */
export const HALLOWEEN_WINDOW = { from: "10-10", to: "10-31" } as const; // MM-DD, Kyiv time, inclusive

export const SEASON_SCRIPT = `(function(){try{
var s=sessionStorage,q=new URLSearchParams(location.search).get('season');
if(q)s.setItem('season',q);q=s.getItem('season');
var p={};new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Kyiv',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});
var md=p.month+'-'+p.day;
if(q==='halloween'||(q!=='off'&&md>='${HALLOWEEN_WINDOW.from}'&&md<='${HALLOWEEN_WINDOW.to}'))document.documentElement.setAttribute('data-season','halloween');
}catch(e){}})();`;
