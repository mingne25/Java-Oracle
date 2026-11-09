// @ts-expect-error Next.js handles global CSS imports at build time.
import './globals.css';
export const metadata = { title: 'Emerald Campus | Quản lý sinh viên', description: 'Nền tảng quản lý sinh viên - Oracle 26ai' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="vi"><body>{children}</body></html> }
