import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Кошик",
  description: "Ваш кошик — системи очищення води Ecosoft.",
};

export default function CartPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Кошик"
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Кошик" },
          ]}
        />
        <CartView />
      </main>
      <Footer />
    </>
  );
}
