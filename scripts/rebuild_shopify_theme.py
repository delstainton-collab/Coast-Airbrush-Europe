#!/usr/bin/env python3
import os, re, sys, zipfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THEME_DIR = os.path.join(ROOT_DIR, "coast-airbrush-eu-shopify-theme")
THEME_ZIP = os.path.join(ROOT_DIR, "coast-airbrush-eu-shopify-theme.zip")
MEDIA_ZIP = os.path.join(ROOT_DIR, "coast-shopify-media-files.zip")
SNIPPETS_DIR = os.path.join(THEME_DIR, "snippets")

MODULE_FILES = [
    "data/hero_config.js",
    "data/shopify_variant_map.js",
    "data/kroma_edge.js",
    "data/full_ecom_catalog.js",
    "data/taxonomy.js",
    "data/brands_master.js",
    "data/flake_king_tds.js",
    "data/ace_of_shades.js",
    "js/mixingEngine.js",
    "js/shopifyCart.js",
    "js/euLocalization.js",
    "js/i18n.js",
    "js/agentA.js",
    "js/agentB.js",
    "js/agentC.js",
    "js/agentD.js",
    "js/forumPreorderEngine.js",
    "js/features/heroCanvasEnhancer.js",
    "js/features/marketingEmailHub.js",
    "js/features/brandsShowcase.js",
    "js/features/bundleConfigurator.js",
    "js/features/productMatrixModal.js",
    "js/features/productDetailModal.js",
    "js/features/tradePortalModal.js",
    "js/features/departmentViews.js",
    "js/features/storefrontAiAgentsUI.js",
    "js/features/storefrontGridUI.js",
    "js/features/storefrontFiltersUI.js",
    "js/features/heroEditorUI.js",
    "js/features/mixingScaleUI.js",
    "js/features/tdsSafetyUI.js",
    "js/features/onboardingHeroUI.js",
    "js/features/dialogsUI.js",
    "js/features/forumPreorderUI.js",
    "js/features/navigationTabsUI.js",
    "js/features/euLocalizationUI.js",
    "js/features/storefrontShowcaseUI.js",
    "js/features/globalWindowBindings.js",
    "js/features/spreadsheet/trashModal.js",
    "js/features/spreadsheet/spreadsheetCsvService.js",
    "js/features/spreadsheet/spreadsheetBatchEngine.js",
    "js/features/spreadsheet/spreadsheetEditor.js",
    "js/features/quickMixModal.js",
    "js/features/projectEstimator.js",
    "js/features/cartDrawerUI.js",
    "js/features/adminOperations/geminiModal.js",
    "js/features/adminOperations/adminHardwareHazmat.js",
    "js/features/adminOperations/adminFxEngineUI.js",
    "js/features/adminOperations/adminAiSpecialists.js",
    "js/admin/adminTaxonomyManager.js",
    "js/admin/adminProductManager.js",
    "js/admin/adminMarketingAiManager.js",
    "js/admin/adminEmailDispatcher.js",
    "js/admin/adminFormulasPreorders.js",
    "js/admin/adminTaxonomyUI.js",
    "js/admin/adminProductUI.js",
    "js/admin/adminAuthUI.js",
    "js/adminController.js",
    "js/features/storefrontDOMListeners.js",
    "js/features/appDelegators.js",
    "js/app.js"
]

def transform_es_to_cjs(code, mod_name):
    code = re.sub(r'import\s*\{([^}]+)\}\s*from\s*["\']([^"\']+)["\'];?', lambda m: f"import {{{' '.join(m.group(1).split())}}} from '{m.group(2)}';", code)
    lines = code.splitlines()
    out = []
    exports_to_add = []
    for line in lines:
        stripped = line.strip()
        m_imp = re.match(r"^import\s+\{([^}]+)\}\s+from\s+[\"']([^\"']+)[\"'];?", stripped)
        if m_imp:
            named = m_imp.group(1)
            target = m_imp.group(2).split("?")[0]
            if target.startswith("./"):
                dir_part = os.path.dirname(mod_name)
                target = os.path.normpath(os.path.join(dir_part, target[2:])).replace("\\", "/")
            elif target.startswith("../"):
                dir_part = os.path.dirname(mod_name)
                target = os.path.normpath(os.path.join(dir_part, target)).replace("\\", "/")
            target = re.sub(r"^\./", "", target)
            out.append(f'const {{ {named} }} = req("{target}");')
            continue

        m_imp_all = re.match(r"^import\s+\*\s+as\s+(\w+)\s+from\s+[\"']([^\"']+)[\"'];?", stripped)
        if m_imp_all:
            named = m_imp_all.group(1)
            target = m_imp_all.group(2).split("?")[0]
            if target.startswith("./"):
                dir_part = os.path.dirname(mod_name)
                target = os.path.normpath(os.path.join(dir_part, target[2:])).replace("\\", "/")
            elif target.startswith("../"):
                dir_part = os.path.dirname(mod_name)
                target = os.path.normpath(os.path.join(dir_part, target)).replace("\\", "/")
            target = re.sub(r"^\./", "", target)
            out.append(f'const {named} = req("{target}");')
            continue

        m_exp_named = re.match(r"^export\s+\{([^}]+)\};?", stripped)
        if m_exp_named:
            items = [item.strip() for item in m_exp_named.group(1).split(",") if item.strip()]
            for item in items:
                if " as " in item:
                    orig, alias = item.split(" as ")
                    exports_to_add.append(f'exports.{alias.strip()} = {orig.strip()};')
                else:
                    exports_to_add.append(f'exports.{item} = {item};')
            continue

        m_exp_const = re.match(r"^export\s+(const|let|var)\s+(\w+)\s*=", stripped)
        if m_exp_const:
            name = m_exp_const.group(2)
            exports_to_add.append(f'exports.{name} = {name};')
            out.append(line.replace("export ", ""))
            continue

        m_exp_fn = re.match(r"^export\s+function\s+(\w+)\s*\(", stripped)
        if m_exp_fn:
            name = m_exp_fn.group(1)
            exports_to_add.append(f'exports.{name} = {name};')
            out.append(line.replace("export ", ""))
            continue

        m_exp_cls = re.match(r"^export\s+class\s+(\w+)", stripped)
        if m_exp_cls:
            name = m_exp_cls.group(1)
            exports_to_add.append(f'exports.{name} = {name};')
            out.append(line.replace("export ", ""))
            continue

        m_exp_def = re.match(r"^export\s+default\s+", stripped)
        if m_exp_def:
            out.append(line.replace("export default ", "module.exports = "))
            continue

        out.append(line)

    for exp in exports_to_add:
        out.append(exp)

    return "\n".join(out)

