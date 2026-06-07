import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const API_URL = import.meta.env.VITE_API_URL || "";

const SUBJECTS = [
  "Custom MLO",
  "Exterior Mapping",
  "Optimization",
  "Bug Report",
  "Other",
];

const PRIORITIES = [
  { value: "low",    label: "Low",    desc: "General question or non-urgent request" },
  { value: "medium", label: "Medium", desc: "Ongoing project or time-sensitive inquiry" },
  { value: "high",   label: "High",   desc: "Urgent — blocking production or delivery" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, optional, children }) {
  return (
    <div>
      <label className="block text-sm text-white/70 mb-1.5">
        {label}
        {optional && <span className="text-white/35 ml-1">(Optional)</span>}
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
    priority: "low",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [serverError, setServerError] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  function validate() {
    const e = {};
    if (!form.email || !EMAIL_RE.test(form.email)) e.email = "Valid email required.";
    if (!form.subject) e.subject = "Please select a subject.";
    if (!form.message.trim()) e.message = "Message is required.";
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
          priority: form.priority,
          message: form.message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Request failed");
      setTicketNumber(data.ticketNumber || "");
      setStatus("success");
    } catch (err) {
      setServerError(err.message || "An error occurred. Please try again.");
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
        <h2 className="text-3xl font-extrabold text-white/90 mb-3">Ticket submitted!</h2>
        {ticketNumber && (
          <p className="text-[#a89fff] font-mono text-lg font-bold mb-3">{ticketNumber}</p>
        )}
        <p className="text-white/55 mb-8">
          Your request has been received. I'll get back to you as soon as possible via email.
        </p>
        <button
          onClick={() => {
            setForm({ email: "", discord: "", subject: "", priority: "low", message: "" });
            setTicketNumber("");
            setStatus("idle");
          }}
          className="rounded-full bg-[#6b5cff] px-8 py-3 text-sm font-semibold text-white hover:brightness-110 transition"
        >
          Submit another ticket
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-16 pt-8">
      <Helmet>
        <title>Contact — Antonin TACCHI</title>
        <meta name="description" content="Get in touch with Antonin TACCHI for custom FiveM mapping commissions, quotes, or any question. Respond within 24 hours." />
      </Helmet>
      <h1 className="text-5xl font-extrabold tracking-tight text-white/90">Contact Me</h1>
      <p className="mt-2 text-white/50">
        Reach out for commissions, quotes, or any question. I typically respond within 24 hours.
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
            {SUBJECTS.map((s) => (
              <option key={s} value={s} className="bg-[#0f1117]">{s}</option>
            ))}
          </select>
          {errors.subject && <p className="mt-1 text-xs text-red-400">{errors.subject}</p>}
        </Field>

        <Field label="Priority">
          <div className="flex flex-col gap-2">
            {PRIORITIES.map(({ value, label, desc }) => (
              <label
                key={value}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                  form.priority === value
                    ? "border-[#6b5cff]/60 bg-[#6b5cff]/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={value}
                  checked={form.priority === value}
                  onChange={handleChange}
                  className="mt-0.5 accent-[#6b5cff]"
                />
                <div>
                  <div className="text-sm font-medium text-white/85">{label}</div>
                  <div className="text-xs text-white/40">{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Message">
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={6}
            placeholder="Describe your project or question…"
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
          {status === "loading" ? "Submitting…" : "Submit Ticket"}
        </button>

      </form>
    </div>
  );
}
