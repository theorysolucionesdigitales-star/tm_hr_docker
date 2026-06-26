-- ============================================================
-- SCRIPT: Migrar postulantes de 'Carta Oferta' → 'Carta Oferta Entregada'
-- IMPORTANTE: Ejecutar DESPUÉS del script 04_add_carta_oferta_enum_values.sql
-- NO afecta la tabla procesos
-- ============================================================

UPDATE public.postulantes
SET estado_proceso_postulante = 'Carta Oferta Entregada'
WHERE estado_proceso_postulante = 'Carta Oferta';
