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

export default function TermsOfService() {
  const { t } = useTranslation();
  const s = (k) => t(`legal.terms.${k}`);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Helmet>
        <title>{t("legal.termsTitle")} — Antonin TACCHI</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mb-10">
        <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition">{t("legal.backHome")}</Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white/90">{t("legal.termsTitle")}</h1>
        <p className="mt-2 text-sm text-white/40">{t("legal.lastUpdated")}</p>
      </div>

      <Section title={s("s1Title")}>
        <p>
          {s("s1p1")}
        </p>
        <p>{s("s1p2")}</p>
      </Section>

      <Section title={s("s2Title")}>
        <p>{s("s2Intro")}</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li>{s("s2Item1")}</li>
          <li>{s("s2Item2")}</li>
          <li>{s("s2Item3")}</li>
        </ul>
      </Section>

      <Section title={s("s3Title")}>
        <p><strong className="text-white/70">{s("s3_1Bold")}</strong></p>
        <p>{s("s3_1")}</p>
        <p><strong className="text-white/70">{s("s3_2Bold")}</strong></p>
        <p>{s("s3_2")}</p>
        <p><strong className="text-white/70">{s("s3_3Bold")}</strong></p>
        <p>{s("s3_3")}</p>
        <p><strong className="text-white/70">{s("s3_4Bold")}</strong></p>
        <p>
          {s("s3_4").split(s("s3_4LicenseBold"))[0]}
          <strong className="text-white/70">{s("s3_4LicenseBold")}</strong>
          {s("s3_4").split(s("s3_4LicenseBold"))[1]}
        </p>
      </Section>

      <Section title={s("s4Title")}>
        <p>{s("s4Intro")}</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li>{s("s4Item1")}</li>
          <li>{s("s4Item2")}</li>
          <li>{s("s4Item3")}</li>
          <li>{s("s4Item4")}</li>
        </ul>
      </Section>

      <Section title={s("s5Title")}>
        <p>{s("s5p1")}</p>
        <p>{s("s5p2")}</p>
      </Section>

      <Section title={s("s6Title")}>
        <p>{s("s6p1")}</p>
      </Section>

      <Section title={s("s7Title")}>
        <p>
          {s("s7p1").split(s("s7LawBold"))[0]}
          <strong className="text-white/70">{s("s7LawBold")}</strong>
          {s("s7p1").split(s("s7LawBold"))[1]}
        </p>
      </Section>

      <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/30">
        <Link to="/legal-notices" className="hover:text-white/60 transition">{t("footer.legal")}</Link>
        <Link to="/privacy-policy" className="hover:text-white/60 transition">{t("footer.privacy")}</Link>
      </div>
    </div>
  );
}
