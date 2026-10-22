'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
// Read-only refreshes: never confirms a payment from checkout return parameters.
export default function OrderRefresh({active}) {
 const router=useRouter();
 useEffect(()=>{
  if(!active)return;
  let count=0;
  const timer=setInterval(()=>{
   if(document.visibilityState==='hidden')return;
   router.refresh();
   if(++count>=6)clearInterval(timer);
  },5000);
  return ()=>clearInterval(timer);
 },[active,router]);
 return null;
}
