-- ============================================================
-- SCRIPT 1/2: Migrar 'Reunión Cliente' → 'Research'
-- Afecta: tabla postulantes (campo estado_proceso_postulante)
-- NO afecta: tabla procesos (mantiene sus estados intactos)
-- ============================================================

UPDATE public.postulantes
SET estado_proceso_postulante = 'Research'
WHERE estado_proceso_postulante = 'Reunión Cliente';
