import { Link } from "react-router-dom";

/** About page: what this is, where the data comes from, and the privacy story. */
export default function About() {
  return (
    <section className="flex w-full flex-col gap-6 text-sm text-fg-muted">
      {/* Page header */}
      <header>
        <h1 className="text-2xl font-semibold leading-tight text-fg">
          About this project
        </h1>
        <p className="mt-2 max-w-3xl">
          The Open Source Contribution Finder helps you find open source work you can
          pick up today: open issues labelled{" "}
          <code>good first issue</code> or <code>help wanted</code>, plus repositories
          that actively welcome contributions.
        </p>
      </header>

      {/* Two-column body */}
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-6">
          <section className="card">
            <h2 className="text-base font-semibold text-fg">
              Where the data comes from
            </h2>
            <p className="mt-2">
              Everything is read from the GitHub REST and Search APIs. Responses are
              cached to stay well within GitHub's rate limits, so results load quickly
              and you're never rate-limited by your own browsing.
            </p>
            <p className="mt-2">
              Data from the GitHub API. Not affiliated with GitHub. Every card links
              straight to GitHub — contribute there, not here.
            </p>
          </section>

          <section className="card">
            <h2 className="text-base font-semibold text-fg">
              How saved items work
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                Saved items live in your browser's local storage — there is no
                account and no database. Nothing leaves your device unless you
                explicitly export or share it.
              </li>
              <li>
                <strong className="font-semibold text-fg">Download saves</strong>{" "}
                writes a <code>saved-YYYY-MM-DD.json</code> file you can keep or move
                to another device with{" "}
                <strong className="font-semibold text-fg">Import saves</strong>.
              </li>
              <li>
                <strong className="font-semibold text-fg">Copy share link</strong>{" "}
                packs the same items into the URL itself, so a friend opening it on a
                fresh device sees your list. Long lists exceed safe URL lengths, so
                the button disables itself — export a file instead.
              </li>
              <li>
                Imports merge by <code>(type, id)</code> and keep whichever copy was
                saved most recently.
              </li>
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="flex min-w-0 flex-col gap-6">
          <section className="card">
            <h2 className="text-base font-semibold text-fg">Learn more</h2>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a
                  href="https://docs.github.com/en/rest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  GitHub REST API ↗
                </a>
              </li>
              <li>
                <a
                  href="https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Issue search syntax ↗
                </a>
              </li>
              <li>
                <a
                  href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  GitHub privacy statement ↗
                </a>
              </li>
            </ul>
          </section>

          <section className="card">
            <h2 className="text-base font-semibold text-fg">Privacy at a glance</h2>
            <ul className="mt-2 space-y-1.5">
              <li>No accounts. No tracking. No ads.</li>
              <li>No cookies are set by this app.</li>
              <li>Saves stay on your device until you export or share them.</li>
            </ul>
          </section>
        </aside>
      </div>

      {/* Footer action */}
      <p>
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
        >
          <span aria-hidden="true">←</span> Back to browsing
        </Link>
      </p>
    </section>
  );
}