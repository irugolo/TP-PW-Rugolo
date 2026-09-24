import Link from 'next/link';

export default function Header() {
  return (
    <header className="header">
      <Link className="marca" href="/" aria-label="Fuera de Plan, inicio">fuera de plan<span aria-hidden="true">.</span></Link>
      <nav aria-label="Navegación principal">
        <Link href="/experiencias">Experiencias</Link>
        <Link href="/#como-funciona">Cómo funciona</Link>
      </nav>
    </header>
  );
}
