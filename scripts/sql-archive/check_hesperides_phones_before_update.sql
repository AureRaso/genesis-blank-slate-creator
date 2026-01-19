-- Verificar qué cambiaría ANTES de ejecutar el UPDATE
-- Club ID: 7b6f49ae-d496-407b-bca1-f5f1e9370610 (Hespérides Padel)

-- Ver estado actual en PROFILES
SELECT
  'PROFILES' as tabla,
  full_name,
  phone as telefono_actual,
  CASE full_name
    WHEN 'Adrián Cazalla Salvatierra' THEN '+34648471649'
    WHEN 'alejandra martin' THEN '+34676179732'
    WHEN 'Alejandro Fernández Fernández' THEN '+34676075103'
    WHEN 'Alejandro Rubio' THEN '+34673475732'
    WHEN 'Alfonso Varela' THEN '+34606157196'
    WHEN 'Andrea Raya Domínguez' THEN '+34638425035'
    WHEN 'Andres Diaz' THEN '+34680320946'
    WHEN 'Borja García Navarro' THEN '+34652235981'
    WHEN 'carlos fernandez morales' THEN '+34634973366'
    WHEN 'Carmen Sobrino Bermejo' THEN '+34680418631'
    WHEN 'Celia Carrero Villoria Mingo' THEN '+34619213707'
    WHEN 'cici nichole' THEN '+34627055097'
    WHEN 'Diana Requena-romero' THEN '+34661585119'
    WHEN 'Emma Martinez' THEN '+34681176920'
    WHEN 'Eugenia Lobo' THEN '+34635516176'
    WHEN 'Fátima R' THEN '+34620003335'
    WHEN 'Francisco Javier Lázaro Vicente' THEN '+34653123716'
    WHEN 'Gema Gavira Rubio' THEN '+34685440439'
    WHEN 'Irene Coca Garcia' THEN '+34696456952'
    WHEN 'Javier Gonzalez' THEN '+34697627864'
    WHEN 'Javier Rodriguez-Piñero Lopez' THEN '+34635537269'
    WHEN 'Joaquín mora fernandez' THEN '+34615129490'
    WHEN 'JOSE MARIA LOPEZ ROBLES' THEN '+34622150949'
    WHEN 'Juan Jose Abad Gómez' THEN '+34688921364'
    WHEN 'Julián Sánchez Gallardo' THEN '+34644327181'
    WHEN 'lucía caballero gonzález' THEN '+34630758451'
    WHEN 'Lucía García Granados' THEN '+34649562128'
    WHEN 'Mª Jesús García Gomez' THEN '+34639390459'
    WHEN 'manoli Rubio' THEN '+34639743466'
    WHEN 'Manuel Roman Valverde' THEN '+34619533905'
    WHEN 'María Canales Gómez' THEN '+34671433338'
    WHEN 'Maria Jimenez Delgado' THEN '+34627509222'
    WHEN 'María José Gálvez' THEN '+34666013210'
    WHEN 'Maria Jose Vizuete Alejandre' THEN '+34636725918'
    WHEN 'María Moya Vázquez' THEN '+34626031675'
    WHEN 'Mario Tejada Salas' THEN '+34615189600'
    WHEN 'Marta Medina Felizon' THEN '+34620860624'
    WHEN 'Marta Pedrera' THEN '+34685307955'
    WHEN 'Mercedes Garci-Varela Olea' THEN '+34605505976'
    WHEN 'Micaela Screpanti' THEN '+543711653550'
    WHEN 'Pablo mesa mesa' THEN '+34673021278'
    WHEN 'Pablo Nieto Bocanegra' THEN '+34618595997'
    WHEN 'Paula Gil Gracia' THEN '+34630945264'
    WHEN 'Paula Martin Lara' THEN '+34673695510'
    WHEN 'Pilar Marroyo' THEN '+34609470609'
    WHEN 'Pilar Sánchez Prada' THEN '+34661726270'
    WHEN 'Quique Machado Domínguez' THEN '+34606843816'
    WHEN 'Reyes García Domínguez' THEN '+34680458724'
    WHEN 'Rocío Iglesias Francés' THEN '+34672024691'
    WHEN 'sergio jimenez' THEN '+34684329447'
    WHEN 'Sergio López Serrano' THEN '+34666916135'
    WHEN 'Soledad perez' THEN '+34660267647'
    WHEN 'Sonia Garcia Hidalgo' THEN '+34667888126'
    WHEN 'Teresa querol quijada' THEN '+34671228906'
    WHEN 'Valeriano Amaya villar' THEN '+34651447892'
    WHEN 'victor pozo' THEN '+34651628880'
    ELSE phone
  END as telefono_nuevo,
  CASE
    WHEN phone IS NULL OR phone = '' THEN 'AGREGAR'
    WHEN phone != CASE full_name
      WHEN 'Adrián Cazalla Salvatierra' THEN '+34648471649'
      WHEN 'alejandra martin' THEN '+34676179732'
      WHEN 'Alejandro Fernández Fernández' THEN '+34676075103'
      WHEN 'Alejandro Rubio' THEN '+34673475732'
      WHEN 'Alfonso Varela' THEN '+34606157196'
      WHEN 'Andrea Raya Domínguez' THEN '+34638425035'
      WHEN 'Andres Diaz' THEN '+34680320946'
      WHEN 'Borja García Navarro' THEN '+34652235981'
      WHEN 'carlos fernandez morales' THEN '+34634973366'
      WHEN 'Carmen Sobrino Bermejo' THEN '+34680418631'
      WHEN 'Celia Carrero Villoria Mingo' THEN '+34619213707'
      WHEN 'cici nichole' THEN '+34627055097'
      WHEN 'Diana Requena-romero' THEN '+34661585119'
      WHEN 'Emma Martinez' THEN '+34681176920'
      WHEN 'Eugenia Lobo' THEN '+34635516176'
      WHEN 'Fátima R' THEN '+34620003335'
      WHEN 'Francisco Javier Lázaro Vicente' THEN '+34653123716'
      WHEN 'Gema Gavira Rubio' THEN '+34685440439'
      WHEN 'Irene Coca Garcia' THEN '+34696456952'
      WHEN 'Javier Gonzalez' THEN '+34697627864'
      WHEN 'Javier Rodriguez-Piñero Lopez' THEN '+34635537269'
      WHEN 'Joaquín mora fernandez' THEN '+34615129490'
      WHEN 'JOSE MARIA LOPEZ ROBLES' THEN '+34622150949'
      WHEN 'Juan Jose Abad Gómez' THEN '+34688921364'
      WHEN 'Julián Sánchez Gallardo' THEN '+34644327181'
      WHEN 'lucía caballero gonzález' THEN '+34630758451'
      WHEN 'Lucía García Granados' THEN '+34649562128'
      WHEN 'Mª Jesús García Gomez' THEN '+34639390459'
      WHEN 'manoli Rubio' THEN '+34639743466'
      WHEN 'Manuel Roman Valverde' THEN '+34619533905'
      WHEN 'María Canales Gómez' THEN '+34671433338'
      WHEN 'Maria Jimenez Delgado' THEN '+34627509222'
      WHEN 'María José Gálvez' THEN '+34666013210'
      WHEN 'Maria Jose Vizuete Alejandre' THEN '+34636725918'
      WHEN 'María Moya Vázquez' THEN '+34626031675'
      WHEN 'Mario Tejada Salas' THEN '+34615189600'
      WHEN 'Marta Medina Felizon' THEN '+34620860624'
      WHEN 'Marta Pedrera' THEN '+34685307955'
      WHEN 'Mercedes Garci-Varela Olea' THEN '+34605505976'
      WHEN 'Micaela Screpanti' THEN '+543711653550'
      WHEN 'Pablo mesa mesa' THEN '+34673021278'
      WHEN 'Pablo Nieto Bocanegra' THEN '+34618595997'
      WHEN 'Paula Gil Gracia' THEN '+34630945264'
      WHEN 'Paula Martin Lara' THEN '+34673695510'
      WHEN 'Pilar Marroyo' THEN '+34609470609'
      WHEN 'Pilar Sánchez Prada' THEN '+34661726270'
      WHEN 'Quique Machado Domínguez' THEN '+34606843816'
      WHEN 'Reyes García Domínguez' THEN '+34680458724'
      WHEN 'Rocío Iglesias Francés' THEN '+34672024691'
      WHEN 'sergio jimenez' THEN '+34684329447'
      WHEN 'Sergio López Serrano' THEN '+34666916135'
      WHEN 'Soledad perez' THEN '+34660267647'
      WHEN 'Sonia Garcia Hidalgo' THEN '+34667888126'
      WHEN 'Teresa querol quijada' THEN '+34671228906'
      WHEN 'Valeriano Amaya villar' THEN '+34651447892'
      WHEN 'victor pozo' THEN '+34651628880'
      ELSE phone
    END THEN 'CAMBIAR'
    ELSE 'SIN CAMBIOS'
  END as accion
