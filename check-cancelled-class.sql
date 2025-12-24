-- Verificar si la clase está en cancelled_classes
SELECT * FROM cancelled_classes 
WHERE programmed_class_id = '206c5f1c-5000-4634-b114-899be53d8030';

-- Ver todas las cancelaciones recientes
SELECT cc.*, pc.name as class_name 
FROM cancelled_classes cc
JOIN programmed_classes pc ON pc.id = cc.programmed_class_id
ORDER BY cc.created_at DESC
LIMIT 10;
