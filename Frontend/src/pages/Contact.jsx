import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const API_URL = import.meta.env.VITE_API_URL || "";
const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || "";

function buildDiscordOAuthUrl(ticketNumber) {
  if (!DISCORD_CLIENT_ID) return null;
  const redirectUri = `${window.location.origin}/auth/discord/callback`;
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds.join",
    state: ticketNumber || "",
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

const COMMISSION_SUBJECTS = ["Custom MLO", "Exterior Mapping", "Optimization"];

const SUBJECTS = [
  { label: "— Commission —", disabled: true },
  { label: "Custom MLO" },
  { label: "Exterior Mapping" },
  { label: "Optimization" },
  { label: "— Support & Other —", disabled: true },
  { label: "Bug Report" },
  { label: "Réclamation", value: "Other" },
  { label: "Question générale", value: "Other" },
  { label: "Other" },
];

const BUDGETS = [
  { value: "< 20€",     label: "< 20 €" },
  { value: "20–50€",    label: "20 – 50 €" },
  { value: "50–100€",   label: "50 – 100 €" },
  { value: "100–200€",  label: "100 – 200 €" },
  { value: "> 200€",    label: "> 200 €" },
  { value: "À discuter", label: "À discuter" },
];

const TIMELINES = [
  { value: "< 1 semaine",  label: "Moins d'une semaine" },
  { value: "1–2 semaines", label: "1 – 2 semaines" },
  { value: "2–4 semaines", label: "2 – 4 semaines" },
  { value: "> 1 mois",     label: "Plus d'un mois" },
  { value: "Flexible",     label: "Flexible / pas de deadline" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, optional, children }) {
  return (
    <div>
      <label className="block text-sm text-white/70 mb-1.5">
        {label}
        {optional && <span className="text-white/35 ml-1">(Optionnel)</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder-white/25 outline-none focus:border-[#6b5cff]/60 focus:ring-1 focus:ring-[#6b5cff]/40 transition";

export default function Contact() {
  const [form, setForm] = useState({
    email: "",
    discord: "",
    subject: "",
    budget: "",
    timeline: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  function validate() {
    const e = {};
    if (!form.email || !EMAIL_RE.test(form.email)) e.email = "Email valide requis.";
    if (!form.subject) e.subject = "Veuillez sélectionner un sujet.";
    if (!form.message.trim()) e.message = "Le message est requis.";
    return e;
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setStatus("loading");
    setServerError("");

    try {
      const res = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          discord: form.discord || undefined,
          subject: form.subject,
          budget: form.budget || undefined,
          timeline: form.timeline || undefined,
          message: form.message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Request failed");
      setTicketNumber(data.ticketNumber || "");
      setStatus("success");
    } catch (err) {
      setServerError(err.message || "Une erreur est survenue. Réessaie.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[#6b5cff]/15 border border-[#6b5cff]/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-[#a89fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-white/90 mb-3">Message envoyé !</h2>
        {ticketNumber && (
          <p className="text-[#a89fff] font-mono text-lg font-bold mb-3">{ticketNumber}</p>
        )}
        <p className="text-white/55 mb-8">
          Ta demande a bien été reçue. Je te répondrai dans les plus brefs délais par email.
        </p>

        {buildDiscordOAuthUrl(ticketNumber) && (
          <div className="mb-6">
            <p className="text-white/45 text-sm mb-3">
              Join the Discord server to track your ticket and communicate directly.
            </p>
            <a
              href={buildDiscordOAuthUrl(ticketNumber)}
              className="inline-flex items-center gap-2 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/15 px-6 py-3 text-sm font-semibold text-[#7289da] hover:bg-[#5865F2]/25 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.054a19.9 19.9 0 0 0 5.993 3.031.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.11 13.11 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Connect with Discord &amp; join the server
            </a>
          </div>
        )}

        <br />
        <button
          onClick={() => {
            setForm({ email: "", discord: "", subject: "", budget: "", timeline: "", message: "" });
            setTicketNumber("");
            setStatus("idle");
          }}
          className="rounded-full bg-[#6b5cff] px-8 py-3 text-sm font-semibold text-white hover:brightness-110 transition"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-16 pt-8">
      <Helmet>
        <title>Contact — Antonin TACCHI</title>
        <meta name="description" content="Get in touch with Antonin TACCHI for custom FiveM mapping commissions, quotes, or any question. Respond within 24 hours." />
        <link rel="canonical" href="https://antonin-tacchi.fr/contact" />
        {/* Open Graph */}
        <meta property="og:title" content="Contact — Antonin TACCHI" />
        <meta property="og:description" content="Get in touch for custom FiveM mapping commissions, quotes, or any question. Respond within 24 hours." />
        <meta property="og:url" content="https://antonin-tacchi.fr/contact" />
        <meta property="og:type" content="website" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Contact — Antonin TACCHI" />
        <meta name="twitter:description" content="Get in touch for custom FiveM mapping commissions or quotes. Respond within 24 hours." />
      </Helmet>
      <h1 className="text-5xl font-extrabold tracking-tight text-white/90">Contact Me</h1>
      <p className="mt-2 text-white/50">
        Commission, question, réclamation ou bug — je réponds en général sous 24h.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-10 flex flex-col gap-5">

        <Field label="Email">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className={inputClass}
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </Field>

        <Field label="Discord" optional>
          <input
            type="text"
            name="discord"
            value={form.discord}
            onChange={handleChange}
            placeholder="username"
            className={inputClass}
          />
        </Field>

        <Field label="Subject">
          <select
            name="subject"
            value={form.subject}
            onChange={handleChange}
            className={inputClass + " appearance-none cursor-pointer"}
          >
            <option value="" disabled className="bg-[#0f1117]">Select a subject…</option>
            {SUBJECTS.map((s) =>
              s.disabled ? (
                <option key={s.label} disabled className="bg-[#0f1117] text-white/30">{s.label}</option>
              ) : (
                <option key={s.label} value={s.value ?? s.label} className="bg-[#0f1117]">{s.label}</option>
              )
            )}
          </select>
          {errors.subject && <p className="mt-1 text-xs text-red-400">{errors.subject}</p>}
        </Field>

        {COMMISSION_SUBJECTS.includes(form.subject) && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget estimé" optional>
              <select
                name="budget"
                value={form.budget}
                onChange={handleChange}
                className={inputClass + " appearance-none cursor-pointer"}
              >
                <option value="" className="bg-[#0f1117]">Non précisé</option>
                {BUDGETS.map(({ value, label }) => (
                  <option key={value} value={value} className="bg-[#0f1117]">{label}</option>
                ))}
              </select>
            </Field>

            <Field label="Délai souhaité" optional>
              <select
                name="timeline"
                value={form.timeline}
                onChange={handleChange}
                className={inputClass + " appearance-none cursor-pointer"}
              >
                <option value="" className="bg-[#0f1117]">Non précisé</option>
                {TIMELINES.map(({ value, label }) => (
                  <option key={value} value={value} className="bg-[#0f1117]">{label}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <Field label="Message">
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={6}
            placeholder="Décris ta demande, ton projet ou ton problème…"
            className={inputClass + " resize-none"}
          />
          {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
        </Field>

        {status === "error" && serverError && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {serverError}
          </p>
        )}

        <p className="text-xs text-white/35">
          By contacting me, you agree to the{" "}
          <Link to="/terms-of-service" className="underline hover:text-white/60 transition">
            Terms of Services
          </Link>{" "}
          and{" "}
          <Link to="/privacy-policy" className="underline hover:text-white/60 transition">
            Privacy Policy
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full bg-[#6b5cff] py-3.5 text-sm font-semibold text-white shadow-[0_16px_50px_-20px_rgba(107,92,255,0.8)] hover:brightness-110 active:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Envoi en cours…" : "Envoyer"}
        </button>

      </form>
    </div>
  );
}