FROM profiles
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND full_name IN (
    'Adrián Cazalla Salvatierra',
    'alejandra martin',
    'Alejandro Fernández Fernández',
    'Alejandro Rubio',
    'Alfonso Varela',
    'Andrea Raya Domínguez',
    'Andres Diaz',
    'Borja García Navarro',
    'carlos fernandez morales',
    'Carmen Sobrino Bermejo',
    'Celia Carrero Villoria Mingo',
    'cici nichole',
    'Diana Requena-romero',
    'Emma Martinez',
    'Eugenia Lobo',
    'Fátima R',
    'Francisco Javier Lázaro Vicente',
    'Gema Gavira Rubio',
    'Irene Coca Garcia',
    'Javier Gonzalez',
    'Javier Rodriguez-Piñero Lopez',
    'Joaquín mora fernandez',
    'JOSE MARIA LOPEZ ROBLES',
    'Juan Jose Abad Gómez',
    'Julián Sánchez Gallardo',
    'lucía caballero gonzález',
    'Lucía García Granados',
    'Mª Jesús García Gomez',
    'manoli Rubio',
    'Manuel Roman Valverde',
    'María Canales Gómez',
    'Maria Jimenez Delgado',
    'María José Gálvez',
    'Maria Jose Vizuete Alejandre',
    'María Moya Vázquez',
    'Mario Tejada Salas',
    'Marta Medina Felizon',
    'Marta Pedrera',
    'Mercedes Garci-Varela Olea',
    'Micaela Screpanti',
    'Pablo mesa mesa',
    'Pablo Nieto Bocanegra',
    'Paula Gil Gracia',
    'Paula Martin Lara',
    'Pilar Marroyo',
    'Pilar Sánchez Prada',
    'Quique Machado Domínguez',
    'Reyes García Domínguez',
    'Rocío Iglesias Francés',
    'sergio jimenez',
    'Sergio López Serrano',
    'Soledad perez',
    'Sonia Garcia Hidalgo',
    'Teresa querol quijada',
    'Valeriano Amaya villar',
    'victor pozo'
  )

