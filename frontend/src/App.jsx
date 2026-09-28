import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import { SavedProvider } from "./context/SavedProvider";
import { useSaved } from "./hooks/useSaved";
import About from "./pages/About";
import Browse from "./pages/Browse";
import NotFound from "./pages/NotFound";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectIssues from "./pages/ProjectIssues";
import Saved from "./pages/Saved";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
  }`;

function NavBar() {
  const { count } = useSaved();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <span aria-hidden="true">⭐</span>
          Open Source Contribution Finder
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClass}>
            Browse
          </NavLink>
          <NavLink to="/saved" className={navLinkClass}>
            Saved{count > 0 ? ` (${count})` : ""}
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-slate-500">
        <p>Data from the GitHub API. Not affiliated with GitHub.</p>
        <p>Your saves are stored only on this device — they are never sent to our servers.</p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SavedProvider>
          <BrowserRouter>
            <div className="flex min-h-screen flex-col">
              <NavBar />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
                <Routes>
                  <Route path="/" element={<Browse />} />
                  <Route path="/saved" element={<Saved />} />
                  <Route path="/project/:owner/:repo/issues" element={<ProjectIssues />} />
                  <Route path="/project/:owner/:repo" element={<ProjectDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </SavedProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
