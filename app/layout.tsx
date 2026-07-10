import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://idunn-estetik.se"),
  title: {
    default: "Iðunn Estetik Stockholm — naturliga resultat, medicinsk trygghet",
    template: "%s · Iðunn Estetik",
  },
  description:
    "Estetisk klinik i Stockholm nära Gullmarsplan. Legitimerad sjuksköterska. Naturliga resultat och långsiktigt underhåll — aldrig mer än vad som behövs.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: "Iðunn Estetik Stockholm",
    description:
      "Naturliga resultat, medicinsk trygghet och långsiktigt underhåll i Stockholm.",
    locale: "sv_SE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
