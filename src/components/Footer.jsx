// Co-branding footer: credits the vendor (Spinframe) and the customer (Qube).
export default function Footer() {
  return (
    <footer className="mt-8 border-t border-navy-800">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Halo — vehicle rollout tracking
        </p>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-slate-500">
          <span>Built by</span>
          <img
            src="/brand/spinframe-white.png"
            alt="Spinframe"
            className="h-5 w-auto opacity-90"
          />
          <span className="text-slate-600">·</span>
          <span>for</span>
          <img
            src="/brand/qube.svg"
            alt="Qube Holdings"
            className="h-4 w-auto opacity-90"
          />
        </div>
      </div>
    </footer>
  );
}
