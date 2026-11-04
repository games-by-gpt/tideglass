// Drives real pointer/keyboard input; it never changes game state.
export function route(start,end,level,ready=false,t=0){
 const step=1.5,minX=-28.5,minZ=-31.5,nx=39,nz=43;
 const obstacles=level.rocks.map(([x,z,r])=>[x,z,r+1.2]);if(!ready)obstacles.push([...level.goal,5.2]);
 // Storms are mobile, so only avoid their current footprint; replan continuously.
 for(const s of level.storms){const [x,z,r,w,size]=s;obstacles.push([x+Math.cos(t*w)*r,z+Math.sin(t*w)*r*.52,size+1.1]);}
 const clear=(x,z)=>Math.abs(x)<=28.5&&Math.abs(z)<=31.5&&obstacles.every(([ox,oz,r])=>Math.hypot(x-ox,z-oz)>r);
 const line=(a,b)=>{const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])*3);for(let i=1;i<=n;i++)if(!clear(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n))return false;return true;};
 if(line(start,end))return end;
 const toGrid=([x,z])=>[Math.max(0,Math.min(nx-1,Math.round((x-minX)/step))),Math.max(0,Math.min(nz-1,Math.round((z-minZ)/step)))];const coord=([x,z])=>[minX+x*step,minZ+z*step];const key=([x,z])=>z*nx+x;let a=toGrid(start),b=toGrid(end),open=[{p:a,g:0,f:0}],cost=new Map([[key(a),0]]),came=new Map();let found;
 for(let it=0;open.length&&it<2200;it++){open.sort((a,b)=>b.f-a.f);const cur=open.pop();if(Math.hypot(...coord(cur.p).map((v,i)=>v-end[i]))<2){found=cur.p;break;}for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){if(!dx&&!dz)continue;const p=[cur.p[0]+dx,cur.p[1]+dz],c=coord(p);if(p[0]<0||p[0]>=nx||p[1]<0||p[1]>=nz||!clear(...c)||!line(coord(cur.p),c))continue;const g=cur.g+Math.hypot(dx,dz);if(g<(cost.get(key(p))??Infinity)){cost.set(key(p),g);came.set(key(p),cur.p);open.push({p,g,f:g+Math.hypot(p[0]-b[0],p[1]-b[1])});}}}
 if(!found){return end;}const path=[];for(let p=found;p&&key(p)!==key(a);p=came.get(key(p)))path.unshift(coord(p));let result=path[0]??end;for(const p of path){if(line(start,p))result=p;else break;}return result;
}
export async function sail(page,{untilLevel=5,onTick=async()=>{},timeout=300000}={}){
 let held=false, ticks=0,lastLog=-1;const began=Date.now();
 while(Date.now()-began<timeout){const state=await page.evaluate(()=>window.__tideglass.snapshot());
  if(state.mode==='complete'){if(held){await page.mouse.up();held=false;}console.log(`Completed stage ${state.run.level+1}: ${state.run.time.toFixed(1)}s, ${state.run.hits} bumps`);await onTick(state,ticks);if(state.run.level>=untilLevel)return state;await page.locator('#next').click();continue;}
  if(state.mode==='wreck'){if(held){await page.mouse.up();held=false;}console.log('Wreck, retry',state.run.level);await page.locator('#retry').click();continue;}
  if(state.mode==='pause'){await page.locator('#resume').click();continue;}if(state.mode!=='play')throw new Error('Unexpected mode '+state.mode);
  const {run,level}=state;const ready=run.collected.length===level.gems.length;const targets=level.gems.filter((_,i)=>!run.collected.includes(i)).sort((a,b)=>Math.hypot(a[0]-run.x,a[1]-run.z)-Math.hypot(b[0]-run.x,b[1]-run.z));const dest=targets[0]??level.goal;let waypoint=route([run.x,run.z],dest,level,ready,run.time);let dx=waypoint[0]-run.x,dz=waypoint[1]-run.z,mag=Math.hypot(dx,dz);if(mag>7){waypoint=[run.x+dx/mag*7,run.z+dz/mag*7];}
  const pt=await page.evaluate(([x,z])=>window.__tideglass.project(x,z),waypoint);await page.mouse.move(pt.x,pt.y);if(!held){await page.mouse.down();held=true;}
  // Exercise the actual dash whenever the forward route has generous clearance.
  if(run.cooldown<=0&&mag>8&&level.rocks.every(([x,z,r])=>Math.hypot(run.x-x,run.z-z)>r+5))await page.keyboard.press('Space');
  await onTick(state,ticks++);if(run.level!==lastLog){lastLog=run.level;console.log('Sailing passage',run.level+1);}
  await page.waitForTimeout(90);
 }
 throw new Error('Navigation timed out');
}
