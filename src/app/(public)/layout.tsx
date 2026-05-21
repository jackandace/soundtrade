import { CartProvider } from "@/contexts/cart-context";
import { Header } from "@/components/public/Header";
import { MakerBar } from "@/components/public/MakerBar";
import { Footer } from "@/components/public/Footer";
import { SkipLink } from "@/components/SkipLink";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <SkipLink />
      <Header />
      <MakerBar />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </CartProvider>
  );
}
