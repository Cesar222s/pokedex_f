export const TYPE_MAP = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada'
};

export const CLASS_MAP = {
  physical: 'Físico',
  special: 'Especial',
  status: 'Estado'
};

export function translateType(type) {
  return TYPE_MAP[type?.toLowerCase()] || type;
}

export function translateClass(cls) {
  return CLASS_MAP[cls?.toLowerCase()] || cls;
}
