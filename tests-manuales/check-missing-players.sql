-- Script para verificar jugadores faltantes en Wild Padel Indoor
-- Club ID: a994e74e-0a7f-4721-8c0f-e23100a01614

-- Primero, crear una tabla temporal con todos los nombres de la lista
WITH lista_jugadores AS (
  SELECT nombre FROM (VALUES
    -- CLASE SUELTA JC - LUNES 16H
    ('Francis Fdez'),
    ('Moises Barrio'),
    ('Jaume Sánchez'),
    ('Fernando Gómez'),
    ('Victor Carrillo'),
    ('Antonio Jiménez'),
    ('Rafa Prada'),
    ('Ángel Rubio'),
    -- LUNES 17:30H
    ('Lucía Chacón'),
    ('Blanca Martín'),
    ('María Martín'),
    ('María Rodríguez'),
    -- LUNES 18:30H
    ('Anne Escribano'),
    ('Carmen Rus'),
    ('Raúl Álvarez'),
    ('Leda Jiménez'),
    ('Adrián Coronado'),
    ('Ismael Rodríguez'),
    ('María de la O'),
    ('Grazie'),
    -- LUNES 20H
    ('Carlos Vinuesa'),
    ('Carlos Wild'),
    ('Bartolome'),
    ('Ale Encuentra'),
    ('Ricardo Aguilar'),
    ('Carlos Arena'),
    ('Miguel Ramos'),
    ('Javi Miranda'),
    -- MARTES 16H
    ('David Mudarra'),
    ('Martín González'),
    ('Carrillo Junior'),
    ('Pepe Alcantara'),
    -- MARTES 17H
    ('Pedro Murube'),
    ('M. Melguizo'),
    ('Manue Sibara'),
    ('Rafa Mata'),
    ('Iñaki Luna'),
    ('Juan Armenteros'),
    ('Fran Cardenas'),
    ('Juanjo Solís'),
    -- MARTES 18:30H
    ('Alberto Prieto'),
    ('Manu Portillo'),
    ('Juan Hermoso'),
    ('Carlos Salguero'),
    ('Miguel Rey'),
    ('Juan Rodríguez'),
    ('Mario Mateos'),
    ('Fran Terceños'),
    -- MARTES 20H
    ('Pablo Fariñas'),
    ('Luis M. Escudero'),
    ('Jose Albarreal'),
    ('Manu Ameal'),
    ('Cristian González'),
    ('Fernando Ruiz'),
    ('Manuel Polo'),
    ('Pepe Díaz'),
    -- MIERCOLES 17H
    ('Antonio Bravo'),
    ('Martín Ponce'),
    ('Pepe Martínez'),
    ('Juan Escudero'),
    ('Pablo Falcón'),
    ('Juan Bosco'),
    -- MIERCOLES 18H
    ('Fran Pazos'),
    ('Julia Ortega'),
    ('Isa Vinuesa'),
    ('Carmen Tamayo'),
    -- MIERCOLES 19H
    ('David Cerrada'),
    ('Daniel Galán'),
    ('Anle'),
    -- MIERCOLES 20H
    ('Fran Cardona'),
    ('Iván Suárez'),
    ('J. A. Melguizo'),
    ('Pablo Vázquez'),
    ('Javi Delgado'),
    ('Manu García'),
    ('Javi Vázquez'),
    ('Fran Velasco'),
    -- JUEVES 17H
    ('Jose Barragán'),
    ('Ale Morales'),
    ('Manuel Jiménez'),
    ('Pablo Ale'),
    ('J. Luis lópez'),
    ('Gonzalo Lázaro'),
    -- JUEVES 18:30H
    ('Pablo Palma'),
    ('Jesús Parrilla'),
    ('Paloma Béjar'),
    ('Paco Espigares'),
    ('J.Carlos Rincón'),
    ('Jose María Pérez'),
    ('Antonio Trecastro'),
    ('Luis Morales'),
    -- JUEVES 20H
    ('Cristian Begines'),
    ('Javi Artés'),
    ('Marcos Ruiz'),
    ('Paco Pajuelo'),
    ('Gabi Torrano'),
    ('J. Carlos Sánchez'),
    ('Jorge Martínez'),
    ('Sergio Ávila'),
    -- CLASE SUELTA MANU - LUNES 17:30H
    ('Cinta Gamonal'),
    ('Enrique Montero'),
    ('Ana Zoraida'),
    ('Gonzalo Mejías'),
    -- LUNES 18:30H
    ('Samuel Pérez'),
    ('Anabel Pérez'),
    ('Alicia Afán'),
    -- LUNES 19:30H
    ('Francisco Díaz'),
    ('Leonardo Fdez'),
    ('Jose M. Rdez'),
    -- LUNES 20:30H
    ('Elías Chinchilla'),
    ('Vanesa Vizuete'),
    ('M. J. Zambrano'),
    ('Pablo Moral'),
    -- LUNES 21:30H
    ('Fran Madueño'),
    ('Raúl García'),
    ('Adrián Durán'),
    ('Ale Berna'),
    -- MARTES 16:30H
    ('Rodrigo Ávalos'),
    ('Adrián Solís'),
    ('Blanca González'),
    ('Álvaro Espigares'),
    ('Antonio Rdez'),
    -- MARTES 17:30H
    ('Jacobo B.'),
    ('Laura López'),
    ('Roberto Calero'),
    -- MARTES 18:30H
    ('Israel Martínez'),
    ('Samuel Nieto'),
    ('J. Carlos Gijosa'),
    -- MARTES 19:30H
    ('Pepa Férnandez'),
    ('Alia Romero'),
    ('Ana Valenzuela'),
    -- MARTES 20:30H
    ('M. A Márquez'),
    ('Manolo Rus'),
    ('Lucía Grillo'),
    ('J. Carlos Rdez'),
    -- MIERCOLES 18H
    ('Francisco Dorado'),
    ('Daniel Marín'),
    ('Carlos Jesús'),
    -- MIERCOLES 19H
    ('Noelia Murillo'),
    ('Nuria Vallejo'),
    ('Marta Moreno'),
    -- JUEVES 18:30H
    ('Espe lópez'),
    ('Rocío Moreno'),
    ('Elena Joya'),
    ('Jorge Piña'),
    -- JUEVES 19:30H
    ('Fernando Ponce'),
    ('Carlos Rodríguez'),
    ('Fernando Rod'),
    ('Jesús Rivera'),
    -- JUEVES 20:30H
    ('Daniel Jurado'),
    ('Jose María Varela'),
    ('Manuel Arm.'),
    ('Iván Mena'),
    -- CLASE SUELTA ALVARO - LUNES 17:30H
    ('Antonio Pedro'),
    ('Juanma Muñiz'),
    ('Lola Roldán'),
    ('Rafael Porras'),
    -- LUNES 21:30H
    ('Jose Riquelme'),
    ('Fernando Pardo'),
    ('Moisés Espinosa'),
    -- MARTES 16H
    ('Ruben Losada'),
    ('Adrian Losada'),
    ('Marcos Baca'),
    -- MARTES 21:30H
    ('Marta Lazaro'),
    ('Eva Pérez'),
    ('Miguel López'),
    ('Carmen Pérez'),
    -- MIERCOLES 10H
    ('Rubén Nuñez'),
    ('Eva García'),
    ('Carmen Xín'),
    -- MIERCOLES 11H
    ('Alfonso Yang'),
    ('Gustavo Olmedo'),
    ('Adrían Róldan'),
    -- MIERCOLES 12H
    ('Ildefonso'),
    ('Jose Delgado'),
    ('Jaime García'),
    -- MIERCOLES 18H
    ('Yaiza'),
    ('Valle Cesto'),
    -- MIERCOLES 19H
    ('Javi Leal'),
    ('Jose Jarana'),
    ('Ángel Rodríguez'),
    ('Manuel Palomo'),
    -- JUEVES 16H
    ('Alexis Santaella'),
    -- JUEVES 21:30H
    ('Antonio Ortega'),
    ('Noelia Fernández'),
    ('Claudia Sánchez'),
    ('Antonio Abad')
  ) AS t(nombre)
),

