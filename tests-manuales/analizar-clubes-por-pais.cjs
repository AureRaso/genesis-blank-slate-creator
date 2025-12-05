const XLSX = require('xlsx');
const path = require('path');

// Leer el archivo Excel
const filePath = path.join(__dirname, 'src', 'assets', 'Clubes Padel in the world.xls');
const workbook = XLSX.readFile(filePath);

// Obtener la primera hoja
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convertir a JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('=== ANÁLISIS DE CLUBES DE PÁDEL POR PAÍS ===\n');
console.log(`Total de filas en el archivo: ${data.length}\n`);

// Mostrar las primeras filas para entender la estructura
console.log('Primeras 3 filas del archivo:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));
console.log('\n');

// Identificar la columna de país (puede tener diferentes nombres)
const firstRow = data[0];
const possibleCountryColumns = Object.keys(firstRow).filter(key =>
  key.toLowerCase().includes('pais') ||
  key.toLowerCase().includes('país') ||
  key.toLowerCase().includes('country') ||
  key.toLowerCase().includes('nation')
);

console.log('Columnas disponibles:', Object.keys(firstRow));
console.log('Posibles columnas de país encontradas:', possibleCountryColumns);
console.log('\n');

// Intentar encontrar la columna de país
let countryColumn = possibleCountryColumns[0];

// Si no se encuentra, buscar cualquier columna que contenga datos de países
if (!countryColumn) {
  // Buscar manualmente en todas las columnas
  for (const key of Object.keys(firstRow)) {
    console.log(`Analizando columna "${key}":`, firstRow[key]);
  }

  // Pedir al usuario que especifique la columna
  console.log('\nNo se pudo identificar automáticamente la columna de país.');
  console.log('Por favor, revisa las columnas anteriores y especifica cuál contiene el país.');
} else {
  // Contar clubes por país
  const clubesPorPais = {};

  data.forEach(row => {
    const pais = row[countryColumn];
    if (pais) {
      const paisNormalizado = String(pais).trim();
      if (paisNormalizado) {
        clubesPorPais[paisNormalizado] = (clubesPorPais[paisNormalizado] || 0) + 1;
      }
    }
  });

  // Ordenar por número de clubes (descendente)
  const paisesOrdenados = Object.entries(clubesPorPais)
    .sort((a, b) => b[1] - a[1]);

  console.log(`\n=== CLUBES POR PAÍS (usando columna: "${countryColumn}") ===\n`);

  let totalClubes = 0;
  paisesOrdenados.forEach(([pais, cantidad], index) => {
    console.log(`${index + 1}. ${pais}: ${cantidad} clubes`);
    totalClubes += cantidad;
  });

  console.log(`\n--- RESUMEN ---`);
  console.log(`Total de países: ${paisesOrdenados.length}`);
  console.log(`Total de clubes: ${totalClubes}`);
  console.log(`\nTop 5 países con más clubes:`);
  paisesOrdenados.slice(0, 5).forEach(([pais, cantidad], index) => {
    const porcentaje = ((cantidad / totalClubes) * 100).toFixed(2);
    console.log(`${index + 1}. ${pais}: ${cantidad} (${porcentaje}%)`);
  });
}
