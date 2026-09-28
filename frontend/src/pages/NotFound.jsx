import { Link } from "react-router-dom";

/** 404 route (PLAN.md §12 Phase 2). */
export default function NotFound() {
  return (
    <section className="flex flex-col items-center gap-3 py-16 text-center">
      <span aria-hidden="true" className="text-4xl">
        🧭
      </span>
      <h1 className="text-3xl font-bold text-slate-900">404 — page not found</h1>
      <p className="max-w-md text-sm text-slate-600">
        That page does not exist. It may have been renamed, or the link may be broken.
      </p>
      <Link to="/" className="btn btn-primary">
        Go to the browse page
      </Link>
    </section>
  );
}
