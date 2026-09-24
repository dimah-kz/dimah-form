import { HomeBackground } from "@/components/home-background";
import { CoreFeatures } from "@/components/home/core-features";
import { HeroSection } from "@/components/home/hero-section";
import { MinimalCta } from "@/components/home/minimal-cta";

export default function HomePage() {
  return (
    <div className="relative isolate min-h-screen w-full overflow-x-clip px-4 sm:px-6 lg:px-8">
      <HomeBackground />

      <main className="mx-auto w-full max-w-7xl">
        <HeroSection />
        <CoreFeatures />
        <MinimalCta />
      </main>
    </div>
  );
}
