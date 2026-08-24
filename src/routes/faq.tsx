import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "كيف أطلب خدمة؟",
    a: "اختر الخدمة من المتجر، حدّد الكمية وأدخل الرابط أو المعرّف، ثم أكمل الطلب من رصيد محفظتك. يبدأ التنفيذ تلقائياً بعد الخصم.",
  },
  {
    q: "كيف أشحن رصيد المحفظة؟",
    a: "من لوحتك ← المحفظة، اختر طريقة الدفع (Stripe، PayPal، عملات رقمية، بطاقة أو تحويل يدوي) وأرسل طلب الشحن. يُضاف الرصيد بعد التأكيد.",
  },
  {
    q: "ما مدة تنفيذ الطلبات؟",
    a: "تختلف حسب الخدمة، وهي معروضة على صفحة كل خدمة (عادة من 0 إلى 24 ساعة للبدء).",
  },
  {
    q: "هل يمكن إلغاء الطلب أو استرداد المبلغ؟",
    a: "إذا لم يبدأ التنفيذ أو تعذّر إتمامه، يُعاد المبلغ كاملاً إلى محفظتك تلقائياً عند تحويل الطلب إلى حالة \u0022مسترد\u0022.",
  },
  {
    q: "هل الخدمات آمنة على حسابي؟",
    a: "نعم، لا نطلب كلمة المرور أبداً. نحتاج فقط الرابط العام أو اسم المستخدم، ويجب أن يكون الحساب عاماً وقت التنفيذ.",
  },
  {
    q: "هل الأسعار بالدولار؟",
    a: "جميع الأسعار والمحفظة بالدولار الأمريكي USD.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة | ViralHub" },
      {
        name: "description",
        content:
          "أجوبة سريعة عن الطلبات، شحن المحفظة، مدة التنفيذ، الاسترداد وأمان الحسابات في منصة ViralHub.",
      },
      { property: "og:title", content: "الأسئلة الشائعة | ViralHub" },
      { property: "og:description", content: "كل ما تحتاج معرفته قبل طلب خدمات السوشيال ميديا." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="مساعدة"
        title="الأسئلة الشائعة"
        description="جمعنا أكثر الأسئلة تكراراً حتى تطلب بثقة."
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="surface-card rounded-2xl p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`i${i}`}>
                <AccordionTrigger className="text-right text-sm font-bold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="surface-card mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6">
          <p className="text-sm font-bold">لم تجد جوابك؟ فريق الدعم متاح 24/7.</p>
          <Button variant="hero" asChild>
            <Link to="/support">افتح تذكرة دعم</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
