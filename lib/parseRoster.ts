import * as XLSX from "xlsx";
import { normaliza, normalizaTelefono } from "./text";

export type FilaPatinador = {
  nombre: string;
  grupo?: string;
  tutor?: string;
  telefono?: string;
  email?: string;
};

const ALIAS_NOMBRE_PATINADOR = [
  "nombre patinadora",
  "nombre patinador",
  "nombre del patinador",
  "nombre del patinador/a",
  "patinadora",
  "patinador",
  "alumno",
  "alumna",
  "nombre completo",
  "nombre",
];
const ALIAS_APELLIDOS_PATINADOR = [
  "apellidos patinadora",
  "apellidos patinador",
  "apellidos del patinador",
  "apellidos",
];
const ALIAS_GRUPO = ["grupo", "categoria", "nivel", "equipo"];
const ALIAS_NOMBRE_TUTOR = [
  "nombre tutor",
  "nombre del tutor",
  "tutor legal",
  "tutor",
  "padre/madre",
  "padre",
  "madre",
];
const ALIAS_APELLIDOS_TUTOR = ["apellidos tutor", "apellidos del tutor"];
const ALIAS_TELEFONO = [
  "telefono tutor",
  "telefono del tutor",
  "telefono",
  "movil",
  "celular",
  "numero de telefono",
  "phone",
];
const ALIAS_EMAIL = ["email", "correo", "e-mail", "correo electronico"];

function encuentraColumna(columnas: string[], alias: string[]) {
  const normalizadas = columnas.map(normaliza);
  for (const a of alias) {
    const idx = normalizadas.indexOf(a);
    if (idx !== -1) return columnas[idx];
  }
  // coincidencia parcial como último recurso
  for (const a of alias) {
    const idx = normalizadas.findIndex((c) => c.includes(a));
    if (idx !== -1) return columnas[idx];
  }
  return null;
}

function valorTexto(fila: Record<string, unknown>, columna: string | null) {
  if (!columna) return "";
  const valor = fila[columna];
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

// Convierte un archivo Excel (tal cual lo exporta Clubber) en una lista
// de patinadores. Es tolerante con los nombres de columna, y acepta tanto
// una sola columna de nombre completo como columnas separadas de nombre y
// apellidos (tanto del patinador como del tutor).
export async function parseRosterFile(file: File): Promise<{
  filas: FilaPatinador[];
  columnasDetectadas: Record<string, string | null>;
}> {
  const buffer = await file.arrayBuffer();
  const libro = XLSX.read(buffer, { type: "array" });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  const registros: Record<string, unknown>[] = XLSX.utils.sheet_to_json(hoja, {
    defval: "",
  });

  if (registros.length === 0) {
    return { filas: [], columnasDetectadas: {} };
  }

  const columnas = Object.keys(registros[0]);
  const colNombre = encuentraColumna(columnas, ALIAS_NOMBRE_PATINADOR);
  const colApellidos = encuentraColumna(columnas, ALIAS_APELLIDOS_PATINADOR);
  const colGrupo = encuentraColumna(columnas, ALIAS_GRUPO);
  const colNombreTutor = encuentraColumna(columnas, ALIAS_NOMBRE_TUTOR);
  const colApellidosTutor = encuentraColumna(columnas, ALIAS_APELLIDOS_TUTOR);
  const colTelefono = encuentraColumna(columnas, ALIAS_TELEFONO);
  const colEmail = encuentraColumna(columnas, ALIAS_EMAIL);

  const filas: FilaPatinador[] = registros
    .map((fila) => {
      const nombrePatinador = [valorTexto(fila, colNombre), valorTexto(fila, colApellidos)]
        .filter(Boolean)
        .join(" ");
      const nombreTutor = [valorTexto(fila, colNombreTutor), valorTexto(fila, colApellidosTutor)]
        .filter(Boolean)
        .join(" ");
      const telefonoRaw = valorTexto(fila, colTelefono);

      return {
        nombre: nombrePatinador,
        grupo: valorTexto(fila, colGrupo) || undefined,
        tutor: nombreTutor || undefined,
        telefono: telefonoRaw ? normalizaTelefono(telefonoRaw) : undefined,
        email: valorTexto(fila, colEmail) || undefined,
      };
    })
    .filter((f) => f.nombre);

  return {
    filas,
    columnasDetectadas: {
      nombre: colNombre,
      apellidos: colApellidos,
      grupo: colGrupo,
      tutor: colNombreTutor,
      telefono: colTelefono,
      email: colEmail,
    },
  };
}
