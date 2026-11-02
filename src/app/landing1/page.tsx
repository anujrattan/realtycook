import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { HeroLanding1 } from "@/components/site/hero-landing1";
import { CompareLanding1, ContactLanding1, ModesLanding1 } from "@/components/site/landing1-sections";
import { Process } from "@/components/site/process";

export default function Landing1Page() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroLanding1 />
        <ModesLanding1 />
        <Process interactive />
        <CompareLanding1 />
        <ContactLanding1 />
      </main>
      <Footer />
    </>
  );
}
