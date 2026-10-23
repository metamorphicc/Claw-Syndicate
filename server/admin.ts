import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { Store } from './store';
const {values}=parseArgs({options:{email:{type:'string'},name:{type:'string'},'claim-seed':{type:'boolean',default:false}}});
const email=z.email().parse(values.email).toLowerCase();const name=z.string().min(2).max(60).parse(values.name);
const password=z.string().min(12).max(128).parse(process.env.ADMIN_PASSWORD);
const store=new Store(resolve(process.env.DATABASE_PATH??'data/claw.sqlite'));
try{const user=await store.register(email,name,password,values['claim-seed']);console.log(`Created local operator ${user.name}. Seed ownership: ${values['claim-seed']?'assigned':'unchanged'}.`);}finally{store.close();}
