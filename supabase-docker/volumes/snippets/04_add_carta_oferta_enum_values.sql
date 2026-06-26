-- ============================================================
-- SCRIPT: Agregar nuevos valores al enum estado_proceso
-- Agrega: 'Carta Oferta Entregada', 'Carta Oferta Rechazada',
--         'Carta Oferta Aceptada'
-- NO elimina 'Carta Oferta' (los procesos aún lo usan)
-- ============================================================

ALTER TYPE public.estado_proceso ADD VALUE IF NOT EXISTS 'Carta Oferta Entregada';
ALTER TYPE public.estado_proceso ADD VALUE IF NOT EXISTS 'Carta Oferta Rechazada';
ALTER TYPE public.estado_proceso ADD VALUE IF NOT EXISTS 'Carta Oferta Aceptada';

-- Verificar resultado:
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'estado_proceso'
ORDER BY enumsortorder;
