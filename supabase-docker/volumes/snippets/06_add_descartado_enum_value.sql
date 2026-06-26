-- ============================================================
-- SCRIPT: Agregar 'Descartado' al enum estado_proceso
-- Este valor existe en el frontend pero faltaba en la BD
-- ============================================================

ALTER TYPE public.estado_proceso ADD VALUE IF NOT EXISTS 'Descartado';

-- Verificar resultado:
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'estado_proceso'
ORDER BY enumsortorder;
