import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import metadata from './schema-meta.json';
const g=globalThis as unknown as {prisma:PrismaClient};
export const db=g.prisma??new PrismaClient();if(process.env.NODE_ENV!=='production')g.prisma=db;
export type DB=Pick<PrismaClient,'$queryRawUnsafe'|'$executeRawUnsafe'>;
export type Row=Record<string,any>;
export const meta=metadata as Record<string,{pk:string;columns:Record<string,any>}>;
export async function rows(d:DB,sql:string,...args:any[]):Promise<Row[]>{return d.$queryRawUnsafe(sql,...args)}
export async function one(d:DB,sql:string,...args:any[]):Promise<Row>{const r=await rows(d,sql,...args);if(!r[0])throw new Error('Record not found');return r[0]}
export function ident(n:string){if(!/^[A-Za-z_][A-Za-z_0-9]*$/.test(n))throw new Error('Invalid identifier');return '"'+n+'"'}
export async function insert(d:DB,t:string,v:Row){if(!meta[t])throw new Error('Unknown entity');const keys=Object.keys(v);return one(d,`INSERT INTO ${ident(t)} (${keys.map(ident)}) VALUES (${keys.map((k,i)=>'$'+(i+1)+(typeof v[k]==='object'&&v[k]!==null&&!(v[k] instanceof Date)?'::jsonb':''))}) RETURNING *`,...keys.map(k=>typeof v[k]==='object'&&v[k]!==null&&!(v[k] instanceof Date)?JSON.stringify(v[k]):v[k]))}
export async function update(d:DB,t:string,id:string,v:Row){const keys=Object.keys(v);if(!keys.length)return one(d,`SELECT * FROM ${ident(t)} WHERE ${ident(meta[t].pk)}=$1`,id);return one(d,`UPDATE ${ident(t)} SET ${keys.map((k,i)=>ident(k)+'=$'+(i+1)+(typeof v[k]==='object'&&v[k]!==null&&!(v[k] instanceof Date)?'::jsonb':''))} WHERE ${ident(meta[t].pk)}=$${keys.length+1} RETURNING *`,...keys.map(k=>typeof v[k]==='object'&&v[k]!==null&&!(v[k] instanceof Date)?JSON.stringify(v[k]):v[k]),id)}
export async function transaction<T>(f:(d:DB)=>Promise<T>):Promise<T>{return db.$transaction(async tx=>{await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(406)');return f(tx)},{maxWait:15000,timeout:30000})}
export function json(v:any):any{return JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='bigint'?Number(x):x))}
export const num=(v:any)=>Number(v??0);
export const money=(v:number)=>Math.round(v*100)/100;
