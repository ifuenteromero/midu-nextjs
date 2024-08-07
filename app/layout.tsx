import { inter, lusitana } from './ui/fonts';
import './ui/global.css';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en' className={`${inter.variable} ${lusitana.variable}`}>
			<body>{children}</body>
		</html>
	);
}
