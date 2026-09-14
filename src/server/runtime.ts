import fs from 'node:fs';import path from 'node:path';
const dir=path.resolve('.runtime');
export function settings(){try{return JSON.parse(fs.readFileSync(path.join(dir,'settings.json'),'utf8'))}catch{return {offsetHours:0,notificationFailure:false,aiFailure:false}}}
export function configure(v:Record<string,unknown>){fs.mkdirSync(dir,{recursive:true});const next={...settings(),...v};fs.writeFileSync(path.join(dir,'settings.json'),JSON.stringify(next,null,2));return next}
export function now(){return new Date(Date.now()+Number(settings().offsetHours??0)*3600000)}
export function date(v:Date|string){return new Date(v).toISOString().slice(0,10)}
export function addDays(v:Date|string,n:number){const d=new Date(date(v)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return date(d)}
export function businessDate(){return new Date(now().getTime()+8*3600000).toISOString().slice(0,10)}
export function week(v:string){const d=new Date(v+'T00:00:00Z');return addDays(v,-((d.getUTCDay()+6)%7))}
export function fulfillmentTime(v:string){return new Date(v+'T09:00:00+08:00')}
export function writeOutbox(id:string,payload:unknown){fs.mkdirSync(path.join(dir,'outbox'),{recursive:true});fs.writeFileSync(path.join(dir,'outbox',id+'.json'),JSON.stringify(payload,null,2))}
export function readOutbox(id:string){try{return JSON.parse(fs.readFileSync(path.join(dir,'outbox',id+'.json'),'utf8'))}catch{return null}}
