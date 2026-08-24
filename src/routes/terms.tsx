import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-shell";

const SECTIONS = [
  {
    t: "1. طبيعة الخدمات",
    b: "توفّر منصة ViralHub خدمات ترويج وتسويق رقمي لحسابات ومحتوى السوشيال ميديا. الخدمات تسويقية بحتة ولا تمثل شراكة مع أي منصة اجتماعية.",
  },
  {
    t: "2. الحساب والمسؤولية",
    b: "أنت مسؤول عن صحة البيانات التي تدخلها (الرابط أو المعرّف). الطلبات المنفّذة على رابط خاطئ غير قابلة للاسترداد. لا نطلب كلمات المرور مطلقاً.",
  },
  {
    t: "3. الدفع والمحفظة",
    b: "يتم الدفع من رصيد المحفظة بالدولار الأمريكي. طلبات الشحن تُراجع قبل إضافة الرصيد، والرصيد غير قابل للتحويل النقدي.",
  },
  {
    t: "4. مدة التنفيذ",
    b: "المدد المعلنة تقديرية وتتأثر بتحديثات المنصات وضغط الطلبات. التأخير البسيط لا يُعد إخلالاً بالاتفاق.",
  },
  {
    t: "5. الاسترداد",
    b: "يُعاد المبلغ كاملاً إلى المحفظة إذا لم يبدأ التنفيذ أو تعذّر إتمام الخدمة من جهتنا. لا يوجد استرداد بعد الإكمال الناجح.",
  },
  {
    t: "6. الاستخدام المحظور",
    b: "يُمنع استخدام الخدمات لأي محتوى مخالف للقانون أو محرّض أو مسيء. نحتفظ بحق إيقاف الحساب دون إشعار في هذه الحالات.",
  },
  {
    t: "7. التعديلات",
    b: "قد نحدّث هذه الشروط في أي وقت، ويُعد استمرارك في استخدام المنصة موافقة على النسخة المحدّثة.",
  },
];

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاستخدام | ViralHub" },
      {
        name: "description",
        content: "شروط استخدام منصة ViralHub: الطلبات، الدفع، المحفظة، الاسترداد والاستخدام المحظور.",
      },
      { property: "og:title", content: "شروط الاستخدام | ViralHub" },
      { property: "og:description", content: "اقرأ شروط التعامل مع خدمات ViralHub قبل الطلب." },
    ],
  }),
  component: () => (
    <PageShell>
      <PageHeader eyebrow="قانوني" title="شروط الاستخدام" description="آخر تحديث: 2026" />
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
