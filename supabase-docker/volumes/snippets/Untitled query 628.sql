-- =============================================
-- MIGRACIÓN: Agregar 'LinkedIn' al enum status_postulante
-- Ejecutar en Supabase Studio > SQL Editor
-- =============================================

-- Agregar el valor 'LinkedIn' al enum (si no existe)
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.status_postulante ADD VALUE 'LinkedIn';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'El valor ''LinkedIn'' ya existe en el enum status_postulante.';
  END;
END
$$;

-- Verificar los valores actuales del enum
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'status_postulante'
ORDER BY enumsortorder;