import { Providers } from './providers'
import { Poppins, Nunito_Sans } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-nunito-sans',
})

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-lt-installed="true">
      <body className={`${poppins.variable} ${nunitoSans.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}