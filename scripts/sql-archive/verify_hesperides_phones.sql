-- Verificar si los teléfonos se actualizaron correctamente
-- Club ID: 7b6f49ae-d496-407b-bca1-f5f1e9370610 (Hespérides Padel)

-- Comparar teléfonos en PROFILES
SELECT
  'PROFILES' as tabla,
  full_name,
  phone as telefono_actual,
  CASE full_name
    WHEN 'Adrián Cazalla Salvatierra' THEN '648471649'
    WHEN 'alejandra martin' THEN '676179732'
    WHEN 'Alejandro Fernández Fernández' THEN '676075103'
    WHEN 'Alejandro Rubio' THEN '673475732'
    WHEN 'Alfonso Varela' THEN '606157196'
    WHEN 'Andrea Raya Domínguez' THEN '638425035'
    WHEN 'Andres Diaz' THEN '680320946'
    WHEN 'Borja García Navarro' THEN '652235981'
    WHEN 'carlos fernandez morales' THEN '634973366'
    WHEN 'Carmen Sobrino Bermejo' THEN '680418631'
    WHEN 'Celia Carrero Villoria Mingo' THEN '619213707'
    WHEN 'cici nichole' THEN '627055097'
    WHEN 'Diana Requena-romero' THEN '661585119'
    WHEN 'Emma Martinez' THEN '681176920'
    WHEN 'Eugenia Lobo' THEN '635516176'
    WHEN 'Fátima R' THEN '620003335'
    WHEN 'Francisco Javier Lázaro Vicente' THEN '653123716'
    WHEN 'Gema Gavira Rubio' THEN '685440439'
    WHEN 'Irene Coca Garcia' THEN '696456952'
    WHEN 'Javier Gonzalez' THEN '697627864'
    WHEN 'Javier Rodriguez-Piñero Lopez' THEN '635537269'
    WHEN 'Joaquín mora fernandez' THEN '615129490'
    WHEN 'JOSE MARIA LOPEZ ROBLES' THEN '622150949'
    WHEN 'Juan Jose Abad Gómez' THEN '688921364'
    WHEN 'Julián Sánchez Gallardo' THEN '644327181'
    WHEN 'lucía caballero gonzález' THEN '630758451'
    WHEN 'Lucía García Granados' THEN '649562128'
    WHEN 'Mª Jesús García Gomez' THEN '639390459'
    WHEN 'manoli Rubio' THEN '639743466'
    WHEN 'Manuel Roman Valverde' THEN '619533905'
    WHEN 'María Canales Gómez' THEN '671433338'
    WHEN 'Maria Jimenez Delgado' THEN '627509222'
    WHEN 'María José Gálvez' THEN '666013210'
    WHEN 'Maria Jose Vizuete Alejandre' THEN '636725918'
    WHEN 'María Moya Vázquez' THEN '626031675'
    WHEN 'Mario Tejada Salas' THEN '615189600'
    WHEN 'Marta Medina Felizon' THEN '620860624'
    WHEN 'Marta Pedrera' THEN '685307955'
    WHEN 'Mercedes Garci-Varela Olea' THEN '605505976'
    WHEN 'Micaela Screpanti' THEN '3711653550'
    WHEN 'Pablo mesa mesa' THEN '673021278'
    WHEN 'Pablo Nieto Bocanegra' THEN '618595997'
    WHEN 'Paula Gil Gracia' THEN '630945264'
    WHEN 'Paula Martin Lara' THEN '673695510'
    WHEN 'Pilar Marroyo' THEN '609470609'
    WHEN 'Pilar Sánchez Prada' THEN '661726270'
    WHEN 'Quique Machado Domínguez' THEN '606843816'
    WHEN 'Reyes García Domínguez' THEN '680458724'
    WHEN 'Rocío Iglesias Francés' THEN '672024691'
    WHEN 'sergio jimenez' THEN '684329447'
    WHEN 'Sergio López Serrano' THEN '666916135'
    WHEN 'Soledad perez' THEN '660267647'
    WHEN 'Sonia Garcia Hidalgo' THEN '667888126'
    WHEN 'Teresa querol quijada' THEN '671228906'
    WHEN 'Valeriano Amaya villar' THEN '651447892'
    WHEN 'victor pozo' THEN '651628880'
  END as telefono_esperado,
  CASE
    WHEN phone = CASE full_name
      WHEN 'Adrián Cazalla Salvatierra' THEN '648471649'
      WHEN 'alejandra martin' THEN '676179732'
      WHEN 'Alejandro Fernández Fernández' THEN '676075103'
      WHEN 'Alejandro Rubio' THEN '673475732'
      WHEN 'Alfonso Varela' THEN '606157196'
      WHEN 'Andrea Raya Domínguez' THEN '638425035'
      WHEN 'Andres Diaz' THEN '680320946'
      WHEN 'Borja García Navarro' THEN '652235981'
      WHEN 'carlos fernandez morales' THEN '634973366'
      WHEN 'Carmen Sobrino Bermejo' THEN '680418631'
      WHEN 'Celia Carrero Villoria Mingo' THEN '619213707'
      WHEN 'cici nichole' THEN '627055097'
      WHEN 'Diana Requena-romero' THEN '661585119'
      WHEN 'Emma Martinez' THEN '681176920'
      WHEN 'Eugenia Lobo' THEN '635516176'
      WHEN 'Fátima R' THEN '620003335'
      WHEN 'Francisco Javier Lázaro Vicente' THEN '653123716'
      WHEN 'Gema Gavira Rubio' THEN '685440439'
      WHEN 'Irene Coca Garcia' THEN '696456952'
      WHEN 'Javier Gonzalez' THEN '697627864'
      WHEN 'Javier Rodriguez-Piñero Lopez' THEN '635537269'
      WHEN 'Joaquín mora fernandez' THEN '615129490'
      WHEN 'JOSE MARIA LOPEZ ROBLES' THEN '622150949'
      WHEN 'Juan Jose Abad Gómez' THEN '688921364'
      WHEN 'Julián Sánchez Gallardo' THEN '644327181'
      WHEN 'lucía caballero gonzález' THEN '630758451'
      WHEN 'Lucía García Granados' THEN '649562128'
      WHEN 'Mª Jesús García Gomez' THEN '639390459'
      WHEN 'manoli Rubio' THEN '639743466'
      WHEN 'Manuel Roman Valverde' THEN '619533905'
      WHEN 'María Canales Gómez' THEN '671433338'
      WHEN 'Maria Jimenez Delgado' THEN '627509222'
      WHEN 'María José Gálvez' THEN '666013210'
      WHEN 'Maria Jose Vizuete Alejandre' THEN '636725918'
      WHEN 'María Moya Vázquez' THEN '626031675'
      WHEN 'Mario Tejada Salas' THEN '615189600'
      WHEN 'Marta Medina Felizon' THEN '620860624'
      WHEN 'Marta Pedrera' THEN '685307955'
      WHEN 'Mercedes Garci-Varela Olea' THEN '605505976'
      WHEN 'Micaela Screpanti' THEN '3711653550'
      WHEN 'Pablo mesa mesa' THEN '673021278'
      WHEN 'Pablo Nieto Bocanegra' THEN '618595997'
      WHEN 'Paula Gil Gracia' THEN '630945264'
      WHEN 'Paula Martin Lara' THEN '673695510'
      WHEN 'Pilar Marroyo' THEN '609470609'
      WHEN 'Pilar Sánchez Prada' THEN '661726270'
      WHEN 'Quique Machado Domínguez' THEN '606843816'
      WHEN 'Reyes García Domínguez' THEN '680458724'
      WHEN 'Rocío Iglesias Francés' THEN '672024691'
      WHEN 'sergio jimenez' THEN '684329447'
      WHEN 'Sergio López Serrano' THEN '666916135'
      WHEN 'Soledad perez' THEN '660267647'
      WHEN 'Sonia Garcia Hidalgo' THEN '667888126'
      WHEN 'Teresa querol quijada' THEN '671228906'
      WHEN 'Valeriano Amaya villar' THEN '651447892'
      WHEN 'victor pozo' THEN '651628880'
    END THEN '✓ CORRECTO'
    ELSE '✗ INCORRECTO'
  END as estado
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

