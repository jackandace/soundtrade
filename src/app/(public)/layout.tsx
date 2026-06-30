import { CartProvider } from "@/contexts/cart-context";
import { Header } from "@/components/public/Header";
import { MakerBar } from "@/components/public/MakerBar";
import { Footer } from "@/components/public/Footer";
import { SkipLink } from "@/components/SkipLink";
import { getCategoryNav } from "@/lib/categories-server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categoryNav = await getCategoryNav();
  return (
    <CartProvider>
      <SkipLink />
      <Header categoryNav={categoryNav} />
      <MakerBar />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </CartProvider>
  );
}
