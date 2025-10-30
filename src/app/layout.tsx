//Animaru\src\app\layout.tsx

"use client";

import "../styles/globals.css";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "./../trpc/react";
import { store } from "../redux/store";
import { Provider } from "react-redux";
import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import AuthBootstrap from "./_components/AuthBootstrap";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} bg-blue-950 text-slate-100`}>
      <body className="bg-blue-950 text-slate-100 font-sans min-h-screen">
        <Provider store={store}>

          {/* Keeps Redux in sync with Supabase session on load & changes */}
          <AuthBootstrap />
          
          <Navbar />
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Footer />
        </Provider>
      </body>
    </html>
  );
}