def build_bundle():
    bundle = []
    bundle.append("var __modules = {};")
    bundle.append("function define(id, fn) { __modules[id] = fn; }")
    bundle.append("function req(id) {")
    bundle.append("  id = id.replace(/\\?.*$/, '');")
    bundle.append("  if (!__modules[id]) {")
    bundle.append("    console.error('Module not found: ' + id);")
    bundle.append("    return {};")
    bundle.append("  }")
    bundle.append("  var m = __modules[id];")
    bundle.append("  if (!m.exports) {")
    bundle.append("    m.exports = {};")
    bundle.append("    m(m.exports, req, m);")
    bundle.append("  }")
    bundle.append("  return m.exports;")
    bundle.append("}")
    bundle.append("")

    for mod in MODULE_FILES:
        filepath = os.path.join(ROOT_DIR, mod)
        if not os.path.exists(filepath):
            print(f"Warning: module file missing: {filepath}")
            continue
        with open(filepath, "r", encoding="utf-8") as f:
            code = f.read()
        trans = transform_es_to_cjs(code, mod)
        bundle.append(f"// MODULE: {mod}")
        bundle.append(f"define('{mod}', function(exports, req, module) {{")
        bundle.append(trans)
        bundle.append("});")
        bundle.append("")

    bundle.append("// Auto-start storefront application")
    bundle.append("document.addEventListener('DOMContentLoaded', function() {")
    bundle.append("  try {")
    bundle.append("    req('js/app.js');")
    bundle.append("  } catch(e) {")
    bundle.append("    console.error('Failed to initialize storefront application:', e);")
    bundle.append("  }")
    bundle.append("});")
    return "\n".join(bundle)

def transform_html_for_liquid(html):
    html = re.sub(r'src=["\'](assets/images/[^"\']+)["\']', lambda m: f"src=\"{{{{ '{m.group(1).split('/')[-1]}' | asset_url }}}}\"", html)
    html = re.sub(r'src=["\'](assets/videos/[^"\']+)["\']', lambda m: f"src=\"{{{{ '{m.group(1).split('/')[-1]}' | asset_url }}}}\"", html)
    html = re.sub(r'href=["\'](assets/docs/[^"\']+)["\']', lambda m: f"href=\"{{{{ '{m.group(1).split('/')[-1]}' | asset_url }}}}\"", html)
    html = re.sub(r'href=["\'](assets/[^"\']+\.(ico|svg|png))["\']', lambda m: f"href=\"{{{{ '{m.group(1).split('/')[-1]}' | asset_url }}}}\"", html)

    def replace_page_links(match):
        href = match.group(1)
        mapping = {
            "index.html": "/",
            "/": "/",
            "about.html": "/pages/about",
            "/about.html": "/pages/about",
            "support.html": "/pages/support",
            "/support.html": "/pages/support",
            "shipping.html": "/pages/shipping",
            "/shipping.html": "/pages/shipping",
            "privacy.html": "/pages/privacy",
            "/privacy.html": "/pages/privacy",
            "dealers.html": "/pages/dealers",
            "/dealers.html": "/pages/dealers",
            "product.html": "/products",
            "/product.html": "/products",
            "crm.html": "/pages/crm",
            "/crm.html": "/pages/crm"
        }
        return f'href="{mapping.get(href, href)}"'

    html = re.sub(r'href=["\']((?:/?[a-zA-Z0-9_\-]+(?:\.html)?)|/)["\']', replace_page_links, html)
    return html

def transform_theme_liquid(content):
    content = transform_html_for_liquid(content)
    if "styles.css" in content and "{{ 'styles.css' | asset_url }}" not in content:
        content = re.sub(r'<link[^>]*href=["\'][^"\']*styles\.css[^"\']*["\'][^>]*>', "{{ 'styles.css' | asset_url | stylesheet_tag }}", content)
    if "coast-storefront-bundle.js" in content and "{{ 'coast-storefront-bundle.js' | asset_url }}" not in content:
        content = re.sub(r'<script[^>]*src=["\'][^"\']*coast-storefront-bundle\.js[^"\']*["\'][^>]*></script>', "{{ 'coast-storefront-bundle.js' | asset_url | script_tag }}", content)
    if "full_ecom_catalog.js" in content and "{{ 'full_ecom_catalog.js' | asset_url }}" not in content:
        content = re.sub(r'<script[^>]*src=["\'][^"\']*full_ecom_catalog\.js[^"\']*["\'][^>]*></script>', "{{ 'full_ecom_catalog.js' | asset_url | script_tag }}", content)
    return content

def get_theme_and_media_assets():
    theme_assets = {}
    content_media = {}
    img_dir = os.path.join(ROOT_DIR, "assets", "images")
    if os.path.exists(img_dir):
        for f in os.listdir(img_dir):
            if f.endswith((".png", ".jpg", ".jpeg", ".svg", ".webp", ".ico")):
                fp = os.path.join(img_dir, f)
                if any(x in f.lower() for x in ["logo", "favicon", "icon", "buggy", "kroma", "fk100", "flake-king-orange"]):
                    theme_assets[f"assets/{f}"] = fp
                else:
                    content_media[f] = fp

    for root_f in ["coast_logo_white.png", "coast_logo_black.png", "coast_logo_red.png", "favicon.ico"]:
        rfp = os.path.join(ROOT_DIR, root_f)
        if os.path.exists(rfp):
            theme_assets[f"assets/{root_f}"] = rfp

    for extra in ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon.svg"]:
        efp = os.path.join(ROOT_DIR, "assets", extra)
        if os.path.exists(efp):
            theme_assets[f"assets/{extra}"] = efp

    return theme_assets, content_media

def extract_content_page(filename):
    filepath = os.path.join(ROOT_DIR, filename)
    if not os.path.exists(filepath):
        return ""
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    style_match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
    style_content = f"<style>\n{style_match.group(1).strip()}\n</style>\n" if style_match else ""

    tw_match = re.search(r'(<script id="tailwind-config">.*?</script>)', html, re.DOTALL)
    tw_content = f"{tw_match.group(1)}\n" if tw_match else ""

    body_match = re.search(r"<body[^>]*>(.*?)</body>", html, re.DOTALL)
    body_content = body_match.group(1).strip() if body_match else html

    combined = f"{tw_content}\n{style_content}\n{body_content}\n"
    return transform_html_for_liquid(combined)

