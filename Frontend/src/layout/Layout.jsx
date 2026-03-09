import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "../components/Header";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1115] to-[#1C202A] text-zinc-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
