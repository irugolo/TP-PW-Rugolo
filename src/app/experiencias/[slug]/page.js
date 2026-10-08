import { notFound } from 'next/navigation';
import DetalleExperiencia from '../../../components/DetalleExperiencia';
import { experiencias } from '../../../data/experiencias';

// Los identificadores existentes también sirven como slugs estables en la URL.
export function generateStaticParams() {
  return experiencias.map(experiencia => ({ slug: experiencia.id }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const experiencia = experiencias.find(item => item.id === slug);
  return { title: experiencia?.nombre ?? 'Experiencia no encontrada' };
}

export default async function ExperienciaPage({ params }) {
  const { slug } = await params;
  const experiencia = experiencias.find(item => item.id === slug);
  if (!experiencia) notFound();
  return <DetalleExperiencia experiencia={experiencia} />;
}
