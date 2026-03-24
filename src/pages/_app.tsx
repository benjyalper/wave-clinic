import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Wave - מערכת ניהול קליניקה</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&family=Assistant:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div dir="rtl" style={{ fontFamily: "'Rubik', 'Assistant', sans-serif" }}>
        <Component {...pageProps} />
      </div>
    </>
  )
}
