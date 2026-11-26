import type {Metadata} from 'next'; import './globals.css';
export const metadata:Metadata={title:'CINETECH — Every story has a universe',description:'Find your next favourite story. Discover films and series curated for every mood.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
