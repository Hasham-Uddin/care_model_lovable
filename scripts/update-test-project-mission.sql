-- Run in Supabase Dashboard → SQL Editor
-- Updates the mission statement for the org linked to "Test Project"

UPDATE public.organizations o
SET mission = 'Test Org exists to deliver dependable, equitable services powered by accurate, timely data. We strengthen the systems our communities rely on—so customers experience seamless support, staff can work with confidence, and every decision is guided by integrity, resilience, and a commitment to continuous improvement.'
FROM public.projects p
WHERE p.organization_id = o.id
  AND p.name ILIKE 'Test Project';
