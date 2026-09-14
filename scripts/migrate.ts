import 'dotenv/config';import pg from 'pg';import fs from 'node:fs';
const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
if((await c.query(`SELECT to_regclass('public."Account"') as existing`)).rows[0].existing){console.log('Schema already exists; no destructive migration run.');}else{await c.query('BEGIN');try{await c.query(fs.readFileSync('prisma/migration.sql','utf8'));await c.query('COMMIT');console.log('Applied 43-entity migration.')}catch(e){await c.query('ROLLBACK');throw e}}
await c.end();
