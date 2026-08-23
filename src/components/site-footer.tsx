import { Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="bg-surface mt-20 border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Brand />
          <p className="text-muted-foreground text-sm leading-relaxed">
            ViralHub منصة عربية لشراء خدمات السوشيال ميديا الرسمية والترويج المشروع لمحتواك — بشفافية
            وأسعار واضحة.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold">المنصة</h3>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>
              <Link to="/services" className="hover:text-foreground">
                متجر الخدمات
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-foreground">
                لوحة التحكم
              </Link>
            </li>
            <li>
              <Link to="/support" className="hover:text-foreground">
                مركز الدعم
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-foreground">
                الأسئلة الشائعة
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold">قانوني</h3>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>
              <Link to="/terms" className="hover:text-foreground">
                الشروط والأحكام
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-foreground">
                سياسة الخصوصية
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold">تنبيه مهم</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            لا نطلب كلمات مرور حساباتك أبداً. جميع الخدمات المعروضة حالياً بيانات تجريبية (Demo)
            لأغراض العرض فقط.
          </p>
        </div>
      </div>
      <div className="text-muted-foreground border-t px-4 py-5 text-center text-xs">
        © {new Date().getFullYear()} ViralHub — جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
