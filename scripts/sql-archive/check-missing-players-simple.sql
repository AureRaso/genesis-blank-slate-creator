-- Script mejorado para ver jugadores que NO están en Wild Padel Indoor
-- Club ID: a994e74e-0a7f-4721-8c0f-e23100a01614
-- Busca coincidencias en: nombre completo, apellido y email

WITH lista_jugadores AS (
  SELECT nombre,
         -- Extraer apellido (última palabra del nombre)
         LOWER(REGEXP_REPLACE(nombre, '^.* ', '')) as apellido,
         -- Normalizar sin acentos para búsqueda
         LOWER(TRANSLATE(nombre, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) as nombre_sin_acentos
  FROM (VALUES
    ('Francis Fdez'), ('Moises Barrio'), ('Jaume Sánchez'), ('Fernando Gómez'),
    ('Victor Carrillo'), ('Antonio Jiménez'), ('Rafa Prada'), ('Ángel Rubio'),
    ('Lucía Chacón'), ('Blanca Martín'), ('María Martín'), ('María Rodríguez'),
    ('Anne Escribano'), ('Carmen Rus'), ('Raúl Álvarez'), ('Leda Jiménez'),
    ('Adrián Coronado'), ('Ismael Rodríguez'), ('María de la O'), ('Grazie'),
    ('Carlos Vinuesa'), ('Carlos Wild'), ('Bartolome'), ('Ale Encuentra'),
    ('Ricardo Aguilar'), ('Carlos Arena'), ('Miguel Ramos'), ('Javi Miranda'),
    ('David Mudarra'), ('Martín González'), ('Carrillo Junior'), ('Pepe Alcantara'),
    ('Pedro Murube'), ('M. Melguizo'), ('Manue Sibara'), ('Rafa Mata'),
    ('Iñaki Luna'), ('Juan Armenteros'), ('Fran Cardenas'), ('Juanjo Solís'),
    ('Alberto Prieto'), ('Manu Portillo'), ('Juan Hermoso'), ('Carlos Salguero'),
    ('Miguel Rey'), ('Juan Rodríguez'), ('Mario Mateos'), ('Fran Terceños'),
    ('Pablo Fariñas'), ('Luis M. Escudero'), ('Jose Albarreal'), ('Manu Ameal'),
    ('Cristian González'), ('Fernando Ruiz'), ('Manuel Polo'), ('Pepe Díaz'),
    ('Antonio Bravo'), ('Martín Ponce'), ('Pepe Martínez'), ('Juan Escudero'),
    ('Pablo Falcón'), ('Juan Bosco'), ('Fran Pazos'), ('Julia Ortega'),
    ('Isa Vinuesa'), ('Carmen Tamayo'), ('David Cerrada'), ('Daniel Galán'),
    ('Anle'), ('Fran Cardona'), ('Iván Suárez'), ('J. A. Melguizo'),
    ('Pablo Vázquez'), ('Javi Delgado'), ('Manu García'), ('Javi Vázquez'),
    ('Fran Velasco'), ('Jose Barragán'), ('Ale Morales'), ('Manuel Jiménez'),
    ('Pablo Ale'), ('J. Luis lópez'), ('Gonzalo Lázaro'), ('Pablo Palma'),
    ('Jesús Parrilla'), ('Paloma Béjar'), ('Paco Espigares'), ('J.Carlos Rincón'),
    ('Jose María Pérez'), ('Antonio Trecastro'), ('Luis Morales'), ('Cristian Begines'),
    ('Javi Artés'), ('Marcos Ruiz'), ('Paco Pajuelo'), ('Gabi Torrano'),
    ('J. Carlos Sánchez'), ('Jorge Martínez'), ('Sergio Ávila'), ('Cinta Gamonal'),
    ('Enrique Montero'), ('Ana Zoraida'), ('Gonzalo Mejías'), ('Samuel Pérez'),
    ('Anabel Pérez'), ('Alicia Afán'), ('Francisco Díaz'), ('Leonardo Fdez'),
    ('Jose M. Rdez'), ('Elías Chinchilla'), ('Vanesa Vizuete'), ('M. J. Zambrano'),
    ('Pablo Moral'), ('Fran Madueño'), ('Raúl García'), ('Adrián Durán'),
    ('Ale Berna'), ('Rodrigo Ávalos'), ('Adrián Solís'), ('Blanca González'),
    ('Álvaro Espigares'), ('Antonio Rdez'), ('Jacobo B.'), ('Laura López'),
    ('Roberto Calero'), ('Israel Martínez'), ('Samuel Nieto'), ('J. Carlos Gijosa'),
    ('Pepa Férnandez'), ('Alia Romero'), ('Ana Valenzuela'), ('M. A Márquez'),
    ('Manolo Rus'), ('Lucía Grillo'), ('J. Carlos Rdez'), ('Francisco Dorado'),
    ('Daniel Marín'), ('Carlos Jesús'), ('Noelia Murillo'), ('Nuria Vallejo'),
    ('Marta Moreno'), ('Espe lópez'), ('Rocío Moreno'), ('Elena Joya'),
    ('Jorge Piña'), ('Fernando Ponce'), ('Carlos Rodríguez'), ('Fernando Rod'),
    ('Jesús Rivera'), ('Daniel Jurado'), ('Jose María Varela'), ('Manuel Arm.'),
    ('Iván Mena'), ('Antonio Pedro'), ('Juanma Muñiz'), ('Lola Roldán'),
    ('Rafael Porras'), ('Jose Riquelme'), ('Fernando Pardo'), ('Moisés Espinosa'),
    ('Ruben Losada'), ('Adrian Losada'), ('Marcos Baca'), ('Marta Lazaro'),
    ('Eva Pérez'), ('Miguel López'), ('Carmen Pérez'), ('Rubén Nuñez'),
    ('Eva García'), ('Carmen Xín'), ('Alfonso Yang'), ('Gustavo Olmedo'),
    ('Adrían Róldan'), ('Ildefonso'), ('Jose Delgado'), ('Jaime García'),
    ('Yaiza'), ('Valle Cesto'), ('Javi Leal'), ('Jose Jarana'),
    ('Ángel Rodríguez'), ('Manuel Palomo'), ('Alexis Santaella'), ('Antonio Ortega'),
    ('Noelia Fernández'), ('Claudia Sánchez'), ('Antonio Abad')
  ) AS t(nombre)
),
estudiantes_club AS (
  SELECT
    LOWER(full_name) as nombre_completo,
    LOWER(TRANSLATE(full_name, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) as nombre_sin_acentos,
    LOWER(SPLIT_PART(email, '@', 1)) as email_usuario,
    -- Extraer apellido del nombre completo (segunda palabra o más)
    LOWER(REGEXP_REPLACE(full_name, '^[^ ]+ ', '')) as apellidos
  FROM student_enrollments
  WHERE club_id = 'a994e74e-0a7f-4721-8c0f-e23100a01614'
)

-- SOLO jugadores que NO están en el club (búsqueda mejorada)
SELECT lj.nombre as "Jugador que FALTA"
FROM lista_jugadores lj
WHERE NOT EXISTS (
  SELECT 1 FROM estudiantes_club ec
  WHERE
    -- Coincidencia en nombre completo
    ec.nombre_completo ILIKE '%' || lj.nombre || '%'
    OR lj.nombre ILIKE '%' || ec.nombre_completo || '%'
    -- Coincidencia sin acentos
    OR ec.nombre_sin_acentos ILIKE '%' || lj.nombre_sin_acentos || '%'
    OR lj.nombre_sin_acentos ILIKE '%' || ec.nombre_sin_acentos || '%'
    -- Coincidencia por apellido en email (ej: juanjosolis -> Juanjo Solís)
    OR (LENGTH(lj.apellido) > 3 AND ec.email_usuario ILIKE '%' || TRANSLATE(lj.apellido, 'áéíóúñ', 'aeioun') || '%')
    -- Coincidencia por apellido en nombre completo
    OR (LENGTH(lj.apellido) > 3 AND ec.apellidos ILIKE '%' || lj.apellido || '%')
    -- Buscar primera palabra del nombre en email
    OR ec.email_usuario ILIKE '%' || TRANSLATE(LOWER(SPLIT_PART(lj.nombre, ' ', 1)), 'áéíóúñ', 'aeioun') || '%'
)
ORDER BY lj.nombre;
