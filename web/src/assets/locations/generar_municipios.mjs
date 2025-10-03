// generar_municipios.mjs
import fs from "node:fs/promises";
import path from "node:path";

// URL del dataset (estados -> [municipios]) basado en INEGI
const DATA_URL =
  "https://raw.githubusercontent.com/cisnerosnow/json-estados-municipios-mexico/master/estados-municipios.json";

// util: quita acentos y normaliza para el nombre de archivo
const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin diacríticos
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const OUT_DIR = path.resolve("./municipios_json");

async function main() {
  // 1) Descarga del dataset
  const res = await fetch(DATA_URL);
  if (!res.ok) {
    throw new Error(`Fallo al descargar dataset: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();

  // 2) Parseo del JSON. OJO: el dataset es un OBJETO (no arreglo)
  let dataset;
  try {
    dataset = JSON.parse(text);
    if (dataset == null || typeof dataset !== "object" || Array.isArray(dataset)) {
      throw new Error("El dataset no es un objeto { Estado: [municipios...] }");
    }
  } catch (e) {
    console.error("No se pudo parsear el JSON del dataset.");
    throw e;
  }

  // 3) Carpeta de salida limpia
  await fs.mkdir(OUT_DIR, { recursive: true });

  // 4) Genera un archivo por estado
  let files = 0;
  for (const [estado, municipios] of Object.entries(dataset)) {
    if (!Array.isArray(municipios)) {
      console.warn(`Estado ${estado} tiene un valor no iterable; se omite.`);
      continue;
    }

    // El usuario pidió nombres tipo "colima.json", "jalisco.json", etc.
    // Usamos slug sin acentos ni espacios.
    const fname = `${slug(estado)}.json`;
    const outPath = path.join(OUT_DIR, fname);

    // Escribimos el arreglo simple con formato bonito
    await fs.writeFile(outPath, JSON.stringify(municipios, null, 2), "utf8");
    files++;
  }

  console.log(`Listo ✅  Se generaron ${files} archivos en: ${OUT_DIR}`);
  console.log(`Ejemplos:`);
  console.log(` - ${path.join(OUT_DIR, "colima.json")}`);
  console.log(` - ${path.join(OUT_DIR, "jalisco.json")}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
