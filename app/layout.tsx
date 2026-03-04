import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../store/CartContext";
import { AuthProvider } from "../store/AuthContext";
import CartDrawer from "../components/CartDrawer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "'Arif Buuku | Your E-Commerce Bookstore",
  description: "Premier destination for computing texts and modern fiction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <CartDrawer />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}