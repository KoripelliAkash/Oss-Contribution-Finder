/** Skeletons, not spinners, while the browse page loads. */
export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading results…</span>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card space-y-3" aria-hidden="true">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
