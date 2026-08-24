import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-shell";

const SECTIONS = [
  {
    t: "1. البيانات التي نجمعها",
    b: "الاسم، البريد الإلكتروني، رقم الهاتف (اختياري)، روابط أو معرّفات الحسابات التي تطلب لها الخدمات، وسجلّ الطلبات والمعاملات المالية.",
  },
  {
    t: "2. لماذا نجمعها",
    b: "لتنفيذ طلباتك، إدارة رصيد محفظتك، الدعم الفني، ومنع الاستخدام الاحتيالي للمنصة.",
  },
  {
    t: "3. كلمات المرور",
    b: "لا نطلب ولا نخزّن كلمات مرور حساباتك على منصات التواصل الاجتماعي إطلاقاً.",
  },
  {
    t: "4. المشاركة مع أطراف ثالثة",
    b: "تُشارك البيانات اللازمة فقط مع مزوّدي التنفيذ وبوابات الدفع لإتمام الخدمة، ولا تُباع لأي جهة.",
  },
  {
    t: "5. الأمان",
    b: "نستخدم تشفير النقل، وسياسات صلاحيات صارمة على مستوى قاعدة البيانات تضمن أن كل مستخدم يرى بياناته فقط.",
  },
  {
    t: "6. حقوقك",
    b: "يمكنك تعديل بياناتك من صفحة الملف الشخصي، أو طلب حذف حسابك عبر مركز الدعم.",
  },
];

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | ViralHub" },
      {
        name: "description",
        content: "كيف نجمع بياناتك ونحميها في منصة ViralHub، وحقوقك في التعديل والحذف.",
      },
      { property: "og:title", content: "سياسة الخصوصية | ViralHub" },
      { property: "og:description", content: "خصوصيتك أولاً: لا كلمات مرور، ولا بيع للبيانات." },
    ],
  }),
  component: () => (
    <PageShell>
      <PageHeader eyebrow="قانوني" title="سياسة الخصوصية" description="آخر تحديث: 2026" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        {SECTIONS.map((s) => (
          <section key={s.t} className="surface-card rounded-2xl p-6">
            <h2 className="mb-2 text-base font-extrabold">{s.t}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.b}</p>
          </section>
        ))}
      </div>
    </PageShell>
  ),
});
