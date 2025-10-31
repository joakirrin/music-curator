import clsx from "clsx";

export function FoneaLogo({
  variant = "full",
  className,
  labelClassName,
}: {
  variant?: "full" | "icon";
  className?: string;
  labelClassName?: string;
}) {
  const Icon = (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={clsx("h-8 w-8", className)}
    >
      <g fill="currentColor">
        <circle cx="24" cy="32" r="20" />
        <circle cx="24" cy="32" r="6" fill="white" />
        <path d="M36 22 L50 10 L54 14 L42 26" />
        <rect x="51.5" y="11.5" width="6" height="6" rx="1" />
        <path
          d="M36 46 A16 16 0 0 1 40 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );

  if (variant === "icon") return Icon;

  return (
    <div className="flex items-center gap-2">
      {Icon}
      <span
        className={clsx(
          "text-2xl font-semibold tracking-tight",
          labelClassName
        )}
      >
        fonea
      </span>
    </div>
  );
}
