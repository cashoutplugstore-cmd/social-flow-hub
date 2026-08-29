-- Atomic multi-item checkout: validates and charges the entire cart in one DB transaction.
CREATE OR REPLACE FUNCTION public.place_orders_batch(_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _item JSONB;
  _service_id UUID;
  _quantity INT;
  _target TEXT;
  _note TEXT;
  _svc public.services;
  _cat public.service_categories;
  _total NUMERIC(12,2) := 0;
  _balance NUMERIC(12,2);
  _order public.orders;
  _orders JSONB := '[]'::JSONB;
  _count INT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' THEN RAISE EXCEPTION 'items must be an array'; END IF;
  _count := jsonb_array_length(_items);
  IF _count < 1 OR _count > 50 THEN RAISE EXCEPTION 'invalid cart size'; END IF;

  -- Validate every line against server-side service pricing before charging anything.
  FOR _item IN SELECT value FROM jsonb_array_elements(_items) LOOP
    _service_id := NULLIF(_item->>'service_id','')::UUID;
    _quantity := (_item->>'quantity')::INT;
    _target := NULLIF(trim(_item->>'target_input'),'');
    _note := NULLIF(trim(_item->>'extra_note'),'');

    SELECT * INTO _svc
      FROM public.services
     WHERE id = _service_id AND is_active
     FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'service unavailable'; END IF;
    SELECT * INTO _cat FROM public.service_categories WHERE id = _svc.category_id;

    IF _quantity IS NULL OR _quantity < _svc.min_quantity OR _quantity > _svc.max_quantity THEN
      RAISE EXCEPTION 'quantity out of range';
    END IF;
    IF _target IS NULL OR length(_target) < 3 THEN RAISE EXCEPTION 'target required'; END IF;
    IF length(_target) > 2000 THEN RAISE EXCEPTION 'target too long'; END IF;
    IF _note IS NOT NULL AND length(_note) > 500 THEN RAISE EXCEPTION 'note too long'; END IF;

    _total := _total + ROUND((_svc.price_per_unit * _quantity) / GREATEST(_svc.unit_size,1), 2);
  END LOOP;

  INSERT INTO public.wallets (user_id) VALUES (_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO _balance FROM public.wallets WHERE user_id = _uid FOR UPDATE;
  IF _balance < _total THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  UPDATE public.wallets
     SET balance = balance - _total,
         total_spent = total_spent + _total
   WHERE user_id = _uid
   RETURNING balance INTO _balance;

  FOR _item IN SELECT value FROM jsonb_array_elements(_items) LOOP
    _service_id := NULLIF(_item->>'service_id','')::UUID;
    _quantity := (_item->>'quantity')::INT;
    _target := trim(_item->>'target_input');
    _note := NULLIF(trim(_item->>'extra_note'),'');

    SELECT * INTO _svc FROM public.services WHERE id = _service_id AND is_active FOR SHARE;
    SELECT * INTO _cat FROM public.service_categories WHERE id = _svc.category_id;

    INSERT INTO public.orders (
      user_id, service_id, service_name, platform, quantity, unit_price,
      total_price, target_input, extra_note, status
    ) VALUES (
      _uid, _svc.id, _svc.name_ar, COALESCE(_cat.name_en,'general'), _quantity,
      _svc.price_per_unit,
      ROUND((_svc.price_per_unit * _quantity) / GREATEST(_svc.unit_size,1), 2),
      _target, _note, 'paid'
    ) RETURNING * INTO _order;

    INSERT INTO public.wallet_transactions (
      user_id, type, amount, balance_after, description_ar, reference_id
    ) VALUES (
      _uid, 'purchase', -_order.total_price, _balance, 'شراء خدمة: ' || _svc.name_ar, _order.id
    );

    INSERT INTO public.notifications (user_id, title, body, kind, link)
    VALUES (
      _uid, 'تم إنشاء طلبك', 'رقم الطلب #' || _order.order_number,
      'success', '/order/' || _order.id
    );

    UPDATE public.services SET popularity = popularity + 1 WHERE id = _svc.id;
    _orders := _orders || jsonb_build_object(
      'id', _order.id,
      'order_number', _order.order_number,
      'total_price', _order.total_price
    );
  END LOOP;

  RETURN jsonb_build_object(
    'orders', _orders,
    'count', _count,
    'total', _total,
    'balance_after', _balance
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_orders_batch(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.place_orders_batch(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.place_orders_batch(JSONB) TO authenticated;
