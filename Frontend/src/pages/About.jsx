import { Helmet } from "react-helmet-async";
import { FaHouse, FaGaugeHigh, FaCode, FaMap, FaCube, FaServer, FaLaptopCode } from "react-icons/fa6";
import { useReveal, useStagger } from "../hooks/useScrollReveal";

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
      </Helmet>

      {/* HERO */}
      <div ref={heroRef} className="mb-2">
        <h1 className="text-5xl font-extrabold tracking-tight text-white/90">About Me</h1>
        <p className="mt-2 text-white/50">Professional mapper &amp; Developer for GTA V / FiveM</p>
      </div>

      {/* BIO CARD */}
      <div ref={bioRef} className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col md:flex-row gap-8">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-xl font-extrabold text-white/90">Antonin TACCHI</div>
          <div className="text-[#6b5cff] text-sm font-semibold mb-5">Mapper / Developer</div>
          <p className="text-white/60 text-sm leading-7">
            I'm a web developer and FiveM mapper focused on creating immersive,
            performance-optimized environments for roleplay servers. With a strong technical
            background, I approach mapping not only as visual design, but as a balance between
            aesthetics, performance, and server stability.
          </p>
          <p className="text-white/60 text-sm leading-7 mt-4">
            I combine development logic with creative mapping to deliver clean, optimized, and
            scalable projects tailored to each server's identity. My goal is simple: build
            environments that look great, feel immersive, and run smoothly even on
            high-population servers.
          </p>
        </div>

        {/* Photo placeholder */}
        <div className="shrink-0 w-full md:w-[260px] h-[200px] md:h-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 text-sm">
          Photo
        </div>
      </div>

      {/* SPECIALTIES */}
      <section className="mt-12">
        <SectionTitle>My specialties</SectionTitle>
        <div ref={specialtiesRef} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SpecialtyCard
            icon={<FaHouse />}
            title="Custom MLO Design"
            desc="Creating design, optimized interiors."
          />
          <SpecialtyCard
            icon={<FaGaugeHigh />}
            title="Optimized Performance"
            desc="Ensuring smooth gameplay with high FPS"
          />
          <SpecialtyCard
            icon={<FaCode />}
            title="Mapping + Scripting"
            desc="Integrating maps with custom scripts"
          />
        </div>
      </section>

      {/* TOOLS */}
      <section className="mt-12">
        <SectionTitle>Tools I use</SectionTitle>
        <div ref={toolsRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ToolCard
            icon={<FaMap />}
            title="CodeWalker"
            desc="Powerful GTA V map editing software"
          />
          <ToolCard
            icon={<FaCube />}
            title="Blender"
            desc="3D modeling for detailed interiors and props"
          />
          <ToolCard
            icon={<FaServer />}
            title="FiveM"
            desc="Expertise in FiveM server optimization"
          />
          <ToolCard
            icon={<FaLaptopCode />}
            title="Visual Studio Code"
            desc="Coding and scripting environment"
          />
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="mt-12">
        <SectionTitle>Workflow</SectionTitle>
        <div ref={workflowRef} className="flex flex-col md:flex-row gap-2 md:gap-0 md:items-start">
          <WorkflowStep
            number="01"
            title="Discussion"
            desc="Initial consultation to understand your needs & vision."
          />
          <WorkflowStep
            number="02"
            title="Prototype"
            desc="Creating a first version of the map for your review."
          />
          <WorkflowStep
            number="03"
            title="Delivery"
            desc="Finalizing and delivering the finished mapping project."
          />
          <WorkflowStep
            number="04"
            title="Support"
            desc="Providing ongoing support and assistance post-delivery."
            isLast
          />
        </div>
      </section>

    </div>
  );
}
