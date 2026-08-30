DROP POLICY "public categories" ON public.service_categories;
DROP POLICY "public services" ON public.services;

CREATE POLICY "anon active categories" ON public.service_categories FOR SELECT TO anon USING (is_active);
CREATE POLICY "auth categories read" ON public.service_categories FOR SELECT TO authenticated USING (is_active OR public.is_admin());
CREATE POLICY "anon active services" ON public.services FOR SELECT TO anon USING (is_active);
CREATE POLICY "auth services read" ON public.services FOR SELECT TO authenticated USING (is_active OR public.is_admin());

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;