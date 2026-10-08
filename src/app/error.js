'use client';
export default function ErrorPage({reset}) { return <section className="seccion"><h1>No pudimos cargar esta página</h1><p role="alert">Intentá nuevamente en unos momentos.</p><button onClick={reset}>Reintentar</button></section>; }
