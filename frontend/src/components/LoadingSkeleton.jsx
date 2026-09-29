/** Skeletons, not spinners, while the browse page loads. */
export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div
      className="grid w-full grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading results…</span>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card flex flex-col gap-4 p-5" aria-hidden="true">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton mt-auto h-4 w-2/5" />
        </div>
      ))}
    </div>
  );
}
