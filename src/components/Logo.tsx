import { cx } from "../lib/cx";

/** Brand mark + wordmark. Purely visual; screens provide their own heading text. */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className={cx("logo", size === "lg" && "logo--lg")} aria-hidden="true">
      <svg className="logo__mark" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        <path
          d="M7 20.5c2.6-5.6 4.8-8.7 6.6-6.4 1.6 2-.6 6.6 2.4 6.6 3 0 3.7-8.6 9-9.2"
          fill="none"
          stroke="#fff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="logo__word">
        Sketch<span className="logo__accent">Rush</span>
      </span>
    </span>
  );
}