UNION ALL

-- Ver estado actual en STUDENT_ENROLLMENTS
SELECT
  'STUDENT_ENROLLMENTS' as tabla,
  p.full_name,
  se.phone as telefono_actual,
  CASE p.full_name
    WHEN 'Adrián Cazalla Salvatierra' THEN '+34648471649'
    WHEN 'alejandra martin' THEN '+34676179732'
    WHEN 'Alejandro Fernández Fernández' THEN '+34676075103'
    WHEN 'Alejandro Rubio' THEN '+34673475732'
    WHEN 'Alfonso Varela' THEN '+34606157196'
    WHEN 'Andrea Raya Domínguez' THEN '+34638425035'
    WHEN 'Andres Diaz' THEN '+34680320946'
    WHEN 'Borja García Navarro' THEN '+34652235981'
    WHEN 'carlos fernandez morales' THEN '+34634973366'
    WHEN 'Carmen Sobrino Bermejo' THEN '+34680418631'
    WHEN 'Celia Carrero Villoria Mingo' THEN '+34619213707'
    WHEN 'cici nichole' THEN '+34627055097'
    WHEN 'Diana Requena-romero' THEN '+34661585119'
    WHEN 'Emma Martinez' THEN '+34681176920'
    WHEN 'Eugenia Lobo' THEN '+34635516176'
    WHEN 'Fátima R' THEN '+34620003335'
    WHEN 'Francisco Javier Lázaro Vicente' THEN '+34653123716'
    WHEN 'Gema Gavira Rubio' THEN '+34685440439'
    WHEN 'Irene Coca Garcia' THEN '+34696456952'
    WHEN 'Javier Gonzalez' THEN '+34697627864'
    WHEN 'Javier Rodriguez-Piñero Lopez' THEN '+34635537269'
    WHEN 'Joaquín mora fernandez' THEN '+34615129490'
    WHEN 'JOSE MARIA LOPEZ ROBLES' THEN '+34622150949'
    WHEN 'Juan Jose Abad Gómez' THEN '+34688921364'
    WHEN 'Julián Sánchez Gallardo' THEN '+34644327181'
    WHEN 'lucía caballero gonzález' THEN '+34630758451'
    WHEN 'Lucía García Granados' THEN '+34649562128'
    WHEN 'Mª Jesús García Gomez' THEN '+34639390459'
    WHEN 'manoli Rubio' THEN '+34639743466'
    WHEN 'Manuel Roman Valverde' THEN '+34619533905'
    WHEN 'María Canales Gómez' THEN '+34671433338'
    WHEN 'Maria Jimenez Delgado' THEN '+34627509222'
    WHEN 'María José Gálvez' THEN '+34666013210'
    WHEN 'Maria Jose Vizuete Alejandre' THEN '+34636725918'
    WHEN 'María Moya Vázquez' THEN '+34626031675'
    WHEN 'Mario Tejada Salas' THEN '+34615189600'
    WHEN 'Marta Medina Felizon' THEN '+34620860624'
    WHEN 'Marta Pedrera' THEN '+34685307955'
    WHEN 'Mercedes Garci-Varela Olea' THEN '+34605505976'
    WHEN 'Micaela Screpanti' THEN '+543711653550'
    WHEN 'Pablo mesa mesa' THEN '+34673021278'
    WHEN 'Pablo Nieto Bocanegra' THEN '+34618595997'
    WHEN 'Paula Gil Gracia' THEN '+34630945264'
    WHEN 'Paula Martin Lara' THEN '+34673695510'
    WHEN 'Pilar Marroyo' THEN '+34609470609'
    WHEN 'Pilar Sánchez Prada' THEN '+34661726270'
    WHEN 'Quique Machado Domínguez' THEN '+34606843816'
    WHEN 'Reyes García Domínguez' THEN '+34680458724'
    WHEN 'Rocío Iglesias Francés' THEN '+34672024691'
    WHEN 'sergio jimenez' THEN '+34684329447'
    WHEN 'Sergio López Serrano' THEN '+34666916135'
    WHEN 'Soledad perez' THEN '+34660267647'
    WHEN 'Sonia Garcia Hidalgo' THEN '+34667888126'
    WHEN 'Teresa querol quijada' THEN '+34671228906'
    WHEN 'Valeriano Amaya villar' THEN '+34651447892'
    WHEN 'victor pozo' THEN '+34651628880'
    ELSE se.phone
  END as telefono_nuevo,
  CASE
    WHEN se.phone IS NULL OR se.phone = '' THEN 'AGREGAR'
    WHEN se.phone != CASE p.full_name
      WHEN 'Adrián Cazalla Salvatierra' THEN '+34648471649'
      WHEN 'alejandra martin' THEN '+34676179732'
      WHEN 'Alejandro Fernández Fernández' THEN '+34676075103'
      WHEN 'Alejandro Rubio' THEN '+34673475732'
      WHEN 'Alfonso Varela' THEN '+34606157196'
      WHEN 'Andrea Raya Domínguez' THEN '+34638425035'
      WHEN 'Andres Diaz' THEN '+34680320946'
      WHEN 'Borja García Navarro' THEN '+34652235981'
      WHEN 'carlos fernandez morales' THEN '+34634973366'
      WHEN 'Carmen Sobrino Bermejo' THEN '+34680418631'
      WHEN 'Celia Carrero Villoria Mingo' THEN '+34619213707'
      WHEN 'cici nichole' THEN '+34627055097'
      WHEN 'Diana Requena-romero' THEN '+34661585119'
      WHEN 'Emma Martinez' THEN '+34681176920'
      WHEN 'Eugenia Lobo' THEN '+34635516176'
      WHEN 'Fátima R' THEN '+34620003335'
      WHEN 'Francisco Javier Lázaro Vicente' THEN '+34653123716'
      WHEN 'Gema Gavira Rubio' THEN '+34685440439'
      WHEN 'Irene Coca Garcia' THEN '+34696456952'
      WHEN 'Javier Gonzalez' THEN '+34697627864'
      WHEN 'Javier Rodriguez-Piñero Lopez' THEN '+34635537269'
      WHEN 'Joaquín mora fernandez' THEN '+34615129490'
      WHEN 'JOSE MARIA LOPEZ ROBLES' THEN '+34622150949'
      WHEN 'Juan Jose Abad Gómez' THEN '+34688921364'
      WHEN 'Julián Sánchez Gallardo' THEN '+34644327181'
      WHEN 'lucía caballero gonzález' THEN '+34630758451'
      WHEN 'Lucía García Granados' THEN '+34649562128'
      WHEN 'Mª Jesús García Gomez' THEN '+34639390459'
      WHEN 'manoli Rubio' THEN '+34639743466'
      WHEN 'Manuel Roman Valverde' THEN '+34619533905'
      WHEN 'María Canales Gómez' THEN '+34671433338'
      WHEN 'Maria Jimenez Delgado' THEN '+34627509222'
      WHEN 'María José Gálvez' THEN '+34666013210'
      WHEN 'Maria Jose Vizuete Alejandre' THEN '+34636725918'
      WHEN 'María Moya Vázquez' THEN '+34626031675'
      WHEN 'Mario Tejada Salas' THEN '+34615189600'
      WHEN 'Marta Medina Felizon' THEN '+34620860624'
      WHEN 'Marta Pedrera' THEN '+34685307955'
      WHEN 'Mercedes Garci-Varela Olea' THEN '+34605505976'
      WHEN 'Micaela Screpanti' THEN '+543711653550'
      WHEN 'Pablo mesa mesa' THEN '+34673021278'
      WHEN 'Pablo Nieto Bocanegra' THEN '+34618595997'
      WHEN 'Paula Gil Gracia' THEN '+34630945264'
      WHEN 'Paula Martin Lara' THEN '+34673695510'
      WHEN 'Pilar Marroyo' THEN '+34609470609'
      WHEN 'Pilar Sánchez Prada' THEN '+34661726270'
      WHEN 'Quique Machado Domínguez' THEN '+34606843816'
      WHEN 'Reyes García Domínguez' THEN '+34680458724'
      WHEN 'Rocío Iglesias Francés' THEN '+34672024691'
      WHEN 'sergio jimenez' THEN '+34684329447'
      WHEN 'Sergio López Serrano' THEN '+34666916135'
      WHEN 'Soledad perez' THEN '+34660267647'
      WHEN 'Sonia Garcia Hidalgo' THEN '+34667888126'
      WHEN 'Teresa querol quijada' THEN '+34671228906'
      WHEN 'Valeriano Amaya villar' THEN '+34651447892'
      WHEN 'victor pozo' THEN '+34651628880'
      ELSE se.phone
    END THEN 'CAMBIAR'
    ELSE 'SIN CAMBIOS'
  END as accion
