import { HomeBackground } from "@/components/home-background";
import { CoreFeatures } from "@/components/home/core-features";
import { HeroSection } from "@/components/home/hero-section";
import { MinimalCta } from "@/components/home/minimal-cta";

export default function HomePage() {
  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8">
      <HomeBackground />

      <main className="mx-auto max-w-7xl">
        {/* Minimal Hero with interactive code & live demo */}
        <HeroSection />

        {/* 1 Single Minimal Section: Core 3 Pillars */}
        <CoreFeatures />

        {/* Minimal Bottom CTA */}
        <MinimalCta />
      </main>
    </div>
  );
}
