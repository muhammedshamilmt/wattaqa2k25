import { Hero } from "@/components/Landing/Hero";
import { About } from "@/components/Landing/About";
import { Lineup } from "@/components/Landing/Lineup";
import { Schedule } from "@/components/Landing/Schedule";
import { Contact } from "@/components/Landing/Contact";
import { Footer } from "@/components/Landing/Footer";
import { generateMetadata as generateSEOMetadata, pageSEO } from "@/lib/seo";
import { Metadata } from "next";

// SEO metadata for home page
export const metadata: Metadata = generateSEOMetadata({
  title: pageSEO.home.title,
  description: pageSEO.home.description,
  keywords: pageSEO.home.keywords,
  url: '/',
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-poppins">
      <Hero />
      <About />
      <Lineup />
      <Schedule />
      <Contact />
      <Footer />
    </div>
  );
}