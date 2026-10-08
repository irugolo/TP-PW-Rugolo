import Header from '../components/Header';
import Footer from '../components/Footer';
import '../../styles.css';

export const metadata = {
  title: { default: 'Fuera de Plan · Experiencias para compartir', template: '%s | Fuera de Plan' },
  description: 'Descubrí experiencias para compartir, reírte y salir de la rutina. Proyecto académico con planes de demostración.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <a className="saltar" href="#contenido">Saltar al contenido</a>
        <Header />
        <main id="contenido" tabIndex={-1}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
