import { Inter, Roboto_Mono, Monda } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export const monda = Monda({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-monda',
});
