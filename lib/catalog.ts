// Catálogo de material del Club Patinaje Flip - Temporada 2026-2027
// Basado en el PDF "ROPA 2526.pdf" subido por el club.
// Para cambiar precios, tallas o añadir/quitar artículos, edita este archivo.

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number; // en euros
  tallas: string[];
  imagen: string; // ruta dentro de /public
  personalizable: boolean; // si se puede pedir con nombre bordado
  personalizacionObligatoria?: boolean; // si el nombre bordado es obligatorio (no opcional)
  colores?: string[]; // si el artículo tiene variantes de color
};

export const catalogo: Producto[] = [
  {
    id: "top-short",
    nombre: "Top y Short",
    descripcion: "Conjunto técnico, tejido circular bielástico con Gesdry y antibacteriano.",
    precio: 40,
    tallas: ["6", "8", "10", "12", "14", "16", "S", "M", "L", "XL"],
    imagen: "/productos/01-top-short.png",
    personalizable: false,
  },
  {
    id: "chaqueta",
    nombre: "Chaqueta",
    descripcion: "Chaqueta entallada tejido térmico, logo bordado.",
    precio: 55,
    tallas: ["6", "8", "10", "12", "XS", "S", "M", "L", "XL"],
    imagen: "/productos/02-chaqueta.png",
    personalizable: true,
    personalizacionObligatoria: true,
  },
  {
    id: "mallas-termicas",
    nombre: "Mallas Térmicas",
    descripcion: "Mallas largas tejido térmico, logo bordado.",
    precio: 30,
    tallas: ["6", "8", "10", "12", "14", "16", "S", "M", "L", "XL"],
    imagen: "/productos/03-mallas-termicas.png",
    personalizable: false,
  },
  {
    id: "mallas-entretiempo",
    nombre: "Mallas Entretiempo",
    descripcion: "Mallas tejido técnico circular, logo bordado.",
    precio: 25,
    tallas: ["6", "8", "10", "12", "14", "16", "S", "M", "L", "XL"],
    imagen: "/productos/04-mallas-entretiempo.png",
    personalizable: false,
  },
  {
    id: "camiseta",
    nombre: "Camiseta",
    descripcion: "Camiseta técnica de manga corta.",
    precio: 10,
    tallas: ["4", "8", "12", "16", "S", "M", "L", "XL"],
    imagen: "/productos/05-camiseta-rosa.png",
    personalizable: false,
    colores: ["Rosa", "Negra"],
  },
  {
    id: "falda",
    nombre: "Falda",
    descripcion: "Falda de patinaje para entrenamiento, tejido lycra.",
    precio: 15,
    tallas: ["6", "8", "10", "12", "S", "M", "L", "XL"],
    imagen: "/productos/07-falda.png",
    personalizable: false,
  },
  {
    id: "braga-cuello",
    nombre: "Braga Cuello",
    descripcion: "Buff de cuello polar para entrenamiento.",
    precio: 10,
    tallas: ["Talla única"],
    imagen: "/productos/08-braga-cuello.png",
    personalizable: false,
  },
  {
    id: "sudadera",
    nombre: "Sudadera",
    descripcion: "Sudadera negra con capucha, bolsillo canguro, logo espalda serigrafiado.",
    precio: 25,
    tallas: ["5-6", "7-8", "9-10", "11-12", "S", "M", "L", "XL", "XXL"],
    imagen: "/productos/09-sudadera.png",
    personalizable: true,
    personalizacionObligatoria: true,
  },
  {
    id: "parka",
    nombre: "Parka",
    descripcion: "Parka acolchada impermeable, capucha extraíble.",
    precio: 50,
    tallas: ["6", "8", "10", "12", "14", "S", "M", "L", "XL"],
    imagen: "/productos/10-parka.png",
    personalizable: false,
  },
  {
    id: "abrigo-fino",
    nombre: "Abrigo Fino",
    descripcion: "Abrigo acolchado relleno tacto pluma con capucha fija.",
    precio: 35,
    tallas: ["4", "6", "8", "10", "12", "14", "16", "S", "M", "L", "XL"],
    imagen: "/productos/11-abrigo-fino.png",
    personalizable: false,
  },
  {
    id: "chaleco",
    nombre: "Chaleco",
    descripcion: "Chaleco acolchado relleno tacto pluma, dos bolsillos.",
    precio: 30,
    tallas: ["4", "6", "8", "10", "12", "14", "S", "M", "L", "XL"],
    imagen: "/productos/12-chaleco.png",
    personalizable: false,
  },
  {
    id: "forro-polar",
    nombre: "Forro Polar",
    descripcion: "Chaqueta polar con cuello alto forrado, corte entallado.",
    precio: 30,
    tallas: ["6", "8", "10", "12", "14", "S", "M", "L", "XL"],
    imagen: "/productos/13-forro-polar.png",
    personalizable: false,
  },
  {
    id: "body",
    nombre: "Body",
    descripcion: "Body de entrenamiento y competiciones, licra mate 4-way stretch, logo en cristales.",
    precio: 65,
    tallas: ["6", "8", "10", "12", "XS", "S", "M", "L", "XL"],
    imagen: "/productos/14-body.png",
    personalizable: false,
  },
];

export function buscarProducto(id: string): Producto | undefined {
  return catalogo.find((p) => p.id === id);
}
