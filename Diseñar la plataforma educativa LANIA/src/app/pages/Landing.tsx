import { LandingNav } from './landing/LandingNav'
import { Hero } from './landing/Hero'
import { Benefits, ClassPreview, Topics } from './landing/ProductSections'
import { Method, MissionsBand, RoomsPreview } from './landing/MethodSections'
import { Faq, FinalCta, Footer, Pricing } from './landing/ClosingSections'

/** A · Landing page */
export function Landing() {
  return (
    <div className="min-h-dvh bg-canvas">
      <LandingNav />
      <main>
        <Hero />
        <Topics />
        <Benefits />
        <ClassPreview />
        <Method />
        <RoomsPreview />
        <MissionsBand />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
