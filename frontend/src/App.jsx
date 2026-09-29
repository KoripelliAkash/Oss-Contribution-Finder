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

const GITHUB_MARK_PATH =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z";

/* ------------------------------------------------------------------ */
/* NavBar                                                              */
/* ------------------------------------------------------------------ */

function NavBar() {
  const { count } = useSaved();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas-inset/95 backdrop-blur supports-[backdrop-filter]:bg-canvas-inset/80">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-4 px-4 md:px-6">
        {/* Brand */}
        <Link
          to="/"
          className="no-underline flex shrink-0 items-center gap-2 text-fg"
          aria-label="Open Source Contribution Finder — home"
        >
          <svg
            viewBox="0 0 16 16"
            width="32"
            height="32"
            aria-hidden="true"
            className="fill-fg"
          >
            <path fillRule="evenodd" d={GITHUB_MARK_PATH} />
          </svg>
          <span className="hidden text-sm font-semibold sm:inline">
            Open Source Contribution Finder
          </span>
        </Link>

        {/* Nav */}
        <nav
          className="ml-auto flex h-full items-stretch"
          aria-label="Main navigation"
        >
          <NavLink to="/" end className="nav-link">
            Browse
          </NavLink>
          <NavLink to="/saved" className="nav-link">
            Saved
            {count > 0 ? (
              <span className="counter" aria-label={`${count} saved items`}>
                {count}
              </span>
            ) : null}
          </NavLink>
          <NavLink to="/about" className="nav-link">
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border bg-canvas-inset">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-8 text-xs text-fg-muted md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 16 16"
            width="20"
            height="20"
            aria-hidden="true"
            className="fill-fg-subtle"
          >
            <path fillRule="evenodd" d={GITHUB_MARK_PATH} />
          </svg>
          <span>&copy; {year} Open Source Contribution Finder</span>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <li>
            <Link to="/about" className="hover:text-fg hover:underline">
              About
            </Link>
          </li>
          <li>
            <a
              href="https://docs.github.com/en/rest"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-fg hover:underline"
            >
              GitHub API
            </a>
          </li>
          <li>
            <a
              href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-fg hover:underline"
            >
              Privacy
            </a>
          </li>
        </ul>
      </div>  
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SavedProvider>
          <BrowserRouter>
            <div className="flex min-h-screen flex-col">
              <NavBar />
              <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-6">
                <Routes>
                  <Route path="/" element={<Browse />} />
                  <Route path="/saved" element={<Saved />} />
                  <Route
                    path="/project/:owner/:repo/issues"
                    element={<ProjectIssues />}
                  />
                  <Route
                    path="/project/:owner/:repo"
                    element={<ProjectDetail />}
                  />
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