-- ============================================================
-- MÚLTIPLOS FUNCIONÁRIOS RESPONSÁVEIS
-- Garagem Grau Car
-- ============================================================
-- Mantém employee_id para compatibilidade com registros antigos
-- e adiciona employee_ids para permitir vários responsáveis.
-- ============================================================


-- 1. AGENDAMENTOS
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS employee_ids uuid[]
NOT NULL
DEFAULT '{}'::uuid[];


-- 2. HISTÓRICO / SERVIÇOS REALIZADOS
ALTER TABLE public.service_orders
ADD COLUMN IF NOT EXISTS employee_ids uuid[]
NOT NULL
DEFAULT '{}'::uuid[];


-- 3. MIGRAR RESPONSÁVEL ANTIGO DOS AGENDAMENTOS
-- Se já existia employee_id, ele passa a ser também o primeiro
-- elemento de employee_ids.
UPDATE public.appointments
SET employee_ids = ARRAY[employee_id]::uuid[]
WHERE employee_id IS NOT NULL
  AND cardinality(employee_ids) = 0;


-- 4. MIGRAR RESPONSÁVEL ANTIGO DO HISTÓRICO
UPDATE public.service_orders
SET employee_ids = ARRAY[employee_id]::uuid[]
WHERE employee_id IS NOT NULL
  AND cardinality(employee_ids) = 0;


-- 5. ÍNDICES PARA PESQUISA POR FUNCIONÁRIO
CREATE INDEX IF NOT EXISTS appointments_employee_ids_gin
ON public.appointments
USING gin (employee_ids);

CREATE INDEX IF NOT EXISTS service_orders_employee_ids_gin
ON public.service_orders
USING gin (employee_ids);