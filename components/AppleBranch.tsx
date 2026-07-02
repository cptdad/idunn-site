export default function AppleBranch({
  className = "",
}: {
  className?: string;
}) {
  // Subtil äppelgren som avdelare, i guldton.
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <span className="h-px w-16 bg-line" />
      <svg
        width="46"
        height="24"
        viewBox="0 0 46 24"
        fill="none"
        aria-hidden="true"
        className="text-gold"
      >
        <path
          d="M2 12h18"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M12 12c2-4 6-5 9-4"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="30" cy="9" r="5" stroke="currentColor" strokeWidth="1" />
        <path
          d="M30 4c1-2 3-2 4-1"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      <span className="h-px w-16 bg-line" />
    </div>
  );
}
