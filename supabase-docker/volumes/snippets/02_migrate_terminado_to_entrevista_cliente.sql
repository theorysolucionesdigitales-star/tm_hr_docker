-- ============================================================
-- SCRIPT 2/2: Migrar 'Terminado' → 'Entrevista Cliente'
-- Afecta: tabla postulantes (campo estado_proceso_postulante)
-- NO afecta: tabla procesos (mantiene sus estados intactos)
-- ============================================================

UPDATE public.postulantes
SET estado_proceso_postulante = 'Entrevista Cliente'
WHERE estado_proceso_postulante = 'Terminado';
