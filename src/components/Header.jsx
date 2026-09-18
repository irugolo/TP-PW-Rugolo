export default function Header() {
  return (
    <header className="header">
      <a className="marca" href="#inicio" aria-label="Fuera de Plan, inicio">fuera de plan<span aria-hidden="true">.</span></a>
      <nav aria-label="Navegación principal">
        <a href="#experiencias">Experiencias</a>
        <a href="#como-funciona">Cómo funciona</a>
      </nav>
    </header>
  );
}
