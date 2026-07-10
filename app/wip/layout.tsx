import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function WipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
