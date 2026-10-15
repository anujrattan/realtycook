import type { Metadata, Viewport } from "next";
import { Inter, Kristi, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const kristi = Kristi({ variable: "--font-kristi", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "RealtyCook — Buy, sell & invest in real estate",
  description:
    "RealtyCook helps you buy homes, sell at the right price and build a property portfolio — resale, new launch, pre-leased commercial, plots and fractional ownership, with one advisor from search to registration.",
  applicationName: "RealtyCook",
  openGraph: {
    title: "RealtyCook — Trust for growth",
    description: "Buy, sell and invest in real estate with one advisor, start to finish.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${kristi.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
