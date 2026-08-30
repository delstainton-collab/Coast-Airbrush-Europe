// Coast Airbrush Europe - Agent C: Social Media & Growth AI Agent ("The Kustom Marketer")

export const VIRAL_CAMPAIGNS = [
  {
    id: "camp_001",
    title: "Liquid Mirror Chrome on Chopper Tank",
    platform: "Instagram Reels",
    scheduledTime: "Today @ 18:30 CET (Peak European Engagement)",
    videoUrl: "https://lh3.googleusercontent.com/aida/AEtjO1Vhrrnuz3jyhR4A0VX8t7zfqmk0kYdRywsYSqJWXeW8Oco_wrh0AZMEPer9BfEyRuPQ94qoCa3JT_UuxD3aP5BBBwduH7LkKrN06tLjmOT1NRwztFGa8s0DXLr8PUMQPRGBsaqrGbgL3iJxKqi_goQBP-DNY8em3IbknCAhqczGmb0Lfr1P_5cwsl_ds1OcfCK1QnQ57Vfe5ZYh9feqsvgIkBSNRYEgSktNsB_HaTEu3y83TgcqNevPUarJ",
    hook: "Is this real chrome or spray paint? 🤯 Watch Kroma Edge mirror up in real time!",
    caption: "Stop paying €2,000 for electroplating. Kroma Edge Sprayable Mirror Chrome lets you spray real liquid metal directly over high-gloss black with a 0.8mm mini gun. In stock across EU & UK hubs with 24h dispatch! 🚀",
    hashtags: ["#KromaEdge", "#LiquidChrome", "#CustomPaint", "#ChopperBuild", "#AirbrushArt", "#CustomGraphics"],
    featuredSku: "KE-CHROME-1L",
    featuredProduct: "Kroma Edge Mirror Spray Chrome System (1 Litre)",
    priceUSD: 145.00,
    projectedViews: "85.4K",
    estConversionRate: "3.8%"
  },
  {
    id: "camp_002",
    title: "Dry Flake Spraying with Flake King 500",
    platform: "TikTok",
    scheduledTime: "Tomorrow @ 19:00 CET",
    videoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYjvbnNECBYPygPVQ1XL5eFtbNAmCtclEB4Fs-w1E49c54w1fzpbaTbq8eSxt34Ynv0Qhlga9hV304V0qQncK8geyEPrG_3inqk1VVoJkvEagwpqgWsdEV7Mf5gmBGF78EL1zUnPTSs9LluAu4MUIL3hjsUZxJbGFm9Nl7c71CIJQ66TnHKdxpYgzJ47g5QeLUTaGxConxq3L2h6aFOBEyyiLhIO_ID7C-TZ2P6VxDLLLO0XiHbNbMqA",
    hook: "Why mixing flake in clearcoat is RUINING your metalflake paint jobs 🚫✨",
    caption: "The Flake King 500 dry flake gun shoots 0.015\" hex flake completely DRY onto wet intercoat clear. Zero clogged fluid tips, zero buried flake sinking to the bottom. Get yours before this batch sells out!",
    hashtags: ["#FlakeKing", "#MetalFlake", "#LowriderPaint", "#CustomHelmet", "#GarageLife"],
    featuredSku: "FK-500-GUN",
    featuredProduct: "Flake King 500 Dry Flake Spray Gun",
    priceUSD: 189.00,
    projectedViews: "142.0K",
    estConversionRate: "4.2%"
  },
  {
    id: "camp_003",
    title: "Nebula Color-Shift Pearl Masterclass",
    platform: "YouTube Shorts",
    scheduledTime: "Wednesday @ 17:00 CET",
    videoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBU8kCBWAmdFaGsVAGlOict2oqcARIbnI7p-eNn0NUwUBdwR5TtiYD3b_TNtwaieX0IBB99hle6vpUv6qU4DYPXX9NWILucwcy0_leBFqbdE8LFD8j0yzRN-zOKh225Fdz1bfM40IZh4-bNxCJw5oIH65KbEQJ4POOIBejKJfCcAmaX6eMOBFZOelse4U0VfRRuyHaD7Er66aLBSLDJZ8kYHzda3_1mQf0iB0Rm_aIdRPWPxSdz1j8FMw",
    hook: "The secret to spraying Nebula Color-Shift Pearl without clouding or blotches 🏎️🔥",
    caption: "Step-by-step ratio guide: Jet Black gloss ground coat + Kroma Edge Nebula Pearl in intercoat binder with 2K Speed Clearcoat. Complete kit link in bio!",
    hashtags: ["#KromaEdge", "#ColorShift", "#CustomAirbrush", "#CustomBike", "#AirbrushTutorial"],
    featuredSku: "KE-PEARL-NEB",
    featuredProduct: "Kroma Edge Nebula Color-Shift Pearl 25g",
    priceUSD: 28.50,
    projectedViews: "62.8K",
    estConversionRate: "5.1%"
  }
];

