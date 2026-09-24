import Link from 'next/link';

export default function Footer() {
  return <footer className="footer"><div><Link href="/" className="marca">fuera de plan<span aria-hidden="true">.</span></Link><p>Experiencias para salir de la rutina.<br />Momentos para compartir.</p></div><p className="nota-academica">Proyecto académico · Fuera de Plan<br />Experiencias de demostración, no eventos reales.</p></footer>;
}
