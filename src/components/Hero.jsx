'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function Hero() {
 const root = useRef(null), videos = useRef([]);
 const [motion, setMotion] = useState(false), [paused, setPaused] = useState(false), [visible, setVisible] = useState(false);
 const [slots, setSlots] = useState([0, null]), [target, setTarget] = useState(0), [active, setActive] = useState(null);
 const running = motion && !paused && visible;
 useEffect(() => {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;
  const update = () => { setMotion(!media.matches); setVisible(inView && !document.hidden); };
  const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }, { threshold: 0.1 });
  observer.observe(root.current); media.addEventListener('change', update); document.addEventListener('visibilitychange', update); update();
  return () => { observer.disconnect(); media.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); };
 }, []);
 useEffect(() => {
  videos.current.forEach((video, slot) => {
   if (!video) return;
   if (running && slot === target) video.play().catch(error => { if(error.name !== 'AbortError') setPaused(true); }); else video.pause();
  });
 }, [running, target, slots]);
 function advance(slot) {
  if (!running || slot !== target) return;
  const next = 1 - slot;
  setSlots(current => { const copy = [...current]; copy[next] = (current[slot] + 1) % 3; return copy; });
  setTarget(next);
 }
 return <section ref={root} className="hero hero-inmersivo" aria-labelledby="titulo-inicio">
  <div className="hero-medios" aria-hidden="true">
   <Image className="hero-poster" src="/media/portada-poster.jpg" alt="" fill preload sizes="100vw" />
   {motion && slots.map((clip, slot) => clip === null ? null : <video key={`${slot}-${clip}`} ref={el => { videos.current[slot] = el; }} className={`hero-video hero-video-${clip + 1}${active === slot ? ' visible' : ''}`} src={`/media/portada-${clip + 1}.mp4`} muted playsInline preload="none" tabIndex={-1} onPlaying={() => setActive(slot)} onEnded={() => advance(slot)} onError={() => { setActive(null); setPaused(true); }} />)}
  </div>
  <div className="hero-texto"><p className="eyebrow">Hacé lugar para algo distinto</p><h1 id="titulo-inicio">FUERA<br />DE PLAN<span>.</span></h1><p className="hero-apoyo">Salí de la rutina. Encontrá tu próximo plan.</p><div className="hero-acciones"><a className="boton principal" href="#experiencias">Explorar experiencias <span aria-hidden="true">↘</span></a><a className="boton hero-secundario" href="#como-funciona">Cómo funciona</a></div></div>
  <div className="hero-base"><a href="#experiencias">Seguí explorando <span aria-hidden="true">↓</span></a>{motion ? <button onClick={() => setPaused(v => !v)} aria-label={paused ? 'Reanudar videos de fondo' : 'Pausar videos de fondo'}>{paused ? 'Reanudar fondo' : 'Pausar fondo'} <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span></button> : <span>Fondo estático</span>}</div>
 </section>;
}
