import './globals.css'
import type {ReactNode} from 'react'

export const metadata = {
  title: 'Fine Print: contest rules, read for you',
  description: 'An agent on Sanity Context that reads contest rules, surfaces where the pages disagree, and tells you whether you can enter, when it really closes, and when the cash lands.',
}

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
