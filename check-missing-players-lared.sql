-- Script para ver jugadores que NO están en La Red 21 Galisport
-- Club ID: bbc10821-1c94-4b62-97ac-2fde0708cefd
-- Busca coincidencias ESTRICTAS en: nombre completo y apellidos

WITH lista_jugadores AS (
  SELECT nombre,
         -- Extraer apellido (última palabra del nombre)
         LOWER(REGEXP_REPLACE(nombre, '^.* ', '')) as apellido,
         -- Extraer primer nombre
         LOWER(SPLIT_PART(nombre, ' ', 1)) as primer_nombre,
         -- Normalizar sin acentos para búsqueda
         LOWER(TRANSLATE(nombre, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) as nombre_sin_acentos
  FROM (VALUES
    -- MARTES 9H
    ('Robert Tetas Casals'), ('Jaime Sacaluga'), ('Jose Maria Marquinez Garcia'), ('Javier Violadé Guerrero'),
    -- MIÉRCOLES 9H
    ('Manu Morillo'), ('Juan Soto Ybarra'), ('Angel Gonzalez'), ('Iñigo Vazquez Garcia'),
    -- JUEVES 9H
    ('Esther Pascual Leon'), ('Beatriz Caravaca de Ugarte'), ('Esther Martin Pérez'), ('Celia Zaccaro Salvador'),
    -- MARTES 10H
    ('Antonio Dominguez Jimenez'), ('Ale Galera'), ('Antonio Calderon Sanchez'),
    -- MIÉRCOLES 10H
    ('Inés Medina'), ('Abel Zamora'), ('Jaime Genesca'),
    -- MARTES 11H
    ('JC Camero'),
    -- LUNES 17H
    ('Hani Ouatfeh'), ('Alfonso Gutierrez'),
    -- MARTES 17H
    ('Jorge Alonso Villar'), ('Ramón Lara Mira'), ('Miguel Artacho Alcoba'),
    -- MIÉRCOLES 17H
    ('Jose Vicente Ortega'), ('Pablo Estrada Ayala'), ('Ale Trujillo'), ('Zenon Hurtado'),
    -- JUEVES 17H
    ('Miguel Anzola Perez'), ('Francisco Javier López Medinilla'),
    -- VIERNES 17H
    ('Mike Chang'), ('Luis Gil-Toresano'),
    -- LUNES 18H
    ('Angela Muñiz Montes'), ('Lourdes Cabello Salazar'), ('Marilo Gonzalez Vasco'), ('María del Mar Cresis Dominguez'),
    -- MARTES 18H
    ('Alfonso Marquez'), ('Ruben Alonso Flores'), ('Vicente Lopez'), ('Ignacio Moreno Dominguez'),
    -- JUEVES 18H
    ('Sara Algorri Ferrero'), ('Laura Caballos Lopez'), ('Jose Carlos Díaz Naranjo'), ('Vivi Ruiz'),
    -- LUNES 19H
    ('Juan Alba'), ('JoseMa Diaz'), ('David Garcia Abad'), ('Luis Manuel Osorio Padilla'),
    -- MARTES 19H
    ('Jose L Venero'), ('Laureano Millares'), ('Emilio de Sola'),
    -- MIÉRCOLES 19H
    ('Oscar Salas Lucarini'), ('Ale Casado'), ('Quini Carmona'),
    -- JUEVES 19H
    ('Carmen Gallango'), ('Patricia Perez Cejas'), ('Maite Escalante'), ('Sara Gonzalez'),
    -- LUNES 20H
    ('Carmen Gonzalez Jimenez'), ('Merchi Pastor'), ('Aida Jimenez de la Calle'), ('Carmen Entrenas de la Haba'),
    -- MARTES 20H
    ('Maria Gomez Lillo'), ('Rosa Jimenez Paz'), ('Angel Berzal Perez-Solano'),
    -- MIÉRCOLES 20H
    ('Ana Cuder'), ('Gloria Garcia Cabrera'), ('Julia Parejo Romero'), ('Else Sacaluga'),
    -- JUEVES 20H
    ('Espe GdT Rider'), ('Maru Jurado Cobreros'), ('MPaz Cabeza'),
    -- LUNES 21H
    ('Fran Jimenez'), ('David Prieto Pascual'), ('Jose Maria Perales'),
    -- MARTES 21H
    ('Enrique Cabral de la Corte'), ('José María Navarro Ortiz'), ('Ignacio Martinez'),
    -- MIÉRCOLES 21H
    ('Paula Levitskiy'), ('Maria Galan Calle'), ('Valeria Sorro'),
    -- JUEVES 21H
    ('Silvia Sanchez Araya'), ('Marga Hernandez Hermida')
  ) AS t(nombre)
),
estudiantes_club AS (
  SELECT
    LOWER(full_name) as nombre_completo,
    LOWER(TRANSLATE(full_name, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) as nombre_sin_acentos,
    LOWER(SPLIT_PART(email, '@', 1)) as email_usuario,
    LOWER(REGEXP_REPLACE(full_name, '^[^ ]+ ', '')) as apellidos
  FROM student_enrollments
  WHERE club_id = 'bbc10821-1c94-4b62-97ac-2fde0708cefd'
)

-- SOLO jugadores que NO están en el club (búsqueda más estricta)
SELECT lj.nombre as "Jugador que FALTA"
FROM lista_jugadores lj
WHERE NOT EXISTS (
  SELECT 1 FROM estudiantes_club ec
  WHERE
    -- Coincidencia exacta en nombre completo (sin acentos)
    ec.nombre_sin_acentos = lj.nombre_sin_acentos
    -- O coincidencia donde el nombre de la lista está contenido en el nombre del club
    OR ec.nombre_sin_acentos ILIKE '%' || lj.nombre_sin_acentos || '%'
    -- O coincidencia donde el nombre del club está contenido en el de la lista
    OR lj.nombre_sin_acentos ILIKE '%' || ec.nombre_sin_acentos || '%'
    -- Coincidencia por apellido Y primer nombre (ambos deben coincidir)
    OR (
      LENGTH(lj.apellido) > 2
      AND ec.apellidos ILIKE '%' || TRANSLATE(lj.apellido, 'áéíóúñ', 'aeioun') || '%'
      AND ec.nombre_completo ILIKE TRANSLATE(lj.primer_nombre, 'áéíóúñ', 'aeioun') || '%'
    )
)
ORDER BY lj.nombre;
