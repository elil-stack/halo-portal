// The "Halo" system mark — a tilted green ring evoking a halo.
export default function HaloMark({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="6"
        transform="rotate(-24 16 16)"
        stroke="#22c55e"
        strokeWidth="3"
      />
      <circle cx="16" cy="16" r="2.4" fill="#22c55e" />
    </svg>
  );
}
