// Reserve the first viewport while streamed content resolves, so the footer
// does not briefly appear and then jump out of view when the catalogue arrives.
export default function Loading() {
 return <section className="seccion" style={{minHeight:'100svh'}} role="status">Cargando…</section>;
}