def extract_snippets():
    with open(os.path.join(ROOT_DIR, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()

    m1 = "  <!-- ========================================================================= -->\n  <!-- MASTER SITE HEADER (UNIFIED STICKY CONTAINER) -->"
    m2 = "    <!-- ========================================================================= -->\n    <!-- MASTER PRODUCT CATALOG & SEARCH TOOLBAR (IN-STOCK PRODUCTS) -->"
    m3 = "  <!-- ========================================================================= -->\n  <!-- TAB VIEW 2: MIXING CALCULATOR & RATIO MATRIX -->"
    m4 = "  <!-- ========================================================================= -->\n  <!-- TAB VIEW 8: ADMIN CONTROL CENTER // MASTER ADD-ON SUITE -->"
    m5 = "  <!-- ========================================================================= -->\n  <!-- MODAL: AUTHORIZED TRADE & DEALER ACCESS (ZERO DISCOUNT DISCLOSURE) -->"
    end_marker = "  <!-- Application Master Scripts -->"

    p1 = html.find(m1)
    if p1 == -1:
        p1 = html.find('<header id="master-site-header"')
    p2 = html.find(m2)
    p3 = html.find(m3)
    p4 = html.find(m4)
    p5 = html.find(m5)
    pend = html.find(end_marker)

    assert p1 != -1 and p2 != -1 and p3 != -1 and p4 != -1 and p5 != -1 and pend != -1, f"Snippet markers missing in index.html"

    # Synchronize primary extracted snippets
    snippets = {
        "snippets/header-and-departments.liquid": transform_html_for_liquid(html[p1:p2].rstrip() + "\n"),
        "snippets/storefront-catalog.liquid": transform_html_for_liquid(html[p2:p3].rstrip() + "\n"),
        "snippets/page-about.liquid": extract_content_page("about.html"),
        "snippets/page-support.liquid": extract_content_page("support.html"),
        "snippets/page-shipping.liquid": extract_content_page("shipping.html"),
        "snippets/page-privacy.liquid": extract_content_page("privacy.html"),
        "snippets/page-dealers.liquid": extract_content_page("dealers.html"),
        "snippets/page-product.liquid": extract_content_page("product.html")
    }

    # Include all modular snippets currently present on disk in coast-airbrush-eu-shopify-theme/snippets/
    if os.path.isdir(SNIPPETS_DIR):
        for sname in sorted(os.listdir(SNIPPETS_DIR)):
            if sname.endswith(".liquid") and not sname.startswith("._"):
                spath = f"snippets/{sname}"
                if spath not in snippets:
                    with open(os.path.join(SNIPPETS_DIR, sname), "r", encoding="utf-8") as sf:
                        snippets[spath] = sf.read()

    return snippets

PASSWORD_LAYOUT_LIQUID = """<!doctype html>
<html class="dark" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ shop.name }} - European Launch &amp; Kroma Edge Premiere</title>
    {{ content_for_header }}
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ 'styles.css' | asset_url }}">
    <link rel="icon" type="image/x-icon" href="{{ 'favicon.ico' | asset_url }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ 'apple-touch-icon.png' | asset_url }}">
    
    <script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "surface": "#0b0b0d",
              "surface-container-lowest": "#060608",
              "surface-container-low": "#131315",
              "surface-container": "#18181b",
              "surface-container-high": "#242429",
              "surface-container-highest": "#2e2e34",
              "primary": "#dc2626",
              "primary-container": "#991b1b",
              "primary-dark": "#7f1d1d",
              "secondary": "#a1a1aa",
              "on-surface": "#f4f4f5",
              "on-surface-variant": "#a1a1aa"
            },
            fontFamily: {
              "headline": ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
              "body": ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
              "mono": ["JetBrains Mono", "monospace"]
            }
          }
        }
      }
    </script>
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #0b0b0d;
        color: #f4f4f5;
        min-height: 100vh;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
      }
      .static-buggy-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(180deg, rgba(11, 11, 13, 0.78) 0%, rgba(11, 11, 13, 0.58) 40%, rgba(6, 6, 8, 0.88) 100%), 
                    url('{{ 'flake_buggy_hero.jpg' | asset_url }}') no-repeat center center;
        background-size: cover;
        z-index: 0;
        pointer-events: none;
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }
      .static-metal-sheen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.02) 100%);
        z-index: 1;
        pointer-events: none;
      }
      .welcome-card {
        background: rgba(19, 19, 21, 0.90);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid #242429;
        border-radius: 4px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
      }
      .inner-panel {
        background: rgba(11, 11, 13, 0.80);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid #242429;
        border-radius: 4px;
      }
      .red-accent-rule {
        height: 2px;
        background: linear-gradient(90deg, #dc2626 0%, rgba(220, 38, 38, 0.3) 60%, transparent 100%);
      }
      .text-shadow-contrast {
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8);
      }
      .mech-btn-primary {
        background-color: #dc2626;
        color: #ffffff;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        transition: all 0.2s ease;
        border-radius: 2px;
      }
      .mech-btn-primary:hover {
        background-color: #b91c1c;
      }
    </style>
  </head>
  <body class="flex flex-col justify-between selection:bg-red-600 selection:text-white relative font-sans">
    <div class="static-buggy-bg"></div>
    <div class="static-metal-sheen"></div>
    {{ content_for_layout }}
  </body>
</html>
"""

PASSWORD_TEMPLATE_LIQUID = """<!-- Header (Clean Branding Bar with Partner Backdoor Trigger) -->
<header class="w-full border-b border-[#242429] bg-[#0b0b0d]/90 backdrop-blur-md sticky top-0 z-30">
  <div class="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <a href="#subscribe-form" class="flex items-center" title="Coast Airbrush Europe">
        <img src="{{ 'coast_logo_white.png' | asset_url }}" alt="Coast Airbrush Europe" class="h-8 md:h-9 w-auto object-contain">
      </a>
    </div>

    <div class="flex items-center gap-2 sm:gap-3 font-mono text-[11px] sm:text-xs">
      <span class="hidden md:inline text-white/80 tracking-wider text-shadow-contrast">
        🇬🇧 UK DISPATCH • REACH COMPLIANT
      </span>
      <span class="hidden md:inline text-white/30">•</span>

      <!-- Trade Partner & VIP Storefront Access Passcode Trigger -->
      <button type="button" onclick="openPartnerBackdoorModal()" class="px-2.5 py-1.5 rounded-sm bg-[#131315] hover:bg-[#18181b] border border-[#242429] hover:border-[#dc2626] text-neutral-300 hover:text-white transition-all cursor-pointer font-mono text-[11px] tracking-wider uppercase flex items-center gap-1.5 shadow-sm" title="Trade Partner &amp; VIP Storefront Access">
        <span class="material-symbols-outlined text-[14px] text-amber-400">vpn_key</span>
        <span>Trade Partner &amp; VIP Storefront Access</span>
      </button>

      <!-- Public VIP Email Registration -->
      <a href="#subscribe-form" class="mech-btn-primary !py-1.5 !px-3 text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-sm" title="Register for VIP Launch Allocation">
        <span class="material-symbols-outlined text-[14px]">notifications_active</span>
        <span class="hidden sm:inline">Register VIP</span>
        <span class="sm:hidden">VIP</span>
      </a>
    </div>
  </div>
</header>

<!-- Main Floating Promotional Story -->
<main class="w-full flex-grow flex flex-col justify-center items-center py-12 sm:py-20 px-4 sm:px-6 relative z-10">
  <article class="welcome-card w-full max-w-3xl p-6 sm:p-12 space-y-12 rounded-sm my-auto">
    
    <!-- SECTION 1: ABOUT COAST AIRBRUSH EUROPE -->
    <section class="space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="font-mono text-xs font-bold uppercase tracking-widest text-[#dc2626] flex items-center gap-2 bg-black/60 px-3 py-1 rounded border border-[#dc2626]/40">
          <span class="inline-block w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>
          Official European Operations
        </div>
        <span class="font-mono text-[11px] text-white/80 text-shadow-contrast font-bold">EST. 2026</span>
      </div>

      <h1 class="font-headline text-3xl sm:text-5xl uppercase text-white tracking-tight leading-tight text-shadow-contrast font-bold">
        About Coast Airbrush Europe
      </h1>

      <p class="font-headline text-lg sm:text-2xl text-[#dc2626] font-medium tracking-wide text-shadow-contrast">
        Precision Engineering. Personal Support. No Compromises.
      </p>

      <div class="red-accent-rule"></div>

      <p class="text-base sm:text-lg text-white leading-relaxed font-normal pt-1 text-shadow-contrast">
        Coast Airbrush Europe brings the legendary heritage of American custom paint craftsmanship direct to European painters and refinishers. We are redefining the custom painting standard with proprietary, market-leading equipment backed by genuine human expertise before, during, and after every purchase.
      </p>

      <!-- Trust Badges Grid -->
      <div class="grid grid-cols-3 gap-2 pt-2 font-mono text-[10px] sm:text-[11px]">
        <div class="p-2.5 rounded bg-black/60 border border-[#242429] text-neutral-200 flex flex-col items-center justify-center">
          <span class="text-base sm:text-lg mb-0.5">🇬🇧 🇳🇱</span>
          <span class="font-bold">UK &amp; EU Dispatch</span>
        </div>
        <div class="p-2.5 rounded bg-black/60 border border-[#242429] text-neutral-200 flex flex-col items-center justify-center">
          <span class="text-base sm:text-lg mb-0.5">🛡️</span>
          <span class="font-bold">REACH Compliant</span>
        </div>
        <div class="p-2.5 rounded bg-black/60 border border-[#242429] text-neutral-200 flex flex-col items-center justify-center">
          <span class="text-base sm:text-lg mb-0.5">⚡</span>
          <span class="font-bold">Zero US Customs</span>
        </div>
      </div>
    </section>

    <!-- SECTION 2: EXCLUSIVE PRODUCT ROLLOUT -->
    <section class="space-y-3">
      <h2 class="font-headline text-xl sm:text-2xl uppercase text-white tracking-tight text-shadow-contrast font-bold">
        Exclusive Product Rollout: <span class="text-neutral-400">The Next 6 Months</span>
      </h2>

      <div class="red-accent-rule"></div>

      <p class="text-sm sm:text-base text-white/95 leading-relaxed font-light text-shadow-contrast">
        Over the next six months, we are launching an exclusive lineup of groundbreaking, professional-grade products found nowhere else. We reject generic clones and faceless marketplaces to bring you purpose-built innovations that protect your craft and elevate your finish.
      </p>
    </section>

    <!-- SECTION 3: PHASE 1 LAUNCH: THE KROMAEDGE SPRAYABLE CHROME SYSTEM -->
    <section class="space-y-4">
      <div class="space-y-1">
        <div class="font-mono text-xs text-[#dc2626] font-bold uppercase tracking-wider text-shadow-contrast">
          PHASE 1 LAUNCH
        </div>
        <h2 class="font-headline text-xl sm:text-2xl uppercase text-white tracking-tight text-shadow-contrast font-bold">
          The Kromaedge Sprayable Chrome System
        </h2>
      </div>

      <div class="red-accent-rule"></div>

      <p class="text-sm sm:text-base text-white/95 leading-relaxed font-light text-shadow-contrast">
        We are excited to announce that the very first release in Europe is the revolutionary <strong class="text-white font-semibold">Kromaedge</strong> product line. Engineered for deep, liquid-mirror reflections, superior atomization, and flawless edge-to-edge application, Kromaedge sets a new benchmark in sprayable chrome technology.
      </p>

      <!-- Product Visual Showcase Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <!-- Card 1: Kroma Edge Mirror Specimen -->
        <div class="inner-panel rounded overflow-hidden border border-white/20 bg-black/60 flex flex-col group">
          <div class="relative h-44 overflow-hidden bg-black/80 flex items-center justify-center">
            <img src="{{ 'kroma-skull-studio-dark.jpg' | asset_url }}" alt="Kroma Edge Mirror Chrome Specimen" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <span class="absolute top-2 left-2 bg-black/80 border border-[#dc2626]/50 text-[#dc2626] font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              ✦ 99.4% Reflection
            </span>
            <span class="absolute bottom-2 right-2 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
              Zero Groundcoat Required
            </span>
          </div>
          <div class="p-3.5 space-y-1">
            <h4 class="font-headline text-sm uppercase text-white font-bold">Kroma Edge™ Mirror Chrome 2K System</h4>
            <p class="font-mono text-xs text-neutral-300">Self-organizing optical coating. Direct chemical bond to plastic, resin, aluminum &amp; steel.</p>
          </div>
        </div>

        <!-- Card 2: Kroma Edge 4-Part System Kit -->
        <div class="inner-panel rounded overflow-hidden border border-white/20 bg-black/60 flex flex-col group">
          <div class="relative h-44 overflow-hidden bg-black/80 flex items-center justify-center p-2">
            <img src="{{ 'kroma-detail-skull.jpg' | asset_url }}" alt="Kroma Edge Complete 4-Part Kit" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <span class="absolute top-2 left-2 bg-black/80 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Complete 4-Part System
            </span>
            <span class="absolute bottom-2 right-2 bg-black/80 border border-white/30 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
              140g &rarr; 10kg Kits
            </span>
          </div>
          <div class="p-3.5 space-y-1">
            <h4 class="font-headline text-sm uppercase text-white font-bold">Complete 4-Part Formulated Kit</h4>
            <p class="font-mono text-xs text-neutral-300">Pre-measured Binder, Reducer, Hardener &amp; Optical Mirror Seeds with precision mixing ratio.</p>
          </div>
        </div>
      </div>

      <!-- Flake King & Hardware Product Row -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <!-- Subcard 1: Flake King Flake Gun -->
        <div class="inner-panel p-2.5 rounded border border-white/15 bg-black/40 flex items-center gap-3">
          <img src="{{ 'flake-buggy-studio.jpg' | asset_url }}" alt="Flake King Dry Flake Gun" class="w-14 h-14 object-cover rounded flex-shrink-0 border border-white/20">
          <div class="min-w-0">
            <div class="font-headline text-xs uppercase text-white font-bold truncate">Flake King™ Dry Guns</div>
            <div class="font-mono text-[11px] text-[#dc2626]">36 Metal Flakes Dropping</div>
          </div>
        </div>

        <!-- Subcard 2: Basecoats & Binders -->
        <div class="inner-panel p-2.5 rounded border border-white/15 bg-black/40 flex items-center gap-3">
          <img src="{{ 'fk100-prime-black-base.jpg' | asset_url }}" alt="FK100 Prime Black Base" class="w-14 h-14 object-contain rounded flex-shrink-0 border border-white/20 bg-black">
          <div class="min-w-0">
            <div class="font-headline text-xs uppercase text-white font-bold truncate">Basecoats &amp; Binders</div>
            <div class="font-mono text-[11px] text-emerald-400">FK50, FK55 &amp; FK100</div>
          </div>
        </div>

        <!-- Subcard 3: Fine-Line Tapes -->
        <div class="inner-panel p-2.5 rounded border border-white/15 bg-black/40 flex items-center gap-3">
          <img src="{{ 'flake-king-orange-mixed-set.jpg' | asset_url }}" alt="Flake King Fine Line Masking Tape" class="w-14 h-14 object-contain rounded flex-shrink-0 border border-white/20 bg-black">
          <div class="min-w-0">
            <div class="font-headline text-xs uppercase text-white font-bold truncate">Fine Line Tapes</div>
            <div class="font-mono text-[11px] text-amber-400">Green &amp; Orange Sets</div>
          </div>
        </div>
      </div>

      <!-- Promotional Status Notice & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div class="font-mono text-xs font-bold text-[#dc2626] flex items-center gap-2 text-shadow-contrast">
          <span class="material-symbols-outlined text-[18px]">verified</span>
          <span>European Premiere • Direct UK &amp; Netherlands Dispatch</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" onclick="openPartnerBackdoorModal()" class="px-3.5 py-2 rounded-sm bg-[#131315] hover:bg-[#18181b] border border-[#242429] hover:border-[#dc2626] text-neutral-200 hover:text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm" title="Trade Partner &amp; VIP Storefront Access">
            <span class="material-symbols-outlined text-[15px] text-amber-400">vpn_key</span>
            <span>Partner Catalog Preview</span>
          </button>
          <a href="#subscribe-form" class="mech-btn-primary !py-2 !px-4 text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-sm uppercase text-white whitespace-nowrap transition-all" title="Register to Reserve Your Launch Allocation">
            <span class="material-symbols-outlined text-[15px]">notifications_active</span>
            <span>Register Allocation</span>
            <span class="material-symbols-outlined text-[14px]">arrow_downward</span>
          </a>
        </div>
      </div>
    </section>

    <!-- SECTION 4: STAY AHEAD OF THE LAUNCH -->
    <section class="space-y-4">
      <h2 class="font-headline text-xl sm:text-2xl uppercase text-white tracking-tight text-shadow-contrast font-bold">
        Stay Ahead of the Launch
      </h2>

      <div class="red-accent-rule"></div>

      <div class="space-y-3 text-sm sm:text-base text-white/95 leading-relaxed font-light text-shadow-contrast">
        <p>
          Don't miss a single drop as our European rollout unfolds. Register below for early access alerts, priority product allocation, and direct technical updates.
        </p>
      </div>

      <!-- Lead Capture Form to Native Shopify Customers -->
      <div class="inner-panel p-5 sm:p-6 rounded space-y-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-[#242429]">
        {% form 'customer', id: 'subscribe-form', class: 'space-y-3' %}
          {{ form.errors | default_errors }}
          
          {% if form.posted_successfully? %}
            <div class="p-6 bg-black/80 border-2 border-emerald-500 rounded text-center space-y-3">
              <div class="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                <span class="material-symbols-outlined text-2xl">verified</span>
              </div>
              <h3 class="font-headline text-lg uppercase text-white font-bold tracking-wide">
                You're on the VIP Allocation List!
              </h3>
              <p class="font-mono text-xs text-neutral-300">
                We have reserved your early access alert. You will receive a direct access link 24 hours before doors open to the general public.
              </p>
              <div class="font-mono text-xs text-white/85 space-y-2 pt-2 text-left max-w-sm mx-auto">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-[#dc2626] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                  <span>Open the notification from <strong>Coast Airbrush Europe</strong>.</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-[#dc2626] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                  <span>Click your private allocation link.</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-[#dc2626] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                  <span>Secure first batch Kroma Edge &amp; Flake King reserves.</span>
                </div>
              </div>
              <div class="pt-2">
                <span class="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded border border-emerald-500/40">
                  Priority Status: Activated
                </span>
              </div>
            </div>
          {% else %}
            <input type="hidden" name="contact[tags]" value="prospect, pre-launch-vip, european-launch">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input 
                type="text" 
                name="contact[first_name]" 
                id="VIPFirstName" 
                required 
                placeholder="First Name" 
                class="bg-[#0b0b0d] border border-[#242429] focus:border-[#dc2626] text-white px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:outline-none placeholder:text-neutral-500 rounded-sm"
              >
              <input 
                type="text" 
                name="contact[last_name]" 
                id="VIPLastName" 
                required 
                placeholder="Last Name" 
                class="bg-[#0b0b0d] border border-[#242429] focus:border-[#dc2626] text-white px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:outline-none placeholder:text-neutral-500 rounded-sm"
              >
            </div>
            <div>
              <input 
                type="email" 
                name="contact[email]" 
                id="VIPEmail" 
                required 
                placeholder="Enter Your Email Address" 
                class="w-full bg-[#0b0b0d] border border-[#242429] focus:border-[#dc2626] text-white px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:outline-none placeholder:text-neutral-500 rounded-sm"
              >
            </div>
            <div>
              <select 
                name="contact[note]" 
                id="VIPRole" 
                class="w-full bg-[#0b0b0d] border border-[#242429] focus:border-[#dc2626] text-neutral-300 px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:outline-none rounded-sm"
              >
                <option value="Custom Automotive &amp; Motorcycle Painting">Custom Automotive &amp; Motorcycle Painting</option>
                <option value="Airbrush &amp; Fine Art Refinishing">Airbrush &amp; Fine Art Refinishing</option>
                <option value="Commercial Body Shop / Trade Dealer">Commercial Body Shop / Trade Dealer</option>
                <option value="Model / Scale &amp; Hobbyist">Model / Scale &amp; Hobbyist</option>
              </select>
            </div>
            <button 
              type="submit" 
              class="w-full mech-btn-primary !py-3 !px-5 text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-sm uppercase cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">notifications_active</span>
              <span>Lock In VIP Access &rarr;</span>
            </button>
            
            <p class="font-mono text-[11px] text-white/85 italic flex items-center justify-center gap-1.5 text-shadow-contrast pt-1">
              <span class="material-symbols-outlined text-[#dc2626] text-[13px]">shield</span>
              Direct technical updates. Exclusive early drops. Zero spam.
            </p>
          {% endif %}
        {% endform %}
      </div>
    </section>

    <!-- SECTION 5: THE COAST GUARANTEE -->
    <section class="space-y-4">
      <h2 class="font-headline text-xl sm:text-2xl uppercase text-white tracking-tight text-shadow-contrast font-bold">
        The Coast Guarantee
      </h2>

      <div class="red-accent-rule"></div>

      <ul class="space-y-2.5">
        <li class="inner-panel p-3.5 sm:p-4 flex items-start gap-3 rounded-sm transition-colors hover:border-[#dc2626]/60">
          <span class="material-symbols-outlined text-[#dc2626] text-xl flex-shrink-0 mt-0.5">support_agent</span>
          <div class="space-y-0.5">
            <h3 class="font-headline text-sm sm:text-base uppercase text-white text-shadow-contrast font-bold">Personal Human Support</h3>
            <p class="text-xs sm:text-sm text-white/90 font-light text-shadow-contrast">
              (Expert 1-on-1 guidance before, whilst, and after your purchase)
            </p>
          </div>
        </li>

        <li class="inner-panel p-3.5 sm:p-4 flex items-start gap-3 rounded-sm transition-colors hover:border-[#dc2626]/60">
          <span class="material-symbols-outlined text-emerald-400 text-xl flex-shrink-0 mt-0.5">verified_user</span>
          <div class="space-y-0.5">
            <h3 class="font-headline text-sm sm:text-base uppercase text-white text-shadow-contrast font-bold">Guaranteed Authenticity</h3>
            <p class="text-xs sm:text-sm text-white/90 font-light text-shadow-contrast">
              (Proprietary products backed by full factory warranty)
            </p>
          </div>
        </li>

        <li class="inner-panel p-3.5 sm:p-4 flex items-start gap-3 rounded-sm transition-colors hover:border-[#dc2626]/60">
          <span class="material-symbols-outlined text-sky-400 text-xl flex-shrink-0 mt-0.5">smart_toy</span>
          <div class="space-y-0.5">
            <h3 class="font-headline text-sm sm:text-base uppercase text-white text-shadow-contrast font-bold">24/7 AI Knowledge Base</h3>
            <p class="text-xs sm:text-sm text-white/90 font-light text-shadow-contrast">
              (Instant technical specs and baseline troubleshooting)
            </p>
          </div>
        </li>
      </ul>
    </section>

  </article>
</main>

<!-- Footer -->
<footer class="w-full border-t border-[#242429] bg-[#0b0b0d]/90 backdrop-blur-md py-6 px-6 text-center font-mono text-xs text-neutral-400 relative z-20">
  <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="flex items-center gap-2.5">
      <img src="{{ 'coast_logo_white.png' | asset_url }}" alt="Coast Airbrush Europe" class="h-6 w-auto object-contain">
      <span class="text-white font-bold">&copy; 2026 Coast Airbrush Europe.</span>
    </div>
    <div class="flex flex-wrap items-center justify-center gap-3 text-neutral-400">
      <span>Precision Performance Engineering • Direct UK &amp; EU Logistics</span>
      <span class="text-neutral-600 hidden sm:inline">•</span>
      <button type="button" onclick="openPartnerBackdoorModal()" class="text-neutral-400 hover:text-white underline underline-offset-4 cursor-pointer transition-colors text-[11px] flex items-center gap-1 font-mono">
        <span class="material-symbols-outlined text-[13px] text-amber-400">vpn_key</span>
        <span>Trade Partner &amp; VIP Storefront Access</span>
      </button>
    </div>
  </div>
</footer>

<!-- Trade Partner & VIP Storefront Password Backdoor Modal -->
<div id="partner-backdoor-modal" class="fixed inset-0 z-50 {% if form.errors %}flex{% else %}hidden{% endif %} items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity" role="dialog" aria-modal="true" aria-labelledby="backdoor-modal-title">
  <div class="relative w-full max-w-md bg-[#131315] border border-[#242429] shadow-2xl rounded-sm p-6 sm:p-7 space-y-5 text-left transform transition-all">
    <!-- Modal Header -->
    <div class="flex items-start justify-between border-b border-[#242429] pb-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-sm bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-500 flex-shrink-0">
          <span class="material-symbols-outlined text-[20px]">vpn_key</span>
        </div>
        <div>
          <h2 id="backdoor-modal-title" class="font-headline text-base uppercase text-white font-bold tracking-tight">Partner &amp; VIP Backdoor</h2>
          <p class="font-mono text-[11px] text-neutral-400">Pre-Launch Storefront Access</p>
        </div>
      </div>
      <button type="button" onclick="closePartnerBackdoorModal()" class="text-neutral-400 hover:text-white p-1 rounded transition-colors cursor-pointer" aria-label="Close modal">
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="space-y-4">
      <p class="font-mono text-xs text-neutral-300 leading-relaxed">
        Authorized trade partners, distributors, and preview evaluators: enter your storefront password below to unlock the complete Coast Airbrush Europe storefront and live mixing engine.
      </p>

      {% form 'storefront_password', id: 'partner-passcode-form', class: 'space-y-3' %}
        {% if form.errors %}
          <div class="p-3 rounded-sm font-mono text-xs flex items-center gap-2 bg-red-950/80 border border-red-500 text-red-300">
            <span class="material-symbols-outlined text-[16px]">error</span>
            <span>{{ form.errors | default_errors | strip_html }}</span>
          </div>
        {% endif %}

        <div class="space-y-1.5">
          <label for="Password" class="block font-mono text-[10px] uppercase tracking-wider text-neutral-400">
            Storefront Password
          </label>
          <div class="relative">
            <input
              type="password"
              name="password"
              id="Password"
              required
              autocomplete="current-password"
              placeholder="Enter Storefront Password"
              class="w-full bg-[#0b0b0d] border border-[#242429] focus:border-[#dc2626] text-white px-3.5 py-2.5 text-xs font-mono rounded-sm focus:outline-none placeholder:text-neutral-600 uppercase pr-10 tracking-widest"
            >
            <button
              type="button"
              onclick="togglePasscodeVisibility()"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer p-1"
              aria-label="Toggle password visibility"
            >
              <span id="passcode-visibility-icon" class="material-symbols-outlined text-[16px]">visibility</span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button
            type="submit"
            id="btn-partner-unlock"
            class="flex-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-mono font-bold text-xs uppercase py-2.5 px-4 rounded-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 tracking-wider"
          >
            <span class="material-symbols-outlined text-[15px]">lock_open</span>
            <span>Unlock Storefront &rarr;</span>
          </button>
          <button
            type="button"
            onclick="closePartnerBackdoorModal()"
            class="px-3.5 py-2.5 rounded-sm bg-[#18181b] border border-[#242429] text-neutral-400 hover:text-white font-mono text-xs uppercase transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      {% endform %}

      <div class="pt-2 text-[11px] font-mono text-neutral-500 text-center border-t border-[#242429]">
        <a href="/admin" class="hover:text-neutral-300 transition-colors">Store Admin Login (/admin)</a>
      </div>
    </div>
  </div>
</div>

<!-- Interactive Modal Scripts -->
<script>
  function openPartnerBackdoorModal() {
    const modal = document.getElementById('partner-backdoor-modal');
    const input = document.getElementById('Password');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (input) setTimeout(() => input.focus(), 50);
    }
  }

  function closePartnerBackdoorModal() {
    const modal = document.getElementById('partner-backdoor-modal');
    if (modal) {
      modal.classList.remove('flex');
      modal.classList.add('hidden');
    }
  }

  function togglePasscodeVisibility() {
    const input = document.getElementById('Password');
    const icon = document.getElementById('passcode-visibility-icon');
    if (!input || !icon) return;
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility';
    }
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closePartnerBackdoorModal();
  });
  document.addEventListener('click', function(e) {
    const modal = document.getElementById('partner-backdoor-modal');
    if (modal && !modal.classList.contains('hidden') && e.target === modal) {
      closePartnerBackdoorModal();
    }
  });
</script>
"""

INDEX_JSON_TEMPLATE = """{
  "name": "Home page",
  "sections": {
    "announcement_bar": {
      "type": "announcement-bar",
      "settings": {
        "show_announcement": true,
        "announcement_text": "Official European Master Distributor: Iwata Custom Lines & Flake King",
        "announcement_link": "",
        "badge_text": "⚡ 24/48H RAPID DISPATCH (UK & EU)",
        "enable_vat_toggle": true
      }
    },
    "header": {
      "type": "header",
      "settings": {
        "menu": "main-menu",
        "show_search": true,
        "show_quick_mix": true,
        "show_b2b_button": true
      }
    },
    "hero_carousel": {
      "type": "hero-carousel",
      "blocks": {
        "slide_1": {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-skull-studio-dark.jpg",
            "caption": "01/06 • 100% Mirror Anatomic Chrome Skull (Zero Gray Haze)",
            "badge": "Zero Gray Clouding",
            "position": "center right 18%"
          }
        },
        "slide_2": {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-surfer-wave-studio.jpg",
            "caption": "02/06 • Full-Scale Silver Surfer on Ocean Wave (Pier Sunset)",
            "badge": "Full Figure Liquid Chrome",
            "position": "center right 10%"
          }
        },
        "slide_3": {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-helmet-mirror.jpg",
            "caption": "03/06 • 99.4% Specular Mirror Racing Helmet (Standard 2K Clearcoat)",
            "badge": "Standard 2K Clearcoat Applied",
            "position": "center right 15%"
          }
        },
        "slide_4": {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-detail-skull.jpg",
            "caption": "04/06 • Liquid Metal Silver Surfer Front Profile (HVLP Applied)",
            "badge": "HVLP 1.3mm Tip Applied",
            "position": "center right 15%"
          }
        },
        "slide_5": {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-detail-helmet.jpg",
            "caption": "05/06 • Back Anatomy & Platelet Alignment Reflection",
            "badge": "Self-Aligning Platelets",
            "position": "center right 15%"
          }
        },
        "slide_6": {
          "type": "slide",
          "settings": {
            "image_filename": "flake-buggy-studio.jpg",
            "caption": "06/06 • Custom Flake Sand Rail & Chassis (Coast Signature)",
            "badge": "Coast Signature Flake Finish",
            "position": "center right 10%"
          }
        }
      },
      "block_order": [
        "slide_1",
        "slide_2",
        "slide_3",
        "slide_4",
        "slide_5",
        "slide_6"
      ],
      "settings": {
        "heading": "Engineered European Custom Paint Hub",
        "subheading": "Direct European warehouse access to legendary American custom painting technologies. Zero import taxes, pre-cleared ADR hazmat freight, and 24h tracked dispatch.",
        "badge_text": "OFFICIAL EUROPEAN DISTRIBUTION HUB",
        "cta_label": "Explore European Stock",
        "cta_link": "#storefront-catalog-anchor",
        "secondary_cta_label": "TDS Mixing Matrix",
        "secondary_cta_link": "#mixing-calculator-section"
      }
    },
    "storefront_catalog": {
      "type": "storefront-catalog",
      "blocks": {
        "category_filter_1": {
          "type": "category_filter",
          "settings": {
            "title": "ALL PRODUCTS",
            "filter_type": "all",
            "filter_value": "all",
            "border_color": "#dc2626"
          }
        },
        "category_filter_2": {
          "type": "category_filter",
          "settings": {
            "title": "KROMA EDGE",
            "filter_type": "brand",
            "filter_value": "Kroma Edge",
            "border_color": "#dc2626"
          }
        },
        "category_filter_3": {
          "type": "category_filter",
          "settings": {
            "title": "IWATA AIRBRUSHES",
            "filter_type": "brand",
            "filter_value": "Iwata",
            "border_color": "#dc2626"
          }
        },
        "category_filter_4": {
          "type": "category_filter",
          "settings": {
            "title": "ACE OF SHADES",
            "filter_type": "brand",
            "filter_value": "Ace of Shades",
            "border_color": "#f59e0b"
          }
        },
        "category_filter_5": {
          "type": "category_filter",
          "settings": {
            "title": "HYPER FX (CREATEX)",
            "filter_type": "brand",
            "filter_value": "Hyper FX",
            "border_color": "#10b981"
          }
        },
        "category_filter_6": {
          "type": "category_filter",
          "settings": {
            "title": "LUMILOR",
            "filter_type": "brand",
            "filter_value": "LumiLor",
            "border_color": "#a855f7"
          }
        },
        "category_filter_7": {
          "type": "category_filter",
          "settings": {
            "title": "CLEAN ARMOR",
            "filter_type": "brand",
            "filter_value": "Clean Armor",
            "border_color": "#10b981"
          }
        },
        "category_filter_8": {
          "type": "category_filter",
          "settings": {
            "title": "FLAKE KING",
            "filter_type": "brand",
            "filter_value": "Flake King",
            "border_color": "#242429"
          }
        },
        "category_filter_9": {
          "type": "category_filter",
          "settings": {
            "title": "VSIONAIR",
            "filter_type": "brand",
            "filter_value": "VsionAir",
            "border_color": "#f59e0b"
          }
        },
        "category_filter_10": {
          "type": "category_filter",
          "settings": {
            "title": "CLEARCOAT KITS",
            "filter_type": "cat",
            "filter_value": "Dedicated Clearcoats",
            "border_color": "#242429"
          }
        },
        "category_filter_11": {
          "type": "category_filter",
          "settings": {
            "title": "FLAKES (36)",
            "filter_type": "cat",
            "filter_value": "Dry Metal Flake (Glitter)",
            "border_color": "#242429"
          }
        },
        "category_filter_12": {
          "type": "category_filter",
          "settings": {
            "title": "TAPES (6)",
            "filter_type": "cat",
            "filter_value": "Masking Products",
            "border_color": "#242429"
          }
        }
      },
      "block_order": [
        "category_filter_1",
        "category_filter_2",
        "category_filter_3",
        "category_filter_4",
        "category_filter_5",
        "category_filter_6",
        "category_filter_7",
        "category_filter_8",
        "category_filter_9",
        "category_filter_10",
        "category_filter_11",
        "category_filter_12"
      ],
      "settings": {
        "heading": "In-Stock Guns, Paints, Flakes & Tapes",
        "products_per_page": 24,
        "show_category_filter": true,
        "show_brand_filter": true,
        "show_search": true,
        "show_sort": true
      }
    },
    "mixing_calculator": {
      "type": "mixing-calculator",
      "settings": {
        "show_calculator": true,
        "heading": "TDS MIXING MATRIX & PROJECT VOLUME ESTIMATOR",
        "subheading": "Calibrated exclusively to official KromaEdge Technical Data Sheets (2 oz = 2 sq ft coverage). Select your formula below to calculate exact component volumes and digital scale tare targets.",
        "badge_text": "KROMAEDGE™ PRECISION LAB",
        "enable_scale_mode": true
      }
    },
    "b2b_trade_portal": {
      "type": "b2b-trade-portal",
      "settings": {
        "show_portal": true,
        "heading": "Run a Commercial Bodyshop, Custom Shop, or Paint Studio?",
        "subheading": "Apply for Trade Tier 1/2 Pricing, Automated VAT Reverse-Charging, Net-30 Invoicing, and Priority Chemical Hazmat Allocations across all European territories.",
        "tier2_mov": "£500.00 / €550.00 ex-VAT (6-Unit Case MOQ)",
        "tier1_mov": "£2,000.00 / €2,500.00 ex-VAT (Pallet Allocation)",
        "button_label": "Apply for B2B Trade Account",
        "button_link": "/pages/dealers"
      }
    },
    "footer": {
      "type": "footer",
      "settings": {
        "brand_description": "Engineered European distribution hub for professional custom automotive finishes, Iwata instrumentation, and Flake King pneumatic flake dispersal systems.",
        "show_logistics_hub": true,
        "show_newsletter": true
      }
    }
  },
  "order": [
    "announcement_bar",
    "header",
    "hero_carousel",
    "storefront_catalog",
    "mixing_calculator",
    "b2b_trade_portal",
    "footer"
  ]
}
"""



def main():
    print(f"Bundling Shopify theme from: {ROOT_DIR}")
    snippets = extract_snippets()
    bundle_code = build_bundle()
    theme_asset_bundle = os.path.join(THEME_DIR, "assets", "coast-storefront-bundle.js")
    if os.path.exists(os.path.dirname(theme_asset_bundle)):
        with open(theme_asset_bundle, "w", encoding="utf-8") as f:
            f.write(bundle_code)
    theme_assets, content_media = get_theme_and_media_assets()

    with open(os.path.join(ROOT_DIR, "css", "styles.css"), "r", encoding="utf-8") as f:
        styles_css = f.read()
    with open(os.path.join(ROOT_DIR, "data", "full_ecom_catalog.js"), "r", encoding="utf-8") as f:
        catalog_js = f.read()

    # Load Sections from disk
    sec_dir = os.path.join(THEME_DIR, "sections")
    active_sections = {}
    if os.path.isdir(sec_dir):
        for sname in sorted(os.listdir(sec_dir)):
            if sname.endswith(".liquid") and not sname.startswith("._"):
                with open(os.path.join(sec_dir, sname), "r", encoding="utf-8") as f:
                    active_sections[f"sections/{sname}"] = f.read()

    # Load Templates from disk
    tmpl_dir = os.path.join(THEME_DIR, "templates")
    active_templates = {"templates/password.liquid": PASSWORD_TEMPLATE_LIQUID}
    if os.path.isdir(tmpl_dir):
        for tname in sorted(os.listdir(tmpl_dir)):
            if (tname.endswith(".json") or tname.endswith(".liquid")) and not tname.startswith("._"):
                if tname in ["index.liquid", "collection.liquid", "cart.liquid", "product.liquid"]:
                    continue
                with open(os.path.join(tmpl_dir, tname), "r", encoding="utf-8") as f:
                    active_templates[f"templates/{tname}"] = f.read()

    # Load Layouts from disk
    active_theme_liquid = None
    theme_liquid_disk = os.path.join(THEME_DIR, "layout", "theme.liquid")
    if os.path.isfile(theme_liquid_disk):
        with open(theme_liquid_disk, "r", encoding="utf-8") as f:
            active_theme_liquid = transform_theme_liquid(f.read())

    password_liquid_disk = os.path.join(THEME_DIR, "layout", "password.liquid")
    active_password_liquid = None
    if os.path.isfile(password_liquid_disk):
        with open(password_liquid_disk, "r", encoding="utf-8") as f:
            active_password_liquid = f.read()

    # Load Config from disk
    schema_disk = os.path.join(THEME_DIR, "config", "settings_schema.json")
    with open(schema_disk, "r", encoding="utf-8") as f:
        active_schema = f.read()

    written_files = set()
    temp_zip = THEME_ZIP + ".tmp"
    with zipfile.ZipFile(THEME_ZIP, "r") as zin:
        with zipfile.ZipFile(temp_zip, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                fname = item.filename
                # Strip out heavy media from legacy theme zip
                if fname.startswith("assets/") and fname not in [
                    "assets/coast-storefront-bundle.js", "assets/styles.css", "assets/full_ecom_catalog.js"
                ] and fname not in theme_assets:
                    continue

                # Strip out obsolete templates in favor of OS 2.0 JSON templates
                if fname in [
                    "templates/index.liquid",
                    "templates/collection.liquid",
                    "templates/cart.liquid",
                    "templates/product.liquid"
                ]:
                    continue

                written_files.add(fname)
                if fname == "config/settings_schema.json":
                    zout.writestr(item, active_schema)
                elif fname == "layout/password.liquid":
                    zout.writestr(item, PASSWORD_LAYOUT_LIQUID)
                elif fname in snippets:
                    zout.writestr(item, snippets[fname])
                elif fname in active_templates:
                    zout.writestr(item, active_templates[fname])
                elif fname in active_sections:
                    zout.writestr(item, active_sections[fname])
                elif fname == "assets/coast-storefront-bundle.js":
                    zout.writestr(item, bundle_code)
                elif fname == "assets/styles.css":
                    zout.writestr(item, styles_css)
                elif fname == "assets/full_ecom_catalog.js":
                    zout.writestr(item, catalog_js)
                elif fname == "layout/theme.liquid":
                    if active_theme_liquid:
                        zout.writestr(item, active_theme_liquid)
                    else:
                        original_theme = zin.read(fname).decode("utf-8")
                        zout.writestr(item, transform_theme_liquid(original_theme))
                elif fname in theme_assets:
                    with open(theme_assets[fname], "rb") as img_f:
                        zout.writestr(item, img_f.read())
                else:
                    zout.writestr(item, zin.read(fname))

            # Add newly created snippets
            for snip_path, snip_content in snippets.items():
                if snip_path not in written_files:
                    zout.writestr(snip_path, snip_content)
                    written_files.add(snip_path)

            # Add newly created templates
            for tmpl_path, tmpl_content in active_templates.items():
                if tmpl_path not in written_files:
                    zout.writestr(tmpl_path, tmpl_content)
                    written_files.add(tmpl_path)

            # Add newly created sections
            for sec_path, sec_content in active_sections.items():
                if sec_path not in written_files:
                    zout.writestr(sec_path, sec_content)
                    written_files.add(sec_path)

            # Add core theme assets (logos, favicon)
            for zip_path, file_path in theme_assets.items():
                if zip_path not in written_files:
                    with open(file_path, "rb") as img_f:
                        zout.writestr(zip_path, img_f.read())
                    written_files.add(zip_path)

            # Ensure sections directory is represented
            if "sections/.gitkeep" not in written_files:
                zout.writestr("sections/.gitkeep", "")
                written_files.add("sections/.gitkeep")

    os.replace(temp_zip, THEME_ZIP)
    theme_sz = os.path.getsize(THEME_ZIP)
    print(f"Theme successfully updated: {THEME_ZIP} ({theme_sz / 1024:.1f} KB / {theme_sz / (1024*1024):.2f} MB)")

    # 2. Build Companion Media Package for Standalone Archiving
    media_zip_temp = MEDIA_ZIP + ".tmp"
    with zipfile.ZipFile(media_zip_temp, "w", zipfile.ZIP_DEFLATED) as mz:
        for filename, filepath in sorted(content_media.items()):
            mz.write(filepath, f"coast-shopify-media-files/{filename}")

    os.replace(media_zip_temp, MEDIA_ZIP)
    media_sz = os.path.getsize(MEDIA_ZIP)
    print(f"Media files package created: {MEDIA_ZIP} ({len(content_media)} files, {media_sz / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    main()
