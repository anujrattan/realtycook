import { Calculator } from "@/components/site/calculator";
import { Compare } from "@/components/site/compare";
import { Contact } from "@/components/site/contact";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { Listings } from "@/components/site/listings";
import { Modes } from "@/components/site/modes";
import { Process } from "@/components/site/process";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Modes />
        <Process />
        <Listings />
        <Calculator />
        <Compare />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
