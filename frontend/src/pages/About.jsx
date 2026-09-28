import { Link } from "react-router-dom";
import { API_BASE_URL } from "../api/client";

/** About page: what this is, where the data comes from, and the privacy story. */
export default function About() {
  return (
    <section className="flex max-w-3xl flex-col gap-5 text-sm text-slate-700">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">About this project</h1>
        <p className="mt-2">
          The Open Source Contribution Finder helps you find open source work you can actually pick up
          today: open issues labelled <code>good first issue</code> or <code>help wanted</code>, plus
          repositories that actively welcome contributions.
        </p>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-800">Where the data comes from</h2>
        <p className="mt-1">
          Everything is read from the GitHub REST and Search APIs through this app’s backend, which
          holds the GitHub token so your browser never sees it. Responses are cached in memory for
          about ten minutes to stay well inside GitHub’s rate limits.
        </p>
        <p className="mt-2">
          Data from the GitHub API. Not affiliated with GitHub. Every card links straight to
          GitHub — contribute there, not here.
        </p>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-800">How saved items work</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Saved items live in your browser’s local storage — there is no account and no database.
          </li>
          <li>
            <strong>Download saves</strong> writes a <code>saved-YYYY-MM-DD.json</code> file you can
            keep or move to another device with <strong>Import saves</strong>.
          </li>
          <li>
            <strong>Copy share link</strong> packs the same items into the URL itself, so a friend
            opening it on a fresh device sees your list. Long lists exceed safe URL lengths, so the
            button disables itself — export a file instead.
          </li>
          <li>Imports merge by <code>(type, id)</code> and keep whichever copy was saved most recently.</li>
        </ul>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-slate-800">This deployment</h2>
        <p className="mt-1">
          API base URL: <code>{API_BASE_URL}</code>
        </p>
        <p className="mt-1">
          Backend health: <code>{API_BASE_URL}/api/health</code>
        </p>
      </div>

      <p>
        <Link to="/" className="font-medium text-brand-600 hover:text-brand-700">
          ← Back to browsing
        </Link>
      </p>
    </section>
  );
}