FROM student_enrollments se
JOIN profiles p ON p.id = se.student_profile_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND p.full_name IN (
    'Adrián Cazalla Salvatierra',
    'alejandra martin',
    'Alejandro Fernández Fernández',
    'Alejandro Rubio',
    'Alfonso Varela',
    'Andrea Raya Domínguez',
    'Andres Diaz',
    'Borja García Navarro',
    'carlos fernandez morales',
    'Carmen Sobrino Bermejo',
    'Celia Carrero Villoria Mingo',
    'cici nichole',
    'Diana Requena-romero',
    'Emma Martinez',
    'Eugenia Lobo',
    'Fátima R',
    'Francisco Javier Lázaro Vicente',
    'Gema Gavira Rubio',
    'Irene Coca Garcia',
    'Javier Gonzalez',
    'Javier Rodriguez-Piñero Lopez',
    'Joaquín mora fernandez',
    'JOSE MARIA LOPEZ ROBLES',
    'Juan Jose Abad Gómez',
    'Julián Sánchez Gallardo',
    'lucía caballero gonzález',
    'Lucía García Granados',
    'Mª Jesús García Gomez',
    'manoli Rubio',
    'Manuel Roman Valverde',
    'María Canales Gómez',
    'Maria Jimenez Delgado',
    'María José Gálvez',
    'Maria Jose Vizuete Alejandre',
    'María Moya Vázquez',
    'Mario Tejada Salas',
    'Marta Medina Felizon',
    'Marta Pedrera',
    'Mercedes Garci-Varela Olea',
    'Micaela Screpanti',
    'Pablo mesa mesa',
    'Pablo Nieto Bocanegra',
    'Paula Gil Gracia',
    'Paula Martin Lara',
    'Pilar Marroyo',
    'Pilar Sánchez Prada',
    'Quique Machado Domínguez',
    'Reyes García Domínguez',
    'Rocío Iglesias Francés',
    'sergio jimenez',
    'Sergio López Serrano',
    'Soledad perez',
    'Sonia Garcia Hidalgo',
    'Teresa querol quijada',
    'Valeriano Amaya villar',
    'victor pozo'
  )
ORDER BY tabla, full_name;

-- Resumen de cambios
SELECT
  'RESUMEN' as tipo,
  COUNT(*) FILTER (WHERE accion = 'AGREGAR') as agregar,
  COUNT(*) FILTER (WHERE accion = 'CAMBIAR') as cambiar,
  COUNT(*) FILTER (WHERE accion = 'SIN CAMBIOS') as sin_cambios
FROM (
  SELECT
    CASE
      WHEN phone IS NULL OR phone = '' THEN 'AGREGAR'
      WHEN phone != CASE full_name
        WHEN 'Adrián Cazalla Salvatierra' THEN '+34648471649'
        WHEN 'alejandra martin' THEN '+34676179732'
        ELSE phone
      END THEN 'CAMBIAR'
      ELSE 'SIN CAMBIOS'
    END as accion
  FROM profiles
  WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
) subq;
