import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { SettingsProvider } from "./context/SettingsContext";
import AdminRoute from "./routes/AdminRoute";

import Layout from "./layout/Layout";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import LegalNotices from "./pages/LegalNotices";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// Admin — chargés uniquement quand on accède à /admin
const AdminLogin      = lazy(() => import("./pages/admin/Login"));
const AdminLayout     = lazy(() => import("./layout/AdminLayout"));
const Dashboard       = lazy(() => import("./pages/admin/Dashboard"));
const AdminProjects   = lazy(() => import("./pages/admin/AdminProjects"));
const AdminProjectForm = lazy(() => import("./pages/admin/AdminProjectForm"));
const AdminFilters    = lazy(() => import("./pages/admin/AdminFilters"));
const AdminTags       = lazy(() => import("./pages/admin/AdminTags"));
const AdminSettings   = lazy(() => import("./pages/admin/AdminSettings"));
const AdminStats      = lazy(() => import("./pages/admin/AdminStats"));

function AdminFallback() {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#6b5cff] border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
      <FavoritesProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#18181b",
            color: "#e5e5e5",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#18181b" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#18181b" } },
        }}
      />
      <Routes>
        {/* Public site */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:slug" element={<ProjectDetails />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="legal-notices" element={<LegalNotices />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<Suspense fallback={<AdminFallback />}><AdminLogin /></Suspense>} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </Suspense>
          }
        >
          <Route index element={<Suspense fallback={null}><Dashboard /></Suspense>} />
          <Route path="projects" element={<Suspense fallback={null}><AdminProjects /></Suspense>} />
          <Route path="projects/new" element={<Suspense fallback={null}><AdminProjectForm /></Suspense>} />
          <Route path="projects/:id/edit" element={<Suspense fallback={null}><AdminProjectForm /></Suspense>} />
          <Route path="filters" element={<Suspense fallback={null}><AdminFilters /></Suspense>} />
          <Route path="tags" element={<Suspense fallback={null}><AdminTags /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={null}><AdminSettings /></Suspense>} />
          <Route path="stats"    element={<Suspense fallback={null}><AdminStats /></Suspense>} />
        </Route>
      </Routes>
      </FavoritesProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
