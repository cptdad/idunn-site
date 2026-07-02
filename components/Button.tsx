import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
};

export default function Button({
  href,
  children,
  variant = "solid",
  className = "",
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-full px-7 py-3 text-sm tracking-wide transition-colors duration-300";
  const styles =
    variant === "solid"
      ? "bg-gold text-cream hover:bg-gold-light"
      : "border border-gold text-ink hover:bg-gold hover:text-cream";
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}