-- Obtener jugadores existentes en el club
jugadores_club AS (
  SELECT
    p.id,
    p.display_name,
    p.first_name,
    p.last_name,
    COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name)) as nombre_completo
  FROM profiles p
  INNER JOIN club_members cm ON cm.profile_id = p.id
  WHERE cm.club_id = 'a994e74e-0a7f-4721-8c0f-e23100a01614'
)

-- Buscar jugadores de la lista que NO están en el club
SELECT
  lj.nombre as "Jugador de la lista",
  CASE
    WHEN jc.id IS NULL THEN '❌ NO ENCONTRADO'
    ELSE '✅ Encontrado como: ' || jc.nombre_completo
  END as "Estado"
FROM lista_jugadores lj
LEFT JOIN jugadores_club jc ON (
  -- Coincidencia exacta
  LOWER(jc.nombre_completo) = LOWER(lj.nombre)
  OR LOWER(jc.display_name) = LOWER(lj.nombre)
  -- O coincidencia parcial (el nombre de la lista está contenido en el nombre del club)
  OR LOWER(jc.nombre_completo) LIKE '%' || LOWER(lj.nombre) || '%'
  OR LOWER(lj.nombre) LIKE '%' || LOWER(COALESCE(jc.first_name, '')) || '%'
)
ORDER BY
  CASE WHEN jc.id IS NULL THEN 0 ELSE 1 END,
  lj.nombre;

-- También mostrar un resumen
/*
SELECT
  COUNT(*) FILTER (WHERE jc.id IS NULL) as "Jugadores NO encontrados",
  COUNT(*) FILTER (WHERE jc.id IS NOT NULL) as "Jugadores encontrados",
  COUNT(*) as "Total en lista"
FROM lista_jugadores lj
LEFT JOIN jugadores_club jc ON (
  LOWER(jc.nombre_completo) = LOWER(lj.nombre)
  OR LOWER(jc.display_name) = LOWER(lj.nombre)
  OR LOWER(jc.nombre_completo) LIKE '%' || LOWER(lj.nombre) || '%'
);
*/
