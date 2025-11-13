const fs = require('fs');
const https = require('https');

// Solo 5 clubes para prueba
const clubes = [
  { club: "CLUB DE MAR DE ALMERIA", provincia: "ALMERÍA", localidad: "ALMERIA" },
  { club: "CLUB NATACION ALMERIA", provincia: "ALMERÍA", localidad: "ALMERIA" },
  { club: "CLUB TENIS LA BARROSA", provincia: "CÁDIZ", localidad: "CHICLANA DE LA FRONTERA" },
  { club: "CLUB DE TENIS MÁLAGA", provincia: "MÁLAGA", localidad: "MALAGA" },
  { club: "REAL CLUB PINEDA DE SEVILLA", provincia: "SEVILLA", localidad: "SEVILLA" }
];

function extractPhoneNumbers(text) {
  const phones = new Set();
  const patterns = [
    /(\+34|0034)?\s*[689]\d{2}\s*\d{2}\s*\d{2}\s*\d{2}/g,
    /[689]\d{8}/g,
    /[689]\d{2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{2}/g
  ];

  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/[\s-]/g, '').replace(/^(\+34|0034)/, '');
        if (cleaned.length === 9 && cleaned.match(/^[689]/)) {
          phones.add(cleaned);
        }
      });
    }
  });

  return Array.from(phones);
}

function searchDuckDuckGo(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const options = {
      hostname: 'html.duckduckgo.com',
      path: `/html/?q=${encodedQuery}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function buscarTelefono(club, localidad, provincia) {
  try {
    const searchTerms = [];
    searchTerms.push(club.replace(/C\.D\.|CLUB|DEPORTIVO/gi, '').trim());
    if (localidad) searchTerms.push(localidad);
    searchTerms.push('telefono contacto');

    const query = searchTerms.join(' ');
    console.log(`  → Buscando: ${query}`);

    const html = await searchDuckDuckGo(query);
    const telefonos = extractPhoneNumbers(html);

    if (telefonos.length > 0) {
      console.log(`  ✓ Encontrados: ${telefonos.join(', ')}`);
      return {
        club: club,
        provincia: provincia,
        localidad: localidad,
        telefonos: telefonos.join(' / '),
        estado: 'encontrado'
      };
    } else {
      console.log(`  ✗ No encontrado`);
      return {
        club: club,
        provincia: provincia,
        localidad: localidad,
        telefonos: '',
        estado: 'no_encontrado'
      };
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return {
      club: club,
      provincia: provincia,
      localidad: localidad,
      telefonos: '',
      estado: 'error: ' + error.message
    };
  }
}

async function testBusqueda() {
  console.log('\n=== PRUEBA DE BÚSQUEDA DE TELÉFONOS ===\n');
  console.log(`Probando con ${clubes.length} clubes...\n`);

  const resultados = [];

  for (const club of clubes) {
    console.log(`\n[${resultados.length + 1}/${clubes.length}] ${club.club}`);
    const resultado = await buscarTelefono(club.club, club.localidad, club.provincia);
    resultados.push(resultado);

    // Delay para no saturar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n=== RESULTADOS ===\n');
  resultados.forEach((r, i) => {
    console.log(`${i+1}. ${r.club}`);
    console.log(`   Tel: ${r.telefonos || 'No encontrado'}`);
    console.log(`   Estado: ${r.estado}\n`);
  });

  const encontrados = resultados.filter(r => r.estado === 'encontrado').length;
  console.log(`\nEncontrados: ${encontrados}/${clubes.length}`);
}

testBusqueda().catch(console.error);
