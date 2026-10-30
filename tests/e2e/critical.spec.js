import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('catálogo: filtros, detalle y navegación con datos ficticios',async({page})=>{
 await page.goto('/experiencias');await expect(page.getByRole('heading',{level:1})).toHaveText('¿Qué plan te pinta?');
 await page.getByRole('checkbox',{name:'En pareja',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'En pareja',exact:true})).toBeChecked();
 const link=page.getByRole('link',{name:/Ver experiencia/}).first();await link.click();
 await expect(page.getByRole('heading',{name:'Qué incluye'})).toBeVisible();
 await page.getByRole('link',{name:'← Volver a experiencias'}).click();await expect(page).toHaveURL(/\/experiencias\?compania=/);await expect(page.getByRole('checkbox',{name:'En pareja',exact:true})).toBeChecked();
});
test('Auth: validación nativa, error proveedor simulado y recuperación',async({page})=>{
 await page.goto('/auth');await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(page.getByLabel('Email')).toBeFocused();
 await page.getByLabel('Email').fill('fixture@example.invalid');await page.getByLabel('Contraseña',{exact:true}).fill('Only-fixture-password!');
 await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.getByRole('status')).toContainText('No pudimos iniciar sesión');
 await expect(page.getByLabel('Email')).toHaveValue('fixture@example.invalid');
 await page.goto('/auth?mode=recovery');await expect(page.getByRole('heading',{name:'Nueva contraseña'})).toBeVisible();
});
test('visitante no obtiene cuenta, admin ni pedidos; API no filtra datos',async({page,request})=>{
 for(const route of ['/mi-cuenta','/admin','/pedidos']){await page.goto(route);await expect(page).toHaveURL(/\/auth$/);}
 expect((await request.get('/api/pedidos')).status()).toBe(401);
 expect((await request.patch('/api/perfil',{headers:{Origin:'https://evil.example'},data:{nombre:'Fixture'}})).status()).toBe(403);
 expect((await request.get('/api/experiencias/no-existe')).status()).toBe(404);
});
for(const width of [375,768,1440])test(`semántica, contraste y sin desborde a ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 for(const route of ['/','/experiencias','/experiencias/plan-pizza-entre-amigos','/auth']){
  await page.goto(route,{waitUntil:'networkidle'});await expect(page.getByRole('heading',{level:1})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
});

test('catálogo con latencia: la carga no desplaza elementos visibles',async({page})=>{
 await page.setViewportSize({width:375,height:900});
 await page.addInitScript(()=>{window.layoutShift=0;new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.layoutShift+=entry.value;}).observe({type:'layout-shift',buffered:true});});
 await page.goto('/experiencias',{waitUntil:'networkidle'});
 await expect(page.getByRole('heading',{name:'¿Qué plan te pinta?'})).toBeVisible();
 expect(await page.evaluate(()=>window.layoutShift)).toBeLessThanOrEqual(0.1);
});

test('portada: reducción de movimiento, menú y navegación desde detalle',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:375,height:900});
 const downloads=[];page.on('request',r=>{if(r.url().endsWith('.mp4'))downloads.push(r.url());});
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('FUERA');
 await expect(page.locator('.hero-poster')).toBeVisible();expect(downloads).toHaveLength(0);
 await page.getByRole('button',{name:'Menú',exact:true}).click();await expect(page.getByRole('navigation')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Menú',exact:true})).toBeFocused();
 await page.goto('/experiencias/plan-cine-para-dos');await page.getByRole('button',{name:'Menú',exact:true}).click();await page.getByRole('link',{name:'Preguntas frecuentes',exact:true}).click();await expect(page).toHaveURL(/\/#preguntas-frecuentes$/);await expect(page.getByRole('heading',{name:/Unas preguntas/})).toBeInViewport();
});
test('portada: carga progresiva, alternancia, pausa y salida de pantalla',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});const requests=new Set();page.on('request',r=>{if(r.url().endsWith('.mp4'))requests.add(new URL(r.url()).pathname);});
 await page.goto('/');await expect(page.locator('video.visible')).toHaveCount(1);
 expect(requests.size).toBe(1);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>page.locator('video').evaluateAll(v=>v.every(x=>x.paused))).toBe(true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await page.getByRole('button',{name:'Pausar videos de fondo'}).click();expect(await page.locator('video').evaluateAll(v=>v.every(x=>x.paused))).toBe(true);
 await page.getByRole('button',{name:'Reanudar videos de fondo'}).click();
 await page.locator('video.visible').evaluate(v=>{v.currentTime=v.duration-0.15;});await expect(page.locator('video.visible')).toHaveAttribute('src','/media/portada-2.mp4');expect(requests.size).toBe(2);
 await page.locator('video.visible').evaluate(v=>{v.currentTime=v.duration-0.15;});await expect(page.locator('video.visible')).toHaveAttribute('src','/media/portada-3.mp4');expect(requests.size).toBe(3);
 await page.locator('#como-funciona').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));await expect.poll(()=>page.locator('video').evaluateAll(v=>v.every(x=>x.paused))).toBe(true);
});
test('portada: error de video conserva poster y acciones',async({page})=>{
 await page.route('**/*.mp4',route=>route.abort());await page.goto('/');await expect(page.locator('.hero-poster')).toBeVisible();await expect(page.getByRole('link',{name:'Explorar experiencias'})).toBeVisible();await page.getByRole('link',{name:'Explorar experiencias'}).click();await expect(page.getByRole('heading',{name:'¿Qué plan te pinta?'})).toBeInViewport();
});

test('portada: autoplay rechazado conserva contenido',async({page})=>{
 await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('blocked','NotAllowedError'));};});
 await page.goto('/');await expect(page.getByRole('button',{name:'Reanudar videos de fondo'})).toBeVisible();await expect(page.locator('.hero-poster')).toBeVisible();await expect(page.getByRole('link',{name:'Explorar experiencias'})).toBeVisible();
});
