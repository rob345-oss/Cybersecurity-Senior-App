import NavBar from './components/home/NavBar'
import Hero from './components/home/Hero'
import LogosStrip from './components/home/LogosStrip'
import Features from './components/home/Features'
import HowItWorks from './components/home/HowItWorks'
import ProtectedPhoneNumbers from './components/home/ProtectedPhoneNumbers'
import Pricing from './components/home/Pricing'
import FAQ from './components/home/FAQ'
import FinalCTA from './components/home/FinalCTA'
import Footer from './components/home/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavBar />
      <Hero />
      <LogosStrip />
      <Features />
      <HowItWorks />
      <ProtectedPhoneNumbers />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}

