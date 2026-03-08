import { FaDiscord, FaGithub } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { FiShoppingBag } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* Icons row */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-white/70">
          <a href="#" className="flex items-center gap-2 hover:text-white transition">
            <FaDiscord size={16} />
            <span>Discord</span>
          </a>

          <a
            href="mailto:contact@example.com"
            className="flex items-center gap-2 hover:text-white transition"
          >
            <HiOutlineMail size={16} />
            <span>Email</span>
          </a>

          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-white transition"
          >
            <FaGithub size={16} />
            <span>Github</span>
          </a>

          <a href="#" className="flex items-center gap-2 hover:text-white transition">
            <FiShoppingBag size={16} />
            <span>Marketplace</span>
          </a>
        </div>

        {/* Legal links */}
        <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-white/40">
          <a href="#" className="hover:text-white transition">
            Terms of Services
          </a>
          <span className="text-white/20">|</span>
          <a href="#" className="hover:text-white transition">
            Privacy Policy
          </a>
          <span className="text-white/20">|</span>
          <a href="#" className="hover:text-white transition">
            legal notices
          </a>
        </div>
      </div>
    </footer>
  );
}