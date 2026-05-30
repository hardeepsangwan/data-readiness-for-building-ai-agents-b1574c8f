CREATE TABLE public.blueprint_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'queued',
  input JSONB NOT NULL,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

GRANT ALL ON public.blueprint_jobs TO service_role;

ALTER TABLE public.blueprint_jobs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_blueprint_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_blueprint_jobs_updated_at
BEFORE UPDATE ON public.blueprint_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_blueprint_jobs_updated_at();