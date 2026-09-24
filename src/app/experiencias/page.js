import Catalogo from '../../components/Catalogo';
import { experiencias } from '../../data/experiencias';

export const metadata = { title: 'Experiencias' };

export default function ExperienciasPage() {
  return <Catalogo experiencias={experiencias} />;
}
