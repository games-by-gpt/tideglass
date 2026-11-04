export const SAVE_NAME = 'tideglass-progress';
export const SCHEMA = 1;
export function freshProgress(){return {schema:SCHEMA,unlocked:0,completed:{},run:null,muted:false,updatedAt:0};}
export function compareVersions(a,b){
  const parse=v=>{const [core,pre]=v.split('-');return {core:core.split('.').map(Number),pre};};
  const x=parse(a),y=parse(b);for(let i=0;i<3;i++){if(x.core[i]!==y.core[i]) return x.core[i]>y.core[i]?1:-1;}
  if(!x.pre&&!y.pre)return 0;if(!x.pre)return 1;if(!y.pre)return -1;
  const xp=x.pre.split('.'),yp=y.pre.split('.');for(let i=0;i<Math.max(xp.length,yp.length);i++){if(xp[i]===yp[i])continue;if(xp[i]===undefined)return -1;if(yp[i]===undefined)return 1;const xn=/^\d+$/.test(xp[i]),yn=/^\d+$/.test(yp[i]);if(xn&&yn)return +xp[i]>+yp[i]?1:-1;if(xn!==yn)return xn?-1:1;return xp[i]>yp[i]?1:-1;}return 0;
}
export function parseProgress(raw){
  if(!raw)return freshProgress();const p=JSON.parse(raw);
  if(p.schema>SCHEMA)throw new Error('This voyage belongs to a newer game version. Please open the latest release.');
  if(p.schema!==SCHEMA||!Number.isInteger(p.unlocked)||p.unlocked<0||p.unlocked>5||!p.completed||typeof p.completed!=='object')throw new Error('Your save could not be read. It has been kept safe.');
  for(const [key,result] of Object.entries(p.completed)){if(!/^[0-5]$/.test(key)||!result||!Number.isInteger(result.stars)||result.stars<1||result.stars>3||!Number.isFinite(result.time)||result.time<0)throw new Error('Your passage records could not be read. They have been kept safe.');}
  if(p.run){const r=p.run;if(!Number.isInteger(r.level)||r.level<0||r.level>p.unlocked||!Array.isArray(r.collected)||new Set(r.collected).size!==r.collected.length||!r.collected.every(n=>Number.isInteger(n)&&n>=0&&n<7)||!['x','z','health','time','hits'].every(k=>Number.isFinite(r[k]))||Math.abs(r.x)>30||Math.abs(r.z)>34||r.health<1||r.health>3||r.time<0)throw new Error('Your saved passage could not be read. It has been kept safe.');}
  return {...freshProgress(),...p};
}
export function mergeProgress(old,next){
 const completed={...old.completed};for(const [key,result] of Object.entries(next.completed)){const before=completed[key];completed[key]=before?{stars:Math.max(before.stars,result.stars),time:Math.min(before.time,result.time)}:result;}
 return {...next,unlocked:Math.max(old.unlocked,next.unlocked),completed,updatedAt:Date.now()};
}
export class ProgressStore{
 constructor(sdk,onStatus=()=>{}){this.sdk=sdk;this.onStatus=onStatus;this.data=freshProgress();this.loaded=false;this.readonly=false;this.chain=Promise.resolve();}
 checkVersion(){const v=this.sdk.saves.infoSync(SAVE_NAME)?.version;const current=this.sdk.build?.version;if(v&&current&&compareVersions(v,current)>0){this.readonly=true;throw new Error('A newer release saved this voyage. Open the latest version to continue.');}}
 async load(){await this.sdk.ready;const raw=await this.sdk.saves.read(SAVE_NAME);this.checkVersion();this.data=parseProgress(raw);this.loaded=true;this.onStatus(this.sdk.saves.where==='memory'?'Temporary session — browser storage is blocked':this.sdk.saves.where==='build'?'Saved on this browser':'Arcadible saves ready');return this.data;}
 save(next){if(!this.loaded||this.readonly)return Promise.resolve(false);const snapshot=structuredClone(next);
 this.chain=this.chain.catch(()=>{}).then(async()=>{try{this.checkVersion();const old=parseProgress(this.sdk.saves.readSync(SAVE_NAME));const combined=mergeProgress(old,snapshot);await this.sdk.saves.write(SAVE_NAME,JSON.stringify(combined));this.data=combined;this.onStatus(this.sdk.saves.where==='memory'?'Temporary session — progress will not be kept':this.sdk.saves.where==='game'?'Voyage saved · Arcadible':'Voyage saved · this browser');return true;}catch(e){this.onStatus('Save paused · '+e.message);return false;}});return this.chain;
 }
}
