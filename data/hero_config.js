/**
 * COAST AIRBRUSH EUROPE - HERO & LANDING CONFIGURATION
 * Factory default settings and data structure for the storefront Hero & Landing Showcase.
 * Editable via the Master Admin Console (PIN protected).
 */

export const DEFAULT_HERO_CONFIG = {
  authorityPill: {
    statusText: "✦ OFFICIAL EUROPEAN MASTER HUB",
    locationText: "PLACENTIA, CA AUTHORIZED"
  },
  headline: {
    prefixText: "THE EUROPEAN MASTER HUB FOR",
    accentText: "KROMA EDGE CHROME, FLAKE KING & VSIONAIR"
  },
  subheadline: "Engineered for automotive refinishers, custom shops & airbrush artists across Europe.",
  description: "Direct European bonded dispatch from our UK logistics center. Zero US import customs, next-day tracked APC & DHL Express, full EU REACH & VOC regulatory compliance, and factory-authorized technical support.",
  quickJumpButtons: [
    {
      id: "jump-1",
      label: "01 • Kroma Chrome & Clears",
      target: "#dept-kroma-edge",
      style: "candy",
      icon: "arrow_downward"
    },
    {
      id: "jump-2",
      label: "02 • Flake King Guns",
      target: "#dept-guns",
      style: "amber",
      icon: "arrow_downward"
    },
    {
      id: "jump-3",
      label: "03 • Metal Flakes",
      target: "#dept-flakes",
      style: "neutral",
      icon: "arrow_downward"
    },
    {
      id: "jump-4",
      label: "04 • Fine Line Tapes",
      target: "#dept-tapes",
      style: "neutral",
      icon: "arrow_downward"
    },
    {
      id: "jump-5",
      label: "Video Proof",
      target: "#section-booth-proof",
      style: "rose",
      icon: "smart_display"
    },
    {
      id: "jump-6",
      label: "05 • VsionAir",
      target: "#dept-vsionair",
      style: "neutral",
      badge: "2026 Direct"
    }
  ],
  tradeCallout: {
    badge: "💼 TRADE & WHOLESALE:",
    text: "Bodyshops, Retailers & Importers —",
    linkText: "Apply for Trade Pricing & Net Ex-VAT Billing",
    linkUrl: "dealers.html"
  },
  trustLine: "Dispatched from UK Hub • Tracked APC Overnight & DHL Express • 100% REACH & VOC Certified • Zero US Customs",
  slides: [
    {
      id: "slide-1",
      image: "assets/images/kroma-skull-mirror.jpg",
      caption: "01/06 • 100% Mirror Anatomic Chrome Skull (Zero Gray Haze)",
      badge: "Zero Gray Clouding",
      position: "center right 18%"
    },
    {
      id: "slide-2",
      image: "assets/images/kroma-silver-surfer-wave.jpg",
      caption: "02/06 • Full-Scale Silver Surfer on Ocean Wave (Pier Sunset)",
      badge: "Full Figure Liquid Chrome",
      position: "center right 10%"
    },
    {
      id: "slide-3",
      image: "assets/images/kroma-helmet-mirror.jpg",
      caption: "03/06 • 99.4% Specular Mirror Racing Helmet (Standard 2K Clearcoat)",
      badge: "Standard 2K Clearcoat Applied",
      position: "center right 15%"
    },
    {
      id: "slide-4",
      image: "assets/images/kroma-silver-surfer-front.jpg",
      caption: "04/06 • Liquid Metal Silver Surfer Front Profile (HVLP Applied)",
      badge: "HVLP 1.3mm Tip Applied",
      position: "center right 15%"
    },
    {
      id: "slide-5",
      image: "assets/images/kroma-silver-surfer-back.jpg",
      caption: "05/06 • Back Anatomy & Platelet Alignment Reflection",
      badge: "Self-Aligning Platelets",
      position: "center right 15%"
    },
    {
      id: "slide-6",
      image: "assets/images/flake_buggy_hero.jpg",
      caption: "06/06 • Custom Flake Sand Rail & Chassis (Coast Signature)",
      badge: "Coast Signature Flake Finish",
      position: "center right 10%"
    }
  ]
};
