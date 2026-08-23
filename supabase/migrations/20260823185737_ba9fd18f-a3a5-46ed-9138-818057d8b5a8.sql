-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.order_status AS ENUM ('pending','paid','processing','completed','cancelled','refunded');
CREATE TYPE public.tx_type AS ENUM ('deposit','purchase','refund','adjustment');
CREATE TYPE public.ticket_status AS ENUM ('open','pending','answered','closed');
CREATE TYPE public.payment_status AS ENUM ('pending','succeeded','failed','refunded');

-- ========== UTIL ==========
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- ========== CATEGORIES ==========
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  icon TEXT,
  accent TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_categories TO anon, authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public categories" ON public.service_categories FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin());
CREATE POLICY "admin categories" ON public.service_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ========== SERVICES ==========
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  short_description_ar TEXT,
  description_ar TEXT,
  price_per_unit NUMERIC(12,4) NOT NULL DEFAULT 0,
  unit_size INT NOT NULL DEFAULT 1000,
  min_quantity INT NOT NULL DEFAULT 100,
  max_quantity INT NOT NULL DEFAULT 100000,
  delivery_time_ar TEXT NOT NULL DEFAULT '0-6 ساعات',
  input_label_ar TEXT,
  input_type TEXT NOT NULL DEFAULT 'link',
  instructions_ar TEXT,
  notes_ar TEXT,
  popularity INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "public services" ON public.services FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin());
CREATE POLICY "admin services" ON public.services FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ========== WALLETS ==========
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deposited NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "own wallet read" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.tx_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL DEFAULT 0,
  description_ar TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx read" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- ========== ORDERS ==========
CREATE SEQUENCE public.order_number_seq START 100001;
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGINT NOT NULL UNIQUE DEFAULT nextval('public.order_number_seq'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(12,4) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  target_input TEXT,
  extra_note TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin orders write" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ========== PAYMENTS ==========
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider_reference TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "own payments read" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin payments write" ON public.payments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ========== TICKETS ==========
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status public.ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "own tickets read" ON public.tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "own tickets insert" ON public.tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin tickets update" ON public.tickets FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ticket messages read" ON public.ticket_messages FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "ticket messages insert" ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND (public.is_admin() OR EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())));

-- ========== NOTIFICATIONS ==========
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========== AUDIT LOGS ==========
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin audit read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- ========== PROVIDERS ==========
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  api_base_url TEXT,
  adapter TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_providers_updated BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "admin providers" ON public.providers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.provider_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.provider_orders TO authenticated;
