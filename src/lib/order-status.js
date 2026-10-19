export function orderStatus(order,payments=[]) {
 if(order.estado==='pendiente')return payments.some(p=>['pending','in_process'].includes(p.estado))
  ? {title:'Estamos verificando tu pago',description:'Recibimos un pago pendiente. Actualizá el estado en unos instantes.'}
  : {title:'Pendiente de pago',description:'Tu pedido está creado. Los cupos se confirman después de verificar el pago.'};
 return ({pagado:{title:'Pago aprobado',description:'El servidor verificó el pago de prueba y confirmó los cupos.'},rechazado:{title:'Pago rechazado o cancelado',description:'Podés volver a intentar desde Mercado Pago si el checkout sigue vigente.'},reembolsado:{title:'Pago reembolsado',description:'Los cupos de este pedido fueron liberados.'},revision:{title:'Pedido en revisión',description:'El administrador debe revisar una incidencia del pago o de los cupos.'}})[order.estado] || {title:'Estado no disponible',description:'Volvé a consultar en unos instantes.'};
}
