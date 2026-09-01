import * as XLSX from "xlsx";
import { normaliza } from "./text";

export type FilaPatinador = {
  nombre: string;
  grupo?: string;
  tutor?: string;
  email?: string;
};

const ALIAS_NOMBRE = ["nombre", "patinador", "patinadora", "alumno", "alumna", "nombre patinador", "nombre completo"];
const ALIAS_GRUPO = ["grupo", "categoria", "nivel", "equipo"];
const ALIAS_TUTOR = ["tutor", "padre", "madre", "padre/madre", "tutor legal", "nombre tutor"];
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

// Convierte un archivo Excel (tal cual lo exporta Klubber) en una lista
// de patinadores. Es tolerante con los nombres de columna: intenta
// reconocer "Nombre"/"Patinador", "Grupo"/"Categoría", etc.
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
  const colNombre = encuentraColumna(columnas, ALIAS_NOMBRE);
  const colGrupo = encuentraColumna(columnas, ALIAS_GRUPO);
  const colTutor = encuentraColumna(columnas, ALIAS_TUTOR);
  const colEmail = encuentraColumna(columnas, ALIAS_EMAIL);

  const filas: FilaPatinador[] = registros
    .map((fila) => ({
      nombre: colNombre ? String(fila[colNombre]).trim() : "",
      grupo: colGrupo ? String(fila[colGrupo]).trim() : undefined,
      tutor: colTutor ? String(fila[colTutor]).trim() : undefined,
      email: colEmail ? String(fila[colEmail]).trim() : undefined,
    }))
    .filter((f) => f.nombre);

  return {
    filas,
    columnasDetectadas: {
      nombre: colNombre,
      grupo: colGrupo,
      tutor: colTutor,
      email: colEmail,
    },
  };
}
