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

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const p = (k) => t(`legal.privacy.${k}`);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Helmet>
        <title>{t("legal.privacyTitle")} — Antonin TACCHI</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mb-10">
        <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition">{t("legal.backHome")}</Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white/90">{t("legal.privacyTitle")}</h1>
        <p className="mt-2 text-sm text-white/40">{t("legal.lastUpdated")}</p>
      </div>

      <Section title={p("s1Title")}>
        <p>
          {p("s1p1")} <strong className="text-white/80">antonin.tacchi2005@gmail.com</strong>
        </p>
      </Section>

      <Section title={p("s2Title")}>
        <p>{p("s2Intro")}</p>
        <ul className="space-y-2 pl-4 list-disc list-inside marker:text-white/20">
          <li>
            <strong className="text-white/70">{p("s2Item1Label")}</strong> {p("s2Item1Text")}
          </li>
          <li>
            <strong className="text-white/70">{p("s2Item2Label")}</strong> {p("s2Item2Text")}
          </li>
          <li>
            <strong className="text-white/70">{p("s2Item3Label")}</strong> {p("s2Item3Text")}
          </li>
        </ul>
      </Section>

      <Section title={p("s3Title")}>
        <p>{p("s3Intro")}</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li><strong className="text-white/70">{p("s3Item1Bold")}</strong> {p("s3Item1")}</li>
          <li><strong className="text-white/70">{p("s3Item2Bold")}</strong> {p("s3Item2")}</li>
          <li><strong className="text-white/70">{p("s3Item3Bold")}</strong> {p("s3Item3")}</li>
        </ul>
      </Section>

      <Section title={p("s4Title")}>
        <p>
          {p("s4p1")} <strong className="text-white/70">{p("s4p1Bold")}</strong> {p("s4p1After")}
        </p>
        <p>{p("s4p2")}</p>
      </Section>

      <Section title={p("s5Title")}>
        <p>{p("s5p1")}</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li>{p("s5Item1")}</li>
          <li>{p("s5Item2")}</li>
          <li>{p("s5Item3")}</li>
        </ul>
      </Section>

      <Section title={p("s6Title")}>
        <p>{p("s6Intro")}</p>
        <ul className="space-y-1 pl-4 list-disc list-inside marker:text-white/20">
          <li><strong className="text-white/70">{p("s6Item1Bold")}</strong> {p("s6Item1")}</li>
          <li><strong className="text-white/70">{p("s6Item2Bold")}</strong> {p("s6Item2")}</li>
          <li><strong className="text-white/70">{p("s6Item3Bold")}</strong> {p("s6Item3")}</li>
          <li><strong className="text-white/70">{p("s6Item4Bold")}</strong> {p("s6Item4")}</li>
          <li><strong className="text-white/70">{p("s6Item5Bold")}</strong> {p("s6Item5")}</li>
          <li><strong className="text-white/70">{p("s6Item6Bold")}</strong> {p("s6Item6")}</li>
        </ul>
        <p>
          {p("s6p2")} <strong className="text-white/80">antonin.tacchi2005@gmail.com</strong>. {p("s6p2After")}
        </p>
      </Section>

      <Section title={p("s7Title")}>
        <p>
          <strong className="text-white/70">{p("s7p1Bold")}</strong> — {p("s7p1")}
        </p>
        <p>
          <strong className="text-white/70">{p("s7p2Bold")}</strong> — {p("s7p2")}
        </p>
      </Section>

      <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/30">
        <Link to="/legal-notices" className="hover:text-white/60 transition">{t("footer.legal")}</Link>
        <Link to="/terms-of-service" className="hover:text-white/60 transition">{t("footer.terms")}</Link>
      </div>
    </div>
  );
}
