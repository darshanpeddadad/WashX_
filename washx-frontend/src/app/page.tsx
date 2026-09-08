'use client';

import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import HeroSection from '@/components/landing/HeroSection';
import CityCoverageTicker from '@/components/landing/CityCoverageTicker';
import LiveEstimator from '@/components/landing/LiveEstimator';
import ProcessSteps from '@/components/landing/ProcessSteps';
import GarmentSpecimenRegistry from '@/components/landing/GarmentSpecimenRegistry';
import ExpressPassCallout from '@/components/landing/ExpressPassCallout';
import ReviewsSection from '@/components/landing/ReviewsSection';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflowX: 'hidden' }}>
      {/* Dynamic Ambient Mesh Glows */}
      <div className="mesh-glow-blue" style={{ top: '-140px', left: '15%' }} />
      <div className="mesh-glow-cyan" style={{ top: '450px', right: '-50px' }} />

      {/* Universal Sticky Header */}
      <Navbar showNavLinks={true} />

      {/* Hero Section */}
      <HeroSection />

      {/* Active Metros Ticker */}
      <CityCoverageTicker />

      {/* Live Load & Price Calculator */}
      <LiveEstimator />

      {/* 4-Step Process Pipeline */}
      <ProcessSteps />

      {/* Garment Catalog & Rates Registry */}
      <GarmentSpecimenRegistry />

      {/* Express Pass Subscription Callout */}
      <ExpressPassCallout />

      {/* Customer Trust & Reviews Grid */}
      <ReviewsSection />

      {/* Universal Footer */}
      <Footer />
    </div>
  );
}