GRANT ALL ON public.provider_orders TO service_role;
ALTER TABLE public.provider_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin provider orders" ON public.provider_orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ========== BOOTSTRAP (profile + wallet + role) ==========
CREATE OR REPLACE FUNCTION public.bootstrap_current_user(_display_name TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _email TEXT; _is_first BOOLEAN;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (_uid, COALESCE(_display_name, split_part(_email,'@',1)), _email)
  ON CONFLICT (id) DO UPDATE SET display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name), email = EXCLUDED.email;
  INSERT INTO public.wallets (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO _is_first;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, CASE WHEN _is_first THEN 'admin'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT DO NOTHING;
END; $$;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user(TEXT) TO authenticated;

-- ========== PLACE ORDER (server-priced, atomic) ==========
CREATE OR REPLACE FUNCTION public.place_order(_service_id UUID, _quantity INT, _target_input TEXT, _extra_note TEXT DEFAULT NULL)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _svc public.services; _cat public.service_categories;
        _total NUMERIC(12,2); _bal NUMERIC(12,2); _order public.orders;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _svc FROM public.services WHERE id = _service_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'service unavailable'; END IF;
  SELECT * INTO _cat FROM public.service_categories WHERE id = _svc.category_id;
  IF _quantity < _svc.min_quantity OR _quantity > _svc.max_quantity THEN RAISE EXCEPTION 'quantity out of range'; END IF;
  IF _target_input IS NULL OR length(trim(_target_input)) < 3 THEN RAISE EXCEPTION 'target required'; END IF;

  _total := ROUND((_svc.price_per_unit * _quantity) / GREATEST(_svc.unit_size,1), 2);

  INSERT INTO public.wallets (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _uid FOR UPDATE;
  IF _bal < _total THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  UPDATE public.wallets SET balance = balance - _total, total_spent = total_spent + _total WHERE user_id = _uid RETURNING balance INTO _bal;

  INSERT INTO public.orders (user_id, service_id, service_name, platform, quantity, unit_price, total_price, target_input, extra_note, status)
  VALUES (_uid, _svc.id, _svc.name_ar, COALESCE(_cat.name_en,'general'), _quantity, _svc.price_per_unit, _total, trim(_target_input), _extra_note, 'paid')
  RETURNING * INTO _order;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, description_ar, reference_id)
  VALUES (_uid, 'purchase', -_total, _bal, 'شراء خدمة: ' || _svc.name_ar, _order.id);

  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (_uid, 'تم إنشاء طلبك', 'رقم الطلب #' || _order.order_number, 'success', '/order/' || _order.id);

  UPDATE public.services SET popularity = popularity + 1 WHERE id = _svc.id;
  RETURN _order;
END; $$;
GRANT EXECUTE ON FUNCTION public.place_order(UUID, INT, TEXT, TEXT) TO authenticated;

-- ========== TOPUP (demo / wallet credit) ==========
CREATE OR REPLACE FUNCTION public.request_topup(_amount NUMERIC, _method TEXT)
RETURNS public.payments LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _p public.payments;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount < 5 OR _amount > 5000 THEN RAISE EXCEPTION 'amount out of range'; END IF;
  IF _method NOT IN ('stripe','paypal','crypto','card','manual') THEN RAISE EXCEPTION 'invalid method'; END IF;
  INSERT INTO public.payments (user_id, amount, method, status)
  VALUES (_uid, ROUND(_amount,2), _method, 'pending') RETURNING * INTO _p;
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (_uid, 'طلب شحن رصيد', 'بانتظار المراجعة — ' || ROUND(_amount,2) || ' USD', 'info', '/dashboard/wallet');
  RETURN _p;
END; $$;
GRANT EXECUTE ON FUNCTION public.request_topup(NUMERIC, TEXT) TO authenticated;

-- ========== ADMIN OPS ==========
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(_user_id UUID, _amount NUMERIC, _reason TEXT)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal NUMERIC(12,2);
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.wallets (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + _amount,
    total_deposited = total_deposited + GREATEST(_amount,0) WHERE user_id = _user_id RETURNING balance INTO _bal;
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, description_ar)
  VALUES (_user_id, CASE WHEN _amount >= 0 THEN 'deposit' ELSE 'adjustment' END, _amount, _bal, COALESCE(_reason,'تعديل إداري'));
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'adjust_balance', 'wallet', _user_id, jsonb_build_object('amount',_amount,'reason',_reason));
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (_user_id, 'تحديث الرصيد', 'تم تعديل رصيدك بمقدار ' || _amount || ' USD', 'success', '/dashboard/wallet');
  RETURN _bal;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(UUID, NUMERIC, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_order_status(_order_id UUID, _status public.order_status, _admin_note TEXT DEFAULT NULL)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o public.orders; _bal NUMERIC(12,2);
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF _status = 'refunded' AND _o.status <> 'refunded' THEN
    UPDATE public.wallets SET balance = balance + _o.total_price, total_spent = GREATEST(total_spent - _o.total_price, 0)
      WHERE user_id = _o.user_id RETURNING balance INTO _bal;
    INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, description_ar, reference_id)
    VALUES (_o.user_id, 'refund', _o.total_price, COALESCE(_bal,0), 'استرداد الطلب #' || _o.order_number, _o.id);
  END IF;
  UPDATE public.orders SET status = _status, admin_note = COALESCE(_admin_note, admin_note) WHERE id = _order_id RETURNING * INTO _o;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'order_status', 'order', _order_id, jsonb_build_object('status',_status));
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (_o.user_id, 'تحديث حالة الطلب', 'الطلب #' || _o.order_number || ' أصبح: ' || _status, 'info', '/order/' || _o.id);
  RETURN _o;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_order_status(UUID, public.order_status, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_payment_status(_payment_id UUID, _status public.payment_status)
RETURNS public.payments LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment not found'; END IF;
  IF _status = 'succeeded' AND _p.status <> 'succeeded' THEN
    PERFORM public.admin_adjust_balance(_p.user_id, _p.amount, 'شحن رصيد عبر ' || _p.method);
  END IF;
  UPDATE public.payments SET status = _status WHERE id = _payment_id RETURNING * INTO _p;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'payment_status', 'payment', _payment_id, jsonb_build_object('status',_status));
  RETURN _p;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_payment_status(UUID, public.payment_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reply_ticket(_ticket_id UUID, _body TEXT, _status public.ticket_status DEFAULT 'answered')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t public.tickets;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _t FROM public.tickets WHERE id = _ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ticket not found'; END IF;
  INSERT INTO public.ticket_messages (ticket_id, sender_id, is_staff, body) VALUES (_ticket_id, auth.uid(), true, _body);
  UPDATE public.tickets SET status = _status WHERE id = _ticket_id;
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (_t.user_id, 'رد جديد على تذكرتك', _t.subject, 'info', '/dashboard/tickets');
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_reply_ticket(UUID, TEXT, public.ticket_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_toggle_user(_user_id UUID, _active BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET is_active = _active WHERE id = _user_id;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'toggle_user', 'profile', _user_id, jsonb_build_object('is_active',_active));
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user(UUID, BOOLEAN) TO authenticated;

-- public stats (no PII)
CREATE OR REPLACE FUNCTION public.public_stats()
RETURNS TABLE(total_orders BIGINT, completed_orders BIGINT, total_services BIGINT, total_users BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT count(*) FROM public.orders),
         (SELECT count(*) FROM public.orders WHERE status='completed'),
         (SELECT count(*) FROM public.services WHERE is_active),
         (SELECT count(*) FROM public.profiles);
$$;
GRANT EXECUTE ON FUNCTION public.public_stats() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'total_users',(SELECT count(*) FROM public.profiles),
    'new_users',(SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'total_orders',(SELECT count(*) FROM public.orders),
    'orders_today',(SELECT count(*) FROM public.orders WHERE created_at::date = now()::date),
    'revenue',(SELECT COALESCE(sum(total_price),0) FROM public.orders WHERE status IN ('paid','processing','completed')),
    'pending_orders',(SELECT count(*) FROM public.orders WHERE status IN ('pending','paid','processing')),
    'completed_orders',(SELECT count(*) FROM public.orders WHERE status='completed'),
    'open_tickets',(SELECT count(*) FROM public.tickets WHERE status <> 'closed'),
    'pending_payments',(SELECT count(*) FROM public.payments WHERE status='pending')
  ) INTO r;
  RETURN r;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;

-- ========== SEED ==========
INSERT INTO public.service_categories (slug,name_ar,name_en,description_ar,icon,accent,sort_order) VALUES
 ('tiktok','تيك توك','TikTok','خدمات ترويج ووصول لمحتوى تيك توك','music','tiktok',1),
 ('youtube','يوتيوب','YouTube','خدمات نمو قناتك على يوتيوب','youtube','youtube',2),
 ('instagram','إنستغرام','Instagram','خدمات ترويج إنستغرام','instagram','instagram',3),
 ('telegram','تيليجرام','Telegram','خدمات قنوات ومجموعات تيليجرام','send','telegram',4),
 ('facebook','فيسبوك','Facebook','خدمات صفحات ومحتوى فيسبوك','facebook','facebook',5),
 ('x','منصة X','X','خدمات الترويج على منصة X','twitter','x',6),
 ('discord','ديسكورد','Discord','خدمات سيرفرات ديسكورد','message-circle','discord',7),
 ('marketing','التسويق الرقمي','Digital Marketing','حملات إعلانية واستشارات تسويقية','megaphone','marketing',8),
 ('design','تصميم المحتوى','Design','تصميم هوية ومحتوى بصري','palette','design',9);

INSERT INTO public.services (category_id,slug,name_ar,short_description_ar,description_ar,price_per_unit,unit_size,min_quantity,max_quantity,delivery_time_ar,input_label_ar,input_type,instructions_ar,notes_ar,popularity)
SELECT c.id, s.slug, s.name_ar, s.short, s.descr, s.price, s.unit, s.mn, s.mx, s.dt, s.label, s.itype, s.instr, s.notes, s.pop
FROM (VALUES
 ('tiktok','tiktok-promo-boost','ترويج فيديو تيك توك (Demo)','حملة ترويج رسمية لزيادة وصول الفيديو',' حملة ترويج مدفوعة عبر أدوات تيك توك الرسمية لزيادة وصول الفيديو للجمهور المستهدف.',4.50,1000,1000,500000,'0-6 ساعات','رابط الفيديو','link','ضع رابط الفيديو العام وتأكد أن الحساب غير خاص.','خدمة تجريبية Demo — لا يتم تنفيذ أي تفاعل وهمي.',95),
 ('tiktok','tiktok-coins-topup','شحن TikTok Coins (Demo)','شحن رسمي لعملات تيك توك','شحن عملات تيك توك عبر القنوات الرسمية باستخدام اسم المستخدم فقط.',12.00,100,100,10000,'1-12 ساعة','اسم المستخدم (@username)','username','أدخل اسم المستخدم فقط. لا نطلب كلمة المرور إطلاقاً.','خدمة تجريبية Demo.',88),
 ('tiktok','tiktok-live-promo','ترويج بث مباشر تيك توك (Demo)','زيادة وصول البث المباشر','ترويج البث المباشر لجمهور مهتم عبر الأدوات الرسمية.',6.00,1000,500,200000,'0-3 ساعات','رابط الحساب','link','ابدأ البث قبل الطلب بـ 10 دقائق.','خدمة تجريبية Demo.',60),
 ('youtube','youtube-ads-campaign','حملة إعلانات يوتيوب (Demo)','إعلانات رسمية عبر Google Ads','إدارة حملة إعلانية احترافية لفيديوهاتك عبر Google Ads.',9.00,1000,1000,1000000,'12-48 ساعة','رابط الفيديو','link','أرسل رابط الفيديو والجمهور المستهدف في الملاحظات.','خدمة تجريبية Demo.',80),
 ('youtube','youtube-thumbnail','تصميم Thumbnail احترافي (Demo)','تصميم صورة مصغّرة جذابة','تصميم صورة مصغرة احترافية تزيد نسبة النقر.',5.00,1,1,20,'24-48 ساعة','رابط الفيديو أو وصف','link','اذكر عنوان الفيديو والألوان المفضلة.','خدمة تجريبية Demo.',55),
 ('youtube','youtube-seo','تحسين SEO للقناة (Demo)','تحسين العناوين والوصف والوسوم','تحسين ظهور فيديوهاتك في نتائج بحث يوتيوب.',15.00,1,1,10,'2-4 أيام','رابط القناة','link','أرسل رابط القناة وأهم الكلمات المفتاحية.','خدمة تجريبية Demo.',44),
 ('instagram','instagram-ads','إعلانات إنستغرام ممولة (Demo)','إدارة حملة Meta Ads','إعداد وإدارة حملة ممولة على إنستغرام لجمهور مستهدف.',8.50,1000,1000,500000,'6-24 ساعة','رابط المنشور','link','تأكد أن الحساب حساب أعمال.','خدمة تجريبية Demo.',77),
 ('instagram','instagram-reels-boost','ترويج ريلز (Demo)','زيادة وصول الريلز','حملة ترويج لمقاطع الريلز عبر الأدوات الرسمية.',5.50,1000,500,300000,'0-8 ساعات','رابط الريل','link','ضع رابط الريل العام.','خدمة تجريبية Demo.',70),
 ('instagram','instagram-content-plan','خطة محتوى شهرية (Demo)','30 فكرة محتوى جاهزة','خطة محتوى شهرية مخصصة لحسابك مع أفكار وكابشنات.',35.00,1,1,5,'3-5 أيام','رابط الحساب','link','اذكر مجال الحساب والجمهور.','خدمة تجريبية Demo.',40),
 ('telegram','telegram-channel-promo','ترويج قناة تيليجرام (Demo)','إعلان قناتك في شبكة قنوات','حملة إعلانية لقناتك ضمن شبكة قنوات حقيقية.',7.00,1000,500,200000,'6-24 ساعة','رابط القناة','link','تأكد أن القناة عامة.','خدمة تجريبية Demo.',52),
 ('telegram','telegram-bot-setup','إعداد بوت تيليجرام (Demo)','بوت خدمة عملاء أو متجر','إعداد بوت مخصص لقناتك أو متجرك.',49.00,1,1,3,'3-7 أيام','اسم القناة/المجموعة','username','اشرح وظائف البوت المطلوبة.','خدمة تجريبية Demo.',30),
 ('facebook','facebook-page-ads','إعلانات صفحة فيسبوك (Demo)','حملة Meta Ads للصفحة','حملة ممولة لزيادة تفاعل ووصول صفحتك.',7.50,1000,1000,500000,'6-24 ساعة','رابط الصفحة','link','امنح صلاحية الإعلان لمدير الحملة.','خدمة تجريبية Demo.',48),
 ('facebook','facebook-post-boost','ترويج منشور (Demo)','زيادة وصول منشور محدد','ترويج منشور واحد لجمهور مستهدف.',6.50,1000,500,300000,'3-12 ساعة','رابط المنشور','link','ضع رابط المنشور العام.','خدمة تجريبية Demo.',45),
 ('x','x-post-promo','ترويج تغريدة (Demo)','حملة X Ads لتغريدتك','ترويج التغريدة عبر منصة X الإعلانية.',8.00,1000,500,300000,'6-24 ساعة','رابط التغريدة','link','ضع رابط التغريدة.','خدمة تجريبية Demo.',38),
 ('x','x-profile-audit','مراجعة حساب X (Demo)','تحليل واستراتيجية نمو','تقرير مفصل عن حسابك مع خطة نمو.',25.00,1,1,10,'2-4 أيام','رابط الحساب','link','ضع رابط الحساب.','خدمة تجريبية Demo.',22),
 ('discord','discord-server-setup','إعداد سيرفر ديسكورد (Demo)','هيكلة كاملة للسيرفر','تنظيم القنوات والرتب والبوتات والحماية.',45.00,1,1,5,'2-5 أيام','رابط دعوة السيرفر','link','أرسل رابط دعوة بصلاحية إدارة.','خدمة تجريبية Demo.',33),
 ('discord','discord-community-promo','ترويج مجتمع ديسكورد (Demo)','إعلان السيرفر في مجتمعات','حملة ترويج للسيرفر في مجتمعات مهتمة.',10.00,1000,500,100000,'12-48 ساعة','رابط الدعوة','link','تأكد أن رابط الدعوة دائم.','خدمة تجريبية Demo.',28),
 ('marketing','marketing-strategy','استراتيجية تسويق رقمي (Demo)','خطة تسويقية متكاملة','خطة تسويق رقمي شاملة لعلامتك التجارية.',120.00,1,1,3,'5-10 أيام','اسم العلامة التجارية','text','اذكر مجال عملك وأهدافك.','خدمة تجريبية Demo.',35),
 ('marketing','marketing-influencer','حملة مؤثرين (Demo)','ربطك بمؤثرين مناسبين','اختيار وإدارة حملة مع مؤثرين في مجالك.',250.00,1,1,3,'7-14 يوم','اسم العلامة التجارية','text','حدد الميزانية والجمهور.','خدمة تجريبية Demo.',26),
 ('marketing','marketing-email','حملة بريد إلكتروني (Demo)','تصميم وإرسال حملة بريدية','إعداد حملة بريد احترافية مع تقارير.',60.00,1,1,10,'3-6 أيام','اسم الحملة','text','أرسل قائمة البريد بصيغة CSV بعد الطلب.','خدمة تجريبية Demo.',20),
 ('design','design-logo','تصميم شعار احترافي (Demo)','هوية بصرية مميزة','تصميم شعار احترافي مع ملفات مفتوحة.',80.00,1,1,5,'3-7 أيام','اسم العلامة التجارية','text','اذكر الألوان والأسلوب المفضل.','خدمة تجريبية Demo.',65),
 ('design','design-social-pack','باقة تصاميم سوشيال (Demo)','12 تصميم منشور','باقة تصاميم منشورات جاهزة لحساباتك.',45.00,1,1,10,'4-8 أيام','اسم الحساب','text','أرسل الشعار والألوان.','خدمة تجريبية Demo.',58),
 ('design','design-video-edit','مونتاج فيديو قصير (Demo)','مونتاج احترافي للريلز','مونتاج فيديو قصير مع مؤثرات وترجمة.',30.00,1,1,20,'2-5 أيام','رابط المادة الخام','link','ارفع المادة على درايف وشارك الرابط.','خدمة تجريبية Demo.',62)
) AS s(cat,slug,name_ar,short,descr,price,unit,mn,mx,dt,label,itype,instr,notes,pop)
JOIN public.service_categories c ON c.slug = s.cat;

INSERT INTO public.providers (name,slug,adapter,is_active,notes) VALUES
 ('تنفيذ يدوي داخلي','manual','manual',true,'المزود الافتراضي — تنفيذ الطلبات يدوياً من لوحة الإدارة'),
 ('مزود API خارجي (نموذج)','generic-api','generic_api',false,'قالب جاهز لربط أي مزود خارجي مستقبلاً عبر طبقة التجريد');