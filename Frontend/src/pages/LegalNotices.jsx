import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-white/90 border-b border-white/10 pb-2 mb-4">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-white/60 leading-relaxed">{children}</div>
    </section>
  );
}

export default function LegalNotices() {
  const { t } = useTranslation();
  const n = (k) => t(`legal.notices.${k}`);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Helmet>
        <title>{t("legal.legalTitle")} — Antonin TACCHI</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mb-10">
        <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition">{t("legal.backHome")}</Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white/90">{t("legal.legalTitle")}</h1>
        <p className="mt-2 text-sm text-white/40">{t("legal.lastUpdated")}</p>
      </div>

      <Section title={n("s1Title")}>
        <p>{n("s1Intro")}</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li><strong className="text-white/70">{n("s1Name")} :</strong> {n("s1NameVal")}</li>
          <li><strong className="text-white/70">{n("s1Status")} :</strong> {n("s1StatusVal")}</li>
          <li><strong className="text-white/70">{n("s1Email")} :</strong> antonin.tacchi2005@gmail.com</li>
          <li><strong className="text-white/70">{n("s1Location")} :</strong> {n("s1LocationVal")}</li>
        </ul>
      </Section>

      <Section title={n("s2Title")}>
        <p>{n("s2Intro")}</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li><strong className="text-white/70">{n("s2Frontend")} :</strong> Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Cyprus</li>
          <li><strong className="text-white/70">{n("s2Backend")} :</strong> Railway Corp, 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
          <li><strong className="text-white/70">{n("s2Media")} :</strong> Cloudinary Ltd, 3400 Central Expy, Suite 110, Santa Clara, CA 95051, USA</li>
        </ul>
      </Section>

      <Section title={n("s3Title")}>
        <p>{n("s3p1")}</p>
        <p>{n("s3p2")}</p>
        <p>{n("s3p3")}</p>
      </Section>

      <Section title={n("s4Title")}>
        <p>{n("s4p1")}</p>
        <p>{n("s4p2")}</p>
      </Section>

      <Section title={n("s5Title")}>
        <p>{n("s5p1")}</p>
      </Section>

      <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/30">
        <Link to="/privacy-policy" className="hover:text-white/60 transition">{t("footer.privacy")}</Link>
        <Link to="/terms-of-service" className="hover:text-white/60 transition">{t("footer.terms")}</Link>
      </div>
    </div>
  );
}
