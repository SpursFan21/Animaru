//Animaru\src\app\layout.tsx

"use client";

import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "./../trpc/react";
import { store } from "../redux/store";
import { Provider } from "react-redux";
import { Navbar } from "./_components/Navbar";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} bg-ocean text-light`}>
      <body className="bg-ocean text-light font-sans">
        <Provider store={store}>
          <Navbar />
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Provider>
      </body>
    </html>
  );
}
