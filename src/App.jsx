import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Catalogo from './components/Catalogo';
import DetalleExperiencia from './components/DetalleExperiencia';
import ComoFunciona from './components/ComoFunciona';
import Footer from './components/Footer';
import { experiencias } from './data/experiencias';

export default function App() {
  const [seleccionada, setSeleccionada] = useState(null);

  return (
    <div id="inicio">
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <Header />
      <main id="contenido">
        <Hero />
        <Catalogo experiencias={experiencias} onSeleccionar={setSeleccionada} />
        <ComoFunciona />
      </main>
      <Footer />
      {seleccionada && <DetalleExperiencia experiencia={seleccionada} onCerrar={() => setSeleccionada(null)} />}
    </div>
  );
}
