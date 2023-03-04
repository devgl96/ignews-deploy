import "@/styles/globals.scss";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";

import { Header } from "../components/Header";

import { SessionProvider as NextAuthProvider } from "next-auth/react";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <NextAuthProvider session={session}>
      <Header />
      <Component {...pageProps} />
    </NextAuthProvider>
  );
}
