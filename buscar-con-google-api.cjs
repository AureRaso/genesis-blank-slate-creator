const https = require('https');
const fs = require('fs');

/**
 * BÚSQUEDA DE TELÉFONOS CON GOOGLE CUSTOM SEARCH API
 *
 * CONFIGURACIÓN REQUERIDA:
 * 1. Crear proyecto en Google Cloud Console: https://console.cloud.google.com/
 * 2. Habilitar Custom Search API
 * 3. Crear credenciales (API Key)
 * 4. Crear Custom Search Engine: https://programmablesearchengine.google.com/
 * 5. Configurar para buscar en toda la web
 * 6. Obtener el Search Engine ID (cx)
 *
 * LÍMITES GRATUITOS:
 * - 100 búsquedas por día GRATIS
 * - Después: $5 por cada 1000 búsquedas adicionales
 */

// ========== CONFIGURACIÓN ==========
const CONFIG = {
  // REEMPLAZA ESTOS VALORES CON TUS CREDENCIALES
  API_KEY: 'TU_API_KEY_AQUI',  // Obtener de Google Cloud Console
  SEARCH_ENGINE_ID: 'TU_SEARCH_ENGINE_ID_AQUI',  // Obtener de programmablesearchengine.google.com

  // Configuración de búsqueda
  DELAY_MS: 1000,  // Delay entre búsquedas (1 segundo)
  MAX_RESULTS_PER_SEARCH: 10,  // Número de resultados por búsqueda
  SAVE_PROGRESS_EVERY: 10  // Guardar progreso cada N clubes
};

