-- ============ DEPOSIT REQUESTS ============
CREATE TYPE public.deposit_method AS ENUM ('card','bitcoin','google_pay','bank_transfer','manual');
CREATE TYPE public.deposit_status AS ENUM ('pending','detected','confirmed','failed','expired','cancelled');
CREATE TYPE public.review_status AS ENUM ('pending','approved','hidden','flagged');

CREATE TABLE public.deposit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  method public.deposit_method NOT NULL,
  status public.deposit_status NOT NULL DEFAULT 'pending',
  provider TEXT,
  provider_reference TEXT,
  provider_intent_id TEXT,
  checkout_url TEXT,
  crypto_address TEXT,
  crypto_amount NUMERIC(18,8),
  crypto_confirmations INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL,
  failure_reason TEXT,
  admin_note TEXT,
  credited_at TIMESTAMPTZ,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '2 hours',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX deposit_requests_idempotency_key_uidx ON public.deposit_requests(idempotency_key);
CREATE UNIQUE INDEX deposit_requests_provider_ref_uidx ON public.deposit_requests(provider, provider_reference) WHERE provider_reference IS NOT NULL;
CREATE INDEX deposit_requests_user_created_idx ON public.deposit_requests(user_id, created_at DESC);
CREATE INDEX deposit_requests_status_idx ON public.deposit_requests(status, created_at DESC);

