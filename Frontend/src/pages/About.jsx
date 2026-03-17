import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { FaHouse, FaGaugeHigh, FaCode, FaMap, FaCube, FaServer, FaLaptopCode } from "react-icons/fa6";
import { useReveal, useStagger } from "../hooks/useScrollReveal";
import ImageHero from "../img/Custom_Project.jpg";

function SectionTitle({ children }) {
  return (
    <h2 className="text-2xl font-extrabold tracking-tight text-white/90 border-b border-white/10 pb-3 mb-8">
      {children}
    </h2>
  );
}

function SpecialtyCard({ icon, title, desc }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-3 text-[#6b5cff] text-3xl">{icon}</div>
      <div className="text-lg font-bold text-white/90 mb-1">{title}</div>
      <div className="text-sm text-white/55 leading-relaxed">{desc}</div>
    </div>
  );
}

function ToolCard({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-[#6b5cff] text-2xl mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="font-bold text-white/90">{title}</div>
        <div className="text-sm text-white/55 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function WorkflowStep({ number, title, desc, isLast }) {
  return (
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <div className="flex flex-col items-center flex-1 min-w-0">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 w-full">
          <div className="text-[#6b5cff] text-sm font-bold mb-1">{number}</div>
          <div className="text-white/90 font-bold mb-1">{title}</div>
          <div className="text-white/50 text-sm leading-relaxed">{desc}</div>
        </div>
      </div>
      {!isLast && (
        <div className="text-white/25 text-2xl mt-6 shrink-0 hidden md:block">›</div>
      )}
    </div>
  );
}

export default function About() {
  const { t } = useTranslation();
  const heroRef        = useReveal({ noScroll: true, delay: 0.1 });
  const bioRef         = useReveal();
  const specialtiesRef = useStagger(":scope > *", { stagger: 0.15 });
  const toolsRef       = useStagger(":scope > *", { stagger: 0.12 });
  const workflowRef    = useStagger(":scope > *", { stagger: 0.12 });

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-8">
      <Helmet>
        <title>About — Antonin TACCHI</title>
        <meta name="description" content="Learn more about Antonin TACCHI, professional FiveM mapper & developer specializing in custom MLO, exterior mapping, and GTA V RP server development." />
        <link rel="canonical" href="https://antonin-tacchi.com/about" />
        <meta property="og:title" content="About — Antonin TACCHI" />
        <meta property="og:description" content="Professional FiveM mapper & developer specializing in custom MLO, exterior mapping, and GTA V RP server development." />
        <meta property="og:url" content="https://antonin-tacchi.com/about" />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="About — Antonin TACCHI" />
        <meta name="twitter:description" content="Professional FiveM mapper & developer specializing in custom MLO, exterior mapping, and GTA V RP server development." />
      </Helmet>

      {/* HERO */}
      <div ref={heroRef} className="mb-2">
        <h1 className="text-5xl font-extrabold tracking-tight text-white/90">{t("about.title")}</h1>
        <p className="mt-2 text-white/50">{t("about.subtitle")}</p>
      </div>

      {/* BIO CARD */}
      <div ref={bioRef} className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-xl font-extrabold text-white/90">Antonin TACCHI</div>
          <div className="text-[#6b5cff] text-sm font-semibold mb-5">{t("about.role")}</div>
          <p className="text-white/60 text-sm leading-7">{t("about.bio1")}</p>
          <p className="text-white/60 text-sm leading-7 mt-4">{t("about.bio2")}</p>
        </div>
        <img src={ImageHero} className="shrink-0 w-full md:w-[260px] h-[200px] md:h-auto rounded-2xl" alt="Antonin TACCHI" />
      </div>

      {/* SPECIALTIES */}
      <section className="mt-12">
        <SectionTitle>{t("about.specialtiesTitle")}</SectionTitle>
        <div ref={specialtiesRef} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SpecialtyCard icon={<FaHouse />} title={t("about.specialty1Title")} desc={t("about.specialty1Desc")} />
          <SpecialtyCard icon={<FaGaugeHigh />} title={t("about.specialty2Title")} desc={t("about.specialty2Desc")} />
          <SpecialtyCard icon={<FaCode />} title={t("about.specialty3Title")} desc={t("about.specialty3Desc")} />
        </div>
      </section>

      {/* TOOLS */}
      <section className="mt-12">
        <SectionTitle>{t("about.toolsTitle")}</SectionTitle>
        <div ref={toolsRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ToolCard icon={<FaMap />} title="CodeWalker" desc={t("about.tool1Desc")} />
          <ToolCard icon={<FaCube />} title="Blender" desc={t("about.tool2Desc")} />
          <ToolCard icon={<FaServer />} title="FiveM" desc={t("about.tool3Desc")} />
          <ToolCard icon={<FaLaptopCode />} title="Visual Studio Code" desc={t("about.tool4Desc")} />
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="mt-12">
        <SectionTitle>{t("about.workflowTitle")}</SectionTitle>
        <div ref={workflowRef} className="flex flex-col md:flex-row gap-2 md:gap-0 md:items-start">
          <WorkflowStep number="01" title={t("about.step1Title")} desc={t("about.step1Desc")} />
          <WorkflowStep number="02" title={t("about.step2Title")} desc={t("about.step2Desc")} />
          <WorkflowStep number="03" title={t("about.step3Title")} desc={t("about.step3Desc")} />
          <WorkflowStep number="04" title={t("about.step4Title")} desc={t("about.step4Desc")} isLast />
        </div>
      </section>
    </div>
  );
}