// Lista completa de clubes
const clubes = [
  // ALMERÍA
  { club: "INDEPENDIENTE ALMERIA", provincia: "ALMERÍA", localidad: "" },
  { club: "C.D. NEXA", provincia: "ALMERÍA", localidad: "" },
  { club: "CLUB DE PADEL ALBOX", provincia: "ALMERÍA", localidad: "ALBOX" },
  { club: "C.D. LICEO SPORT CLUB", provincia: "ALMERÍA", localidad: "ALMERIA" },
  { club: "C.D. PROPADEL INDOOR CLUB", provincia: "ALMERÍA", localidad: "ALMERIA" },
  { club: "CLUB DE MAR DE ALMERIA", provincia: "ALMERÍA", localidad: "ALMERIA" },
  { club: "CLUB NATACION ALMERIA", provincia: "ALMERÍA", localidad: "ALMERIA" },
  { club: "C.D. PADEL INDOOR EL EJIDO", provincia: "ALMERÍA", localidad: "EL EJIDO" },
  { club: "C.D. CENTRO DEPORTIVO ROQUETAS DE MAR", provincia: "ALMERÍA", localidad: "ROQUETAS DEL MAR" },
  { club: "C.D. LA CUBIERTA PADEL", provincia: "ALMERÍA", localidad: "VICAR" },
  // CÁDIZ
  { club: "INDEPENDIENTE CADIZ", provincia: "CÁDIZ", localidad: "" },
  { club: "CLUB GLOBAL PADEL", provincia: "CÁDIZ", localidad: "" },
  { club: "PADELGADES INDOOR CLUB", provincia: "CÁDIZ", localidad: "" },
  { club: "R2 PADEL FITCLUB", provincia: "CÁDIZ", localidad: "CAMPAMENTO - SAN ROQUE" },
  { club: "CLUB PADEL TORNO CHICLANA INDOOR", provincia: "CÁDIZ", localidad: "CHICLANA" },
  { club: "CLUB DEPORTIVO FERCUM", provincia: "CÁDIZ", localidad: "CHICLANA DE LA FRONTERA" },
  { club: "CLUB TENIS LA BARROSA", provincia: "CÁDIZ", localidad: "CHICLANA DE LA FRONTERA" },
  { club: "C.D. PADEL VALDESPORT", provincia: "CÁDIZ", localidad: "EL PUERTO DE SANTA MARÍA" },
  { club: "CORNER4", provincia: "CÁDIZ", localidad: "JEREZ" },
  { club: "C.D. PÁDEL EXTREME", provincia: "CÁDIZ", localidad: "JEREZ DE LA FRONTERA" },
  { club: "CLUB DE PADEL JACARANDA", provincia: "CÁDIZ", localidad: "JEREZ DE LA FRONTERA" },
  { club: "CLUB DE PADEL MASPADEL XEREZ", provincia: "CÁDIZ", localidad: "JEREZ DE LA FRONTERA" },
  { club: "PADEL KD JEREZ", provincia: "CÁDIZ", localidad: "JEREZ DE LA FRONTERA" },
  { club: "C.D. LAS MARIAS", provincia: "CÁDIZ", localidad: "PTO.STA MARIA" },
  { club: "CLUB PADEL ROTA", provincia: "CÁDIZ", localidad: "ROTA" },
  { club: "C.D. CEFATED-REVEREND PEER", provincia: "CÁDIZ", localidad: "SAN FERNANDO" },
  { club: "SECCION DEPORTIVA CLUB LA SALINA", provincia: "CÁDIZ", localidad: "SAN FERNANDO" },
  { club: "REAL SOCIEDAD DE CARRERAS DE CABALLOS DE SANLÚCAR DE BARRAMEDA", provincia: "CÁDIZ", localidad: "SANLUCAR DE BDA." },
  { club: "CLUB DE PADEL DE UBRIQUE", provincia: "CÁDIZ", localidad: "UBRIQUE" },
  { club: "C.D. CEFATED-REVEREND PEER", provincia: "CÁDIZ", localidad: "SAN FERNANDO" },
  { club: "SECCION DEPORTIVA CLUB LA SALINA", provincia: "CÁDIZ", localidad: "SAN FERNANDO" },
  { club: "REAL SOCIEDAD DE CARRERAS DE CABALLOS DE SANLÚCAR DE BARRAMEDA", provincia: "CÁDIZ", localidad: "SANLUCAR DE BDA." },
  { club: "CLUB DE PADEL DE UBRIQUE", provincia: "CÁDIZ", localidad: "UBRIQUE" },
  // CÓRDOBA
  { club: "INDEPENDIENTE CORDOBA", provincia: "CÓRDOBA", localidad: "" },
  { club: "C.D. AMIGOS PADEL CORDOBA", provincia: "CÓRDOBA", localidad: "CORDOBA" },
  { club: "C.D. ARRUZAFA", provincia: "CÓRDOBA", localidad: "CORDOBA" },
  { club: "CLUB KHALIFA", provincia: "CÓRDOBA", localidad: "CORDOBA" },
  { club: "LA CATEDRAL DEL PADEL", provincia: "CÓRDOBA", localidad: "CORDOBA" },
  { club: "SEC.DPTVA. CLUB FIGUEROA", provincia: "CÓRDOBA", localidad: "CORDOBA" },
  { club: "YOU PLAY PADEL", provincia: "CÓRDOBA", localidad: "CORDOBA" },
  { club: "OPEN ARENA CORDOBA", provincia: "CÓRDOBA", localidad: "CÓRDOBA" },
  { club: "C.D. PADEL ALTO GUADALQUIVIR", provincia: "CÓRDOBA", localidad: "EL CARPIO" },
  { club: "C.D. RAQUETAS DE LUCENA", provincia: "CÓRDOBA", localidad: "LUCENA" },
  { club: "PADEL CLUB LUCENA", provincia: "CÓRDOBA", localidad: "LUCENA" },
  { club: "C.D. PADEL POZOBLANCO", provincia: "CÓRDOBA", localidad: "POZOBLANCO" },
  { club: "CLUB PADEL INDOOR PRIEGO", provincia: "CÓRDOBA", localidad: "PRIEGO DE CORDOBA" },
  // GRANADA
  { club: "CLUB DEPORTIVO PADEL ATARFE", provincia: "GRANADA", localidad: "" },
  { club: "INDEPENDIENTE GRANADA", provincia: "GRANADA", localidad: "" },
  { club: "C.D. A.D. DE TENIS TROVADOR", provincia: "GRANADA", localidad: "ALBOLOTE" },
  { club: "C.D. FEEL CENTER PADEL", provincia: "GRANADA", localidad: "ALBOLOTE" },
  { club: "C.D. PADEL TEAM ALMUÑECAR", provincia: "GRANADA", localidad: "ALMUÑECAR" },
  { club: "CLUB PADEL SPORT GRANADA INDOOR", provincia: "GRANADA", localidad: "ARMILLA" },
  { club: "C.D. ARENA PADEL GRANADA", provincia: "GRANADA", localidad: "ATARFE" },
  { club: "CLUB DEPORTIVO SUCA PÁDEL", provincia: "GRANADA", localidad: "ATARFE" },
  { club: "CLUB DEPORTIVO PADEL BAZA", provincia: "GRANADA", localidad: "BAZA" },
  { club: "CLUB DEPORTIVO FUTBOL SALA CASTRIL", provincia: "GRANADA", localidad: "castril" },
  { club: "C.D. CAMPUS PADEL CLUB GRANADA", provincia: "GRANADA", localidad: "GRANADA" },
  { club: "C.D. CULLAR VEGA BASE", provincia: "GRANADA", localidad: "Granada" },
  { club: "REAL SOCIEDAD DE TENIS GRANADA", provincia: "GRANADA", localidad: "GRANADA" },
  { club: "C.D. CARTUJA 13", provincia: "GRANADA", localidad: "LA ZUBIA" },
  { club: "C.D. Oxixares Club de Pádel", provincia: "GRANADA", localidad: "OGIJARES" },
  { club: "GEOPADEL", provincia: "GRANADA", localidad: "OGIJARES" },
  { club: "C. D. SOLO HAY PADEL", provincia: "GRANADA", localidad: "PELIGROS" },
  { club: "CLUB DEPORTIVO GRX PADEL", provincia: "GRANADA", localidad: "PELIGROS" },
  // HUELVA
  { club: "INDEPENDIENTE HUELVA", provincia: "HUELVA", localidad: "" },
  { club: "C.D. XELPADEL", provincia: "HUELVA", localidad: "" },
  { club: "C.D. G3 SPORT", provincia: "HUELVA", localidad: "ALJARAQUE" },
  { club: "CLUB DEPORTIVO LA MIYA DE ALJARAQUE", provincia: "HUELVA", localidad: "ALJARAQUE" },
  { club: "C.D. SUBE A LA RED", provincia: "HUELVA", localidad: "AYAMONTE" },
  { club: "C.D. PADEL 3 TOKES BONARES", provincia: "HUELVA", localidad: "BONARES" },
  { club: "C.D. PADEL CARTAYA", provincia: "HUELVA", localidad: "CARTAYA" },
  { club: "C.D. FREE PADEL HUELVA", provincia: "HUELVA", localidad: "HUELVA" },
  { club: "C.D. PÁDEL LA VOLEA", provincia: "HUELVA", localidad: "HUELVA" },
  { club: "CLUB DEPORTIVO PADEL INDOOR LA RIA", provincia: "HUELVA", localidad: "HUELVA" },
  { club: "C.D. DE PADEL LA HIGUERITA", provincia: "HUELVA", localidad: "ISLA CRISTINA" },
  { club: "CLUB DE PÁDEL PALOS DE LA FRONTERA", provincia: "HUELVA", localidad: "PALOS DE LA FRONTERA" },
  { club: "C.D. PADEL7 HUELVA", provincia: "HUELVA", localidad: "Polígono Pavipresa nave 29" },
  { club: "C.D. PÁDEL ROCIANA", provincia: "HUELVA", localidad: "ROCIANA DEL CONDADO" },
  // JAÉN
  { club: "INDEPENDIENTE JAEN", provincia: "JAEN", localidad: "" },
  { club: "CLUB DE PADEL ALCALA LA REAL", provincia: "JAEN", localidad: "ALCALA LA REAL" },
  { club: "C.D. FUENTE DEL REY", provincia: "JAEN", localidad: "ALCALÁ LA REAL" },
  { club: "PANY PADEL CLUB", provincia: "JAEN", localidad: "ALCALÁ LA REAL" },
  { club: "C.D. DE PADEL DE ALCAUDETE", provincia: "JAEN", localidad: "ALCAUDETE" },
  { club: "CLUB DE TENIS DEPORTIVO ISTURGI", provincia: "JAEN", localidad: "Andujar" },
  { club: "CLUB DE PÁDEL ANDÚJAR", provincia: "JAEN", localidad: "ANDÚJAR" },
  { club: "CLUB DEPORTIVO ARQUIPADEL ARQUILLOS", provincia: "JAEN", localidad: "Arquillos" },
  { club: "CLUB DEPORTIVO PADEL LOS PINOS", provincia: "JAEN", localidad: "ARROYO DEL OJANCO" },
  { club: "CLUB DEPORTIVO SHARK PADEL BAEZA", provincia: "JAEN", localidad: "BAEZA" },
  { club: "CLUB DEPORTIVO PADEL CHIC BAILÉN", provincia: "JAEN", localidad: "Bailén" },
  { club: "CLUB DE PADEL BEAS DE SEGURA", provincia: "JAEN", localidad: "Beas de Segura" },
  { club: "C.D. PADEL CANENA", provincia: "JAEN", localidad: "CANENA" },
  { club: "CLUB PADEL FUENSANTA X3", provincia: "JAEN", localidad: "Fuensanta de Martos" },
  { club: "CLUB DEPORTIVO DE PADEL GUARROMAN", provincia: "JAEN", localidad: "GUARROMAN" },
  { club: "C.D PADEL INDOOR JAEN", provincia: "JAEN", localidad: "JAEN" },
  { club: "C.D. PADELAKA", provincia: "JAEN", localidad: "JAEN" },
  { club: "C.D. PADELPREMIUM", provincia: "JAEN", localidad: "JAEN" },
  { club: "CLUB DE TENIS Y PADEL LA ESTACION", provincia: "JAEN", localidad: "LA CAROLINA" },
  { club: "CLUB PADEL LA CAROLINA", provincia: "JAEN", localidad: "LA CAROLINA" },
  { club: "CLUB DEPORTIVO MENTESA PÁDEL", provincia: "JAEN", localidad: "LA GUARDIA DE JAÉN" },
  { club: "C.D. PADEL-LINARES", provincia: "JAEN", localidad: "LINARES" },
  { club: "PADEL 5 LINARES", provincia: "JAEN", localidad: "LINARES" },
  { club: "C.D. PADEL LOS VILLARES", provincia: "JAEN", localidad: "LOS VILLARES" },
  { club: "C.D. IBERO PADEL PEAL DE BECERRO", provincia: "JAEN", localidad: "Peal de Becerro" },
  { club: "C.D.PADEL FUSION", provincia: "JAEN", localidad: "PEAL DE BECERRO" },
  { club: "C.D. PADEL LA VOLEA POZO ALCON", provincia: "JAEN", localidad: "POZO ALCON" },
  { club: "CLUB DEPORTIVO PADEL-TENIS SABIOTE", provincia: "JAEN", localidad: "SABIOTE" },
  { club: "CLUB DE PADEL SANTO TOMÉ", provincia: "JAEN", localidad: "SANTO TOMÉ" },
  { club: "CLUB DEPORTIVO PADEL TORREOLIVO", provincia: "JAEN", localidad: "TORREDELCAMPO" },
  { club: "CLUB DE PADEL SPORTGOLI", provincia: "JAEN", localidad: "TORREDONJIMENO" },
  { club: "C.D. PADEL CENTER UBEDA", provincia: "JAEN", localidad: "UBEDA" },
  { club: "C.D. VILLACARRILLO SMASHPADEL", provincia: "JAEN", localidad: "VILLACARRILLO" },
  { club: "C.D. VILLANUEVA PADEL CLUB", provincia: "JAEN", localidad: "VILLANUEVA DEL ARZOBISPO" },
  // MÁLAGA
  { club: "INDEPENDIENTE MALAGA", provincia: "MÁLAGA", localidad: "" },
  { club: "FAP - PISTAS MUNICIPALES FRANCIS CEBALLOS ALHAURIN DE LA TORRE", provincia: "MÁLAGA", localidad: "Alhaurin de la Torre" },
  { club: "Oxygen Pádel Club", provincia: "MÁLAGA", localidad: "" },
  { club: "VALS SPORT CHURRIANA", provincia: "MÁLAGA", localidad: "" },
  { club: "CLUB DE TENIS Y PÁDEL LA CAPELLANÍA", provincia: "MÁLAGA", localidad: "ALHAURIN DE LA TORRE" },
  { club: "CLUB PADEL LA QUINTA", provincia: "MÁLAGA", localidad: "ANTEQUERA" },
  { club: "CLUB DEPORTIVO LA DORMILONA BENAHAVIS", provincia: "MÁLAGA", localidad: "BENAHAVIS" },
  { club: "CLUB DEPORTIVO NARANJA PADEL", provincia: "MÁLAGA", localidad: "COIN" },
  { club: "CLUB DE PADEL ALHAMBRA DEL GOLF", provincia: "MÁLAGA", localidad: "ESTEPONA" },
  { club: "C.D. PADEL SOUL", provincia: "MÁLAGA", localidad: "FUENGIROLA" },
  { club: "C.D. PADEL SPORT MÁLAGA", provincia: "MÁLAGA", localidad: "MALAGA" },
  { club: "C.D. REAL CLUB EL CANDADO", provincia: "MÁLAGA", localidad: "MALAGA" },
  { club: "CLUB DE TENIS MÁLAGA", provincia: "MÁLAGA", localidad: "MALAGA" },
  { club: "CLUB DE TENIS, PADEL Y NATACION VALSPORT CONSUL", provincia: "MÁLAGA", localidad: "MALAGA" },
  { club: "CLUB DEPORTIVO CHAPARRAL GOLF-CLUB DE PADEL", provincia: "MÁLAGA", localidad: "MALAGA" },
  { club: "CLUB DEPORTIVO MASDEPADEL MALAGA", provincia: "MÁLAGA", localidad: "MALAGA" },
  { club: "FINURA PADEL & GYM MALAGA", provincia: "MÁLAGA", localidad: "MALAGA" },
  { club: "C.D. FANTASY PÁDEL", provincia: "MÁLAGA", localidad: "Málaga" },
  { club: "C.D. PADEL SPORT ANDALUCIA", provincia: "MÁLAGA", localidad: "Málaga" },
  { club: "C.D. MARBELLA MIRADOR", provincia: "MÁLAGA", localidad: "MARBELLA" },
  { club: "C.D. CERRADO DEL ÁGUILA", provincia: "MÁLAGA", localidad: "MIJAS" },
  { club: "C.D. RAQUETAS DE MIJAS", provincia: "MÁLAGA", localidad: "MIJAS" },
  { club: "C. D. NARIXA PADEL", provincia: "MÁLAGA", localidad: "NERJA" },
  { club: "C.D. AÑORETA GOLF", provincia: "MÁLAGA", localidad: "RINCÓN DE LA VICTORIA" },
  { club: "NUEVA ALCÁNTARA CLUB", provincia: "MÁLAGA", localidad: "SAN PEDRO DE ALCÁNTARA" },
  { club: "C.D. PÁDEL COSTA DEL SOL", provincia: "MÁLAGA", localidad: "VELEZ-MALAGA" },
  // SEVILLA
  { club: "INDEPENDIENTE SEVILLA", provincia: "SEVILLA", localidad: "" },
  { club: "C.D. OSUNA PÁDEL INDOOR", provincia: "SEVILLA", localidad: "" },
  { club: "C.D. PRODIGY LAND", provincia: "SEVILLA", localidad: "" },
  { club: "CD IRON PADEL", provincia: "SEVILLA", localidad: "" },
  { club: "CLUB DEPORTIVO SOCIETY PADEL", provincia: "SEVILLA", localidad: "" },
  { club: "SITING PADEL CLUB", provincia: "SEVILLA", localidad: "" },
  { club: "SEC. DPTVA. DEL CIRCULO MERCANTIL E INDUSTRIAL DE SEVILLA", provincia: "SEVILLA", localidad: "41011" },
  { club: "CLUB DE TENIS OROMANA", provincia: "SEVILLA", localidad: "ALCALA DE GUADAIRA" },
  { club: "REAL CLUB DE GOLF SEVILLA", provincia: "SEVILLA", localidad: "ALCALA DE GUADAIRA" },
  { club: "SEC. DPTVA. - SOLO PÁDEL SEVILLA S.L.", provincia: "SEVILLA", localidad: "ALCALA DE GUADAIRA" },
  { club: "CD LET´S PADEL", provincia: "SEVILLA", localidad: "ALCALÁ DE GUADAIRA" },
  { club: "CLUB DEPORTIVO ALPADEL", provincia: "SEVILLA", localidad: "BOLLULLOS DE LA MITACION (SEVILLA)" },
  { club: "C.D. CAMAS TENIS", provincia: "SEVILLA", localidad: "CAMAS" },
  { club: "C.D. PADEL FUENTE VIÑA", provincia: "SEVILLA", localidad: "CARMONA" },
  { club: "CLUB DE TENIS KARMO", provincia: "SEVILLA", localidad: "CARMONA" },
  { club: "C.D. PÁDEL NUEVA CASTILLEJA", provincia: "SEVILLA", localidad: "CASTILLEJA DE LA CUESTA" },
  { club: "C.D. CALLENTUM PADEL CLUB", provincia: "SEVILLA", localidad: "CAZALLA DE LA SIERRA" },
  { club: "C.D. PUNTO SUR", provincia: "SEVILLA", localidad: "CORIA DEL RIO" },
  { club: "CLUB DEPORTIVO LA MAGIA DEL PADEL", provincia: "SEVILLA", localidad: "CORIA DEL RIO" },
  { club: "C.D. CLUB DE CAMPO LA MOTILLA", provincia: "SEVILLA", localidad: "DOS HERMANAS" },
  { club: "C.D. OLIVAR DE QUINTO", provincia: "SEVILLA", localidad: "DOS HERMANAS" },
  { club: "C.D. PÁDEL DOS HERMANAS", provincia: "SEVILLA", localidad: "DOS HERMANAS" },
  { club: "C.D. VISTAZUL", provincia: "SEVILLA", localidad: "DOS HERMANAS" },
  { club: "CLUB DE PÁDEL INFINITY INDOOR", provincia: "SEVILLA", localidad: "DOS HERMANAS" },
  { club: "CLUB WILD PADEL", provincia: "SEVILLA", localidad: "DOS HERMANAS" },
  { club: "PADEL INDOOR ECIJA", provincia: "SEVILLA", localidad: "ECIJA" },
  { club: "C.D. EL SAUCEJO PADEL INDOOR", provincia: "SEVILLA", localidad: "EL SAUCEJO" },
  { club: "CLUB DE PÁDEL LOS ALCORES", provincia: "SEVILLA", localidad: "EL VISO DEL ALCOR" },
  { club: "C.D. ESPA SPORTS", provincia: "SEVILLA", localidad: "Espartinas" },
  { club: "C.D. PADEL PRIME", provincia: "SEVILLA", localidad: "ESPARTINAS" },
  { club: "CLUB DE TENIS Y PÁDEL BERNIER", provincia: "SEVILLA", localidad: "GELVES" },
  { club: "SIMON VERDE FAMILY SPORT CENTER", provincia: "SEVILLA", localidad: "GELVES" },
  { club: "CLUB DEPORTIVO OCIOSPORT BASICS", provincia: "SEVILLA", localidad: "GINES" },
  { club: "DEPORTES DE LA VEGA", provincia: "SEVILLA", localidad: "La Algaba" },
  { club: "PADEL CLUB AJPRO INDOOR LA CAMPANA", provincia: "SEVILLA", localidad: "LA CAMPANA" },
  { club: "C.D. PADEL INDOOR LA LUISIANA", provincia: "SEVILLA", localidad: "LA LUISIANA" },
  { club: "ASOCIACION CLUB DE CAMPO DE SEVILLA", provincia: "SEVILLA", localidad: "LA RINCONADA" },
  { club: "CLUB DE PADEL LANTEJUELA", provincia: "SEVILLA", localidad: "LANTEJUELA" },
  { club: "C.D. PADEL INDOOR LAS CABEZAS", provincia: "SEVILLA", localidad: "LAS CABEZAS" },
  { club: "CLUB DEPORTIVO LA MARTINA LEBRIJA", provincia: "SEVILLA", localidad: "LEBRIJA" },
  { club: "CLUB DEPORTIVO LEBRIJA", provincia: "SEVILLA", localidad: "LEBRIJA" },
  { club: "C.D. PÁDEL LOS PALACIOS", provincia: "SEVILLA", localidad: "LOS PALACIOS Y VFCA." },
  { club: "C.D. PADEL TOCINA-LOS ROSALES", provincia: "SEVILLA", localidad: "LOS ROSALES" },
  { club: "SECCION DEPORTIVA CLUB RIO GRANDE", provincia: "SEVILLA", localidad: "MAIRENA ALJARAFE" },
  { club: "C.D. ALCORES PADEL INDOOR", provincia: "SEVILLA", localidad: "MAIRENA DEL ALCOR" },
  { club: "C.D. LA RED XXI PADEL CENTER", provincia: "SEVILLA", localidad: "MAIRENA DEL ALJARAFE" },
  { club: "BLUEPADEL INDOOR", provincia: "SEVILLA", localidad: "PALOMARES DEL RIO" },
  { club: "C.D. PADEL TEAM ALJARAFE", provincia: "SEVILLA", localidad: "PALOMARES DEL RIO" },
  { club: "R2 CLUB DE PADEL ITALICA", provincia: "SEVILLA", localidad: "SALTERAS" },
  { club: "C.D. SANTANAS PÁDEL INDOORS CLUB", provincia: "SEVILLA", localidad: "SAN JOSE DE LA RINCONADA" },
  { club: "CLUB DE PADEL EL GORDILLO", provincia: "SEVILLA", localidad: "SAN JOSÉ DE LA RINCONADA" },
  { club: "LUCUS SOLIS PADEL", provincia: "SEVILLA", localidad: "SANLUCAR LA MAYOR" },
  { club: "C.D PANORAMIC PADEL CLUB", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. BERMEJALES II", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. C3 PÁDEL CLUB", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. GASTROPADEL", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. HÍSPALIS", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. LAYGO PÁDEL", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. LEONIDAS", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. MATCHPADEL", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. PÁDEL GUADALQUIVIR", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. SALESIANOS TRINIDAD", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. TABLADILLA", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D.TENIS PADEL SEVILLA", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "CLUB DE CORREDORES ATLAS", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "CLUB DE PADEL EL NEVERAZO", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "CLUB DE PÁDEL ICONICO SPORTS", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "CLUB DEPORTIVO @PADELPLUS", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "CLUB SANTA CLARA", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "DIEZXVEINTE", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "FAP - INSTALACIONES DE LA CARTUJA/E.P.G. TURISMO Y DEPORTE S.A.", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "REAL CIRCULO DE LABRADORES", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "REAL CLUB PINEDA DE SEVILLA", provincia: "SEVILLA", localidad: "SEVILLA" },
  { club: "C.D. READY UP", provincia: "SEVILLA", localidad: "Tomares" },
  { club: "C.D.A.D. ALJARAFE XXI", provincia: "SEVILLA", localidad: "TOMARES" },
  { club: "CLUB DE PÁDEL MOLINO HONDO", provincia: "SEVILLA", localidad: "UTRERA" },
  { club: "CLUB DE PÁDEL UTRERA", provincia: "SEVILLA", localidad: "UTRERA" }
];

// Función para extraer números de teléfono españoles
function extractPhoneNumbers(text) {
  if (!text) return [];

  const phones = new Set();
  const patterns = [
    /(\+34|0034)[\s]?[689]\d{2}[\s]?\d{2}[\s]?\d{2}[\s]?\d{2}/g,
    /[689]\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}/g,
    /[689]\d{8}/g
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

// Función para buscar con Google Custom Search API
function googleCustomSearch(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `/customsearch/v1?key=${CONFIG.API_KEY}&cx=${CONFIG.SEARCH_ENGINE_ID}&q=${encodedQuery}&num=${CONFIG.MAX_RESULTS_PER_SEARCH}`;

    const options = {
      hostname: 'www.googleapis.com',
      path: url,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error('Error parsing JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

// Función para buscar teléfono de un club
async function buscarTelefono(club, localidad, provincia) {
  try {
    // Construir query de búsqueda
    const searchTerms = [];
    searchTerms.push(club);
    if (localidad) searchTerms.push(localidad);
    searchTerms.push('teléfono');
    searchTerms.push('contacto');

    const query = searchTerms.join(' ');
    console.log(`  → Buscando: ${query}`);

    // Hacer búsqueda en Google
    const results = await googleCustomSearch(query);

    if (!results.items || results.items.length === 0) {
      console.log(`  ✗ No se encontraron resultados`);
      return {
        club,
        provincia,
        localidad,
        telefonos: '',
        url: '',
        snippet: '',
        estado: 'sin_resultados'
      };
    }

    // Buscar teléfonos en los snippets y títulos
    const allText = results.items.map(item =>
      `${item.title} ${item.snippet} ${item.formattedUrl}`
    ).join(' ');

    const telefonos = extractPhoneNumbers(allText);

    if (telefonos.length > 0) {
      console.log(`  ✓ Encontrados: ${telefonos.join(', ')}`);
      return {
        club,
        provincia,
        localidad,
        telefonos: telefonos.join(' / '),
        url: results.items[0].link,
        snippet: results.items[0].snippet,
        estado: 'encontrado'
      };
    } else {
      console.log(`  ⚠ Resultados encontrados pero sin teléfonos`);
      return {
        club,
        provincia,
        localidad,
        telefonos: '',
        url: results.items[0].link,
        snippet: results.items[0].snippet,
        estado: 'sin_telefono'
      };
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return {
      club,
      provincia,
      localidad,
      telefonos: '',
      url: '',
      snippet: '',
      estado: 'error: ' + error.message
    };
  }
}

// Función para guardar resultados
function guardarResultados(resultados, archivo = 'telefonos-clubes-google.csv') {
  const csv = ['Club,Provincia,Localidad,Telefonos,URL,Snippet,Estado'];
  resultados.forEach(r => {
    csv.push(`"${r.club}","${r.provincia}","${r.localidad}","${r.telefonos}","${r.url}","${r.snippet.replace(/"/g, '""')}","${r.estado}"`);
  });
  fs.writeFileSync(archivo, csv.join('\n'), 'utf8');
}

// Función principal
async function buscarTodosLosClubes() {
  console.log('\n' + '='.repeat(70));
  console.log('BÚSQUEDA DE TELÉFONOS CON GOOGLE CUSTOM SEARCH API');
  console.log('='.repeat(70) + '\n');

  // Verificar configuración
  if (CONFIG.API_KEY === 'TU_API_KEY_AQUI' || CONFIG.SEARCH_ENGINE_ID === 'TU_SEARCH_ENGINE_ID_AQUI') {
    console.error('❌ ERROR: Debes configurar API_KEY y SEARCH_ENGINE_ID primero\n');
    console.log('Instrucciones:');
    console.log('1. Ve a: https://console.cloud.google.com/');
    console.log('2. Crea un proyecto y habilita Custom Search API');
    console.log('3. Crea una API Key');
    console.log('4. Ve a: https://programmablesearchengine.google.com/');
    console.log('5. Crea un Search Engine y obtén el ID (cx)');
    console.log('6. Edita este archivo y reemplaza los valores en CONFIG\n');
    return;
  }

  console.log(`Total de clubes: ${clubes.length}`);
  console.log(`Límite diario gratuito: 100 búsquedas`);
  console.log(`Este script usará ${Math.min(clubes.length, 100)} búsquedas hoy\n`);

  const resultados = [];
  let procesados = 0;
  let encontrados = 0;

  for (const club of clubes) {
    // Límite de 100 búsquedas gratuitas por día
    if (procesados >= 100) {
      console.log('\n⚠️  LÍMITE DE 100 BÚSQUEDAS DIARIAS ALCANZADO');
      console.log('Para continuar, espera 24 horas o habilita facturación en Google Cloud\n');
      break;
    }

    procesados++;
    console.log(`\n[${procesados}/${Math.min(clubes.length, 100)}] ${club.club}`);

    try {
      const resultado = await buscarTelefono(club.club, club.localidad, club.provincia);
      resultados.push(resultado);

      if (resultado.estado === 'encontrado') {
        encontrados++;
      }

      // Guardar progreso periódicamente
      if (procesados % CONFIG.SAVE_PROGRESS_EVERY === 0) {
        guardarResultados(resultados);
        console.log(`\n--- Progreso guardado (${procesados}/${clubes.length}) ---`);
      }

      // Delay para respetar rate limits
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));

    } catch (error) {
      console.error(`Error: ${error.message}`);
      resultados.push({
        club: club.club,
        provincia: club.provincia,
        localidad: club.localidad,
        telefonos: '',
        url: '',
        snippet: '',
        estado: 'error: ' + error.message
      });
    }
  }

  // Guardar resultados finales
  guardarResultados(resultados);
  fs.writeFileSync('telefonos-clubes-google.json', JSON.stringify(resultados, null, 2), 'utf8');

  // Estadísticas
  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN FINAL');
  console.log('='.repeat(70));
  console.log(`✓ Clubes procesados: ${resultados.length}`);
  console.log(`✓ Teléfonos encontrados: ${encontrados} (${Math.round(encontrados/resultados.length*100)}%)`);
  console.log(`✓ Sin teléfono: ${resultados.filter(r => r.estado === 'sin_telefono').length}`);
  console.log(`✗ Sin resultados: ${resultados.filter(r => r.estado === 'sin_resultados').length}`);
  console.log(`✗ Errores: ${resultados.filter(r => r.estado.startsWith('error')).length}`);
  console.log(`\n✓ Archivos generados:`);
  console.log(`  - telefonos-clubes-google.csv`);
  console.log(`  - telefonos-clubes-google.json\n`);
}

// Ejecutar
buscarTodosLosClubes().catch(console.error);