GRANT SELECT ON public.deposit_requests TO authenticated;
GRANT ALL ON public.deposit_requests TO service_role;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own deposits read" ON public.deposit_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE TRIGGER trg_deposit_requests_updated BEFORE UPDATE ON public.deposit_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PAYMENT ATTEMPTS ============
CREATE TABLE public.payment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deposit_request_id UUID NOT NULL REFERENCES public.deposit_requests(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  error_message TEXT,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payment_attempts_deposit_idx ON public.payment_attempts(deposit_request_id, created_at DESC);
GRANT SELECT ON public.payment_attempts TO authenticated;
GRANT ALL ON public.payment_attempts TO service_role;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin payment attempts read" ON public.payment_attempts FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.deposit_requests d WHERE d.id = deposit_request_id AND d.user_id = auth.uid()));

-- ============ PAYMENT WEBHOOKS ============
CREATE TABLE public.payment_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT,
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  deposit_request_id UUID REFERENCES public.deposit_requests(id) ON DELETE SET NULL,
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX payment_webhooks_provider_event_uidx ON public.payment_webhooks(provider, event_id);
CREATE INDEX payment_webhooks_created_idx ON public.payment_webhooks(created_at DESC);
GRANT SELECT ON public.payment_webhooks TO authenticated;
GRANT ALL ON public.payment_webhooks TO service_role;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin webhooks read" ON public.payment_webhooks FOR SELECT TO authenticated USING (public.is_admin());

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  display_name TEXT,
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  status public.review_status NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reviews_order_uidx ON public.reviews(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX reviews_service_status_idx ON public.reviews(service_id, status, created_at DESC);
CREATE INDEX reviews_user_idx ON public.reviews(user_id, created_at DESC);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved reviews public read" ON public.reviews FOR SELECT TO anon USING (status = 'approved');
CREATE POLICY "reviews read" ON public.reviews FOR SELECT TO authenticated
  USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ VISITOR EVENTS (privacy friendly, aggregated) ============
CREATE TABLE public.visitor_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_hash TEXT NOT NULL,
  country_code TEXT,
  language TEXT,
  path TEXT NOT NULL,
  referrer_host TEXT,
  device TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX visitor_events_created_idx ON public.visitor_events(created_at DESC);
CREATE INDEX visitor_events_country_idx ON public.visitor_events(country_code, created_at DESC);
GRANT SELECT ON public.visitor_events TO authenticated;
GRANT ALL ON public.visitor_events TO service_role;
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin visitors read" ON public.visitor_events FOR SELECT TO authenticated USING (public.is_admin());

-- ============ CUSTOMER: CREATE DEPOSIT REQUEST (never credits balance) ============
CREATE OR REPLACE FUNCTION public.create_deposit_request(
  _amount NUMERIC, _method public.deposit_method, _idempotency_key TEXT DEFAULT NULL
) RETURNS public.deposit_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _key TEXT; _d public.deposit_requests; _recent INTEGER;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount < 5 OR _amount > 5000 THEN RAISE EXCEPTION 'amount out of range'; END IF;

  SELECT count(*) INTO _recent FROM public.deposit_requests
    WHERE user_id = _uid AND created_at > now() - interval '5 minutes';
  IF _recent >= 10 THEN RAISE EXCEPTION 'too many deposit requests, please wait'; END IF;

  _key := COALESCE(NULLIF(trim(_idempotency_key), ''), _uid::text || ':' || gen_random_uuid()::text);

  SELECT * INTO _d FROM public.deposit_requests WHERE idempotency_key = _key;
  IF FOUND THEN
    IF _d.user_id <> _uid THEN RAISE EXCEPTION 'invalid idempotency key'; END IF;
    RETURN _d;
  END IF;

  INSERT INTO public.deposit_requests (user_id, amount, method, idempotency_key, status)
  VALUES (_uid, ROUND(_amount,2), _method, _key, 'pending')
  RETURNING * INTO _d;

  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (_uid, 'طلب شحن قيد الانتظار',
          'بانتظار تأكيد الدفع — ' || ROUND(_amount,2) || ' USD', 'info', '/dashboard/wallet');
  RETURN _d;
END; $$;
REVOKE ALL ON FUNCTION public.create_deposit_request(NUMERIC, public.deposit_method, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_deposit_request(NUMERIC, public.deposit_method, TEXT) TO authenticated;

-- ============ SERVER-ONLY: CREDIT A VERIFIED DEPOSIT (idempotent) ============
CREATE OR REPLACE FUNCTION public.credit_deposit_request(
  _deposit_id UUID, _provider_reference TEXT DEFAULT NULL, _source TEXT DEFAULT 'webhook'
) RETURNS public.deposit_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d public.deposit_requests; _bal NUMERIC(12,2); _tx UUID;
BEGIN
  SELECT * INTO _d FROM public.deposit_requests WHERE id = _deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit not found'; END IF;
  IF _d.status = 'confirmed' AND _d.credited_at IS NOT NULL THEN RETURN _d; END IF;

  INSERT INTO public.wallets (user_id) VALUES (_d.user_id) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + _d.amount,
         total_deposited = total_deposited + _d.amount
   WHERE user_id = _d.user_id RETURNING balance INTO _bal;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, description_ar, reference_id)
  VALUES (_d.user_id, 'deposit', _d.amount, _bal,
          'شحن محفظة (' || _d.method || ')', _d.id)
  RETURNING id INTO _tx;

  UPDATE public.deposit_requests
     SET status = 'confirmed', credited_at = now(), wallet_transaction_id = _tx,
         provider_reference = COALESCE(_provider_reference, provider_reference)
   WHERE id = _d.id RETURNING * INTO _d;

  INSERT INTO public.payments (user_id, amount, method, status, provider_reference, meta)
  VALUES (_d.user_id, _d.amount, _d.method::text, 'succeeded', _d.provider_reference,
          jsonb_build_object('deposit_request_id', _d.id, 'source', _source));

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (NULL, 'deposit_credited', 'deposit_request', _d.id,
          jsonb_build_object('amount', _d.amount, 'source', _source, 'balance_after', _bal));

  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (_d.user_id, 'تم شحن رصيدك',
          'تمت إضافة ' || _d.amount || ' USD إلى محفظتك', 'success', '/dashboard/wallet');
  RETURN _d;
END; $$;
REVOKE ALL ON FUNCTION public.credit_deposit_request(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_deposit_request(UUID, TEXT, TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION public.credit_deposit_request(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.credit_deposit_request(UUID, TEXT, TEXT) TO service_role;

-- ============ SERVER-ONLY: MARK DEPOSIT STATE ============
CREATE OR REPLACE FUNCTION public.set_deposit_state(
  _deposit_id UUID, _status public.deposit_status, _reason TEXT DEFAULT NULL, _confirmations INTEGER DEFAULT NULL
) RETURNS public.deposit_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d public.deposit_requests;
BEGIN
  UPDATE public.deposit_requests
     SET status = _status,
         failure_reason = COALESCE(_reason, failure_reason),
         crypto_confirmations = COALESCE(_confirmations, crypto_confirmations)
   WHERE id = _deposit_id AND status <> 'confirmed'
   RETURNING * INTO _d;
  IF NOT FOUND THEN SELECT * INTO _d FROM public.deposit_requests WHERE id = _deposit_id; END IF;
  RETURN _d;
END; $$;
REVOKE ALL ON FUNCTION public.set_deposit_state(UUID, public.deposit_status, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_deposit_state(UUID, public.deposit_status, TEXT, INTEGER) FROM authenticated;
REVOKE ALL ON FUNCTION public.set_deposit_state(UUID, public.deposit_status, TEXT, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_deposit_state(UUID, public.deposit_status, TEXT, INTEGER) TO service_role;

-- ============ ADMIN: CONTROLLED MANUAL CONFIRMATION (audited) ============
CREATE OR REPLACE FUNCTION public.admin_confirm_deposit(_deposit_id UUID, _reason TEXT)
RETURNS public.deposit_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d public.deposit_requests;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 5 THEN RAISE EXCEPTION 'reason required'; END IF;
  SELECT * INTO _d FROM public.deposit_requests WHERE id = _deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit not found'; END IF;
  IF _d.method NOT IN ('manual','bank_transfer','bitcoin') THEN
    RAISE EXCEPTION 'automated payment methods can only be confirmed by verified provider webhooks';
  END IF;
  UPDATE public.deposit_requests SET admin_note = _reason WHERE id = _deposit_id;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'deposit_manual_confirm', 'deposit_request', _deposit_id,
          jsonb_build_object('reason', _reason, 'amount', _d.amount, 'method', _d.method));
  RETURN public.credit_deposit_request(_deposit_id, _d.provider_reference, 'admin:' || auth.uid()::text);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_confirm_deposit(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_deposit(_deposit_id UUID, _reason TEXT)
RETURNS public.deposit_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d public.deposit_requests;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.deposit_requests SET status = 'failed', failure_reason = COALESCE(_reason,'rejected by admin')
   WHERE id = _deposit_id AND status <> 'confirmed' RETURNING * INTO _d;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit not found or already credited'; END IF;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'deposit_reject', 'deposit_request', _deposit_id, jsonb_build_object('reason', _reason));
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (_d.user_id, 'فشل طلب الشحن', COALESCE(_reason,'تم رفض طلب الشحن'), 'error', '/dashboard/wallet');
  RETURN _d;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_reject_deposit(UUID, TEXT) TO authenticated;

-- ============ REVIEWS: eligibility-checked submission ============
CREATE OR REPLACE FUNCTION public.submit_review(
  _order_id UUID, _rating SMALLINT, _title TEXT DEFAULT NULL, _comment TEXT DEFAULT NULL
) RETURNS public.reviews
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _o public.orders; _r public.reviews; _name TEXT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _rating IS NULL OR _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'rating must be 1-5'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id = _order_id AND user_id = _uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF _o.status <> 'completed' THEN RAISE EXCEPTION 'review allowed only for completed orders'; END IF;
  IF EXISTS (SELECT 1 FROM public.reviews WHERE order_id = _order_id) THEN
    RAISE EXCEPTION 'review already submitted for this order';
  END IF;
  SELECT display_name INTO _name FROM public.profiles WHERE id = _uid;
  INSERT INTO public.reviews (user_id, service_id, order_id, rating, title, comment, display_name, verified_purchase, status)
  VALUES (_uid, _o.service_id, _order_id, _rating, NULLIF(trim(_title),''), NULLIF(trim(_comment),''),
          _name, true, 'pending')
  RETURNING * INTO _r;
  RETURN _r;
END; $$;
GRANT EXECUTE ON FUNCTION public.submit_review(UUID, SMALLINT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_moderate_review(
  _review_id UUID, _status public.review_status, _response TEXT DEFAULT NULL
) RETURNS public.reviews
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r public.reviews;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.reviews SET status = _status, admin_response = COALESCE(_response, admin_response)
   WHERE id = _review_id RETURNING * INTO _r;
  IF NOT FOUND THEN RAISE EXCEPTION 'review not found'; END IF;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'review_moderate', 'review', _review_id, jsonb_build_object('status', _status));
  IF _status = 'approved' AND _r.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, kind, link)
    VALUES (_r.user_id, 'تم نشر تقييمك', 'شكراً لمشاركتك تجربتك معنا', 'success', '/dashboard/orders');
  END IF;
  RETURN _r;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_moderate_review(UUID, public.review_status, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_review(_review_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.reviews WHERE id = _review_id;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), 'review_delete', 'review', _review_id, '{}'::jsonb);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_delete_review(UUID) TO authenticated;

-- ============ PUBLIC RATING SUMMARY ============
CREATE OR REPLACE FUNCTION public.service_rating_summary()
RETURNS TABLE(service_id UUID, avg_rating NUMERIC, review_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT service_id, ROUND(AVG(rating)::numeric, 2), count(*)
  FROM public.reviews WHERE status = 'approved' GROUP BY service_id;
$$;
GRANT EXECUTE ON FUNCTION public.service_rating_summary() TO anon, authenticated;

-- ============ ADMIN ANALYTICS ============
CREATE OR REPLACE FUNCTION public.admin_analytics(_from TIMESTAMPTZ, _to TIMESTAMPTZ)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'revenue_total',(SELECT COALESCE(sum(total_price),0) FROM public.orders WHERE status IN ('paid','processing','completed')),
    'revenue_range',(SELECT COALESCE(sum(total_price),0) FROM public.orders WHERE status IN ('paid','processing','completed') AND created_at BETWEEN _from AND _to),
    'revenue_today',(SELECT COALESCE(sum(total_price),0) FROM public.orders WHERE status IN ('paid','processing','completed') AND created_at::date = now()::date),
    'revenue_week',(SELECT COALESCE(sum(total_price),0) FROM public.orders WHERE status IN ('paid','processing','completed') AND created_at > now() - interval '7 days'),
    'revenue_month',(SELECT COALESCE(sum(total_price),0) FROM public.orders WHERE status IN ('paid','processing','completed') AND created_at > now() - interval '30 days'),
    'orders_total',(SELECT count(*) FROM public.orders),
    'orders_range',(SELECT count(*) FROM public.orders WHERE created_at BETWEEN _from AND _to),
    'orders_by_status',(SELECT COALESCE(jsonb_object_agg(status, c),'{}'::jsonb) FROM (SELECT status::text AS status, count(*) c FROM public.orders GROUP BY status) s),
    'aov',(SELECT COALESCE(ROUND(AVG(total_price),2),0) FROM public.orders WHERE status IN ('paid','processing','completed')),
    'users_total',(SELECT count(*) FROM public.profiles),
    'users_new',(SELECT count(*) FROM public.profiles WHERE created_at BETWEEN _from AND _to),
    'users_active',(SELECT count(DISTINCT user_id) FROM public.orders WHERE created_at BETWEEN _from AND _to),
    'deposits_total',(SELECT COALESCE(sum(amount),0) FROM public.deposit_requests WHERE status='confirmed'),
    'deposits_range',(SELECT COALESCE(sum(amount),0) FROM public.deposit_requests WHERE status='confirmed' AND created_at BETWEEN _from AND _to),
    'deposits_pending',(SELECT count(*) FROM public.deposit_requests WHERE status IN ('pending','detected')),
    'deposits_by_method',(SELECT COALESCE(jsonb_object_agg(m, c),'{}'::jsonb) FROM (SELECT method::text m, count(*) c FROM public.deposit_requests WHERE status='confirmed' GROUP BY method) x),
    'refunds_total',(SELECT COALESCE(sum(amount),0) FROM public.wallet_transactions WHERE type='refund'),
    'wallet_balance',(SELECT COALESCE(sum(balance),0) FROM public.wallets),
    'reviews_total',(SELECT count(*) FROM public.reviews WHERE status='approved'),
    'reviews_pending',(SELECT count(*) FROM public.reviews WHERE status='pending'),
    'rating_avg',(SELECT COALESCE(ROUND(AVG(rating)::numeric,2),0) FROM public.reviews WHERE status='approved'),
    'rating_distribution',(SELECT COALESCE(jsonb_object_agg(rating::text, c),'{}'::jsonb) FROM (SELECT rating, count(*) c FROM public.reviews WHERE status='approved' GROUP BY rating) d),
    'visitors_range',(SELECT count(DISTINCT session_hash) FROM public.visitor_events WHERE created_at BETWEEN _from AND _to),
    'visitors_by_country',(SELECT COALESCE(jsonb_object_agg(COALESCE(country_code,'??'), c),'{}'::jsonb) FROM (SELECT country_code, count(DISTINCT session_hash) c FROM public.visitor_events WHERE created_at BETWEEN _from AND _to GROUP BY country_code ORDER BY c DESC LIMIT 20) v),
    'revenue_series',(SELECT COALESCE(jsonb_agg(jsonb_build_object('d', d, 'revenue', rev, 'orders', ords) ORDER BY d),'[]'::jsonb)
        FROM (SELECT created_at::date d, COALESCE(sum(total_price) FILTER (WHERE status IN ('paid','processing','completed')),0) rev, count(*) ords
              FROM public.orders WHERE created_at BETWEEN _from AND _to GROUP BY 1) t),
    'users_series',(SELECT COALESCE(jsonb_agg(jsonb_build_object('d', d, 'users', c) ORDER BY d),'[]'::jsonb)
        FROM (SELECT created_at::date d, count(*) c FROM public.profiles WHERE created_at BETWEEN _from AND _to GROUP BY 1) t),
    'top_services',(SELECT COALESCE(jsonb_agg(jsonb_build_object('name', service_name, 'orders', c, 'revenue', rev) ORDER BY rev DESC),'[]'::jsonb)
        FROM (SELECT service_name, count(*) c, COALESCE(sum(total_price),0) rev FROM public.orders WHERE created_at BETWEEN _from AND _to GROUP BY 1 ORDER BY rev DESC LIMIT 10) t),
    'orders_by_platform',(SELECT COALESCE(jsonb_object_agg(platform, c),'{}'::jsonb) FROM (SELECT platform, count(*) c FROM public.orders GROUP BY 1) p)
  ) INTO r;
  RETURN r;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_analytics(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;