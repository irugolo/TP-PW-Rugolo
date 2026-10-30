'use client';
import { useEffect } from 'react';
// Restore a requested section after the streamed catalogue has mounted.
// No automatic scroll occurs without an explicit section in the URL.
export default function SectionAnchor(){
 useEffect(()=>{
  const ids=['experiencias','como-funciona','preguntas-frecuentes'];
  const navigate=()=>{const id=window.location.hash.slice(1);if(ids.includes(id))document.getElementById(id)?.scrollIntoView({block:'start',behavior:'instant'});};
  const frame=requestAnimationFrame(navigate);window.addEventListener('hashchange',navigate);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('hashchange',navigate);};
 },[]);
 return null;
}
