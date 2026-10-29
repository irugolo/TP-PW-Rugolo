import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('catálogo: filtros, detalle y navegación con datos ficticios',async({page})=>{
 await page.goto('/experiencias');await expect(page.getByRole('heading',{level:1})).toHaveText('¿Qué plan te pinta?');
 await page.getByRole('button',{name:'En pareja',exact:true}).click();
 await expect(page.getByRole('button',{name:/En pareja/})).toHaveAttribute('aria-pressed','true');
 const link=page.getByRole('link',{name:/Ver experiencia/}).first();await link.click();
 await expect(page.getByRole('heading',{name:'Qué incluye'})).toBeVisible();
 await page.getByRole('link',{name:'← Volver a experiencias'}).click();await expect(page).toHaveURL(/\/experiencias$/);
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
 for(const route of ['/','/experiencias','/experiencias/cocina','/auth']){
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
