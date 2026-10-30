export const filterGroups = [
 {key:'compania', label:'Compañía', options:['En pareja','Con amigos']},
 {key:'ambiente', label:'Ambiente', options:['Al aire libre','Interior']},
 {key:'momento', label:'Momento', options:['Día','Noche']},
];
export const filterLabels = filterGroups.flatMap(group=>group.options);
export function readFilters(params){return Object.fromEntries(filterGroups.map(group=>[group.key,(params.get(group.key)||'').split(',').filter(value=>group.options.includes(value))]));}
export function matchesFilters(item, filters){return filterGroups.every(group=>!filters[group.key]?.length || filters[group.key].some(value=>item.filtros.includes(value)));}
export function filterQuery(filters){const params=new URLSearchParams();for(const group of filterGroups)if(filters[group.key]?.length)params.set(group.key,filters[group.key].join(','));return params.toString();}
