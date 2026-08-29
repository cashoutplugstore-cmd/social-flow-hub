import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) throw new Error("Supabase public environment is not configured");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type PublicService = {
  id: string; slug: string; name_ar: string; short_description_ar: string | null; description_ar: string | null;
  price_per_unit: number; unit_size: number; min_quantity: number; max_quantity: number; delivery_time_ar: string;
  input_label_ar: string | null; input_type: string; instructions_ar: string | null; notes_ar: string | null;
  popularity: number; is_active: boolean; category_id: string;
};
export type PublicCategory = { id: string; slug: string; name_ar: string; name_en: string; description_ar: string | null; sort_order: number };

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [cats, svcs] = await Promise.all([
    supabase.from("service_categories").select("id, slug, name_ar, name_en, description_ar, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("services").select("id, slug, name_ar, short_description_ar, description_ar, price_per_unit, unit_size, min_quantity, max_quantity, delivery_time_ar, input_label_ar, input_type, instructions_ar, notes_ar, popularity, is_active, category_id").eq("is_active", true).order("popularity", { ascending: false }),
  ]);
  if (cats.error) throw new Error(`Catalog categories: ${cats.error.message}`);
  if (svcs.error) throw new Error(`Catalog services: ${svcs.error.message}`);
  return { categories: (cats.data ?? []) as PublicCategory[], services: (svcs.data ?? []) as PublicService[], error: null };
});

export const getServiceBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: service, error: serviceError } = await supabase.from("services").select("id, slug, name_ar, short_description_ar, description_ar, price_per_unit, unit_size, min_quantity, max_quantity, delivery_time_ar, input_label_ar, input_type, instructions_ar, notes_ar, popularity, is_active, category_id").eq("slug", data.slug).eq("is_active", true).maybeSingle();
    if (serviceError) throw new Error(`Service lookup: ${serviceError.message}`);
    if (!service) return { service: null, category: null, related: [] as PublicService[] };
    const [{ data: category, error: categoryError }, { data: related, error: relatedError }] = await Promise.all([
      supabase.from("service_categories").select("id, slug, name_ar, name_en, description_ar, sort_order").eq("id", service.category_id).maybeSingle(),
      supabase.from("services").select("id, slug, name_ar, short_description_ar, description_ar, price_per_unit, unit_size, min_quantity, max_quantity, delivery_time_ar, input_label_ar, input_type, instructions_ar, notes_ar, popularity, is_active, category_id").eq("category_id", service.category_id).eq("is_active", true).neq("id", service.id).limit(3),
    ]);
    if (categoryError) throw new Error(`Service category: ${categoryError.message}`);
    if (relatedError) throw new Error(`Related services: ${relatedError.message}`);
    return { service: service as PublicService, category: (category ?? null) as PublicCategory | null, related: (related ?? []) as PublicService[] };
  });

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.rpc("public_stats");
  if (error) throw new Error(`Public stats: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return { total_orders: Number(row?.total_orders ?? 0), completed_orders: Number(row?.completed_orders ?? 0), total_services: Number(row?.total_services ?? 0), total_users: Number(row?.total_users ?? 0) };
});
