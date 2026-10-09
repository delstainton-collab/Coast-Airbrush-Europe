export class AdminEmailDispatcher {
  constructor(adminController) {
    this.admin = adminController;
  }

  get config() {
    return this.admin.config;
  }

  /**
   * Aggregates customers across Agent B orders, forum pre-orders, and custom accounts.
   */
  getAllCustomers() {
    const customerMap = new Map();

    // 1. From MOCK_ORDERS (Agent B)
    if (this.admin.app && this.admin.app.agentB && this.admin.app.agentB.orders) {
      this.admin.app.agentB.orders.forEach(ord => {
        if (ord.customerEmail) {
          const isB2B = Boolean(ord.shippingAddress && ord.shippingAddress.vatNumber);
          const isUK = ord.shippingAddress && ord.shippingAddress.countryCode === 'GB';
          const isEU = ord.shippingAddress && ord.shippingAddress.countryCode !== 'GB';
          
          let seg = 'retail_hobbyists';
          if (isB2B && isEU) seg = 'b2b_jobbers';
          else if (isB2B && isUK) seg = 'uk_garages';

          customerMap.set(ord.customerEmail.toLowerCase(), {
            id: ord.orderId || `CUST-${Math.random().toString(36).substr(2, 6)}`,
            name: ord.customerName ? ord.customerName.replace(/\s*\([^)]*\)/, '') : 'Valued Customer',
            company: ord.customerName && ord.customerName.includes('(') ? ord.customerName.match(/\((.*?)\)/)[1] : (isB2B ? 'Registered Commercial Shop' : 'Studio / Individual'),
            email: ord.customerEmail.toLowerCase(),
            phone: ord.customerPhone || 'N/A',
            country: ord.shippingAddress ? ord.shippingAddress.country : 'European Union',
            countryCode: ord.shippingAddress ? ord.shippingAddress.countryCode : 'EU',
            city: ord.shippingAddress ? ord.shippingAddress.city : 'Central Hub',
            vatNumber: ord.shippingAddress && ord.shippingAddress.vatNumber ? ord.shippingAddress.vatNumber : 'N/A (Standard Consumer)',
            tier: isB2B ? 'Commercial B2B Jobber' : 'Custom Builder',
            segment: seg,
            latestOrderId: ord.orderId || 'EU-10492',
            carrier: ord.carrier || 'DHL Express ADR',
            trackingNumber: ord.trackingNumber || 'DHL-EU-884920194DE',
            estimatedDelivery: ord.estimatedDelivery || '2026-09-02',
            source: 'Verified Order'
          });
        }
      });
    }

    // 2. Default Seed Customers if sparse
    const defaultRoster = [
      {
        id: "CUST-DE-101",
        name: "Klaus Schneider",
        company: "Custom Kolors Germany",
        email: "klaus@customkolors.de",
        phone: "+49 170 8291034",
        country: "Germany",
        countryCode: "DE",
        city: "Stuttgart",
        vatNumber: "DE318294012",
        tier: "Master Painter",
        segment: "b2b_jobbers",
        latestOrderId: "EU-10492",
        carrier: "DHL Express Hazmat ADR",
        trackingNumber: "DHL-EU-884920194DE",
        estimatedDelivery: "2026-08-31",
        source: "EU B2B Jobber"
      },
      {
        id: "CUST-GB-102",
        name: "Liam Evans",
        company: "Speed & Chrome UK",
        email: "liam@speedandchrome.co.uk",
        phone: "+44 7700 900482",
        country: "United Kingdom",
        countryCode: "GB",
        city: "Towcester",
        vatNumber: "GB948201844",
        tier: "Verified Builder",
        segment: "uk_garages",
        latestOrderId: "UK-88214",
        carrier: "DPD UK Hazmat Express",
        trackingNumber: "DPD-UK-9948201849",
        estimatedDelivery: "2026-09-01",
        source: "UK PVA Account"
      },
      {
        id: "CUST-FR-103",
        name: "Mathieu Dubois",
        company: "Atelier Airbrush France",
        email: "mathieu@atelier-airbrush.fr",
        phone: "+33 6 12 34 56 78",
        country: "France",
        countryCode: "FR",
        city: "Lyon",
        vatNumber: "FR82910482910",
        tier: "Verified Builder",
        segment: "b2b_jobbers",
        latestOrderId: "EU-10505",
        carrier: "PostNL / DPD Europe",
        trackingNumber: "NL-POST-77382910FR",
        estimatedDelivery: "2026-09-02",
        source: "EU B2B Jobber"
      },
      {
        id: "CUST-SE-104",
        name: "Stefan Lindqvist",
        company: "Kustom Garage Stockholm",
        email: "stefan@kustomgarage.se",
        phone: "+46 70 123 4567",
        country: "Sweden",
        countryCode: "SE",
        city: "Stockholm",
        vatNumber: "SE556123456701",
        tier: "Master Painter",
        segment: "master_painters",
        latestOrderId: "EU-10512",
        carrier: "DHL Freight Hazmat",
        trackingNumber: "DHL-SE-492019482SE",
        estimatedDelivery: "2026-09-03",
        source: "Master Artist VIP"
      },
      {
        id: "CUST-NL-105",
        name: "Jan Van Der Berg",
        company: "Rotterdam Lowrider Studio",
        email: "jan@rotterdamkustoms.nl",
        phone: "+31 6 55512345",
        country: "Netherlands",
        countryCode: "NL",
        city: "Rotterdam",
        vatNumber: "NL812345678B01",
        tier: "Founding Backer",
        segment: "preorder_backers",
        latestOrderId: "PO-B1-042",
        carrier: "PostNL Cargo",
        trackingNumber: "NL-CARGO-8849201NL",
        estimatedDelivery: "2026-09-05",
        source: "Pre-Order Backer Tier 3"
      },
      {
        id: "CUST-BE-106",
        name: "Luc Claes",
        company: "Airbrush Creations Antwerp",
        email: "luc@airbrushcreations.be",
        phone: "+32 470 123456",
        country: "Belgium",
        countryCode: "BE",
        city: "Antwerp",
        vatNumber: "BE0123456789",
        tier: "Master Painter",
        segment: "master_painters",
        latestOrderId: "EU-10520",
        carrier: "DPD Belgium ADR",
        trackingNumber: "DPD-BE-9948201BE",
        estimatedDelivery: "2026-09-04",
        source: "Master Artist VIP"
      },
      {
        id: "CUST-UK-107",
        name: "Marcus Ward",
        company: "Ward Kustom Choppers",
        email: "marcus@wardchoppers.co.uk",
        phone: "+44 7800 112233",
        country: "United Kingdom",
        countryCode: "GB",
        city: "Birmingham",
        vatNumber: "GB123456789",
        tier: "Pre-Order Backer",
        segment: "preorder_backers",
        latestOrderId: "PO-B1-089",
        carrier: "DPD UK Hazmat",
        trackingNumber: "DPD-UK-1122334455",
        estimatedDelivery: "2026-09-06",
        source: "Pre-Order Backer Tier 2"
      },
      {
        id: "CUST-IT-108",
        name: "Marco Rossi",
        company: "Milano Airbrush Studio",
        email: "marco.rossi@airbrushmilano.it",
        phone: "+39 340 1234567",
        country: "Italy",
        countryCode: "IT",
        city: "Milan",
        vatNumber: "IT01234567890",
        tier: "Retail Builder",
        segment: "retail_hobbyists",
        latestOrderId: "EU-10531",
        carrier: "DHL Express Italy",
        trackingNumber: "DHL-IT-77382910IT",
        estimatedDelivery: "2026-09-07",
        source: "Direct Retail"
      }
    ];

    defaultRoster.forEach(c => {
      if (!customerMap.has(c.email.toLowerCase())) {
        customerMap.set(c.email.toLowerCase(), c);
      }
    });

    return Array.from(customerMap.values());
  }

  getCustomersBySegment(segment) {
    const all = this.getAllCustomers();
    if (!segment || segment === 'all') return all;
    if (segment === 'b2b_jobbers') return all.filter(c => c.segment === 'b2b_jobbers' || c.vatNumber !== 'N/A (Standard Consumer)');
    if (segment === 'uk_garages') return all.filter(c => c.countryCode === 'GB');
    if (segment === 'master_painters') return all.filter(c => c.segment === 'master_painters' || c.tier.includes('Master'));
    if (segment === 'preorder_backers') return all.filter(c => c.segment === 'preorder_backers' || c.latestOrderId.startsWith('PO-'));
    if (segment === 'retail_hobbyists') return all.filter(c => c.segment === 'retail_hobbyists' || c.vatNumber === 'N/A (Standard Consumer)');
    return all;
  }

  renderMergeTags(templateText, customer) {
    if (!templateText) return "";
    return templateText
      .replace(/\{\{customer_name\}\}/gi, customer.name || 'Valued Painter')
      .replace(/\{\{customer_company\}\}/gi, customer.company || 'Custom Shop')
      .replace(/\{\{customer_email\}\}/gi, customer.email || 'customer@example.com')
      .replace(/\{\{customer_city\}\}/gi, customer.city || 'Central')
      .replace(/\{\{customer_country\}\}/gi, customer.country || 'Europe')
      .replace(/\{\{vat_number\}\}/gi, customer.vatNumber || 'N/A')
      .replace(/\{\{tier\}\}/gi, customer.tier || 'Master Painter')
      .replace(/\{\{latest_order_id\}\}/gi, customer.latestOrderId || 'EU-10492')
      .replace(/\{\{carrier\}\}/gi, customer.carrier || 'DHL Express ADR')
      .replace(/\{\{tracking_number\}\}/gi, customer.trackingNumber || 'DHL-EU-884920194DE')
      .replace(/\{\{estimated_delivery\}\}/gi, customer.estimatedDelivery || '2026-09-02');
  }

  generateAiEmailContent(presetKey, targetSegment, customGoal = "") {
    let subjectOptions = [];
    let generatedBody = "";
    let audienceNote = "";
    let predictedOpenRate = "58% - 74%";

    if (presetKey === 'restock_flash') {
      subjectOptions = [
        "⚡ [48H FLASH RESTOCK] Kroma Edge Speed Clear & High-Solid Primer Pallets (EU / UK Dispatch)",
        "📦 Stock Alert for {{customer_company}}: Solvent Reducers, Speed Clears & VAT-Free Reorder",
        "🔥 Priority Allocation for {{customer_name}}: Claim Your Solvent Batch Before Weekend Dispatch"
      ];
      generatedBody = `Hi {{customer_name}},\n\nWe are preparing this week's bonded solvent pallet dispatches from our Rotterdam and UK hubs.\n\n` +
        `As a key commercial account (**{{customer_company}}** | VAT: \`{{vat_number}}\`), we have reserved priority allocation for your shop across our high-demand consumable lines:\n\n` +
        `• **Kroma Edge Speed Clearcoat (1.5L Complete Kits):** Rapid 15-min air dry, mirror depth, zero solvent dieback.\n` +
        `• **Jet Black Mirror Gloss Primer (1L & 5L):** High-build leveling formulation for flawless base prep.\n` +
        `• **Fast / Medium / Slow Reducers:** Fully stocked for variable temperature booth spraying.\n\n` +
        `💡 *Commercial Tax Note:* All EU Intra-Community B2B orders process under 0% Reverse Charge OSS VAT; UK commercial garages utilize Postponed VAT Accounting (PVA).\n\n` +
        `👉 **1-Click Restock Link:** Reply directly with your required quantities or tap below to lock in your trade order.\n\n` +
        `Best regards,\n**Coast Airbrush Europe Supply Logistics**`;
      audienceNote = "Tone: High urgency, commercial margin focus, inventory certainty, VAT compliance clarity.";
      predictedOpenRate = "68.5%";
    } else if (presetKey === 'preorder_backer_addon') {
      subjectOptions = [
        "🚢 Ocean Container Milestone Update + Backer-Only Free Shipping on Flake Guns & Pearls",
        "📦 Pre-Order #{{latest_order_id}} Progress: Yokohama to Rotterdam Port Clearance Schedule",
        "🎁 Backer VIP Perk: Add Flake King Spray Guns to Order #{{latest_order_id}} with Zero Extra Shipping"
      ];
      generatedBody = `Hello {{customer_name}},\n\nHere is your official logistics milestone report for your **{{tier}}** pre-order (**#{{latest_order_id}}**):\n\n` +
        `🌊 **Ocean Freight Status:** The bulk shipping container carrying our Signal Japan Kroma Edge and California custom pigment inventory is navigating on schedule toward Rotterdam Port.\n` +
        `⏱️ **Target Port Customs Clearance:** September 14, 2026.\n` +
        `📦 **Final Mile Carrier:** Handing off to DHL Hazmat ADR (EU) & DPD Express (UK) for insured ground transit.\n\n` +
        `✨ **Exclusive Backer Add-On Window (Save on Freight):**\n` +
        `Because your master parcel is already booked, you can add any of the following items to your crate with **100% FREE COMBINED HAZMAT FREIGHT**:\n` +
        `1. *Flake King 500 Dry Flake Gun* (Save €25 on hazmat surcharge)\n` +
        `2. *Holographic & Kameleon Flake Starter Packs (100g jars)*\n` +
        `3. *Spare 1L Reducer & Airbrush Cleaning Stations*\n\n` +
        `Use your secret backer checkout code: \`BACKER-COMBO-FREE\`\n\n` +
        `Thanks for standing with Coast Airbrush Europe from day one!\n\n` +
        `Warm regards,\n**Dave 'Coast' Stainton & The European Crew**`;
      audienceNote = "Tone: Transparent, reassuring, logistics-backed, high-converting add-on incentive.";
      predictedOpenRate = "79.2%";
    } else if (presetKey === 'vip_artist_exclusive') {
      subjectOptions = [
        "👑 [Master Artist Exclusive] Limited Batch Liquid Chrome & Ace of Shades Pearls Unlocked",
        "🎨 Special Formulation Alert for {{customer_name}}: Micro-Refraction Pearls Ready for Spray",
        "💎 Secret Studio Vault: Custom Micron Tuned Formulas for {{customer_company}}"
      ];
      generatedBody = `Hey {{customer_name}},\n\nAs one of our verified **{{tier}}** artists, you know that true mirror chrome and candy depth depend on exact pigment purity.\n\n` +
        `We have just finalized a limited micro-batch of our **Kroma Edge Liquid Chrome Special Edition** alongside rare Ace of Shades candy concentrates.\n\n` +
        `🔬 **What makes this batch special for custom work:**\n` +
        `• Ultra-fine particle suspension designed specifically for 0.18mm - 0.35mm precision nozzles.\n` +
        `• Zero graininess under high-intensity spotlighting.\n` +
        `• Formulated to lock cleanly under 2K Speed Clears without lifting or graying.\n\n` +
        `Because this batch is strictly capped at 50 numbered liters across Europe, we have opened a 72-hour priority reservation window for verified studio painters.\n\n` +
        `Use VIP code: \`MASTERPIECE2026\` for instant express dispatch and complimentary swatch test cards.\n\n` +
        `Keep laying it down,\n**Coast Airbrush Europe Mix Lab**`;
      audienceNote = "Tone: Elite craftsmanship, exclusivity, technical precision, passion for custom paint.";
      predictedOpenRate = "72.4%";
    } else {
      subjectOptions = [
        `🔥 Essential Paint Update & Trade Notice for {{customer_name}}`,
        `📦 Special Announcement from Coast Airbrush Europe for {{customer_company}}`,
        `⚡ European Custom Paint Alert: New Formulas & 24H Logistics Dispatches`
      ];
      generatedBody = `Dear {{customer_name}},\n\n` +
        (customGoal ? `In response to ${customGoal}:\n\n` : '') +
        `We are writing to update you on our latest solvent formulas, inventory availability, and express pan-European delivery routes for **{{customer_company}}**.\n\n` +
        `Whether you require ADR Class 3 compliant clearcoats, high-sparkle dry metal flakes, or specialized airbrush accessories, our team is equipped to support your projects with 24-hour bonded dispatch.\n\n` +
        `Please let us know how we can support your upcoming spray jobs.\n\n` +
        `Kind regards,\n**Coast Airbrush Europe Team**`;
      audienceNote = "Tone: Professional, direct, custom tailored to your specified goal.";
      predictedOpenRate = "61.0%";
    }

    return {
      selectedSubject: subjectOptions[0],
      subjectOptions: subjectOptions,
      body: generatedBody,
      predictedOpenRate: predictedOpenRate,
      audienceNote: audienceNote
    };
  }

  generateAiCampaignDiagnostics(campaignId) {
    const cmp = (this.config.emailHub.campaigns || []).find(c => c.id === campaignId) || this.config.emailHub.campaigns[0];
    if (!cmp) return null;

    let diagnosis = {
      score: "A- (91/100)",
      headline: `High Engagement Across ${cmp.segment.toUpperCase().replace('_', ' ')}`,
      strengths: [
        `Open rate of ${cmp.openRate}% exceeds industry automotive benchmark by +38.5%.`,
        `Generated €${(cmp.revenueEur || 0).toLocaleString()} in direct attributed sales within 48 hours of broadcast.`,
        `Zero spam complaints and 100% clean delivery with no bounce errors.`
      ],
      opportunities: [
        `${cmp.recipientCount - cmp.conversions} recipients opened the email but did not complete checkout.`,
        `Subject line variation #2 had a higher engagement index on mobile devices.`
      ],
      aiActionableRecommendation: `Trigger an automated AI 48-Hour Follow-Up targeted strictly at the ${cmp.recipientCount - cmp.conversions} non-converting recipients with a 5% instant checkout nudge: code 'RESTOCK-FAST'.`
    };

    return diagnosis;
  }

  sendDirectEmail(customer, emailData) {
    const mergedSubject = this.renderMergeTags(emailData.subject, customer);
    const mergedBody = this.renderMergeTags(emailData.body, customer);

    const logEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toISOString(),
      type: "single",
      recipientEmail: customer.email,
      recipientName: customer.name,
      recipientCompany: customer.company,
      subject: mergedSubject,
      bodyPreview: mergedBody.slice(0, 140) + '...',
      status: "Delivered",
      mode: emailData.mode || "Simulated Delivery",
      segment: customer.segment
    };

    if (!this.config.emailHub.dispatchLogs) {
      this.config.emailHub.dispatchLogs = [];
    }
    this.config.emailHub.dispatchLogs.unshift(logEntry);
    this.admin.saveConfig();

    return {
      success: true,
      log: logEntry,
      renderedSubject: mergedSubject,
      renderedBody: mergedBody
    };
  }

  sendBlanketCampaign(segment, emailData) {
    const targetCustomers = this.getCustomersBySegment(segment);
    const now = new Date().toISOString();
    const campaignId = `cmp-${Date.now()}`;

    const logs = targetCustomers.map(cust => {
      return {
        id: `log-${Date.now()}-${Math.floor(Math.random()*10000)}`,
        timestamp: now,
        type: "blanket",
        campaignId: campaignId,
        recipientEmail: cust.email,
        recipientName: cust.name,
        recipientCompany: cust.company,
        subject: this.renderMergeTags(emailData.subject, cust),
        bodyPreview: this.renderMergeTags(emailData.body, cust).slice(0, 140) + '...',
        status: "Delivered",
        mode: emailData.mode || "Simulated Delivery",
        segment: segment
      };
    });

    if (!this.config.emailHub.dispatchLogs) {
      this.config.emailHub.dispatchLogs = [];
    }
    this.config.emailHub.dispatchLogs.unshift(...logs);

    const simOpenRate = 65 + Math.round(Math.random() * 18);
    const simClickRate = Math.round(simOpenRate * 0.45);
    const simConversions = Math.max(1, Math.round(targetCustomers.length * 0.28));
    const simRevenue = simConversions * (segment === 'b2b_jobbers' ? 780 : 240);

    const newCampaign = {
      id: campaignId,
      date: now,
      title: emailData.title || emailData.subject.slice(0, 40),
      type: "blanket",
      segment: segment,
      subject: emailData.subject,
      recipientCount: targetCustomers.length,
      deliveredCount: targetCustomers.length,
      openRate: simOpenRate,
      clickRate: simClickRate,
      conversions: simConversions,
      revenueEur: simRevenue,
      aiSummary: `Dispatched to ${targetCustomers.length} verified accounts in '${segment}'. Expected €${simRevenue} in trade reorders.`
    };

    if (!this.config.emailHub.campaigns) {
      this.config.emailHub.campaigns = [];
    }
    this.config.emailHub.campaigns.unshift(newCampaign);
    this.admin.saveConfig();

    return {
      success: true,
      campaign: newCampaign,
      recipientsSent: targetCustomers.length
    };
  }

  saveEmailTemplate(templateData) {
    if (!this.config.emailHub.templates) {
      this.config.emailHub.templates = [];
    }
    const idx = this.config.emailHub.templates.findIndex(t => t.id === templateData.id);
    if (idx >= 0) {
      this.config.emailHub.templates[idx] = templateData;
    } else {
      this.config.emailHub.templates.push(templateData);
    }
    this.admin.saveConfig();
  }

  deleteEmailTemplate(templateId) {
    if (this.config.emailHub.templates) {
      this.config.emailHub.templates = this.config.emailHub.templates.filter(t => t.id !== templateId);
      this.admin.saveConfig();
    }
  }

  clearDispatchLogs() {
    if (this.config.emailHub) {
      this.config.emailHub.dispatchLogs = [];
      this.admin.saveConfig();
    }
  }
}
