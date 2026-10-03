export function normaliza(texto: string) {
  return texto
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}

// Deja un n\u00famero de tel\u00e9fono solo con d\u00edgitos, y si viene con el prefijo
// de Espa\u00f1a (34 o 0034) delante de un n\u00famero de 9 cifras, lo quita, para
// que "+34 679 15 67 56", "0034679156756" y "679156756" se reconozcan
// como el mismo n\u00famero.
export function normalizaTelefono(valor: string | number) {
  const digitos = valor.toString().replace(/\D/g, "");
  if (digitos.length === 13 && digitos.startsWith("0034")) {
    return digitos.slice(4);
  }
  if (digitos.length === 11 && digitos.startsWith("34")) {
    return digitos.slice(2);
  }
  return digitos;
}