export const TRENDING_HASHTAGS = [
  { tag: "#KromaEdge", posts24h: "18.6K", velocity: "+64%", sentiment: "Viral" },
  { tag: "#FlakeKing", posts24h: "9.1K", velocity: "+29%", sentiment: "High" },
  { tag: "#CustomAirbrush", posts24h: "14.4K", velocity: "+18%", sentiment: "Steady" },
  { tag: "#AirbrushArt", posts24h: "24.9K", velocity: "+15%", sentiment: "High" },
  { tag: "#CustomPaint", posts24h: "31.2K", velocity: "+22%", sentiment: "Very High" }
];

export class SocialGrowthAI {
  constructor(cartManager) {
    this.cartManager = cartManager;
    this.campaigns = [...VIRAL_CAMPAIGNS];
    this.hashtags = [...TRENDING_HASHTAGS];
  }

  /**
   * Evaluates user DM/Comment and generates instant response with direct 1-click checkout permalink.
   */
  processSocialDM(messageText) {
    const text = (messageText || "").toLowerCase();
    let matchedCampaign = this.campaigns[0]; // Default chrome

    if (text.includes("flake") || text.includes("glitter") || text.includes("gun") || text.includes("sparkle")) {
      matchedCampaign = this.campaigns[1]; // Flake King
    } else if (text.includes("pearl") || text.includes("shift") || text.includes("color") || text.includes("nebula")) {
      matchedCampaign = this.campaigns[2]; // Nebula Pearl
    }

    const permalink = `https://shop.coastairbrush.eu/cart/add?id=${matchedCampaign.featuredSku}&quantity=1&ref=agent_c_social`;

    const reply = {
      userQuery: messageText,
      matchedCampaign: matchedCampaign,
      replyMessage: `Hey there! 🎨 That finish was created using the **${matchedCampaign.featuredProduct}**.\n\n` +
                    `📦 **In Stock**: Available now at our Netherlands bonded 3PL and UK hubs for immediate dispatch across Europe.\n` +
                    `💳 **Direct 1-Click Checkout**: [Click here to buy directly](${permalink})\n\n` +
                    `Need technical tips or needle/PSI setup? Our 24/7 AI Master Painter is standing by!`,
      directCheckoutLink: permalink,
      featuredItem: {
        sku: matchedCampaign.featuredSku,
        name: matchedCampaign.featuredProduct,
        priceUSD: matchedCampaign.priceUSD,
        qty: 1
      }
    };

    return reply;
  }

  /**
   * One-click pushes the DM featured product directly to the Shopify Cart Drawer.
   */
  addSocialItemToCart(item) {
    if (!item) return;
    this.cartManager.addItem({
      sku: item.sku,
      name: item.name,
      containerLabel: item.sku.includes("-QT") ? "Quart" : item.sku.includes("-1L") ? "1 Litre" : "Unit",
      quantity: item.qty || 1,
      unitPriceUSD: item.priceUSD,
      properties: {
        "Source Channel": "Agent C (Social DM Automation)",
        "Campaign": "Viral Social Conversion"
      }
    });
  }
}
