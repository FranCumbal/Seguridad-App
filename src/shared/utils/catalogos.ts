// src/shared/utils/catalogos.ts

export const CARGOS_MINERIA = [
  "ALL", "ANALISTA DE SISTEMAS / TELECOMUNICACIONES", "ASESOR - AGENTE AFINES", "ASISTENTE AUXILIAR CONTABLE",
  "ASISTENTE AUXILIAR DE BODEGA", "ASISTENTE AUXILIAR DE COMPRAS", "ASISTENTE AUXILIAR DE SERVICIO TECNICO",
  "ASISTENTE AUXILIAR DE SSGG", "ASISTENTE AUXILIAR DE TALENTO HUMANO", "ASISTENTE AUXILIAR DE TALENTO HUMANO SELECCION",
  "ASISTENTE COORDINADOR DE NOMINA", "ASISTENTE DE GEOLOGIA", "ASISTENTE DE LABORATORIO", "ASISTENTE SALUD SEGURIDAD AMBIENTE SALUD",
  "ASISTENTE SALUD, SEGURIDAD, AMBIENTE", "AUXILIAR DE ENFERMERIA", "AYUDANTE DE MANTENIMIENTO / SUELDA",
  "AYUDANTE DE MINAS / OPERADOR PLANTA BENEFICIO", "AYUDANTE DE PERFORACION", "AYUDANTE DE POLVORIN",
  "AYUDANTE DE MEDIO AMBIENTE", "AYUDANTE DE MOLINOS Y TRITURADORA", "AYUDANTE TOPOGRAFO", "CHOFER",
  "COORDINADOR AFINES DE SEGURIDAD Y SALUD", "DIGITADOR / ESTADISTICO", "ELECTRICISTA GENERAL", "ENMADERADOR",
  "GERENTE AFINES OPERACIONES", "JEFE AFINES", "JEFE AFINES DE ELECTROMECANICA", "JEFE AFINES DE LABORATORIO",
  "JEFE AFINES DE SISTEMAS", "JEFE AFINES DE TELECOMUNICACIONES", "JEFE DE GEOLOGIA", "JEFE DE MANTENIMIENTO",
  "JEFE DE MINAS CANTERAS", "LAVANDERA EN HUMEDO", "LOCOMOTORISTA", "MEDICO OCUPACIONAL",
  "MECANICO DE MANTENIMIENTO / ELECTROMECANICO", "MECANICO GENERAL", "MENSAJERO / REPARTIDOR", "MUESTRERO",
  "OBRERO DE MINA", "OPERADOR DE DIAMANTINA", "OPERADOR DE EXCAVADORA", "OPERADOR DE MINAS / AYUDANTE METALURGICO",
  "OPERADOR DE MINAS / PERFORISTA", "OPERADOR DE MINAS / WINCHERO", "PASANTES", "PERFORISTA", "PSICOLOGO(A)",
  "SECRETARIA / OFICINISTA", "SOLDADOR", "SUPERVISOR AFINES", "SUPERVISOR AFINES DE LABORATORIO",
  "SUPERVISOR AFINES DE SEGURIDAD FISICA", "SUPERVISOR AFINES METALURGICOS", "SUPERVISOR DE MANTENIMIENTO MINAS CANTERAS",
  "SUPERVISOR DE OPERACIONES MINAS CANTERAS", "SUPERVISOR DE SALUD SEGURIDAD AMBIENTE", "TOPOGRAFIA", "TORNERO",
  "TRABAJADOR CAMPO / AYUDANTE DE MEDIO AMBIENTE", "TRABAJADOR CAMPO / AYUDANTE DE POLVORIN",
  "TRABAJADOR CAMPO / MUESTRERO", "TRABAJADOR CAMPO / OBRERO DE MINA", "TRABAJADORA SOCIAL", "WINCHERO"
];

export const ESTADOS_CIVILES = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión Libre"];
export const GENEROS = ["Masculino", "Femenino", "Otro"];
export const ESTADOS_SALUD = ["Excelente", "Bueno", "Regular", "Malo"];

// Provincias y ciudades principales de Ecuador
export const PROVINCIAS_ECUADOR: Record<string, string[]> = {
  "Azuay": ["Cuenca", "Gualaceo", "Sigsig", "Camilo Ponce Enríquez", "Nabón", "Santa Isabel"],
  "Bolívar": ["Guaranda", "Chillanes", "Chimbo", "Echeandía", "San Miguel", "Caluma"],
  "Cañar": ["Azogues", "Biblián", "Cañar", "La Troncal", "El Tambo"],
  "Carchi": ["Tulcán", "Bolívar", "Espejo", "Mira", "Montúfar", "San Pedro de Huaca"],
  "Chimborazo": ["Riobamba", "Alausí", "Colta", "Chambo", "Guamote", "Guano"],
  "Cotopaxi": ["Latacunga", "La Maná", "Pangua", "Pujilí", "Salcedo", "Saquisilí"],
  "El Oro": ["Machala", "Arenillas", "Balsas", "Chilla", "El Guabo", "Huaquillas", "Pasaje", "Piñas", "Portovelo", "Santa Rosa", "Zaruma"],
  "Esmeraldas": ["Esmeraldas", "Atacames", "Eloy Alfaro", "Muisne", "Quinindé", "San Lorenzo"],
  "Galápagos": ["San Cristóbal", "Isabela", "Santa Cruz"],
  "Guayas": ["Guayaquil", "Daule", "Durán", "Milagro", "Samborondón", "Naranjal", "El Empalme", "Balzar"],
  "Imbabura": ["Ibarra", "Antonio Ante", "Cotacachi", "Otavalo", "Pimampiro", "San Miguel de Urcuquí"],
  "Loja": ["Loja", "Calvas", "Catamayo", "Celica", "Chaguarpamba", "Espíndola", "Macará", "Paltas", "Puyango", "Saraguro"],
  "Los Ríos": ["Babahoyo", "Quevedo", "Buena Fe", "Puebloviejo", "Vinces", "Ventanas", "Mocache"],
  "Manabí": ["Portoviejo", "Manta", "Chone", "El Carmen", "Jipijapa", "Montecristi", "Pedernales", "Sucre"],
  "Morona Santiago": ["Macas", "Gualaquiza", "Limón Indanza", "Palora", "Santiago", "Sucúa"],
  "Napo": ["Tena", "Archidona", "Carlos Julio Arosemena Tola", "El Chaco", "Quijos"],
  "Orellana": ["Francisco de Orellana (Coca)", "Aguarico", "La Joya de los Sachas", "Loreto"],
  "Pastaza": ["Puyo", "Arajuno", "Mera", "Santa Clara"],
  "Pichincha": ["Quito", "Cayambe", "Machachi", "Sangolquí", "Pedro Moncayo", "Puerto Quito"],
  "Santa Elena": ["Santa Elena", "La Libertad", "Salinas"],
  "Santo Domingo de los Tsáchilas": ["Santo Domingo", "La Concordia"],
  "Sucumbíos": ["Nueva Loja (Lago Agrio)", "Cascales", "Cuyabeno", "Gonzalo Pizarro", "Putumayo", "Shushufindi"],
  "Tungurahua": ["Ambato", "Baños", "Cevallos", "Mocha", "Patate", "Pelileo", "Píllaro"],
  "Zamora Chinchipe": ["Zamora", "Yantzaza", "El Pangui", "Centinela del Cóndor", "Chinchipe", "Nangaritza"]
};