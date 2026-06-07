import { Link } from "react-router-dom";
import { FaDiscord, FaGithub, FaTiktok, FaYoutube } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { FiShoppingBag } from "react-icons/fi";
import { useSettings } from "../context/SettingsContext";

const SOCIAL_LINKS = [
  { key: "discord",     icon: FaDiscord,      label: "Discord",      prefix: "" },
  { key: "email",       icon: HiOutlineMail,  label: "Email",        prefix: "mailto:" },
  { key: "github",      icon: FaGithub,       label: "Github",       prefix: "" },
  { key: "marketplace", icon: FiShoppingBag,  label: "Marketplace",  prefix: "" },
  { key: "tiktok",      icon: FaTiktok,       label: "TikTok",       prefix: "" },
  { key: "youtube",     icon: FaYoutube,      label: "YouTube",      prefix: "" },
];

export default function Footer() {
  const settings = useSettings();

  const activeLinks = SOCIAL_LINKS.filter(({ key }) => settings[key]);

  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* Social links */}
        {activeLinks.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-white/70">
            {activeLinks.map(({ key, icon: Icon, label, prefix }) => (
              <a
                key={key}
                href={`${prefix}${settings[key]}`}
                target={key !== "email" ? "_blank" : undefined}
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <Icon size={16} />
                <span>{label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Legal links */}
        <div className={`flex items-center justify-center gap-3 text-[10px] text-white/40 ${activeLinks.length > 0 ? "mt-3" : ""}`}>
          <Link to="/terms" className="hover:text-white transition">Terms of Services</Link>
          <span className="text-white/20">|</span>
          <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <span className="text-white/20">|</span>
          <Link to="/legal" className="hover:text-white transition">Legal notices</Link>
        </div>
      </div>
    </footer>
  );
}
