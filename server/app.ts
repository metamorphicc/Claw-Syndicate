import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { z, ZodError } from 'zod';
import { Store, ApiError, digest, type Principal } from './store';
import { actionSchema } from '../src/schema';
import type { Action } from '../src/model';
export function buildApi(options:{store:Store;origins:string[];secureCookies?:boolean;logger?:boolean;proxyToken?:string}){
 const {store}=options;const app=Fastify({logger:options.logger??false,bodyLimit:65536,trustProxy:false});
 app.register(cookie);app.register(cors,{origin:options.origins,credentials:true,methods:['GET','POST','DELETE']});
 app.register(rateLimit,{max:180,timeWindow:'1 minute'});
 const principal=(request:{cookies:Record<string,string|undefined>;headers:Record<string,unknown>})=>store.authenticate(request.cookies.claw_session,typeof request.headers.authorization==='string'?request.headers.authorization.replace(/^Bearer /,''):undefined);
 const requireUser=(p?:Principal)=>{if(!p)throw new ApiError(401,'Sign in to continue.');return p;};
 const human=(p?:Principal)=>{const user=requireUser(p);if(user.agentId)throw new ApiError(403,'Use a human session to manage credentials.');return user;};
 app.addHook('onRequest',async(req,reply)=>{
  reply.header('Cache-Control','no-store').header('X-Content-Type-Options','nosniff');
  if(options.proxyToken&&digest(String(req.headers['x-claw-proxy-token']??''))!==digest(options.proxyToken))throw new ApiError(403,'Proxy authentication required.');
  const origin=req.headers.origin;
  if(origin&&!options.origins.includes(origin))throw new ApiError(403,'Origin is not allowed.');
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&!req.headers.authorization&&!origin)throw new ApiError(403,'An allowed Origin is required for browser mutations.');
 });
 app.setErrorHandler((err,req,reply)=>{
  if(err instanceof ZodError)return reply.code(400).send({error:'Invalid request.',details:err.issues.map(i=>({path:i.path.join('.'),message:i.message}))});
  if(err instanceof ApiError)return reply.code(err.status).send({error:err.message});
  if((err as {statusCode?:number}).statusCode)return reply.code((err as {statusCode:number}).statusCode).send({error:(err as Error).message});
  req.log.error(err);return reply.code(500).send({error:'The operation could not be applied.'});
 });
 app.get('/api/health',()=>({ok:true,mode:'simulation'}));
 app.get('/api/state',()=>({state:store.state()}));
 app.get('/api/me',req=>({user:store.me(principal(req))}));
 const credentials=z.strictObject({email:z.email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(12).max(128)});
 const registration=credentials.extend({name:z.string().trim().min(2).max(60)});
 for(const mode of ['register','login'] as const)app.post(`/api/auth/${mode}`,{config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async(req,reply)=>{
  const body=mode==='register'?registration.parse(req.body):credentials.parse(req.body);
  const user=mode==='register'?await store.register(body.email,registration.parse(body).name,body.password):await store.login(body.email,body.password);
  const token=store.session(user.id);reply.setCookie('claw_session',token,{httpOnly:true,secure:options.secureCookies??false,sameSite:'lax',path:'/',maxAge:7*86400});return {user,state:store.state()};
 });
 app.post('/api/auth/logout',(req,reply)=>{const token=req.cookies.claw_session;if(token)store.db.prepare('DELETE FROM sessions WHERE hash=?').run(digest(token));reply.clearCookie('claw_session',{path:'/',httpOnly:true,secure:options.secureCookies??false,sameSite:'lax'});return {ok:true};});
 app.post('/api/actions',req=>{
  const p=requireUser(principal(req));const key=z.string().min(8).max(100).parse(req.headers['idempotency-key']);
  const revision=z.string().regex(/^\d{1,15}$/).transform(Number).parse(req.headers['if-match']);
  return store.execute(p,key,revision,actionSchema.parse(req.body) as Action);
 });
 app.get('/api/keys',req=>({keys:store.keys(human(principal(req)).userId)}));
 app.post('/api/keys',req=>{const p=human(principal(req));const b=z.strictObject({agentId:z.string().min(1).max(150),name:z.string().trim().min(2).max(60)}).parse(req.body);return store.issueKey(p.userId,b.agentId,b.name);});
 app.delete('/api/keys/:id',req=>{const p=human(principal(req));store.revokeKey(p.userId,(req.params as {id:string}).id);return {ok:true};});
 app.addHook('onClose',async()=>store.close());return app;
}
