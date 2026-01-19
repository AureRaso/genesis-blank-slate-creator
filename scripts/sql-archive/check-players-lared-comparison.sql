-- Script para comparar jugadores de la lista con los registrados en La Red 21 Galisport
-- Muestra TODOS los jugadores y si están o no registrados (y con qué nombre)
-- Club ID: bbc10821-1c94-4b62-97ac-2fde0708cefd

WITH lista_jugadores AS (
  SELECT nombre,
         LOWER(REGEXP_REPLACE(nombre, '^.* ', '')) as apellido,
         LOWER(SPLIT_PART(nombre, ' ', 1)) as primer_nombre,
         LOWER(TRANSLATE(nombre, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) as nombre_sin_acentos
  FROM (VALUES
    ('Robert Tetas Casals'), ('Jaime Sacaluga'), ('Jose Maria Marquinez Garcia'), ('Javier Violadé Guerrero'),
    ('Manu Morillo'), ('Juan Soto Ybarra'), ('Angel Gonzalez'), ('Iñigo Vazquez Garcia'),
    ('Esther Pascual Leon'), ('Beatriz Caravaca de Ugarte'), ('Esther Martin Pérez'), ('Celia Zaccaro Salvador'),
    ('Antonio Dominguez Jimenez'), ('Ale Galera'), ('Antonio Calderon Sanchez'),
    ('Inés Medina'), ('Abel Zamora'), ('Jaime Genesca'),
    ('JC Camero'),
    ('Hani Ouatfeh'), ('Alfonso Gutierrez'),
    ('Jorge Alonso Villar'), ('Ramón Lara Mira'), ('Miguel Artacho Alcoba'),
    ('Jose Vicente Ortega'), ('Pablo Estrada Ayala'), ('Ale Trujillo'), ('Zenon Hurtado'),
    ('Miguel Anzola Perez'), ('Francisco Javier López Medinilla'),
    ('Mike Chang'), ('Luis Gil-Toresano'),
    ('Angela Muñiz Montes'), ('Lourdes Cabello Salazar'), ('Marilo Gonzalez Vasco'), ('María del Mar Cresis Dominguez'),
    ('Alfonso Marquez'), ('Ruben Alonso Flores'), ('Vicente Lopez'), ('Ignacio Moreno Dominguez'),
    ('Sara Algorri Ferrero'), ('Laura Caballos Lopez'), ('Jose Carlos Díaz Naranjo'), ('Vivi Ruiz'),
    ('Juan Alba'), ('JoseMa Diaz'), ('David Garcia Abad'), ('Luis Manuel Osorio Padilla'),
    ('Jose L Venero'), ('Laureano Millares'), ('Emilio de Sola'),
    ('Oscar Salas Lucarini'), ('Ale Casado'), ('Quini Carmona'),
    ('Carmen Gallango'), ('Patricia Perez Cejas'), ('Maite Escalante'), ('Sara Gonzalez'),
    ('Carmen Gonzalez Jimenez'), ('Merchi Pastor'), ('Aida Jimenez de la Calle'), ('Carmen Entrenas de la Haba'),
    ('Maria Gomez Lillo'), ('Rosa Jimenez Paz'), ('Angel Berzal Perez-Solano'),
    ('Ana Cuder'), ('Gloria Garcia Cabrera'), ('Julia Parejo Romero'), ('Else Sacaluga'),
    ('Espe GdT Rider'), ('Maru Jurado Cobreros'), ('MPaz Cabeza'),
    ('Fran Jimenez'), ('David Prieto Pascual'), ('Jose Maria Perales'),
    ('Enrique Cabral de la Corte'), ('José María Navarro Ortiz'), ('Ignacio Martinez'),
    ('Paula Levitskiy'), ('Maria Galan Calle'), ('Valeria Sorro'),
    ('Silvia Sanchez Araya'), ('Marga Hernandez Hermida')
  ) AS t(nombre)
),
estudiantes_club AS (
  SELECT
    full_name as nombre_original,
    LOWER(full_name) as nombre_completo,
    LOWER(TRANSLATE(full_name, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN')) as nombre_sin_acentos,
    LOWER(REGEXP_REPLACE(full_name, '^[^ ]+ ', '')) as apellidos
  FROM student_enrollments
  WHERE club_id = 'bbc10821-1c94-4b62-97ac-2fde0708cefd'
),
coincidencias AS (
  SELECT
    lj.nombre as nombre_lista,
    ec.nombre_original as nombre_registrado,
    CASE
      WHEN ec.nombre_sin_acentos = lj.nombre_sin_acentos THEN 'EXACTA'
      WHEN ec.nombre_sin_acentos ILIKE '%' || lj.nombre_sin_acentos || '%' THEN 'PARCIAL (lista en BD)'
      WHEN lj.nombre_sin_acentos ILIKE '%' || ec.nombre_sin_acentos || '%' THEN 'PARCIAL (BD en lista)'
      WHEN ec.apellidos ILIKE '%' || TRANSLATE(lj.apellido, 'áéíóúñ', 'aeioun') || '%'
           AND ec.nombre_completo ILIKE TRANSLATE(lj.primer_nombre, 'áéíóúñ', 'aeioun') || '%'
           THEN 'APELLIDO+NOMBRE'
      ELSE NULL
    END as tipo_coincidencia
  FROM lista_jugadores lj
  LEFT JOIN estudiantes_club ec ON (
    ec.nombre_sin_acentos = lj.nombre_sin_acentos
    OR ec.nombre_sin_acentos ILIKE '%' || lj.nombre_sin_acentos || '%'
    OR lj.nombre_sin_acentos ILIKE '%' || ec.nombre_sin_acentos || '%'
    OR (
      LENGTH(lj.apellido) > 2
      AND ec.apellidos ILIKE '%' || TRANSLATE(lj.apellido, 'áéíóúñ', 'aeioun') || '%'
      AND ec.nombre_completo ILIKE TRANSLATE(lj.primer_nombre, 'áéíóúñ', 'aeioun') || '%'
    )
  )
)

SELECT
  nombre_lista as "Nombre en Lista",
  COALESCE(nombre_registrado, '❌ NO REGISTRADO') as "Nombre en BD",
  COALESCE(tipo_coincidencia, '-') as "Tipo Coincidencia"
FROM coincidencias
ORDER BY
  CASE WHEN nombre_registrado IS NULL THEN 1 ELSE 0 END,
  nombre_lista;
