import React from 'react';
import LandingHeader from '../components/landing/LandingHeader.jsx';
import Hero from '../components/landing/Hero.jsx';
import Services from '../components/landing/Services.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import CTA from '../components/landing/CTA.jsx';
import Footer from '../components/landing/Footer.jsx';

export default function Landing() {
  return (
    <div className="app">
      <LandingHeader />
      <Hero />
      <Services />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
