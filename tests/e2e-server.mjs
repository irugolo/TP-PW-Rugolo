// Isolated fixture service. Never imported by application code or deployed.
import http from 'node:http';
import {spawn} from 'node:child_process';
import {experiencias} from '../src/data/experiencias.js';
const fixtures=experiencias.map(x=>({...x,estado:'publicado'}));
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');res.setHeader('Content-Type','application/json');
 res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:3100');res.setHeader('Access-Control-Allow-Headers','authorization,apikey,content-type,x-client-info,x-supabase-api-version');
 if(req.method==='OPTIONS'){res.end();return;}
 if(url.pathname==='/rest/v1/experiencias'){
  const id=url.searchParams.get('id')?.replace(/^eq\./,'');// Simulated latency exercises streamed loading, not a test-side sleep.
  setTimeout(()=>res.end(JSON.stringify(id?fixtures.filter(x=>x.id===id):fixtures)),350);return;
 }
 res.statusCode=400;res.end(JSON.stringify({code:'invalid_credentials',msg:'Invalid login credentials'}));
});
server.listen(54329,'127.0.0.1');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3100','-H','127.0.0.1'],{stdio:'inherit',env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-public-key',APP_ORIGIN:'http://127.0.0.1:3100',MP_TEST_MODE:'false'}});
for(const event of ['SIGTERM','SIGINT'])process.on(event,()=>{child.kill(event);server.close();});
child.on('exit',code=>{server.close();process.exitCode=code??1;});