-- Comparar teléfonos en STUDENT_ENROLLMENTS
SELECT
  'STUDENT_ENROLLMENTS' as tabla,
  p.full_name,
  se.phone as telefono_actual,
  CASE p.full_name
    WHEN 'Adrián Cazalla Salvatierra' THEN '648471649'
    WHEN 'alejandra martin' THEN '676179732'
    WHEN 'Alejandro Fernández Fernández' THEN '676075103'
    WHEN 'Alejandro Rubio' THEN '673475732'
    WHEN 'Alfonso Varela' THEN '606157196'
    WHEN 'Andrea Raya Domínguez' THEN '638425035'
    WHEN 'Andres Diaz' THEN '680320946'
    WHEN 'Borja García Navarro' THEN '652235981'
    WHEN 'carlos fernandez morales' THEN '634973366'
    WHEN 'Carmen Sobrino Bermejo' THEN '680418631'
    WHEN 'Celia Carrero Villoria Mingo' THEN '619213707'
    WHEN 'cici nichole' THEN '627055097'
    WHEN 'Diana Requena-romero' THEN '661585119'
    WHEN 'Emma Martinez' THEN '681176920'
    WHEN 'Eugenia Lobo' THEN '635516176'
    WHEN 'Fátima R' THEN '620003335'
    WHEN 'Francisco Javier Lázaro Vicente' THEN '653123716'
    WHEN 'Gema Gavira Rubio' THEN '685440439'
    WHEN 'Irene Coca Garcia' THEN '696456952'
    WHEN 'Javier Gonzalez' THEN '697627864'
    WHEN 'Javier Rodriguez-Piñero Lopez' THEN '635537269'
    WHEN 'Joaquín mora fernandez' THEN '615129490'
    WHEN 'JOSE MARIA LOPEZ ROBLES' THEN '622150949'
    WHEN 'Juan Jose Abad Gómez' THEN '688921364'
    WHEN 'Julián Sánchez Gallardo' THEN '644327181'
    WHEN 'lucía caballero gonzález' THEN '630758451'
    WHEN 'Lucía García Granados' THEN '649562128'
    WHEN 'Mª Jesús García Gomez' THEN '639390459'
    WHEN 'manoli Rubio' THEN '639743466'
    WHEN 'Manuel Roman Valverde' THEN '619533905'
    WHEN 'María Canales Gómez' THEN '671433338'
    WHEN 'Maria Jimenez Delgado' THEN '627509222'
    WHEN 'María José Gálvez' THEN '666013210'
    WHEN 'Maria Jose Vizuete Alejandre' THEN '636725918'
    WHEN 'María Moya Vázquez' THEN '626031675'
    WHEN 'Mario Tejada Salas' THEN '615189600'
    WHEN 'Marta Medina Felizon' THEN '620860624'
    WHEN 'Marta Pedrera' THEN '685307955'
    WHEN 'Mercedes Garci-Varela Olea' THEN '605505976'
    WHEN 'Micaela Screpanti' THEN '3711653550'
    WHEN 'Pablo mesa mesa' THEN '673021278'
    WHEN 'Pablo Nieto Bocanegra' THEN '618595997'
    WHEN 'Paula Gil Gracia' THEN '630945264'
    WHEN 'Paula Martin Lara' THEN '673695510'
    WHEN 'Pilar Marroyo' THEN '609470609'
    WHEN 'Pilar Sánchez Prada' THEN '661726270'
    WHEN 'Quique Machado Domínguez' THEN '606843816'
    WHEN 'Reyes García Domínguez' THEN '680458724'
    WHEN 'Rocío Iglesias Francés' THEN '672024691'
    WHEN 'sergio jimenez' THEN '684329447'
    WHEN 'Sergio López Serrano' THEN '666916135'
    WHEN 'Soledad perez' THEN '660267647'
    WHEN 'Sonia Garcia Hidalgo' THEN '667888126'
    WHEN 'Teresa querol quijada' THEN '671228906'
    WHEN 'Valeriano Amaya villar' THEN '651447892'
    WHEN 'victor pozo' THEN '651628880'
  END as telefono_esperado,
  CASE
    WHEN se.phone = CASE p.full_name
      WHEN 'Adrián Cazalla Salvatierra' THEN '648471649'
      WHEN 'alejandra martin' THEN '676179732'
      WHEN 'Alejandro Fernández Fernández' THEN '676075103'
      WHEN 'Alejandro Rubio' THEN '673475732'
      WHEN 'Alfonso Varela' THEN '606157196'
      WHEN 'Andrea Raya Domínguez' THEN '638425035'
      WHEN 'Andres Diaz' THEN '680320946'
      WHEN 'Borja García Navarro' THEN '652235981'
      WHEN 'carlos fernandez morales' THEN '634973366'
      WHEN 'Carmen Sobrino Bermejo' THEN '680418631'
      WHEN 'Celia Carrero Villoria Mingo' THEN '619213707'
      WHEN 'cici nichole' THEN '627055097'
      WHEN 'Diana Requena-romero' THEN '661585119'
      WHEN 'Emma Martinez' THEN '681176920'
      WHEN 'Eugenia Lobo' THEN '635516176'
      WHEN 'Fátima R' THEN '620003335'
      WHEN 'Francisco Javier Lázaro Vicente' THEN '653123716'
      WHEN 'Gema Gavira Rubio' THEN '685440439'
      WHEN 'Irene Coca Garcia' THEN '696456952'
      WHEN 'Javier Gonzalez' THEN '697627864'
      WHEN 'Javier Rodriguez-Piñero Lopez' THEN '635537269'
      WHEN 'Joaquín mora fernandez' THEN '615129490'
      WHEN 'JOSE MARIA LOPEZ ROBLES' THEN '622150949'
      WHEN 'Juan Jose Abad Gómez' THEN '688921364'
      WHEN 'Julián Sánchez Gallardo' THEN '644327181'
      WHEN 'lucía caballero gonzález' THEN '630758451'
      WHEN 'Lucía García Granados' THEN '649562128'
      WHEN 'Mª Jesús García Gomez' THEN '639390459'
      WHEN 'manoli Rubio' THEN '639743466'
      WHEN 'Manuel Roman Valverde' THEN '619533905'
      WHEN 'María Canales Gómez' THEN '671433338'
      WHEN 'Maria Jimenez Delgado' THEN '627509222'
      WHEN 'María José Gálvez' THEN '666013210'
      WHEN 'Maria Jose Vizuete Alejandre' THEN '636725918'
      WHEN 'María Moya Vázquez' THEN '626031675'
      WHEN 'Mario Tejada Salas' THEN '615189600'
      WHEN 'Marta Medina Felizon' THEN '620860624'
      WHEN 'Marta Pedrera' THEN '685307955'
      WHEN 'Mercedes Garci-Varela Olea' THEN '605505976'
      WHEN 'Micaela Screpanti' THEN '3711653550'
      WHEN 'Pablo mesa mesa' THEN '673021278'
      WHEN 'Pablo Nieto Bocanegra' THEN '618595997'
      WHEN 'Paula Gil Gracia' THEN '630945264'
      WHEN 'Paula Martin Lara' THEN '673695510'
      WHEN 'Pilar Marroyo' THEN '609470609'
      WHEN 'Pilar Sánchez Prada' THEN '661726270'
      WHEN 'Quique Machado Domínguez' THEN '606843816'
      WHEN 'Reyes García Domínguez' THEN '680458724'
      WHEN 'Rocío Iglesias Francés' THEN '672024691'
      WHEN 'sergio jimenez' THEN '684329447'
      WHEN 'Sergio López Serrano' THEN '666916135'
      WHEN 'Soledad perez' THEN '660267647'
      WHEN 'Sonia Garcia Hidalgo' THEN '667888126'
      WHEN 'Teresa querol quijada' THEN '671228906'
      WHEN 'Valeriano Amaya villar' THEN '651447892'
      WHEN 'victor pozo' THEN '651628880'
    END THEN '✓ CORRECTO'
    ELSE '✗ INCORRECTO'
  END as estado
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
