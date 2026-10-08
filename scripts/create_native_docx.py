import os
import zipfile

def create_docx(filename):
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="222222"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr>
      <w:b/>
      <w:color w:val="B71C1C"/>
      <w:sz w:val="40"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr>
      <w:b/>
      <w:color w:val="1A237E"/>
      <w:sz w:val="30"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:rPr>
      <w:b/>
      <w:color w:val="333333"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>"""

    # Helper functions to build elements
    def p(text, style=None, bold=False, italic=False, color=None, size=None):
        rPr = []
        if bold: rPr.append('<w:b/>')
        if italic: rPr.append('<w:i/>')
        if color: rPr.append(f'<w:color w:val="{color}"/>')
        if size: rPr.append(f'<w:sz w:val="{size}"/>')
        rPr_str = f'<w:rPr>{"".join(rPr)}</w:rPr>' if rPr else ''
        pPr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ''
        return f'<w:p>{pPr}<w:r>{rPr_str}<w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'

    def p_runs(runs, style=None):
        pPr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ''
        body = []
        for text, bold, italic, color in runs:
            rPr = []
            if bold: rPr.append('<w:b/>')
            if italic: rPr.append('<w:i/>')
            if color: rPr.append(f'<w:color w:val="{color}"/>')
            rPr_str = f'<w:rPr>{"".join(rPr)}</w:rPr>' if rPr else ''
            body.append(f'<w:r>{rPr_str}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>')
        return f'<w:p>{pPr}{"".join(body)}</w:p>'

    def table(headers, rows, col_widths=None):
        out = ['<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="DCDCDC"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="DCDCDC"/><w:right w:val="none"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="EFEFEF"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr>']
        # Header Row
        out.append('<w:tr><w:trPr><w:tblHeader/></w:trPr>')
        for h in headers:
            out.append(f'<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="212121"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t>{escape(h)}</w:t></w:r></w:p></w:tc>')
        out.append('</w:tr>')
        # Data rows
        for i, row in enumerate(rows):
            bg = "F9F9F9" if i % 2 == 1 else "FFFFFF"
            out.append('<w:tr>')
            for cell in row:
                out.append(f'<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{bg}"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{escape(cell)}</w:t></w:r></w:p></w:tc>')
            out.append('</w:tr>')
        out.append('</w:tbl>')
        return "".join(out)

    def escape(t):
        return str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

    body_elements = []

    # Title Box
    body_elements.append(p("COAST AIRBRUSH EUROPE & T5 PRODUCT DISTRIBUTION LTD", style="Heading1"))
    body_elements.append(p("Joint Strategic Proposal, European & UK Competitor Intelligence, Go-to-Market Plan & Commercial Term Sheet", bold=True, size=24, color="444444"))
    body_elements.append(p("Prepared for: Ryan Royal (Managing Director, T5 Product Distribution Ltd) & Derek Stainton (Director, Coast Airbrush Europe)", italic=True, size=20, color="666666"))
    body_elements.append(p("Date: Autumn 2026 | Classification: Strictly Confidential — Commercial-in-Confidence", size=18, color="888888"))
    body_elements.append(p(""))

    # 1. Executive Summary
    body_elements.append(p("1. Executive Summary & Strategic Rationale", style="Heading2"))
    body_elements.append(p("Custom automotive finishes, motorcycle customization, helmet artistry, and bespoke airbrushing represent a high-margin, resilient sector within the broader European automotive refinish market (€4.2B+). However, following Brexit and European supply chain shifts, the European and UK custom paint market is plagued by three fundamental structural failures:"))
    body_elements.append(p_runs([("1. Severe Product Fragmentation: ", True, False, "B71C1C"), ("Painters and trade jobbers are forced to piece together primers, custom candies, flakes, and reducers from multiple erratic suppliers with inconsistent quality.", False, False, None)]))
    body_elements.append(p_runs([("2. Post-Brexit Hazmat Freight Penalties: ", True, False, "B71C1C"), ("Shipping solvent paints across the UK-EU border incurs crushing carrier dangerous goods (UN1263 Class 3) surcharges (€45 to €95 per parcel), lengthy customs holds, and unexpected doorstep import fees.", False, False, None)]))
    body_elements.append(p_runs([("3. Outdated Digital Infrastructure: ", True, False, "B71C1C"), ("Incumbents lack modern digital mixing engines, live formula calculators, and automated e-commerce replenishment systems.", False, False, None)]))
    body_elements.append(p(""))

    body_elements.append(p("The Strategic Alliance & Partnership Synergy", style="Heading3"))
    body_elements.append(p("This joint venture unites Derek Stainton (Coast Airbrush US relationship, brand marketing, e-commerce, proprietary mixing engine software, and European distributor sales) with T5 Product Distribution Ltd (headed by Managing Director Ryan Royal, providing working capital, bulk purchasing, bonded/domestic storage, hazmat logistics, and fulfillment operations)."))
    body_elements.append(p(""))

    body_elements.append(p("The Breakthrough Distribution Mechanism: 'Demand Proving to Territory Lockdown'", style="Heading3"))
    body_elements.append(p("The core commercial innovation solves the single greatest barrier in automotive paint distribution: Distributor Channel Conflict."))
    body_elements.append(p_runs([("• Phase 1 (D2C Demand Validation): ", True, False, "1A237E"), ("End users across the UK and Continental Europe purchase directly via coastairbrush.eu. This generates immediate high-margin revenue, tests SKU velocity, captures customer emails/profiles, and builds geographic heatmaps of proven demand.", False, False, None)]))
    body_elements.append(p_runs([("• Phase 2 (Country Distributor Appointment & Web Cut-Off): ", True, False, "1A237E"), ("The moment an exclusive Master Distributor agreement is executed in a specific European country (e.g., Germany, France, Spain, Italy, Sweden), direct website purchasing is immediately disabled for that country. 100% of website traffic, customer inquiries, and commercial body shop leads from that territory are automatically geo-routed exclusively to the local appointed distributor.", False, False, None)]))
    body_elements.append(p_runs([("• Zero Channel Conflict Guarantee: ", True, False, "B71C1C"), ("This guarantees the distributor a protected, captive market with pre-existing demand, making the Coast Airbrush distribution license an irresistible commercial proposition.", False, False, None)]))
    body_elements.append(p(""))

    # 2. Competitor Intelligence
    body_elements.append(p("2. UK & European Competitor Analysis", style="Heading2"))
    body_elements.append(p("A comprehensive audit of custom paint manufacturers, specialized coating brands, and distribution jobbers across the UK and Continental Europe reveals clear structural vulnerabilities:"))
    
    body_elements.append(p("2.1 Legacy US Solvent Brands (Traditional Automotive Importers)", style="Heading3"))
    body_elements.append(p("• Profile: Historic legacy custom automotive paint lines imported from North America. Distributed in the UK via regional factors (Jawel Paints, Autopaint Solutions, Martin Brown Paints). In Europe, availability is fractured."))
    body_elements.append(p("• Strengths: Traditional brand recognition, traditional basecoat systems, traditional Kandys."))
    body_elements.append(p("• Weaknesses: Severe post-Brexit UK stockouts; extreme price inflation per quart; strict solvent VOC regulatory friction; zero modern digital mixing software."))

    body_elements.append(p("2.2 Custom Creative (Spain / Pan-European)", style="Heading3"))
    body_elements.append(p("• Profile: Prominent Spanish manufacturer specializing in custom automotive candies, fluorescent paints, pinstriping lacquers, and flakes."))
    body_elements.append(p("• Strengths: High-quality formulations, full European chemical compliance, solid southern European distribution."))
    body_elements.append(p("• Weaknesses: Lacks the 40-year American Kustom Kulture heritage of Coast Airbrush; weak direct presence in the UK following Brexit; sells direct to consumers online while trying to sign local dealers, causing channel margin friction."))

    body_elements.append(p("2.3 Specialist Paints / Custom Paints Ltd (UK)", style="Heading3"))
    body_elements.append(p("• Profile: UK-based manufacturer and direct distributor operating the 'Inspire Paints' line out of St Helens, UK."))
    body_elements.append(p("• Strengths: Broad range of special-effect coatings (pearls, candies, thermochromic, hydrographic, chrome)."))
    body_elements.append(p("• Weaknesses: Operates almost exclusively on a Direct-to-Consumer e-commerce model, which alienates professional trade refinish distributors and factors who demand territory protection; perceived as a hobbyist brand rather than an elite custom shop system; heavy cross-border customs friction into Europe."))

    body_elements.append(p("2.4 Stardust Colors (France / Pan-European)", style="Heading3"))
    body_elements.append(p("• Profile: French manufacturer and distributor founded in 2009 in Saint-Laurent-des-Arbres, France."))
    body_elements.append(p("• Strengths: Giant catalog of optical effect pigments (crystalizer, chameleon, phosphorescent, holographic, chrome)."))
    body_elements.append(p("• Weaknesses: Pure e-commerce catalog mindset; lacks authentic custom lifestyle identity; no dedicated dealer loyalty or protected territory distribution model; weak airbrush and striping line."))

    body_elements.append(p("2.5 Createx Colors (Distributed via Createx Handels-GmbH, Germany)", style="Heading3"))
    body_elements.append(p("• Profile: The global standard in water-based airbrush colors (Wicked Colors, candy2o, Illustration Colors), with a master European warehouse in Germany."))
    body_elements.append(p("• Strengths: Non-toxic, water-based formulations; zero VOC issues; high artist loyalty in fine art, RC cars, and textiles."))
    body_elements.append(p("• Weaknesses: The Automotive Solvent Void: Professional automotive customizers, hot-rod builders, and chopper painters still demand high-solids solvent-borne urethanes, candies, and clearcoats for production speed, flow-out, and depth of gloss. Createx does not fulfill this solvent demand."))

    body_elements.append(p("2.6 Competitor Comparison Matrix", style="Heading3"))
    
    comp_headers = ["Competitor", "Origin", "Primary Focus", "UK/EU Distribution", "Digital Tools", "Channel Protection", "Brand Heritage"]
    comp_rows = [
        ["Legacy US Solvent Brands", "USA", "Solvent Custom Paint", "Moderate (UK factors; fractured EU)", "Low (Static PDF charts)", "Low (Stockouts, eroded margin)", "Iconic (4/5)"],
        ["Custom Creative", "Spain", "Custom Solvents & Candies", "Strong Southern EU; Weak UK", "Moderate (Basic formulas)", "Moderate (Competes with site)", "Regional Trade (3/5)"],
        ["Specialist Paints", "UK", "Special Effect Coatings", "Strong UK D2C; Fragmented EU", "Low (Standard e-commerce)", "None (Pure D2C focus)", "Hobbyist/Niche (2/5)"],
        ["Stardust Colors", "France", "Optical Effect Paints", "Strong EU Direct; Weak UK", "Moderate (Technical data)", "Low (Direct web sales)", "Industrial Chemical (2/5)"],
        ["Createx Colors", "USA/DE", "Water-Based Airbrush", "High (Createx GmbH wholesale)", "Moderate (Color guides)", "High (Protected dealers)", "Airbrush Standard (4/5)"],
        ["Coast Airbrush Europe (Us)", "USA/JP/UK", "Solvent Custom System & Kroma Edge + Flake King", "Hybrid D2C to Protected Exclusive Master Distributors", "High (Live Web Mixing Engine, AI Agents, CRM)", "Absolute (100% Web Cut-Off Guarantee per Country)", "World's #1 Custom Paint Destination (5/5)"]
    ]
    body_elements.append(table(comp_headers, comp_rows))
    body_elements.append(p(""))

    # 3. Sales & Marketing Plan
    body_elements.append(p("3. Comprehensive Sales & Marketing Plan", style="Heading2"))
    body_elements.append(p("3.1 Phased Commercial Rollout", style="Heading3"))
    body_elements.append(p("• Phase 1: D2C Demand Generation & Heatmapping (Months 1–3): Launch coastairbrush.eu shipping from T5 facilities across the UK and EU. Generates rapid retail cash flow, tests SKU velocity, and identifies exact geographical clusters of custom painters and shops."))
    body_elements.append(p("• Phase 2: Distributor Recruitment & Frictionless Handover (Months 4–9): Derek approaches premier paint factors in Germany (DACH), France, Italy, Spain, and Benelux with empirical data showing active demand. When distributors sign, central web checkout is switched off for their country."))
    body_elements.append(p("• Phase 3: Pan-European Network Maturity (Months 10+): Consolidate 6 to 8 Master Distributors covering all European economic zones, supported by automated B2B portal reordering, container-load ocean replenishment from Japan, and dedicated warehouse buffer stocks at T5."))

    body_elements.append(p("3.2 Target Distributor Commercial Terms", style="Heading3"))
    body_elements.append(p("• Initial Stocking Order (ISO): €25,000 to €50,000 mandatory initial buy-in covering core fast-moving inventory, point-of-sale display racks, and sample spray-out decks."))
    body_elements.append(p("• Annual Performance Commitments: €120,000 to €250,000 annual quota to retain national exclusivity, audited quarterly via the CRM."))
    body_elements.append(p("• Volume Retro-Rebates: Tiered rebate structure (3% at 100% of quota, 5% at 120%, 7.5% at 150%) disbursed quarterly to incentivize high-volume reorders."))
    body_elements.append(p("• Minimum Advertised Price (MAP): Strictly enforced pan-European MAP agreement to preserve healthy margins across all borders."))

    body_elements.append(p("3.3 Marketing & Brand Engine", style="Heading3"))
    body_elements.append(p("• Ambassador Seeding: Supply complete paint systems to 15 elite custom motorcycle builders, hot-rod painters, and helmet artists across the UK, Germany, France, and Spain for viral social proof."))
    body_elements.append(p("• Video & Technical Content Playbook: Short-form, high-impact video reels demonstrating candy spray-outs, metal flake reduction, and clearcoat depth across Instagram, TikTok, and YouTube."))
    body_elements.append(p("• Proprietary Mixing Software Moat: The interactive paint mixing engine and CRM system at coastairbrush.eu locks painters and jobbers into our paint system by calculating exact formulation ratios and layer sequences."))
    body_elements.append(p("• Trade Show Presence: High-visibility exhibition booths at Essen Motor Show (Germany), Automechanika Frankfurt, and Motorcycle Live (UK)."))
    body_elements.append(p(""))

    # 4. Operational RACI
    body_elements.append(p("4. Operational Division of Responsibilities (RACI Matrix)", style="Heading2"))
    raci_headers = ["Operational Domain / Task", "Derek Stainton (Coast Europe)", "Ryan Royal / T5 Distribution", "Lead Entity"]
    raci_rows = [
        ["Coast Airbrush US Relationship & IP Licensing", "Accountable / Responsible", "Informed", "Derek Stainton"],
        ["Product Selection, Color Systems & Formulations", "Accountable / Responsible", "Consulted", "Derek Stainton"],
        ["Website, E-Commerce, UX & Mixing Engine Software", "Accountable / Responsible", "Informed", "Derek Stainton"],
        ["European Distributor Sourcing, Pitching & Sales", "Accountable / Responsible", "Consulted", "Derek Stainton"],
        ["Brand Marketing, Social Media & Content Playbooks", "Accountable / Responsible", "Informed", "Derek Stainton"],
        ["Technical Support & Painter Application Advice", "Accountable / Responsible", "Informed", "Derek Stainton"],
        ["Working Capital Deployment & Inventory Purchasing", "Consulted", "Accountable / Responsible", "Ryan Royal / T5"],
        ["Inbound Freight, Ocean Shipping & Customs Clearance", "Consulted", "Accountable / Responsible", "Ryan Royal / T5"],
        ["Warehousing, ADR Hazmat Storage & Safety", "Informed", "Accountable / Responsible", "Ryan Royal / T5"],
        ["Order Fulfillment (Pick, Pack & Same-Day Dispatch)", "Informed", "Accountable / Responsible", "Ryan Royal / T5"],
        ["B2B Pallet Freight to European Distributors", "Consulted", "Accountable / Responsible", "Ryan Royal / T5"],
        ["Back-Office Invoicing, Credit Control & VAT Reporting", "Consulted", "Accountable / Responsible", "Ryan Royal / T5"],
        ["Website Country Geo-Fencing & Distributor Cut-Off", "Accountable / Responsible", "Informed", "Derek Stainton"]
    ]
    body_elements.append(table(raci_headers, raci_rows))
    body_elements.append(p(""))

    # 5. Financial Architecture & Commercial Term Sheet
    body_elements.append(p("5. Financial Architecture & Commercial Term Sheet", style="Heading2"))
    body_elements.append(p("5.1 Landed Cost & Unit Economics (Kroma Edge Custom Paint Kit)", style="Heading3"))

    cogs_headers = ["Cost Component", "Cost / Value (€ EUR)", "Strategic Supply Chain Notes"]
    cogs_rows = [
        ["1. Supplier Base FOB Price (Japan / US bulk)", "€32.20", "Direct manufacturer wholesale bulk pricing"],
        ["2. Inbound Ocean Freight Allocation (Per Unit)", "€3.00", "Bulk sea container economics (FCL/LCL)"],
        ["3. Hazmat / ADR Dangerous Goods Allocation", "€1.50", "Bulk hazardous sea cargo amortized"],
        ["4. Customs Brokerage & Port Entry Fees", "€0.50", "Commercial clearance entry fee"],
        ["5. Customs Duty Rate", "€0.00", "0.0% Duty under Japan-UK/EU EPA (REX Origin)"],
        ["TOTAL TRUE LANDED COST (COGS)", "€37.20", "Landed cost at T5 warehouse facility"],
        ["A. Direct B2C Retail Price (excl. VAT)", "€119.95", "Gross Profit: €82.75 | Margin: 68.99%"],
        ["B. B2B Wholesale Distributor Price (excl. VAT)", "€74.50", "Gross Profit: €37.30 | Margin: 50.07%"]
    ]
    body_elements.append(table(cogs_headers, cogs_rows))

    body_elements.append(p("5.2 Definition of Gross Profit & Remuneration Structure", style="Heading3"))
    body_elements.append(p_runs([("Gross Profit Formula: ", True, False, "B71C1C"), ("Gross Profit = Net Invoiced Product Sales − True Landed Cost of Goods Sold (COGS)", True, False, "1A237E")]))
    body_elements.append(p("Where Net Invoiced Sales represents collected revenue net of VAT and returns; True Landed COGS includes supplier FOB cost, inbound freight, duty, customs clearance, and direct inbound handling. No general office or corporate overhead is deducted."))
    body_elements.append(p("Proposed Remuneration Split:"))
    body_elements.append(p("• Derek Stainton Receives: 35% of Total Product Gross Profit across all channels (both initial direct website sales and recurring B2B European distributor sales)."))
    body_elements.append(p("• T5 Product Distribution Retains: 65% of Total Product Gross Profit, compensating T5 for deploying inventory capital, inventory holding risk, warehouse lease space, pick/pack labor, and credit control."))
    body_elements.append(p("• Settlement Schedule: T5 provides an automated monthly Gross Profit & Sales Ledger within 10 business days of month-end; profit share fee is remitted via bank transfer by the 15th of each month (Net 15 days)."))

    body_elements.append(p("5.3 24-Month Conservative Financial Projections", style="Heading3"))
    fin_headers = ["Financial Metric", "Year 1 (Launch & Foundation)", "Year 2 (Network Expansion)"]
    fin_rows = [
        ["Direct D2C Web Sales (excl. VAT)", "€180,000", "€90,000 (Shifted to Distributors)"],
        ["B2B European Distributor Sales (excl. VAT)", "€320,000 (3 Distributors)", "€980,000 (7 Distributors)"],
        ["TOTAL ANNUAL REVENUE", "€500,000", "€1,070,000"],
        ["Blended Gross Margin (%)", "56.8%", "51.6%"],
        ["TOTAL GROSS PROFIT POOL", "€284,000", "€552,120"],
        ["Derek Stainton Share (35%)", "€99,400", "€193,242"],
        ["T5 Product Distribution Share (65%)", "€184,600", "€358,878"]
    ]
    body_elements.append(table(fin_headers, fin_rows))
    body_elements.append(p(""))

    # 6. Regulatory & Logistics
    body_elements.append(p("6. Regulatory, Hazmat & Logistics Framework", style="Heading2"))
    body_elements.append(p("• Dangerous Goods Exemption (ADR Limited Quantity): Solvent paints are classified as UN1263 Class 3 Flammable Liquids. By packaging paints in containers ≤ 5L within outer packaging ≤ 30kg, shipments qualify for the ADR Limited Quantity (LQ) road exemption. This completely eliminates expensive carrier Hazmat surcharges on standard ground parcel deliveries across the UK and Europe."))
    body_elements.append(p("• Postponed VAT Accounting (PVA): T5 utilizes UK Postponed VAT Accounting on bulk imports, eliminating upfront cash VAT payments at the border and protecting working capital cash flow."))
    body_elements.append(p("• Safety Compliance: All products supplied with localized CLP hazard pictograms and multi-lingual SDS (English, German, French, Spanish) accessible via the online platform."))
    body_elements.append(p(""))

    # 7. Signatures
    body_elements.append(p("7. Roundtable Agreement & Term Sheet Sign-Off", style="Heading2"))
    body_elements.append(p("By signing below, the parties agree in principle to the terms outlined in this document and commit to proceeding with the formal operating partnership agreement:"))
    body_elements.append(p(""))
    body_elements.append(p("___________________________________________                    ___________________________________________"))
    body_elements.append(p("Ryan Royal                                                                   Derek Stainton"))
    body_elements.append(p("Managing Director, T5 Product Distribution Ltd                Founder & Director, Coast Airbrush Europe"))
    body_elements.append(p("Date: ________________________                                         Date: ________________________"))

    doc_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {"".join(body_elements)}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>"""

    with zipfile.ZipFile(filename, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", rels)
        z.writestr("word/_rels/document.xml.rels", doc_rels)
        z.writestr("word/styles.xml", styles)
        z.writestr("word/document.xml", doc_xml)

    print(f"Native DOCX successfully created: {filename}")

if __name__ == "__main__":
    out_file = "/Volumes/Media SSD/Coast Airbrush Paint System/docs/Coast_Airbrush_Europe_T5_Partnership_Strategy.docx"
    create_docx(out_file)
