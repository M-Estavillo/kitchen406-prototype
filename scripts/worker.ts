import {transaction,db} from '../src/server/db';import {jobs} from '../src/server/jobs';
async function tick(){try{const result=await transaction(d=>jobs(d));console.log('Kitchen406 worker',result)}catch(e){console.error(e)}}await tick();setInterval(tick,30000);for(const sig of ['SIGINT','SIGTERM'])process.on(sig,async()=>{await db.$disconnect();process.exit(0)});
