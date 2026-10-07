#!/usr/bin/env python3
import os, re, sys, zipfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THEME_ZIP = os.path.join(ROOT_DIR, "coast-airbrush-eu-shopify-theme.zip")

MODULE_FILES = [
    "data/hero_config.js",
    "data/shopify_variant_map.js",
    "data/kroma_edge.js",
    "data/full_ecom_catalog.js",
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
    "js/adminController.js",
    "js/app.js"
]

def transform_es_to_cjs(code, mod_name):
    # Normalize multi-line imports into single-line imports
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
            if target.startswith("./") or target.startswith("../"):
                dir_part = os.path.dirname(mod_name)
                target = os.path.normpath(os.path.join(dir_part, target)).replace("\\", "/")
            target = re.sub(r"^\./", "", target)
            out.append(f'const {named} = req("{target}");')
            continue

        m_imp_def = re.match(r"^import\s+(\w+)\s+from\s+[\"']([^\"']+)[\"'];?", stripped)
        if m_imp_def:
            named = m_imp_def.group(1)
            target = m_imp_def.group(2).split("?")[0]
            if target.startswith("./") or target.startswith("../"):
                dir_part = os.path.dirname(mod_name)
                target = os.path.normpath(os.path.join(dir_part, target)).replace("\\", "/")
            target = re.sub(r"^\./", "", target)
            out.append(f"const {named} = req(\"{target}\");")
            continue

        m_exp_const = re.match(r"^export\s+const\s+(\w+)\s*=", line)
        if m_exp_const:
            var_name = m_exp_const.group(1)
            out.append(line.replace("export const ", "const "))
            exports_to_add.append(var_name)
            continue

        m_exp_class = re.match(r"^export\s+class\s+(\w+)", line)
        if m_exp_class:
            cls_name = m_exp_class.group(1)
            out.append(line.replace("export class ", "class "))
            exports_to_add.append(cls_name)
            continue

        m_exp_fn = re.match(r"^export\s+function\s+(\w+)", line)
        if m_exp_fn:
            fn_name = m_exp_fn.group(1)
            out.append(line.replace("export function ", "function "))
            exports_to_add.append(fn_name)
            continue

        m_exp_def = re.match(r"^export\s+default\s+(\w+);?", stripped)
        if m_exp_def:
            def_name = m_exp_def.group(1)
            out.append(f"module.exports = {def_name}; exports.default = {def_name};")
            continue

        out.append(line)

    for ex in exports_to_add:
        out.append(f"exports.{ex} = {ex};")

    return "\n".join(out)

def build_bundle():
    with open(os.path.join(ROOT_DIR, "data", "bundles_config.js"), "r", encoding="utf-8") as f:
        bundles_js = f.read()

    bundle_parts = [
        bundles_js,
        "\n\n// Coast Airbrush Europe - Production Storefront Bundle\n",
        "(function() {\n",
        "  \x27use strict\x27;\n",
        "  const modules = {};\n",
        "  const cache = {};\n",
        "  function define(name, fn) { modules[name] = fn; }\n",
        "  function req(name) {\n",
        "    let clean = name.replace(/^\\.\\//, '').split('?')[0];\n",
        "    if (clean.startsWith('../')) clean = clean.substring(3);\n",
        "    if (cache[clean]) return cache[clean].exports;\n",
        "    if (!modules[clean]) throw new Error('Module not found: ' + clean);\n",
        "    const module = { exports: {} };\n",
        "    cache[clean] = module;\n",
        "    modules[clean](module.exports, req, module);\n",
        "    return module.exports;\n",
        "  }\n\n"
    ]

    for mod in MODULE_FILES:
        filepath = os.path.join(ROOT_DIR, mod)
        with open(filepath, "r", encoding="utf-8") as f:
            code = f.read()
        transformed = transform_es_to_cjs(code, mod)
        bundle_parts.append(f"  // ==========================================\n  // MODULE: {mod}\n  // ==========================================\n")
        bundle_parts.append(f"  define(\x27{mod}\x27, function(exports, req, module) {{\n")
        bundle_parts.append(transformed)
        bundle_parts.append("\n  });\n\n")

    bundle_parts.append("  // Auto-start application entry point\n  req(\x27js/app.js\x27);\n})();\n")
    return "".join(bundle_parts)

MEDIA_ZIP = os.path.join(ROOT_DIR, "coast-shopify-media-files.zip")

THEME_CORE_ASSET_FILENAMES = {
    "coast_logo_white.png",
    "coast_logo_black.png",
    "coast_logo_red.png",
    "coast_airbrush_logo.jpg",
    "favicon.svg",
    "favicon.ico",
    "apple-touch-icon.png",
    "icon-192.png",
    "icon-512.png",
    "kroma-skull-studio-dark.jpg",
    "kroma-detail-skull.jpg",
    "flake-buggy-studio.jpg",
    "flake_buggy_hero.jpg",
    "fk100-prime-black-base.jpg",
    "flake-king-orange-mixed-set.jpg",
    "kroma-helmet-mirror.jpg",
    "kroma-detail-helmet.jpg"
}

def transform_html_for_liquid(html):
    def replace_url(m):
        full_path = m.group(1)
        if "Cleaned Skull Image" in full_path:
            filename = "kroma-skull-mirror.jpg"
        else:
            filename = full_path.split("/")[-1]
        filt = "asset_url" if filename in THEME_CORE_ASSET_FILENAMES else "file_url"
        return f"url('{{{{ '{filename}' | {filt} }}}}')"

    def replace_src(m):
        prefix = m.group(1)
        full_path = m.group(2)
        quote = m.group(3)
        if "Cleaned Skull Image" in full_path:
            filename = "kroma-skull-mirror.jpg"
        else:
            filename = full_path.split("/")[-1]
        filt = "asset_url" if filename in THEME_CORE_ASSET_FILENAMES else "file_url"
        return f"{prefix}{{{{ '{filename}' | {filt} }}}}{quote}"

    def replace_this_src(m):
        prefix = m.group(1)
        full_path = m.group(2)
        quote = m.group(3)
        filename = full_path.split("/")[-1]
        filt = "asset_url" if filename in THEME_CORE_ASSET_FILENAMES else "file_url"
        return f"{prefix}{{{{ '{filename}' | {filt} }}}}{quote}"

    def replace_doc(m):
        full_path = m.group(1)
        filename = full_path.split("/")[-1]
        return f"href=\"{{{{ '{filename}' | file_url }}}}\""

    out = re.sub(r"url\(['\"]?((?:assets/images/|Images/)[^'\")]+)['\"]?\)", replace_url, html)
    out = re.sub(r"(src=['\"])((?:assets/images/|Images/)[^'\">]+)(['\"])", replace_src, out)
    out = re.sub(r"(this\.src=['\"])((?:assets/images/|Images/)[^'\">]+)(['\"])", replace_this_src, out)
    out = re.sub(r"href=[\"'](?:assets/docs/)([^\"']+\.pdf)[\"']", replace_doc, out)

    # Transform relative page links to Shopify canonical routes
    out = re.sub(r'href=["\'](?:\./)?about\.html(#[\w-]*)?["\']', r'href="/pages/about\1"', out)
    out = re.sub(r'href=["\'](?:\./)?support\.html(#[\w-]*)?["\']', r'href="/pages/support\1"', out)
    out = re.sub(r'href=["\'](?:\./)?shipping\.html(#[\w-]*)?["\']', r'href="/pages/shipping\1"', out)
    out = re.sub(r'href=["\'](?:\./)?privacy\.html(#[\w-]*)?["\']', r'href="/pages/privacy-policy\1"', out)
    out = re.sub(r'href=["\'](?:\./)?dealers\.html(#[\w-]*)?["\']', r'href="/pages/dealers\1"', out)
    out = re.sub(r'href=["\'](?:\./)?product\.html(#[\w-]*)?["\']', r'href="/products/atawi-precision-detail-airbrush\1"', out)
    out = re.sub(r'href=["\'](?:\./)?index\.html\?tab=admin["\']', r'href="/?tab=admin"', out)
    out = re.sub(r'href=["\'](?:\./)?index\.html(#[\w-]*)?["\']', r'href="/\1"', out)

    return out

def transform_theme_liquid(content):
    content = re.sub(r"\{\{\s*'flake_buggy_hero\.jpg'\s*\|\s*asset_url\s*\}\}", r"{{ 'flake_buggy_hero.jpg' | file_url }}", content)
    content = re.sub(r"https://coastairbrush\.eu/assets/images/([a-zA-Z0-9_\-\.]+)", r"https:{{ '\1' | file_url }}", content)
    content = re.sub(r"assets/images/([a-zA-Z0-9_\-\.]+)", r"{{ '\1' | file_url }}", content)
    root_script = """    <script>
      window.SHOPIFY_ASSET_URL_ROOT = "{{ 'coast_logo_white.png' | asset_url | split: 'coast_logo_white.png' | first }}";
      window.SHOPIFY_FILE_URL_ROOT = "{{ 'flake_buggy_hero.jpg' | file_url | split: 'flake_buggy_hero.jpg' | first }}";
    </script>\n"""
    if "window.SHOPIFY_FILE_URL_ROOT" not in content:
        if "window.SHOPIFY_ASSET_URL_ROOT" in content:
            content = re.sub(r"window\.SHOPIFY_ASSET_URL_ROOT\s*=\s*[^;]+;",
                             """window.SHOPIFY_ASSET_URL_ROOT = "{{ 'coast_logo_white.png' | asset_url | split: 'coast_logo_white.png' | first }}";\n      window.SHOPIFY_FILE_URL_ROOT = "{{ 'flake_buggy_hero.jpg' | file_url | split: 'flake_buggy_hero.jpg' | first }}";""",
                             content)
        else:
            content = content.replace("    <!-- Coast Airbrush Europe Storefront Application Engine -->", root_script + "    <!-- Coast Airbrush Europe Storefront Application Engine -->")
    else:
        content = re.sub(r"window\.SHOPIFY_FILE_URL_ROOT\s*=\s*[^;]+;",
                         """window.SHOPIFY_FILE_URL_ROOT = "{{ 'flake_buggy_hero.jpg' | file_url | split: 'flake_buggy_hero.jpg' | first }}";""",
                         content)

    # Ensure global admin views and modals are rendered after content_for_layout
    if "{% render 'modals-and-drawers' %}" not in content:
        content = content.replace(
            "{{ content_for_layout }}",
            "{{ content_for_layout }}\n\n    {% render 'admin-views' %}\n    {% render 'modals-and-drawers' %}"
        )
    return content

def get_theme_and_media_assets():
    files_to_scan = [
        "index.html", "about.html", "support.html", "shipping.html", "privacy.html", "dealers.html", "product.html",
        "css/styles.css", "data/full_ecom_catalog.js", "data/brands_master.js", "data/hero_config.js", "data/kroma_edge.js",
        "js/app.js", "js/adminController.js"
    ]
    all_text = ""
    for f in files_to_scan:
        p = os.path.join(ROOT_DIR, f)
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as fh:
                all_text += "\n" + fh.read()

    referenced = set(m.lower() for m in re.findall(r"[\w\-\.]+\.(?:jpg|jpeg|png|webp|svg|gif|ico|pdf)", all_text, re.I))

    theme_assets = {}
    content_media = {}

    img_dir = os.path.join(ROOT_DIR, "assets", "images")
    if os.path.exists(img_dir):
        for root, dirs, files in os.walk(img_dir):
            for f in files:
                if f.startswith("."):
                    continue
                ext = os.path.splitext(f)[1].lower()
                if ext in [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".ico"]:
                    f_lower = f.lower()
                    full_path = os.path.join(root, f)
                    if f in THEME_CORE_ASSET_FILENAMES:
                        theme_assets[f"assets/{f}"] = full_path
                        content_media[f] = full_path
                    elif f_lower in referenced:
                        content_media[f] = full_path

    doc_dir = os.path.join(ROOT_DIR, "assets", "docs")
    if os.path.exists(doc_dir):
        for root, dirs, files in os.walk(doc_dir):
            for f in files:
                if f.startswith("."):
                    continue
                ext = os.path.splitext(f)[1].lower()
                if ext == ".pdf":
                    content_media[f] = os.path.join(root, f)

    root_ico = os.path.join(ROOT_DIR, "favicon.ico")
    if os.path.exists(root_ico):
        theme_assets["assets/favicon.ico"] = root_ico

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

SETTINGS_SCHEMA_JSON = """[
  {
    "name": "theme_info",
    "theme_name": "Coast Airbrush Europe",
    "theme_author": "Coast Airbrush Europe",
    "theme_version": "1.0.0",
    "theme_documentation_url": "https://coastairbrush.eu/",
    "theme_support_url": "https://coastairbrush.eu/pages/support"
  },
  {
    "name": "Branding & Logos",
    "settings": [
      {
        "type": "header",
        "content": "Logos & Visual Identity"
      },
      {
        "type": "image_picker",
        "id": "logo_white",
        "label": "White Logo (Dark Backgrounds)",
        "info": "Primary white Coast Airbrush Europe brand logo (assets/images/coast_logo_white.png)"
      },
      {
        "type": "image_picker",
        "id": "logo_red",
        "label": "Red Logo (Accent Header)",
        "info": "Secondary red Coast Airbrush Europe brand logo (assets/images/coast_logo_red.png)"
      },
      {
        "type": "image_picker",
        "id": "logo_black",
        "label": "Black Logo (Light Mode / Documents)",
        "info": "Monochrome black Coast Airbrush Europe logo (assets/images/coast_logo_black.png)"
      },
      {
        "type": "range",
        "id": "logo_width",
        "min": 80,
        "max": 320,
        "step": 10,
        "unit": "px",
        "label": "Custom Logo Width",
        "default": 180
      },
      {
        "type": "image_picker",
        "id": "favicon",
        "label": "Favicon image",
        "info": "Browser tab icon (32x32px or SVG recommended)"
      }
    ]
  },
  {
    "name": "Color Scheme",
    "settings": [
      {
        "type": "header",
        "content": "Mechanical Brutalism Core Palette"
      },
      {
        "type": "color",
        "id": "color_bg",
        "label": "Chassis Background",
        "default": "#0b0b0d",
        "info": "Deep chassis obsidian background"
      },
      {
        "type": "color",
        "id": "color_surface",
        "label": "Container & Card Surface",
        "default": "#131315",
        "info": "Engineered panel & modal container surface"
      },
      {
        "type": "color",
        "id": "color_accent",
        "label": "Primary Accent Red",
        "default": "#dc2626",
        "info": "Kustom Red high-visibility accent & CTA buttons"
      },
      {
        "type": "color",
        "id": "color_border",
        "label": "Industrial Border",
        "default": "#242429",
        "info": "Milled steel border outlining modules and cards"
      },
      {
        "type": "color",
        "id": "color_text",
        "label": "Primary Text",
        "default": "#ffffff",
        "info": "High-contrast reading text"
      },
      {
        "type": "color",
        "id": "color_text_muted",
        "label": "Secondary / Muted Text",
        "default": "#9ca3af",
        "info": "Technical metadata and sub-labels"
      },
      {
        "type": "color",
        "id": "color_accent_hover",
        "label": "Accent Red Hover",
        "default": "#b91c1c",
        "info": "Hover state for primary action buttons"
      }
    ]
  },
  {
    "name": "Typography",
    "settings": [
      {
        "type": "header",
        "content": "Storefront Typography"
      },
      {
        "type": "font_picker",
        "id": "font_heading",
        "label": "Headline Font Family",
        "default": "inter_n7",
        "info": "Modern engineered grotesque font family"
      },
      {
        "type": "font_picker",
        "id": "font_body",
        "label": "Body Font Family",
        "default": "inter_n4",
        "info": "High legibility sans-serif for descriptions and pricing"
      },
      {
        "type": "text",
        "id": "font_mono",
        "label": "Monospace Specification Font",
        "default": "'JetBrains Mono', monospace",
        "info": "Used for SKU codes, TDS ratios, and pallet density readouts"
      }
    ]
  },
  {
    "name": "Header Alerts & Dispatch",
    "settings": [
      {
        "type": "header",
        "content": "Announcement & Live Logistics Bar"
      },
      {
        "type": "checkbox",
        "id": "show_announcement",
        "label": "Display Announcement Bar",
        "default": true
      },
      {
        "type": "text",
        "id": "announcement_text",
        "label": "Announcement Message",
        "default": "Official European Master Distributor: Iwata Custom Lines & Flake King"
      },
      {
        "type": "url",
        "id": "announcement_link",
        "label": "Announcement Link"
      },
      {
        "type": "text",
        "id": "dispatch_speed_badge",
        "label": "Dispatch Speed Badge",
        "default": "⚡ 24/48H RAPID DISPATCH (UK & EU)",
        "info": "Live logistics guarantee badge"
      },
      {
        "type": "checkbox",
        "id": "enable_vat_toggle",
        "label": "Enable Dynamic VAT Toggle (Ex/Inc VAT)",
        "default": true
      }
    ]
  },
  {
    "name": "Logistics & Warehouses",
    "settings": [
      {
        "type": "header",
        "content": "Dual Fulfillment Hubs (UK & EU)"
      },
      {
        "type": "text",
        "id": "uk_hub_name",
        "label": "UK Fulfillment Hub Name",
        "default": "Coast Airbrush Europe - UK Hub"
      },
      {
        "type": "textarea",
        "id": "uk_hub_address",
        "label": "UK Hub Address & Logistics",
        "default": "Unit 4 Gateway Business Park, Basildon, Essex, SS14 3WB, United Kingdom"
      },
      {
        "type": "text",
        "id": "support_phone",
        "label": "UK & EU Phone Desk",
        "default": "+44 (0) 1268 765 432"
      },
      {
        "type": "text",
        "id": "nl_hub_name",
        "label": "Netherlands Fulfillment Hub Name",
        "default": "Coast Airbrush Europe - NL Bonded Hub"
      },
      {
        "type": "textarea",
        "id": "nl_hub_address",
        "label": "Netherlands Hub Address & Logistics",
        "default": "Distributieweg 18, 2645 EJ Delfgauw, Rotterdam Logistics Corridor, Netherlands"
      },
      {
        "type": "text",
        "id": "support_email",
        "label": "Support Desk Email",
        "default": "support@coastairbrush.eu"
      },
      {
        "type": "text",
        "id": "orders_email",
        "label": "B2B Trade & Orders Email",
        "default": "orders@coastairbrush.eu"
      }
    ]
  },
  {
    "name": "Social Links",
    "settings": [
      {
        "type": "header",
        "content": "Social Media Channels"
      },
      {
        "type": "url",
        "id": "social_instagram",
        "label": "Instagram Profile"
      },
      {
        "type": "url",
        "id": "social_youtube",
        "label": "YouTube Channel"
      },
      {
        "type": "url",
        "id": "social_facebook",
        "label": "Facebook Page"
      },
      {
        "type": "url",
        "id": "social_twitter",
        "label": "Twitter / X Profile"
      }
    ]
  }
]
"""

PASSWORD_LAYOUT_LIQUID = """<!doctype html>
<html class="dark" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ shop.name }} - VIP Priority Launch Access</title>
    {{ content_for_header }}
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ 'styles.css' | asset_url }}">
    <style>
      .static-bg-overlay {
        background: linear-gradient(180deg, rgba(11, 11, 13, 0.88) 0%, rgba(11, 11, 13, 0.82) 40%, rgba(6, 6, 8, 0.94) 100%),
                    url('{{ 'flake_buggy_hero.jpg' | asset_url }}') no-repeat center center fixed;
        background-size: cover;
      }
    </style>
  </head>
  <body class="static-bg-overlay bg-[#0b0b0d] text-white min-h-screen flex flex-col justify-between selection:bg-red-600 selection:text-white relative font-sans">
    {{ content_for_layout }}
  </body>
</html>
"""

PASSWORD_TEMPLATE_LIQUID = """<div class="w-full flex-grow flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative z-10">
  <div class="max-w-xl w-full p-6 sm:p-10 bg-[#131315]/95 backdrop-blur-xl border border-[#242429] shadow-2xl rounded-sm text-center space-y-6 my-auto">
    
    <!-- Brand Logo -->
    <div class="flex justify-center">
      <img src="{{ 'coast_logo_white.png' | asset_url }}" alt="Coast Airbrush Europe" class="h-11 sm:h-13 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
    </div>
    
    <!-- Live Launch Status Badge -->
    <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-black/60 border border-[#dc2626]/60 text-red-500 font-mono text-[11px] font-bold uppercase tracking-widest shadow-sm">
      <span class="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>
      Official European Hub • Opening Soon
    </div>

    <!-- Hero Title & Value Proposition -->
    <div class="space-y-2.5">
      <h1 class="font-headline text-2xl sm:text-3xl uppercase text-white font-bold tracking-tight">
        VIP Priority Early Access
      </h1>
      <p class="text-xs sm:text-sm text-neutral-300 font-body leading-relaxed max-w-lg mx-auto">
        Coast Airbrush Europe brings legendary American custom paint systems direct to UK & European painters. Doors unlock soon. Register below for <strong class="text-white font-semibold">24-hour priority allocation</strong> on the initial batch of Kroma Edge mirror chrome &amp; Flake King systems before public release.
      </p>
    </div>

    <!-- Trust & Fulfillment Badges -->
    <div class="grid grid-cols-3 gap-2 py-1 font-mono text-[10px] sm:text-[11px]">
      <div class="p-2 rounded bg-black/50 border border-[#242429] text-neutral-200 flex flex-col items-center justify-center">
        <span class="text-base sm:text-lg mb-0.5">🇬🇧 🇳🇱</span>
        <span class="font-bold">UK &amp; EU Dispatch</span>
      </div>
      <div class="p-2 rounded bg-black/50 border border-[#242429] text-neutral-200 flex flex-col items-center justify-center">
        <span class="text-base sm:text-lg mb-0.5">🛡️</span>
        <span class="font-bold">REACH Compliant</span>
      </div>
      <div class="p-2 rounded bg-black/50 border border-[#242429] text-neutral-200 flex flex-col items-center justify-center">
        <span class="text-base sm:text-lg mb-0.5">⚡</span>
        <span class="font-bold">Zero US Customs</span>
      </div>
    </div>

    <!-- Primary Form: Customer Lead Capture to Shopify Customers -->
    {% form 'customer', class: 'space-y-4 text-left pt-2' %}
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
          <div class="pt-2">
            <span class="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded border border-emerald-500/40">
              Priority Status: Activated
            </span>
          </div>
        </div>
      {% else %}
        <input type="hidden" name="contact[tags]" value="prospect, pre-launch-vip, european-launch">
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="VIPFirstName" class="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1">First Name</label>
            <input type="text" name="contact[first_name]" id="VIPFirstName" class="w-full bg-[#0b0b0d] border border-[#242429] px-3.5 py-2.5 text-xs font-mono text-white rounded-sm focus:border-[#dc2626] focus:outline-none placeholder:text-neutral-600" placeholder="e.g. Marcus" required>
          </div>
          <div>
            <label for="VIPLastName" class="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1">Last Name</label>
            <input type="text" name="contact[last_name]" id="VIPLastName" class="w-full bg-[#0b0b0d] border border-[#242429] px-3.5 py-2.5 text-xs font-mono text-white rounded-sm focus:border-[#dc2626] focus:outline-none placeholder:text-neutral-600" placeholder="e.g. Vance" required>
          </div>
        </div>

        <div>
          <label for="VIPEmail" class="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1">Email Address</label>
          <input type="email" name="contact[email]" id="VIPEmail" class="w-full bg-[#0b0b0d] border border-[#242429] px-3.5 py-2.5 text-xs font-mono text-white rounded-sm focus:border-[#dc2626] focus:outline-none placeholder:text-neutral-600" placeholder="painter@customshop.com" required>
        </div>

        <div>
          <label for="VIPRole" class="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1">Painter / Trade Focus (Optional)</label>
          <select name="contact[note]" id="VIPRole" class="w-full bg-[#0b0b0d] border border-[#242429] px-3.5 py-2.5 text-xs font-mono text-white rounded-sm focus:border-[#dc2626] focus:outline-none">
            <option value="Custom Automotive &amp; Motorcycle Painting">Custom Automotive &amp; Motorcycle Painting</option>
            <option value="Airbrush &amp; Fine Art Refinishing">Airbrush &amp; Fine Art Refinishing</option>
            <option value="Commercial Body Shop / Trade Dealer">Commercial Body Shop / Trade Dealer</option>
            <option value="Model / Scale &amp; Hobbyist">Model / Scale &amp; Hobbyist</option>
          </select>
        </div>

        <button type="submit" class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-mono font-bold text-xs uppercase py-3.5 px-6 rounded-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wider">
          <span class="material-symbols-outlined text-[16px]">notifications_active</span>
          <span>Secure My VIP Priority Allocation &rarr;</span>
        </button>

        <div class="flex items-center justify-center gap-1.5 text-[11px] font-mono text-neutral-400 pt-1 text-center">
          <span class="material-symbols-outlined text-[13px] text-red-400">shield</span>
          <span>Zero spam. Direct launch alert &amp; first batch access link only.</span>
        </div>
      {% endif %}
    {% endform %}

    <!-- Staff & Trade Partner Gate (Collapsible) -->
    <div class="pt-6 border-t border-white/10 space-y-3">
      <button type="button" onclick="const sec = document.getElementById('staff-password-section'); sec.classList.toggle('hidden');" class="font-mono text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer">
        <span class="material-symbols-outlined text-[14px]">lock</span>
        <span>Staff &amp; Trade Partner Access</span>
      </button>

      <div id="staff-password-section" class="hidden p-4 bg-black/60 border border-neutral-700 rounded space-y-3 text-left">
        <p class="font-mono text-[11px] text-neutral-300">
          Authorized staff &amp; trade dealers: enter your storefront password below to unlock the catalog preview.
        </p>
        {% form 'storefront_password', class: 'space-y-3' %}
          {{ form.errors | default_errors }}
          <div class="flex flex-col sm:flex-row gap-2">
            <input type="password" name="password" id="Password" class="flex-grow bg-[#0c0e0e] border border-neutral-600 px-3.5 py-2 text-xs font-mono text-white rounded focus:border-red-500 focus:outline-none" placeholder="Enter Store Password" required>
            <button type="submit" class="bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs uppercase px-4 py-2 rounded border border-neutral-600 cursor-pointer whitespace-nowrap">
              Unlock &rarr;
            </button>
          </div>
        {% endform %}
      </div>

      <div class="pt-2 text-[11px] font-mono text-neutral-500 text-center">
        <a href="/admin" class="hover:text-neutral-300 transition-colors">Store Owner Login (/admin)</a>
      </div>
    </div>

  </div>
</div>

<footer class="w-full py-4 text-center font-mono text-[11px] text-neutral-500 relative z-20">
  &copy; 2026 Coast Airbrush Europe. Precision Engineering. Personal Support. No Compromises.
</footer>
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

PAGE_TEMPLATES = {
    "templates/index.json": INDEX_JSON_TEMPLATE,
    "templates/password.liquid": PASSWORD_TEMPLATE_LIQUID,
    "templates/page.about.liquid": "{% render 'page-about' %}\n",
    "templates/page.support.liquid": "{% render 'page-support' %}\n",
    "templates/page.shipping.liquid": "{% render 'page-shipping' %}\n",
    "templates/page.privacy.liquid": "{% render 'page-privacy' %}\n",
    "templates/page.dealers.liquid": "{% render 'page-dealers' %}\n",
    "templates/page.product.liquid": "{% render 'page-product' %}\n",
    "templates/product.liquid": """{% render 'page-product' %}
{% if product %}
<script>
  window.SHOPIFY_CURRENT_PRODUCT = {
    id: {{ product.id | json }},
    title: {{ product.title | json }},
    name: {{ product.title | json }},
    handle: {{ product.handle | json }},
    price: {{ product.price | divided_by: 100.0 | json }},
    sku: {{ product.selected_or_first_available_variant.sku | default: 'PRO-SERIES' | json }},
    description: {{ product.description | strip_html | json }},
    category: {{ product.type | default: product.collections.first.title | default: 'spray_hardware' | json }},
    specs: {{ product.metafields.specs | json }},
    tags: {{ product.tags | json }},
    images: [{% for img in product.images %}{{ img | image_url: width: 1200 | json }}{% unless forloop.last %},{% endunless %}{% endfor %}],
    variants: [
      {% for variant in product.variants %}
        {
          id: {{ variant.id | json }},
          title: {{ variant.title | json }},
          sku: {{ variant.sku | json }},
          price: {{ variant.price | divided_by: 100.0 | json }},
          available: {{ variant.available | json }}
        }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ]
  };
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof hydrateProductData === 'function') {
      hydrateProductData(window.SHOPIFY_CURRENT_PRODUCT);
    }
  });
</script>
{% endif %}
""",
    "templates/page.liquid": """{% assign handle = page.handle | downcase %}
{% if handle contains 'about' %}
  {% render 'page-about' %}
{% elsif handle contains 'support' or handle contains 'faq' %}
  {% render 'page-support' %}
{% elsif handle contains 'shipping' %}
  {% render 'page-shipping' %}
{% elsif handle contains 'privacy' %}
  {% render 'page-privacy' %}
{% elsif handle contains 'dealer' %}
  {% render 'page-dealers' %}
{% elsif handle contains 'product' %}
  {% render 'page-product' %}
{% else %}
  <div class="max-w-5xl mx-auto py-12 px-6">
    <h1 class="font-headline text-3xl uppercase text-white font-bold mb-6">{{ page.title }}</h1>
    <div class="prose prose-invert max-w-none text-neutral-300 font-body leading-relaxed">
      {{ page.content }}
    </div>
  </div>
{% endif %}
""",
    "templates/404.liquid": """<script>
  (function() {
    var p = (window.location.pathname || '').toLowerCase();
    var target = 'real-404';
    var pageTitle = '';

    if (p.indexOf('about') !== -1) {
      target = 'about';
      pageTitle = 'About Coast Airbrush Europe | Heritage, Innovation & European Rollout';
    } else if (p.indexOf('support') !== -1 || p.indexOf('faq') !== -1) {
      target = 'support';
      pageTitle = 'Technical & Customer Support Desk | Coast Airbrush Europe';
    } else if (p.indexOf('shipping') !== -1 || p.indexOf('delivery') !== -1) {
      target = 'shipping';
      pageTitle = 'Shipping & ADR Hazchem Delivery Guide | Coast Airbrush Europe';
    } else if (p.indexOf('privacy') !== -1) {
      target = 'privacy';
      pageTitle = 'Privacy Policy | Coast Airbrush Europe';
    } else if (p.indexOf('dealer') !== -1) {
      target = 'dealers';
      pageTitle = 'Become an Authorized Dealer & Distributor | Coast Airbrush Europe';
    } else if (p.indexOf('product') !== -1) {
      target = 'product';
      pageTitle = 'Atawi Precision Detail Airbrush (0.18mm) | Coast Airbrush Europe';
    }

    if (pageTitle) {
      document.title = pageTitle;
    }

    if (target !== 'real-404' && window.history && window.history.replaceState) {
      var targetUrl = target === 'privacy' ? '/pages/privacy-policy' : '/pages/' + target;
      if (window.location.pathname !== targetUrl && window.location.pathname.indexOf('.html') !== -1) {
        window.history.replaceState({}, '', targetUrl);
      }
    }

    // Immediately inject CSS during initial parse so the targeted route appears with ZERO flicker
    document.write('<style>#route-' + target + ' { display: block !important; } #route-real-404 { display: none !important; }</style>');
  })();
</script>

<div id="page-router-wrap">
  <div id="route-about" class="page-route-item" style="display: none;">
    {% render 'page-about' %}
  </div>
  <div id="route-support" class="page-route-item" style="display: none;">
    {% render 'page-support' %}
  </div>
  <div id="route-shipping" class="page-route-item" style="display: none;">
    {% render 'page-shipping' %}
  </div>
  <div id="route-privacy" class="page-route-item" style="display: none;">
    {% render 'page-privacy' %}
  </div>
  <div id="route-dealers" class="page-route-item" style="display: none;">
    {% render 'page-dealers' %}
  </div>
  <div id="route-product" class="page-route-item" style="display: none;">
    {% render 'page-product' %}
  </div>
  <div id="route-real-404" class="page-route-item" style="display: none;">
    <div class="max-w-lg mx-auto my-20 p-8 bg-[#181a1b] border-2 border-secondary text-center space-y-6">
      <h1 class="font-headline text-4xl uppercase text-white font-bold">404 - Page Not Found</h1>
      <p class="text-neutral-300 text-sm font-body">The page you requested could not be found.</p>
      <a href="/" class="inline-block bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-mono font-bold text-xs uppercase py-3 px-6 rounded shadow transition-all">
        Return to Storefront &rarr;
      </a>
    </div>
  </div>
</div>

<script>
  // DOM ready backup to ensure target displays even if document.write was prevented
  document.addEventListener('DOMContentLoaded', function() {
    var p = (window.location.pathname || '').toLowerCase();
    var target = 'real-404';
    if (p.indexOf('about') !== -1) target = 'about';
    else if (p.indexOf('support') !== -1 || p.indexOf('faq') !== -1) target = 'support';
    else if (p.indexOf('shipping') !== -1 || p.indexOf('delivery') !== -1) target = 'shipping';
    else if (p.indexOf('privacy') !== -1) target = 'privacy';
    else if (p.indexOf('dealer') !== -1) target = 'dealers';
    else if (p.indexOf('product') !== -1) target = 'product';

    var el = document.getElementById('route-' + target);
    if (el) el.style.setProperty('display', 'block', 'important');
    if (target !== 'real-404') {
      var notFoundEl = document.getElementById('route-real-404');
      if (notFoundEl) notFoundEl.style.setProperty('display', 'none', 'important');
    }
  });
</script>
"""
}

ANNOUNCEMENT_BAR_SECTION = """{% if section.settings.show_announcement %}
  <!-- TOP COMPLIANCE & LOGISTICS ANNOUNCEMENT BAR -->
  <div id="top-shipping-banner" class="bg-[#0b0b0d] border-b border-[#242429] py-1.5 px-margin-mobile md:px-margin text-xs tracking-wider">
    <div class="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-neutral-400 font-mono">
      <div class="flex items-center gap-2 flex-wrap text-[11px]">
        <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse shrink-0"></span>
        {% if section.settings.announcement_link != blank %}
          <a href="{{ section.settings.announcement_link }}" class="text-white hover:text-[#dc2626] transition-colors font-semibold">
            {{ section.settings.announcement_text | default: 'Official European Master Distributor: Iwata Custom Lines & Flake King' }}
          </a>
        {% else %}
          <span class="text-white font-semibold">{{ section.settings.announcement_text | default: 'Official European Master Distributor: Iwata Custom Lines & Flake King' }}</span>
        {% endif %}
        <span class="text-[#242429] hidden sm:inline">|</span>
        <span class="hidden sm:inline">ADR / Hazmat Certified UK &amp; EU Dispatch</span>
        <span class="text-[#242429] hidden md:inline">|</span>
        <!-- Dynamic VAT Advisory Badge for UK & European Customers -->
        <span id="nav-vat-advisory-badge" class="inline-flex items-center gap-1 text-neutral-300 bg-[#131315] px-2 py-0.5 rounded border border-[#242429]" title="VAT status details for your destination country">
          <span class="material-symbols-outlined text-[13px] text-neutral-400">info</span>
          <span id="nav-vat-advisory-text">All Retail Prices Shown Inclusive of VAT</span>
        </span>
        <span class="font-mono text-[11px] bg-emerald-950/80 text-emerald-400 border border-emerald-700/80 px-2 py-0.5 font-bold rounded-sm ml-1">
          {{ section.settings.badge_text | default: '⚡ 24/48H RAPID DISPATCH (UK & EU)' }}
        </span>
      </div>

      <!-- Country, Language & Currency Quick Switcher -->
      <div class="flex items-center gap-2 ml-auto text-[11px]">
        <!-- Language Selector -->
        <div class="flex items-center gap-1 bg-[#131315] border border-[#242429] px-2 py-0.5 rounded">
          <span class="material-symbols-outlined text-[13px] text-[#dc2626]">translate</span>
          <select id="select-site-language" class="bg-transparent text-white text-[11px] font-bold uppercase outline-none cursor-pointer">
            <option value="en" class="bg-[#131315] text-white">🇬🇧 EN</option>
            <option value="de" class="bg-[#131315] text-white">🇩🇪 DE</option>
            <option value="fr" class="bg-[#131315] text-white">🇫🇷 FR</option>
            <option value="nl" class="bg-[#131315] text-white">🇳🇱 NL</option>
            <option value="es" class="bg-[#131315] text-white">🇪🇸 ES</option>
            <option value="it" class="bg-[#131315] text-white">🇮🇹 IT</option>
            <option value="pl" class="bg-[#131315] text-white">🇵🇱 PL</option>
          </select>
        </div>

        <!-- Country Selector -->
        <div class="flex items-center gap-1 bg-[#131315] border border-[#242429] px-2 py-0.5 rounded">
          <span id="nav-selected-country-flag" class="text-xs">🇬🇧</span>
          <select id="select-eu-country" class="bg-transparent text-white text-[11px] font-bold uppercase outline-none cursor-pointer">
            <option value="GB" class="bg-[#131315] text-white">GB (£)</option>
            <option value="DE" class="bg-[#131315] text-white">DE (€)</option>
            <option value="FR" class="bg-[#131315] text-white">FR (€)</option>
            <option value="NL" class="bg-[#131315] text-white">NL (€)</option>
            <option value="IT" class="bg-[#131315] text-white">IT (€)</option>
            <option value="ES" class="bg-[#131315] text-white">ES (€)</option>
            <option value="PL" class="bg-[#131315] text-white">PL (zł)</option>
            <option value="BE" class="bg-[#131315] text-white">BE (€)</option>
            <option value="CH" class="bg-[#131315] text-white">CH (CHF)</option>
            <option value="SE" class="bg-[#131315] text-white">SE (kr)</option>
          </select>
        </div>

        <!-- VAT Display Mode Switcher (Ex VAT / Inc VAT) -->
        {% if section.settings.enable_vat_toggle != false %}
        <div id="nav-vat-toggle-group" class="flex items-center bg-[#131315] border border-[#242429] rounded text-[11px] font-mono overflow-hidden shadow-sm" title="Toggle prices between Exclusive and Inclusive of VAT">
          <button type="button" id="btn-vat-toggle-ex" class="px-2 py-0.5 font-bold transition-all text-neutral-400 hover:text-white cursor-pointer" title="Display prices excluding VAT">EX VAT</button>
          <div class="w-[1px] h-3.5 bg-[#242429]"></div>
          <button type="button" id="btn-vat-toggle-inc" class="px-2 py-0.5 font-bold transition-all text-neutral-400 hover:text-white cursor-pointer" title="Display prices including VAT">INC VAT</button>
        </div>
        {% endif %}

        <!-- Preferred Unit Toggle (Metric / Imperial) -->
        <button id="btn-toggle-units" class="hidden sm:flex items-center gap-1 bg-[#131315] border border-[#242429] px-2 py-0.5 text-[11px] text-neutral-400 hover:text-[#dc2626] transition-colors cursor-pointer" title="Toggle Unit Preference">
          <span class="material-symbols-outlined text-[13px]">straighten</span>
          <span id="label-unit-toggle">METRIC</span>
        </button>
      </div>
    </div>
  </div>
{% endif %}

{% schema %}
{
  "name": "Announcement Bar",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_announcement",
      "label": "Display Announcement Bar",
      "default": true
    },
    {
      "type": "text",
      "id": "announcement_text",
      "label": "Announcement Message",
      "default": "Official European Master Distributor: Iwata Custom Lines & Flake King"
    },
    {
      "type": "url",
      "id": "announcement_link",
      "label": "Announcement Link"
    },
    {
      "type": "text",
      "id": "badge_text",
      "label": "Dispatch Speed Badge",
      "default": "⚡ 24/48H RAPID DISPATCH (UK & EU)"
    },
    {
      "type": "checkbox",
      "id": "enable_vat_toggle",
      "label": "Enable VAT Mode Switcher",
      "default": true
    }
  ],
  "presets": [
    {
      "name": "Announcement Bar"
    }
  ]
}
{% endschema %}
"""

HEADER_SECTION = """<header id="master-site-header" class="relative md:sticky top-0 z-50 w-full flex flex-col bg-[#0b0b0d]/95 backdrop-blur-md border-b border-[#242429] shadow-[0_1px_8px_rgba(0,0,0,0.5)]">

  <!-- DEV MODE STATUS BAR (Shows when previewing/dev mode) -->
  <div id="dev-mode-bar" class="hidden bg-[#0d2818] border-b border-emerald-500/40 text-emerald-300 px-4 py-1.5 text-[11px] font-mono flex items-center justify-between z-50">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="font-bold tracking-wider uppercase text-emerald-200">🛠️ STOREFRONT DEV MODE</span>
      <span class="text-emerald-500/60 hidden sm:inline">|</span>
      <span class="text-emerald-300/80 hidden sm:inline">Active Development Environment</span>
    </div>
    <div class="flex items-center gap-3 text-[11px]">
      <a href="/pages/about" class="hover:underline text-emerald-200 font-semibold flex items-center gap-1">
        <span>About Europe</span> &rarr;
      </a>
      <span class="text-emerald-500/40">•</span>
      <a href="/pages/shipping" class="hover:underline text-emerald-200 font-semibold flex items-center gap-1">
        <span>ADR Shipping</span> &rarr;
      </a>
    </div>
  </div>

  <!-- MAIN BRAND & NAVIGATION ROW -->
  <div class="h-20 max-w-[1440px] mx-auto px-margin-mobile md:px-margin flex items-center justify-between gap-space-lg w-full">
    <!-- Logo Lockup -->
    <a id="nav-logo-btn" class="flex items-center gap-3 shrink-0 cursor-pointer text-decoration-none group" href="/" title="{{ shop.name }} Home">
      {% assign logo_img = section.settings.logo | default: settings.logo_white %}
      {% if logo_img %}
        <img alt="{{ shop.name }}" class="h-10 md:h-11 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" src="{{ logo_img | image_url: width: 400 }}" style="max-width: {{ section.settings.logo_width | default: 180 }}px;">
      {% else %}
        <img alt="{{ shop.name }}" class="h-10 md:h-11 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" src="{{ 'coast_logo_white.png' | asset_url }}" style="max-width: {{ section.settings.logo_width | default: 180 }}px;" onerror="this.onerror=null; this.src='coast_logo_white.png';">
      {% endif %}
      <span class="inline-flex items-center font-headline text-headline-sm tracking-wider uppercase border-l border-[#242429] pl-3 text-white font-semibold">
        <span class="text-[#dc2626] font-extrabold text-sm md:text-base">EUROPE</span>
      </span>
    </a>

    <!-- Search Bar with CMD + K -->
    {% if section.settings.show_search != false %}
    <div class="flex-1 max-w-lg hidden lg:block">
      <div class="relative flex items-center">
        <span class="material-symbols-outlined absolute left-3 text-neutral-400 text-[18px]">search</span>
        <input id="store-search-input" class="w-full h-10 pl-10 pr-20 bg-[#131315] border border-[#242429] rounded-lg text-white font-mono text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#dc2626] transition-colors" placeholder="Search by SKU, gun model, or paint chemistry..." type="text">
        <span class="absolute right-2 font-mono text-[10px] text-neutral-400 bg-[#0b0b0d] px-1.5 py-0.5 rounded border border-[#242429]">CMD + K</span>
      </div>
    </div>
    {% endif %}

    <!-- Trailing Action Systems -->
    <div class="flex items-center gap-space-md shrink-0">
      <!-- Quick Mix Pop-up Button -->
      {% if section.settings.show_quick_mix != false %}
      <button onclick="window.openQuickMixModal && window.openQuickMixModal()" class="hidden md:inline-flex items-center gap-1.5 font-mono text-xs border border-[#242429] bg-[#131315] hover:bg-[#1c1d22] hover:border-neutral-400 text-neutral-300 hover:text-white px-3 py-2 rounded-lg transition-all shadow-sm active:scale-[0.98] cursor-pointer" title="Open Quick Mix Calculator Pop-up">
        <span class="material-symbols-outlined text-[16px] text-[#dc2626]">calculate</span>
        <span>QUICK MIX</span>
      </button>
      {% endif %}

      <!-- B2B Trade Portal Button -->
      {% if section.settings.show_b2b_button != false %}
      <a id="btn-b2b-login" href="/pages/dealers" onclick="event.preventDefault(); window.openTradePortalModal && window.openTradePortalModal();" class="hidden sm:flex items-center gap-space-xs px-space-md py-2 border border-[#242429] hover:border-neutral-400 rounded-lg font-mono text-xs uppercase text-white bg-[#131315] hover:bg-[#1c1d22] transition-all cursor-pointer" title="Authorized Trade &amp; Dealer Portal">
        <span class="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>
        <span>B2B PORTAL</span>
      </a>
      {% endif %}

      <!-- Action Icons: Saved TDS Specs & Cart Drawer -->
      <div class="flex items-center gap-space-sm">
        <!-- Saved TDS Specs -->
        <button aria-label="Saved TDS Specs" onclick="window.openFlakeTDSModal && window.openFlakeTDSModal()" class="w-10 h-10 rounded-lg border border-[#242429] bg-[#131315] flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-400 transition-all cursor-pointer" title="Open Technical TDS Library">
          <span class="material-symbols-outlined text-[20px]">description</span>
        </button>

        <!-- Cart Drawer Button -->
        <button id="btn-toggle-cart-drawer" aria-label="Cart" class="relative w-10 h-10 rounded-lg border border-[#242429] bg-[#131315] flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-400 transition-all cursor-pointer" title="Open Shopping Cart">
          <span class="material-symbols-outlined text-[20px]">shopping_bag</span>
          <span id="header-cart-count" class="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 bg-[#dc2626] text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">0</span>
        </button>

        <!-- Operator / Admin Login -->
        <button onclick="window.openAdminLogin && window.openAdminLogin()" aria-label="Admin Access" class="w-8 h-8 rounded-full bg-[#dc2626]/20 border border-[#dc2626]/40 flex items-center justify-center ml-space-xs text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-colors cursor-pointer" title="Operator Console">
          <span class="material-symbols-outlined text-[18px]">person</span>
        </button>
      </div>
    </div>
  </div>

  <!-- DEPARTMENT-LED HORIZONTAL NAVIGATION BAR -->
  <div class="border-t border-[#242429] bg-[#0b0b0d]/80">
    <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin">
      <nav class="flex items-center space-x-space-md sm:space-x-space-lg overflow-x-auto py-2 font-mono text-xs uppercase">
        {% if section.settings.menu != blank and linklists[section.settings.menu].links.size > 0 %}
          {% for link in linklists[section.settings.menu].links %}
            <a href="{{ link.url }}" class="nav-link{% if link.active %} active{% endif %} text-neutral-300 hover:text-white transition-colors">{{ link.title }}</a>
          {% endfor %}
        {% else %}
          <a id="tab-storefront" class="nav-link active" href="javascript:void(0)">SHOP</a>
          <a href="#dept-brands" class="nav-link text-[#dc2626] font-bold flex items-center gap-1" title="Explore Authorized European Manufacturers"><span class="material-symbols-outlined text-[15px]">verified</span> BRANDS</a>
          <a href="#dept-guns" class="nav-link">AIRBRUSHES &amp; GUNS</a>
          <a href="#dept-kroma-edge" class="nav-link">CUSTOM PAINT LINES</a>
          <a href="#dept-flakes" class="nav-link">FLAKE SYSTEMS</a>
          <a href="#dept-basecoats-binders" class="nav-link">BASECOATS &amp; BINDERS</a>
          <a href="#dept-tapes" class="nav-link">TAPES</a>
          <a id="tab-calculator" class="nav-link text-[#dc2626] hover:text-white flex items-center gap-1 font-bold" href="javascript:void(0)">
            <span class="material-symbols-outlined text-[15px]">calculate</span> MIX LAB
          </a>
          <a id="tab-academy" class="nav-link" href="javascript:void(0)">ACADEMY</a>
          <a id="nav-about-link" class="nav-link" href="/pages/about">ABOUT</a>
          <a href="/pages/dealers" class="nav-link text-neutral-400">B2B TRADE</a>
        {% endif %}
      </nav>
    </div>
  </div>

  <!-- Dynamic Active Trade Session Banner (Hidden by default, shown when verified B2B partner logs in) -->
  <div id="trade-active-banner" class="hidden w-full bg-[#131315] border-b border-[#dc2626] text-white py-2.5 px-margin-mobile md:px-margin z-40 transition-all">
    <div class="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono">
      <div class="flex items-center gap-2.5 flex-wrap">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#dc2626] text-white font-bold text-[11px]">✓</span>
        <span class="font-bold text-white tracking-wide uppercase text-sm" id="trade-banner-company">Apex Custom Paintworks Ltd</span>
        <span class="bg-[#0b0b0d] px-2.5 py-0.5 rounded text-[10px] text-neutral-300 border border-[#242429] uppercase tracking-wider font-bold" id="trade-banner-tier">Tier 2: Authorized Trade Dealer</span>
        <span class="text-neutral-400 text-[11px]" id="trade-banner-vat">VAT: GB123456789</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-[11px] text-neutral-400 font-bold hidden md:inline">Wholesale pricing unlocked • Ex-VAT billing active</span>
        <button onclick="window.handleTradeLogout && window.handleTradeLogout()" class="px-3 py-1 bg-[#242429] hover:bg-[#dc2626] text-white text-xs font-bold rounded border border-[#242429] transition-colors flex items-center gap-1 cursor-pointer">
          <span class="material-symbols-outlined text-[14px]">logout</span> Log Out Trade Session
        </button>
      </div>
    </div>
  </div>

</header>

<!-- Mobile Secondary Navigation Bar -->
<div class="lg:hidden bg-[#131315] border-b border-[#242429] flex overflow-x-auto py-2 px-4 gap-2 text-xs font-mono">
  <button onclick="document.getElementById('tab-storefront') && document.getElementById('tab-storefront').click()" class="nav-link !text-xs !py-1 !px-2.5 active">Shop</button>
  <a href="#dept-brands" class="nav-link !text-xs !py-1 !px-2.5 text-[#dc2626] font-bold">Brands</a>
  <a href="#dept-kroma-edge" class="nav-link !text-xs !py-1 !px-2.5 text-neutral-300">Chrome &amp; Clears</a>
  <a href="#dept-guns" class="nav-link !text-xs !py-1 !px-2.5 text-[#dc2626] font-bold">Guns</a>
  <a href="#dept-flakes" class="nav-link !text-xs !py-1 !px-2.5 text-neutral-300">Flakes</a>
  <a href="#dept-basecoats-binders" class="nav-link !text-xs !py-1 !px-2.5 text-amber-300 font-bold">Basecoats &amp; Binders</a>
  <a href="#dept-tapes" class="nav-link !text-xs !py-1 !px-2.5 text-neutral-300">Tapes</a>
  <button onclick="document.getElementById('tab-calculator') && document.getElementById('tab-calculator').click()" class="nav-link !text-xs !py-1 !px-2.5">Mix Lab</button>
  <a href="/pages/about" class="nav-link !text-xs !py-1 !px-2.5">About</a>
  <a href="/pages/dealers" class="nav-link !text-xs !py-1 !px-2.5 text-neutral-300">Dealers</a>
</div>

{% schema %}
{
  "name": "Header",
  "settings": [
    {
      "type": "image_picker",
      "id": "logo",
      "label": "Custom Store Logo"
    },
    {
      "type": "range",
      "id": "logo_width",
      "min": 80,
      "max": 320,
      "step": 10,
      "unit": "px",
      "label": "Logo Width",
      "default": 180
    },
    {
      "type": "link_list",
      "id": "menu",
      "label": "Navigation Menu",
      "default": "main-menu"
    },
    {
      "type": "checkbox",
      "id": "show_search",
      "label": "Show Search Bar",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_quick_mix",
      "label": "Show Quick Mix Button",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_b2b_button",
      "label": "Show B2B Trade Portal Button",
      "default": true
    }
  ],
  "presets": [
    {
      "name": "Header"
    }
  ]
}
{% endschema %}
"""

HERO_CAROUSEL_SECTION = """<section class="relative w-full py-16 lg:py-24 bg-[#0b0b0d] border-b-2 border-[#242429] overflow-hidden min-h-[600px] lg:min-h-[680px] flex items-center">
  <!-- Ambient Slideshow: Real Optical Finishes -->
  <div id="hero-crossfade-container" class="hero-crossfade-container">
    {% for block in section.blocks %}
      {% assign slide_img = block.settings.image %}
      {% assign slide_file = block.settings.image_filename | default: 'kroma-skull-studio-dark.jpg' %}
      <div class="hero-crossfade-slide{% if forloop.first %} active{% endif %}"
           {{ block.shopify_attributes }}
           style="background-image: url('{% if slide_img %}{{ slide_img | image_url: width: 2000 }}{% else %}{{ slide_file | asset_url }}{% endif %}'); background-position: {{ block.settings.position | default: 'center right 15%' }};"
           data-caption="{{ block.settings.caption | escape }}"
           data-badge="{{ block.settings.badge | escape }}">
      </div>
    {% endfor %}
  </div>

  <!-- Directional Mask for High-Contrast Text Legibility -->
  <div class="hero-directional-overlay"></div>
  <div class="absolute inset-0 metal-sheen opacity-10 pointer-events-none z-10"></div>
  <div class="absolute bottom-0 w-full h-1 bg-gradient-to-r from-[#dc2626] via-[#b91c1c] to-transparent z-20"></div>

  <div class="relative z-20 h-full flex flex-col justify-center px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      
      <div class="lg:col-span-9 space-y-5 max-w-3xl">
        <!-- Authority Pill -->
        <div id="hero-authority-pill" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/85 border border-[#dc2626]/60 backdrop-blur-md font-mono text-[11px] text-white font-bold uppercase tracking-wider shadow-[0_0_18px_rgba(220,38,38,0.35)]">
          <span id="hero-pill-dot" class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span id="hero-pill-status" class="text-neutral-200">{{ section.settings.pill_status | default: '✦ OFFICIAL EUROPEAN MASTER HUB' }}</span>
          <span class="text-neutral-500">•</span>
          <span id="hero-pill-location" class="text-amber-300">{{ section.settings.pill_location | default: 'PLACENTIA, CA AUTHORIZED' }}</span>
        </div>

        <!-- Approved Master Headline & Statement -->
        <div class="space-y-3">
          <h1 id="hero-headline" class="font-headline text-3xl sm:text-5xl lg:text-6xl uppercase text-white tracking-tight leading-[1.06] drop-shadow-[0_4px_30px_rgba(0,0,0,1)] font-black">
            <span id="hero-headline-prefix">{{ section.settings.headline_prefix | default: 'THE EUROPEAN MASTER HUB FOR' }}</span> <br>
            <span id="hero-headline-accent" class="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-[#dc2626]">{{ section.settings.headline_accent | default: 'KROMA EDGE CHROME, FLAKE KING & VSIONAIR' }}</span>
          </h1>
          <p id="hero-subheadline" class="font-headline text-base sm:text-xl text-neutral-200 font-medium tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            {{ section.settings.subheadline | default: 'Engineered for automotive refinishers, custom shops & airbrush artists across Europe.' }}
          </p>
          <p id="hero-description" class="font-body text-sm sm:text-base text-neutral-300 font-normal leading-relaxed max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {{ section.settings.description | default: 'Direct European bonded dispatch from our UK logistics center. Zero US import customs, next-day tracked APC & DHL Express, full EU REACH & VOC regulatory compliance, and factory-authorized technical support.' }}
          </p>
        </div>

        <!-- Action Row -->
        <div class="flex flex-wrap items-center gap-space-md pt-space-xs">
          <a class="h-11 px-6 bg-[#dc2626] hover:bg-[#b91c1c] active:scale-[0.98] text-white font-headline text-sm uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-md transition-all font-bold" href="#dept-guns">
            <span>Explore Exclusive Hardware</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
          <button type="button" onclick="window.openFlakeTDSModal && window.openFlakeTDSModal()" class="h-11 px-6 bg-[#131315] hover:bg-[#1c1d22] text-white font-headline text-sm uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-sm transition-all border border-[#242429] cursor-pointer font-bold">
            <span class="material-symbols-outlined text-[18px] text-neutral-400">file_download</span>
            <span>Download Chemical TDS Guides</span>
          </button>
        </div>

        <!-- Trust Line -->
        <div id="hero-trust-bar" class="flex items-center gap-2 font-mono text-[11px] text-neutral-400 pt-1">
          <span class="material-symbols-outlined text-[15px] text-emerald-400">verified_user</span>
          <span id="hero-trust-line">{{ section.settings.trust_line | default: 'Dispatched from UK Hub • Tracked APC Overnight & DHL Express • 100% REACH & VOC Certified • Zero US Customs' }}</span>
        </div>

        <!-- Carousel Slide Indicators & Captions -->
        <div class="flex items-center gap-4 pt-4 border-t border-[#242429]">
          <div id="hero-slide-dots" class="flex items-center gap-2">
            {% for block in section.blocks %}
              <button class="hero-indicator-dot{% if forloop.first %} active{% endif %} w-2.5 h-2.5 rounded-full bg-white/30 transition-all cursor-pointer hover:bg-white/70" onclick="window.setHeroSlide && window.setHeroSlide({{ forloop.index0 }})" title="Slide {{ forloop.index }}"></button>
            {% endfor %}
          </div>
          <div id="hero-caption-text" class="font-mono text-xs text-neutral-300">
            {{ section.blocks.first.settings.caption | default: '01/06 • 100% Mirror Anatomic Chrome Skull (Zero Gray Haze)' }}
          </div>
          <span id="hero-artifact-badge" class="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
            {{ section.blocks.first.settings.badge | default: 'Zero Gray Clouding' }}
          </span>
          <div class="flex items-center gap-1.5 ml-auto">
            <button onclick="window.prevHeroSlide && window.prevHeroSlide()" class="w-8 h-8 rounded bg-[#131315] border border-[#242429] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer" title="Previous Slide">
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button onclick="window.nextHeroSlide && window.nextHeroSlide()" class="w-8 h-8 rounded bg-[#131315] border border-[#242429] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer" title="Next Slide">
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  </div>
</section>

{% schema %}
{
  "name": "Hero Carousel",
  "settings": [
    {
      "type": "text",
      "id": "pill_status",
      "label": "Authority Pill Status",
      "default": "✦ OFFICIAL EUROPEAN MASTER HUB"
    },
    {
      "type": "text",
      "id": "pill_location",
      "label": "Authority Pill Location",
      "default": "PLACENTIA, CA AUTHORIZED"
    },
    {
      "type": "text",
      "id": "headline_prefix",
      "label": "Headline Prefix",
      "default": "THE EUROPEAN MASTER HUB FOR"
    },
    {
      "type": "text",
      "id": "headline_accent",
      "label": "Headline Accent",
      "default": "KROMA EDGE CHROME, FLAKE KING & VSIONAIR"
    },
    {
      "type": "text",
      "id": "subheadline",
      "label": "Subheadline",
      "default": "Engineered for automotive refinishers, custom shops & airbrush artists across Europe."
    },
    {
      "type": "textarea",
      "id": "description",
      "label": "Description",
      "default": "Direct European bonded dispatch from our UK logistics center. Zero US import customs, next-day tracked APC & DHL Express, full EU REACH & VOC regulatory compliance, and factory-authorized technical support."
    },
    {
      "type": "text",
      "id": "trust_line",
      "label": "Trust Line",
      "default": "Dispatched from UK Hub • Tracked APC Overnight & DHL Express • 100% REACH & VOC Certified • Zero US Customs"
    }
  ],
  "blocks": [
    {
      "type": "slide",
      "name": "Hero Slide",
      "settings": [
        {
          "type": "image_picker",
          "id": "image",
          "label": "Slide Image"
        },
        {
          "type": "text",
          "id": "image_filename",
          "label": "Fallback Asset Filename",
          "default": "kroma-skull-studio-dark.jpg"
        },
        {
          "type": "text",
          "id": "caption",
          "label": "Slide Caption",
          "default": "100% Mirror Anatomic Chrome Skull (Zero Gray Haze)"
        },
        {
          "type": "text",
          "id": "badge",
          "label": "Technical Badge",
          "default": "Zero Gray Clouding"
        },
        {
          "type": "text",
          "id": "position",
          "label": "CSS Background Position",
          "default": "center right 15%"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Hero Carousel",
      "blocks": [
        {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-skull-studio-dark.jpg",
            "caption": "01/06 • 100% Mirror Anatomic Chrome Skull (Zero Gray Haze)",
            "badge": "Zero Gray Clouding",
            "position": "center right 18%"
          }
        },
        {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-surfer-wave-studio.jpg",
            "caption": "02/06 • Full-Scale Silver Surfer on Ocean Wave (Pier Sunset)",
            "badge": "Full Figure Liquid Chrome",
            "position": "center right 10%"
          }
        },
        {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-helmet-mirror.jpg",
            "caption": "03/06 • 99.4% Specular Mirror Racing Helmet (Standard 2K Clearcoat)",
            "badge": "Standard 2K Clearcoat Applied",
            "position": "center right 15%"
          }
        },
        {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-detail-skull.jpg",
            "caption": "04/06 • Liquid Metal Silver Surfer Front Profile (HVLP Applied)",
            "badge": "HVLP 1.3mm Tip Applied",
            "position": "center right 15%"
          }
        },
        {
          "type": "slide",
          "settings": {
            "image_filename": "kroma-detail-helmet.jpg",
            "caption": "05/06 • Back Anatomy & Platelet Alignment Reflection",
            "badge": "Self-Aligning Platelets",
            "position": "center right 15%"
          }
        },
        {
          "type": "slide",
          "settings": {
            "image_filename": "flake-buggy-studio.jpg",
            "caption": "06/06 • Custom Flake Sand Rail & Chassis (Coast Signature)",
            "badge": "Coast Signature Flake Finish",
            "position": "center right 10%"
          }
        }
      ]
    }
  ]
}
{% endschema %}
"""

STOREFRONT_CATALOG_SECTION = """<div id="storefront-catalog-anchor" class="px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full py-12 flex-grow flex flex-col gap-6">
  
  <!-- Catalog Toolbar & Controls -->
  <div class="bg-[#131315] border-2 border-[#242429] p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
    <!-- Status Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#242429] text-xs font-mono">
      <div class="flex items-center gap-2">
        <span class="bg-[#dc2626] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">OFFICIAL MASTER DISTRIBUTOR</span>
        <span class="text-neutral-400 uppercase text-[11px] font-bold">{{ section.settings.heading | default: 'In-Stock Guns, Paints, Flakes & Tapes' }}</span>
      </div>
      <span class="font-mono text-[11px] bg-emerald-950/80 text-emerald-400 border border-emerald-700/80 px-2.5 py-0.5 font-bold self-start sm:self-auto rounded-sm">
        {{ section.settings.badge_text | default: '⚡ 24/48H RAPID DISPATCH (UK & EU)' }}
      </span>
    </div>

    <div class="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
      
      <!-- Search Bar -->
      {% if section.settings.enable_search != false %}
      <div class="relative flex-grow max-w-xl">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">search</span>
        <input id="input-shop-search" type="text" placeholder="Search by SKU, product name, flake micron, color..." class="w-full pl-9 pr-4 py-2.5 bg-[#0b0b0d] border border-[#242429] text-white rounded text-xs font-mono focus:border-[#dc2626] focus:outline-none">
      </div>
      {% endif %}

      <!-- Brand & Category Quick Filter Pills -->
      <div id="brand-filter-pills" class="flex items-center gap-1.5 flex-wrap font-mono text-xs">
        <span class="text-neutral-400 font-bold uppercase text-[11px] mr-1 hidden sm:inline">Filter:</span>
        
        <!-- Render Customizer Blocks -->
        {% for block in section.blocks %}
          {% if block.type == 'category_filter' %}
            {% assign b_type = block.settings.filter_type | default: 'brand' %}
            {% assign b_val = block.settings.filter_value | default: 'all' %}
            {% assign b_border = block.settings.border_color | default: '#242429' %}
            <button 
              {{ block.shopify_attributes }}
              data-{{ b_type }}-val="{{ b_val }}" 
              class="brand-pill{% if b_val == 'all' %} active{% endif %} px-3 py-1.5 border bg-black/60 text-white font-bold hover:border-[#dc2626] transition-colors cursor-pointer"
              style="border-color: {{ b_border }};">
              {{ block.settings.title | default: b_val | upcase }}
            </button>
          {% endif %}
        {% endfor %}

        <!-- Dynamic Shopify Collections -->
        {% if section.settings.enable_dynamic_collections != false %}
          {% for col in collections %}
            {% unless col.handle == 'frontpage' or col.all_products_count == 0 %}
              <button data-collection-handle="{{ col.handle }}" data-cat-val="{{ col.title | escape }}" class="brand-pill px-3 py-1.5 border border-[#242429] bg-black/60 text-neutral-400 hover:text-white hover:border-[#dc2626] transition-colors cursor-pointer">
                {{ col.title | upcase }} ({{ col.all_products_count }})
              </button>
            {% endunless %}
          {% endfor %}
        {% endif %}
      </div>

      <!-- Sorter Dropdown & Reset -->
      {% if section.settings.enable_sorting != false %}
      <div class="flex items-center gap-2 flex-shrink-0 font-mono text-xs">
        <span class="text-neutral-400 uppercase font-bold">Sort:</span>
        <select id="select-shop-sort" class="bg-[#0b0b0d] border border-[#242429] text-white py-1.5 px-3 uppercase rounded focus:border-[#dc2626] focus:outline-none cursor-pointer">
          <option value="popular">Popularity</option>
          <option value="price-asc">Price: Low &rarr; High</option>
          <option value="price-desc">Price: High &rarr; Low</option>
          <option value="name">Name (A-Z)</option>
        </select>

        <button id="btn-reset-filters" class="border border-[#242429] hover:border-[#dc2626] text-neutral-400 hover:text-white px-2.5 py-2 uppercase transition-colors cursor-pointer flex items-center gap-1" title="Reset all filters">
          <span class="material-symbols-outlined text-[14px]">refresh</span>
          <span class="hidden sm:inline">Reset</span>
        </button>
      </div>
      {% endif %}

    </div>

    <!-- Contextual Subcategory Bar (Dynamic: Flake Guns / Jigs / Flakes) -->
    <div id="contextual-subcat-bar" class="hidden items-center gap-1.5 flex-wrap font-mono text-xs pt-2.5 border-t border-[#242429]"></div>
  </div>

  <!-- Results Count & Active Filter Tags -->
  <div class="flex items-center justify-between text-xs font-mono text-neutral-400">
    <span id="shop-results-count" class="font-bold uppercase text-white">Showing 57 Products</span>
    <div id="active-filter-chips" class="flex items-center gap-1.5 flex-wrap">
      <!-- Active filter tags appear here -->
    </div>
  </div>

  <!-- Product Grid (Full Width 4-Column Responsive Grid) -->
  <div id="storefront-product-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
    <!-- Product cards injected via JS -->
  </div>

</div>

<!-- Shopify Live Catalog JSON Data for Client-Side Hydration -->
<script id="shopify-catalog-data" type="application/json">
[
  {% paginate collections.all.products by 250 %}
    {% for prod in collections.all.products %}
      {
        "id": {{ prod.id | json }},
        "title": {{ prod.title | json }},
        "name": {{ prod.title | json }},
        "handle": {{ prod.handle | json }},
        "vendor": {{ prod.vendor | json }},
        "type": {{ prod.type | json }},
        "price": {{ prod.price | divided_by: 100.0 | json }},
        "compare_at_price": {{ prod.compare_at_price | divided_by: 100.0 | json }},
        "available": {{ prod.available | json }},
        "tags": {{ prod.tags | json }},
        "description": {{ prod.description | strip_html | truncatewords: 50 | json }},
        "images": [{% for img in prod.images %}{{ img | image_url: width: 800 | json }}{% unless forloop.last %},{% endunless %}{% endfor %}],
        "specs": {
          {% if prod.metafields.specs %}
            {% for spec in prod.metafields.specs %}
              {{ spec.first | json }}: {{ spec.last | json }}{% unless forloop.last %},{% endunless %}
            {% endfor %}
          {% endif %}
        },
        "variants": [
          {% for v in prod.variants %}
            {
              "id": {{ v.id | json }},
              "title": {{ v.title | json }},
              "sku": {{ v.sku | json }},
              "price": {{ v.price | divided_by: 100.0 | json }},
              "available": {{ v.available | json }}
            }{% unless forloop.last %},{% endunless %}
          {% endfor %}
        ]
      }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  {% endpaginate %}
]
</script>

{% schema %}
{
  "name": "Storefront Catalog",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Catalog Heading",
      "default": "In-Stock Guns, Paints, Flakes & Tapes"
    },
    {
      "type": "text",
      "id": "badge_text",
      "label": "Dispatch Badge",
      "default": "⚡ 24/48H RAPID DISPATCH (UK & EU)"
    },
    {
      "type": "checkbox",
      "id": "enable_search",
      "label": "Enable Search Input",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "enable_sorting",
      "label": "Enable Sorting Dropdown",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "enable_dynamic_collections",
      "label": "Include Dynamic Collection Pills",
      "default": true
    },
    {
      "type": "range",
      "id": "products_per_page",
      "min": 12,
      "max": 96,
      "step": 4,
      "label": "Products per Page",
      "default": 48
    }
  ],
  "blocks": [
    {
      "type": "category_filter",
      "name": "Category Filter Pill",
      "settings": [
        {
          "type": "text",
          "id": "title",
          "label": "Pill Title",
          "default": "Kroma Edge"
        },
        {
          "type": "select",
          "id": "filter_type",
          "label": "Filter Type",
          "options": [
            { "value": "brand", "label": "Brand / Manufacturer" },
            { "value": "cat", "label": "Product Category / Type" },
            { "value": "tag", "label": "Product Tag" }
          ],
          "default": "brand"
        },
        {
          "type": "text",
          "id": "filter_value",
          "label": "Filter Match Value",
          "default": "Kroma Edge"
        },
        {
          "type": "color",
          "id": "border_color",
          "label": "Border Accent Color",
          "default": "#242429"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Storefront Catalog",
      "blocks": [
        {
          "type": "category_filter",
          "settings": {
            "title": "ALL",
            "filter_type": "brand",
            "filter_value": "all",
            "border_color": "#dc2626"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "KROMA EDGE",
            "filter_type": "brand",
            "filter_value": "Kroma Edge",
            "border_color": "#0284c7"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "IWATA / ATAWI",
            "filter_type": "brand",
            "filter_value": "Iwata",
            "border_color": "#dc2626"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "ACE OF SHADES",
            "filter_type": "brand",
            "filter_value": "Ace of Shades",
            "border_color": "#f59e0b"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "HYPER FX (CREATEX)",
            "filter_type": "brand",
            "filter_value": "Hyper FX",
            "border_color": "#10b981"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "LUMILOR",
            "filter_type": "brand",
            "filter_value": "LumiLor",
            "border_color": "#a855f7"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "CLEAN ARMOR",
            "filter_type": "brand",
            "filter_value": "Clean Armor",
            "border_color": "#10b981"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "FLAKE KING",
            "filter_type": "brand",
            "filter_value": "Flake King",
            "border_color": "#242429"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "VSIONAIR",
            "filter_type": "brand",
            "filter_value": "VsionAir",
            "border_color": "#f59e0b"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "CLEARCOAT KITS",
            "filter_type": "cat",
            "filter_value": "Dedicated Clearcoats",
            "border_color": "#242429"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "FLAKES (36)",
            "filter_type": "cat",
            "filter_value": "Dry Metal Flake (Glitter)",
            "border_color": "#242429"
          }
        },
        {
          "type": "category_filter",
          "settings": {
            "title": "TAPES (6)",
            "filter_type": "cat",
            "filter_value": "Masking Products",
            "border_color": "#242429"
          }
        }
      ]
    }
  ]
}
{% endschema %}
"""

MIXING_CALCULATOR_SECTION = """{% if section.settings.show_calculator != false %}
  <div id="view-calculator" class="tab-view flex-grow flex flex-col py-8 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full" style="display: none;">
    <!-- Return to Storefront Quick-Link -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3 bg-[#131315] border border-[#242429] p-3 rounded shadow-sm">
      <button onclick="window.paintApp ? window.paintApp.switchTab('tab-storefront', 'view-storefront') : (document.getElementById('tab-storefront') && document.getElementById('tab-storefront').click());" class="bg-[#dc2626] hover:bg-[#b91c1c] text-white !py-2 !px-4 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-md hover:brightness-110 transition-all rounded-sm">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>RETURN TO PRODUCT STOREFRONT</span>
      </button>
      <div class="font-mono text-xs text-neutral-300 flex items-center gap-2">
        <span class="text-emerald-400">✓ In-Booth Formulation Tool</span>
        <span class="text-[#242429] hidden sm:inline">•</span>
        <span class="hidden sm:inline">Your active cart &amp; product selections remain saved</span>
      </div>
    </div>

    <!-- Header -->
    <div class="border-b-2 border-[#242429] pb-4 mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
      <div>
        <div class="flex items-center gap-2 font-mono">
          <span class="bg-[#dc2626] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">{{ section.settings.badge_text | default: 'KROMAEDGE™ PRECISION LAB' }}</span>
          <span class="bg-[#131315] border border-[#242429] text-neutral-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">OFFICIAL TDS BENCHMARKED</span>
        </div>
        <h2 class="font-headline text-2xl sm:text-3xl uppercase text-[#dc2626] mt-1.5 font-bold">{{ section.settings.heading | default: 'TDS MIXING MATRIX & PROJECT VOLUME ESTIMATOR' }}</h2>
        <p class="font-mono text-xs text-neutral-400 mt-1 max-w-3xl">
          {{ section.settings.subheading | default: 'Calibrated exclusively to official KromaEdge Technical Data Sheets (2 oz = 2 sq ft coverage). Select your formula below to calculate exact component volumes and digital scale tare targets.' }}
        </p>
      </div>
      {% if section.settings.enable_scale_mode != false %}
      <button id="btn-open-scale-mode-header" onclick="window.paintApp && window.paintApp.openScaleMode ? window.paintApp.openScaleMode() : null" class="bg-[#131315] border border-[#242429] text-white hover:border-[#dc2626] px-3 py-2 font-mono text-xs self-start sm:self-auto flex items-center gap-1.5 rounded-sm cursor-pointer">
        <span class="material-symbols-outlined text-[16px] text-[#dc2626]">scale</span> DIGITAL SCALE MODE
      </button>
      {% endif %}
    </div>

    <!-- Streamlined Linear Mixing Suite (4-Step Painter's Flow) -->
    <div class="space-y-6">
      
      <!-- STEP 1: SELECT COATING / PAINT SYSTEM -->
      <div id="step-1-system-card" class="p-6 border-2 border-[#242429] bg-[#131315] rounded">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b-2 border-[#242429] gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1 font-mono">
              <span class="bg-[#dc2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">STEP 1 OF 4</span>
              <span class="bg-[#0b0b0d] text-neutral-400 text-[10px] border border-[#242429] px-2 py-0.5 rounded-sm">PAINT FORMULATION ENGINE</span>
            </div>
            <h3 class="font-headline text-lg sm:text-xl text-white uppercase font-bold">Select Coating / Paint System</h3>
            <p class="font-mono text-xs text-neutral-400 mt-0.5">
              Select your paint chemistry first. Each coating dictates exact coverage rates, coat count rules, pot life, and digital scale tare ratios.
            </p>
          </div>
          <!-- SDS & TDS Quick Download Actions in Header -->
          <div class="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
            <button id="btn-calc-download-tds" class="bg-[#0b0b0d] border border-[#242429] hover:border-[#dc2626] hover:text-[#dc2626] text-neutral-300 px-3 py-1.5 uppercase transition-all flex items-center gap-1.5 cursor-pointer rounded-sm" title="Download Technical Data Sheet">
              <span class="material-symbols-outlined text-[15px] text-sky-400">description</span>
              <span>TDS SPEC</span>
            </button>
            <button id="btn-calc-download-sds" class="bg-[#0b0b0d] border border-[#242429] hover:border-[#dc2626] hover:text-[#dc2626] text-neutral-300 px-3 py-1.5 uppercase transition-all flex items-center gap-1.5 cursor-pointer rounded-sm" title="Download Safety Data Sheet">
              <span class="material-symbols-outlined text-[15px] text-red-400">picture_as_pdf</span>
              <span>REACH SDS</span>
            </button>
          </div>
        </div>

        <!-- Formula Grid -->
        <div class="space-y-3 font-mono">
          <label class="text-xs text-neutral-400 uppercase block font-bold">Active Storefront Coating Systems:</label>
          <div id="mixing-systems-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <!-- Injected dynamically by JS -->
          </div>
          <select id="select-mixing-system" class="sr-only"></select>
        </div>

        <!-- Dynamic Live Spec & Surface Coverage Banner -->
        <div id="system-description" class="mt-5 pt-4 border-t border-[#242429]">
          <!-- Rendered dynamically by JS -->
        </div>
      </div>

      <!-- STEP 2: PROJECT DIMENSIONS & BATCH VOLUME ESTIMATOR -->
      <div id="project-estimator-card" class="p-6 border-2 border-[#242429] bg-[#131315] relative overflow-hidden rounded">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b-2 border-[#242429] gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1 font-mono">
              <span class="bg-[#dc2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">STEP 2 OF 4</span>
              <span class="bg-[#0b0b0d] text-neutral-400 text-[10px] border border-[#242429] px-2 py-0.5 rounded-sm">TDS-BENCHMARKED AREA &amp; VOLUME</span>
            </div>
            <h3 class="font-headline text-lg sm:text-xl text-white uppercase font-bold">Project Dimensions &amp; Batch Volume</h3>
            <p class="font-mono text-xs text-neutral-400 mt-0.5">
              Input physical measurements or select an automotive preset. Volume and scale recipes auto-calculate and live-sync below in real time.
            </p>
          </div>
          
          <!-- Unit Switcher -->
          <div class="flex items-center gap-2 self-start sm:self-auto bg-[#0b0b0d] p-1.5 border border-[#242429] rounded">
            <span class="font-mono text-[10px] text-neutral-400 uppercase font-bold px-1">Units:</span>
            <div class="flex gap-1" id="estimator-unit-toggle">
              <button type="button" id="btn-unit-imperial" class="px-2.5 py-1 text-xs font-mono font-bold bg-[#dc2626] text-white rounded transition-colors cursor-pointer shadow-sm">Imperial (In/Ft)</button>
              <button type="button" id="btn-unit-metric" class="px-2.5 py-1 text-xs font-mono font-bold bg-[#131315] hover:bg-[#242429] text-neutral-400 hover:text-white rounded transition-colors cursor-pointer">Metric (Cm/M)</button>
            </div>
          </div>
        </div>

        <!-- Calculation Mode Selector Tabs -->
        <div class="flex flex-wrap gap-2 mb-5 pb-3 border-b border-[#242429]">
          <button type="button" id="btn-calc-mode-box" class="px-3 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-[#dc2626]/20 border-[#dc2626] text-[#dc2626] flex items-center gap-1.5 shadow-sm">
            <span class="material-symbols-outlined text-[16px]">view_in_ar</span>
            <span>3D Object / Box (L × W × H)</span>
          </button>
          <button type="button" id="btn-calc-mode-panel" class="px-3 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-[#0b0b0d] border-[#242429] text-neutral-400 hover:text-white hover:border-neutral-400 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">crop_landscape</span>
            <span>2D Flat Panel (L × W)</span>
          </button>
          <button type="button" id="btn-calc-mode-cylinder" class="px-3 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-[#0b0b0d] border-[#242429] text-neutral-400 hover:text-white hover:border-neutral-400 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">radio_button_checked</span>
            <span>Cylinder / Tank / Helmet</span>
          </button>
          <button type="button" id="btn-calc-mode-preset" class="px-3 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-[#0b0b0d] border-[#242429] text-neutral-400 hover:text-white hover:border-neutral-400 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">directions_car</span>
            <span>Automotive Preset</span>
          </button>
        </div>

        <!-- Mode Input Rows -->
        <div id="estimator-inputs-container" class="space-y-4">
          <!-- Dynamically swapped by JS -->
        </div>

        <!-- Calculated Live Metrics Banner -->
        <div class="mt-6 pt-5 border-t border-[#242429] grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
          <div class="p-3 bg-[#0b0b0d] border border-[#242429] rounded">
            <span class="text-[10px] text-neutral-400 uppercase block font-bold">Total Surface Area</span>
            <span id="metric-surface-area" class="text-lg font-bold text-white">0.00 sq ft</span>
          </div>
          <div class="p-3 bg-[#0b0b0d] border border-[#242429] rounded">
            <span class="text-[10px] text-neutral-400 uppercase block font-bold">Recommended Coats</span>
            <span id="metric-coat-count" class="text-lg font-bold text-[#dc2626]">2 Medium Wet</span>
          </div>
          <div class="p-3 bg-[#0b0b0d] border border-[#242429] rounded">
            <span class="text-[10px] text-neutral-400 uppercase block font-bold">Target Volume (mL)</span>
            <span id="metric-target-volume-ml" class="text-lg font-bold text-emerald-400">140 mL</span>
          </div>
          <div class="p-3 bg-[#0b0b0d] border border-[#242429] rounded">
            <span class="text-[10px] text-neutral-400 uppercase block font-bold">Target Volume (Fl Oz)</span>
            <span id="metric-target-volume-oz" class="text-lg font-bold text-sky-400">4.73 fl oz</span>
          </div>
        </div>
      </div>

      <!-- STEP 3: DIGITAL SCALE TARE RATIO MATRIX -->
      <div id="recipe-matrix-card" class="p-6 border-2 border-[#242429] bg-[#131315] rounded">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b-2 border-[#242429] gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1 font-mono">
              <span class="bg-[#dc2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">STEP 3 OF 4</span>
              <span class="bg-[#0b0b0d] text-neutral-400 text-[10px] border border-[#242429] px-2 py-0.5 rounded-sm">GRAM SCALE TARE FORMULA</span>
            </div>
            <h3 class="font-headline text-lg sm:text-xl text-white uppercase font-bold">Component Weights &amp; Ratios</h3>
            <p class="font-mono text-xs text-neutral-400 mt-0.5">
              Precision digital scale recipe. Place your mixing cup on the scale, tare between steps, and pour to cumulative weights.
            </p>
          </div>
          <span id="formula-ratio-badge" class="font-mono text-xs bg-[#0b0b0d] border border-[#242429] text-[#dc2626] px-3 py-1 font-bold rounded">
            RATIO: 4:1:1
          </span>
        </div>

        <!-- Recipe Table -->
        <div class="overflow-x-auto border border-[#242429] rounded">
          <table class="w-full text-left font-mono text-xs">
            <thead class="bg-[#0b0b0d] text-neutral-400 uppercase text-[11px] border-b border-[#242429]">
              <tr>
                <th class="p-3">Step</th>
                <th class="p-3">Component</th>
                <th class="p-3">Ratio %</th>
                <th class="p-3">Volume</th>
                <th class="p-3">Tare Target</th>
                <th class="p-3">Cumulative Weight</th>
              </tr>
            </thead>
            <tbody id="recipe-table-body" class="divide-y divide-[#242429] text-white">
              <!-- Dynamically populated by JS -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- STEP 4: APPLICATION PROTOCOL & TIMELINE -->
      <div id="application-guide-card" class="p-6 border-2 border-[#242429] bg-[#131315] rounded">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b-2 border-[#242429] gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1 font-mono">
              <span class="bg-[#dc2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">STEP 4 OF 4</span>
              <span class="bg-[#0b0b0d] text-neutral-400 text-[10px] border border-[#242429] px-2 py-0.5 rounded-sm">TECHNICAL DATA SPECIFICATION</span>
            </div>
            <h3 class="font-headline text-lg sm:text-xl text-white uppercase font-bold">Application Protocol &amp; Timeline</h3>
            <p class="font-mono text-xs text-neutral-400 mt-0.5">
              Manufacturer flash times, spray gun nozzle sizing, recommended PSI, and full cure windows.
            </p>
          </div>
        </div>

        <div id="application-guide-timeline" class="space-y-4 font-mono text-xs">
          <!-- Dynamically populated via JS -->
        </div>
      </div>

    </div>
  </div>
{% endif %}

{% schema %}
{
  "name": "Mixing Calculator",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_calculator",
      "label": "Enable Mixing Calculator",
      "default": true
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Calculator Heading",
      "default": "TDS MIXING MATRIX & PROJECT VOLUME ESTIMATOR"
    },
    {
      "type": "textarea",
      "id": "subheading",
      "label": "Calculator Subheading",
      "default": "Calibrated exclusively to official KromaEdge Technical Data Sheets (2 oz = 2 sq ft coverage). Select your formula below to calculate exact component volumes and digital scale tare targets."
    },
    {
      "type": "text",
      "id": "badge_text",
      "label": "Lab Badge Text",
      "default": "KROMAEDGE™ PRECISION LAB"
    },
    {
      "type": "checkbox",
      "id": "enable_scale_mode",
      "label": "Enable Digital Scale Mode Button",
      "default": true
    }
  ],
  "presets": [
    {
      "name": "Mixing Calculator"
    }
  ]
}
{% endschema %}
"""

B2B_TRADE_PORTAL_SECTION = """{% if section.settings.show_portal %}
<section class="w-full py-space-lg mb-space-xl px-margin-mobile md:px-margin bg-[#0b0b0d]">
  <div class="max-w-[1440px] mx-auto">
    <div class="relative w-full rounded border border-[#242429] p-space-xl bg-[#131315] shadow-xl overflow-hidden">
      <!-- Ambient Crimson Backing Flare -->
      <div class="absolute -bottom-16 -left-16 w-80 h-80 bg-[#dc2626]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
        <!-- Text Group -->
        <div class="flex-1 max-w-3xl space-y-space-sm">
          <div class="flex items-center gap-space-xs font-mono text-xs uppercase tracking-wider text-[#dc2626] font-bold">
            <span class="material-symbols-outlined text-[18px]">verified</span>
            <span>Commercial Accounts &amp; Authorized Applicator Network</span>
          </div>
          <h2 class="font-headline text-2xl sm:text-3xl text-white tracking-tight font-bold">
            {{ section.settings.heading | default: 'Run a Commercial Bodyshop, Custom Shop, or Paint Studio?' }}
          </h2>
          <p class="font-body text-sm sm:text-base text-neutral-300 leading-relaxed">
            {{ section.settings.subheading | default: 'Apply for Trade Tier 1/2 Pricing, Automated VAT Reverse-Charging, Net-30 Invoicing, and Priority Chemical Hazmat Allocations across all European territories.' }}
          </p>

          <!-- MOV Threshold Badges -->
          <div class="p-3 bg-[#0b0b0d] border border-[#242429] rounded font-mono text-xs text-neutral-300 space-y-1.5 my-2">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="font-bold text-amber-400 uppercase text-[11px] flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">local_shipping</span> Tier 2 Trade Stockist MOV:
              </span>
              <span class="text-white font-bold">{{ section.settings.tier2_mov | default: '£500.00 / €550.00 ex-VAT (6-Unit Case MOQ)' }}</span>
            </div>
            <div class="flex items-center justify-between flex-wrap gap-2 border-t border-[#242429] pt-1">
              <span class="font-bold text-emerald-400 uppercase text-[11px] flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">inventory_2</span> Tier 1 Regional Distributor MOV:
              </span>
              <span class="text-white font-bold">{{ section.settings.tier1_mov | default: '£2,000.00 / €2,500.00 ex-VAT (Pallet Allocation)' }}</span>
            </div>
          </div>

          <!-- Quick Perk Pills -->
          <div class="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-white">
            <span class="px-2.5 py-1 bg-[#1c1d22] rounded flex items-center gap-1.5 shadow-sm border border-[#242429]">
              <span class="material-symbols-outlined text-[14px] text-emerald-400">check_circle</span>
              Verified VAT Exemption (0% Reverse-Charge)
            </span>
            <span class="px-2.5 py-1 bg-[#1c1d22] rounded flex items-center gap-1.5 shadow-sm border border-[#242429]">
              <span class="material-symbols-outlined text-[14px] text-emerald-400">check_circle</span>
              Bulk Litre Drum Sourcing
            </span>
            <span class="px-2.5 py-1 bg-[#1c1d22] rounded flex items-center gap-1.5 shadow-sm border border-[#242429]">
              <span class="material-symbols-outlined text-[14px] text-emerald-400">check_circle</span>
              Dedicated Technical Chemist Support
            </span>
          </div>
        </div>

        <!-- Action Column -->
        <div class="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
          <a href="{{ section.settings.button_link | default: '/pages/dealers' }}" class="h-11 px-6 bg-[#dc2626] hover:bg-[#b91c1c] active:scale-[0.98] text-white font-headline text-sm uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-md transition-all font-bold border border-[#dc2626] text-center">
            <span class="material-symbols-outlined text-[18px]">domain</span>
            <span>{{ section.settings.button_label | default: 'Apply for B2B Trade Account' }}</span>
          </a>
          <button onclick="window.openTradePortalModal && window.openTradePortalModal()" class="h-11 px-6 bg-[#0b0b0d] hover:bg-[#1c1d22] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors shadow-sm border border-[#242429] font-bold cursor-pointer">
            <span>Existing Trade Login</span>
            <span class="material-symbols-outlined text-[16px]">login</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
{% endif %}

{% schema %}
{
  "name": "B2B Trade Portal",
  "settings": [
    {
      "type": "checkbox",
      "id": "show_portal",
      "label": "Show B2B Portal Banner",
      "default": true
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Banner Heading",
      "default": "Run a Commercial Bodyshop, Custom Shop, or Paint Studio?"
    },
    {
      "type": "textarea",
      "id": "subheading",
      "label": "Banner Subheading",
      "default": "Apply for Trade Tier 1/2 Pricing, Automated VAT Reverse-Charging, Net-30 Invoicing, and Priority Chemical Hazmat Allocations across all European territories."
    },
    {
      "type": "text",
      "id": "tier2_mov",
      "label": "Tier 2 Minimum Order Value (MOV)",
      "default": "£500.00 / €550.00 ex-VAT (6-Unit Case MOQ)"
    },
    {
      "type": "text",
      "id": "tier1_mov",
      "label": "Tier 1 Minimum Order Value (MOV)",
      "default": "£2,000.00 / €2,500.00 ex-VAT (Pallet Allocation)"
    },
    {
      "type": "text",
      "id": "button_label",
      "label": "Action Button Label",
      "default": "Apply for B2B Trade Account"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Action Button Link"
    }
  ],
  "presets": [
    {
      "name": "B2B Trade Portal"
    }
  ]
}
{% endschema %}
"""

FOOTER_SECTION = """<footer class="w-full bg-[#0b0b0d] border-t border-[#242429] mt-space-xl">
  <div class="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-space-xl">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
      <!-- Col 1: Brand & Logistics -->
      <div class="flex flex-col space-y-space-md">
        <div class="flex items-center gap-3">
          <img alt="{{ shop.name }}" class="h-8 md:h-9 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" src="{{ 'coast_logo_white.png' | asset_url }}" onerror="this.onerror=null; this.src='coast_logo_white.png';">
          <span class="font-headline text-headline-sm uppercase tracking-wider text-[#dc2626] font-extrabold border-l border-[#242429] pl-3 text-sm md:text-base">Europe</span>
        </div>
        <p class="font-body text-xs sm:text-sm text-neutral-400 leading-relaxed">
          {{ section.settings.brand_description | default: 'Engineered European distribution hub for professional custom automotive finishes, Iwata instrumentation, and Flake King pneumatic flake dispersal systems.' }}
        </p>
        
        <!-- Warehouse Logistics Info -->
        {% if section.settings.show_logistics_hub != false %}
        <div class="font-mono text-[11px] text-neutral-400 space-y-1 bg-[#131315] p-2.5 rounded border border-[#242429]">
          <div class="text-white font-bold uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span> Dual European Fulfillment Hubs
          </div>
          <div>🇬🇧 <strong>UK Hub:</strong> {{ settings.uk_hub_address | default: 'Unit 4 Gateway Business Park, Basildon, Essex, SS14 3WB, United Kingdom' }}</div>
          <div>🇳🇱 <strong>EU Hub:</strong> {{ settings.nl_hub_address | default: 'Distributieweg 18, 2645 EJ Delfgauw, Rotterdam Corridor, Netherlands' }}</div>
          <div class="pt-1 text-neutral-300">✉️ {{ settings.support_email | default: 'support@coastairbrush.eu' }} • 📞 {{ settings.support_phone | default: '+44 (0) 1268 765 432' }}</div>
        </div>
        {% endif %}

        <div class="flex flex-wrap items-center gap-space-sm pt-space-xs font-mono text-xs">
          <div class="px-2 py-1 bg-[#131315] border border-[#242429] rounded text-white flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#dc2626]"></span>
            <span>ADR Hazmat Certified</span>
          </div>
          <div class="px-2 py-1 bg-[#131315] border border-[#242429] rounded text-neutral-400">
            <span>ISO 9001:2015</span>
          </div>
        </div>
      </div>

      <!-- Col 2: Product Lines -->
      <div>
        <h4 class="font-mono text-xs text-white uppercase tracking-wider mb-space-md pb-space-xs border-b border-[#242429]">Product Lines</h4>
        <ul class="space-y-space-sm font-body text-xs sm:text-sm text-neutral-400">
          <li class="hover:text-white transition-colors"><a href="#dept-guns">Atawi Precision Series Guns</a></li>
          <li class="hover:text-white transition-colors"><a href="#dept-flake-king">Flake King Dry Systems</a></li>
          <li class="hover:text-white transition-colors"><a href="#dept-kroma-edge">KromaEdge Mirror Chromes</a></li>
          <li class="hover:text-white transition-colors"><a href="#dept-lumilor">LumiLor Electro-luminescent</a></li>
          <li class="hover:text-white transition-colors"><a href="#dept-clean-armor">Clean Armor UV Hard Clears</a></li>
        </ul>
      </div>

      <!-- Col 3: Safety & Compliance -->
      <div>
        <h4 class="font-mono text-xs text-white uppercase tracking-wider mb-space-md pb-space-xs border-b border-[#242429]">Safety &amp; Compliance</h4>
        <ul class="space-y-space-sm font-body text-xs sm:text-sm text-neutral-400">
          <li class="hover:text-white transition-colors"><a href="/pages/shipping">SDS &amp; Technical Library</a></li>
          <li class="hover:text-white transition-colors"><a href="/pages/shipping">ADR Road Transport Protocols</a></li>
          <li class="hover:text-white transition-colors"><a href="/pages/dealers">Authorized Distributors &amp; Bodyshops</a></li>
          <li class="hover:text-white transition-colors"><a href="/pages/privacy-policy">EU REACH &amp; Privacy Compliance</a></li>
          <li class="hover:text-white transition-colors"><a href="/pages/support">Support &amp; Dangerous Goods</a></li>
        </ul>
      </div>

      <!-- Col 4: B2B Trade & Exclusive Drops -->
      <div>
        <h4 class="font-mono text-xs text-white uppercase tracking-wider mb-space-md pb-space-xs border-b border-[#242429]">B2B Trade &amp; Exclusive Drops</h4>
        <p class="font-body text-xs sm:text-sm text-neutral-400 mb-space-sm">Register authorized studio workshops for trade allocation pricing and batch drops.</p>
        {% if section.settings.show_newsletter != false %}
        <div class="flex flex-col space-y-space-xs">
          {% form 'customer', class: 'flex gap-2' %}
            <input type="hidden" name="contact[tags]" value="prospect, newsletter">
            <input class="flex-1 h-10 px-3 bg-[#131315] border border-[#242429] rounded text-white font-mono text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#dc2626]" name="contact[email]" placeholder="pro.finisher@studio.eu" type="email" required>
            <button type="submit" class="h-10 px-4 bg-[#dc2626] text-white font-mono text-xs uppercase rounded hover:bg-[#b91c1c] transition-colors shrink-0 cursor-pointer font-bold">Subscribe</button>
          {% endform %}
          <span class="font-mono text-[10px] text-neutral-500">Weekly allocation alerts. No spam.</span>
        </div>
        {% endif %}
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="border-t border-[#242429] mt-space-xl pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-md font-mono text-xs text-neutral-400">
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span>© 2026 Coast Airbrush Europe Ltd. All rights reserved. Registered VAT GB / EU IOSS.</span>
        <a class="hover:text-white transition-colors" href="/pages/about">About Us</a>
        <a class="hover:text-white transition-colors" href="/pages/support">Support</a>
        <a class="hover:text-white transition-colors" href="/pages/privacy-policy">Privacy</a>
        <a class="hover:text-white transition-colors" href="/pages/shipping">Shipping</a>
        <a class="hover:text-white transition-colors" href="/pages/dealers">Dealers</a>
        <button onclick="window.openAdminLogin && window.openAdminLogin()" class="hover:text-amber-400 transition-colors inline-flex items-center gap-1 font-mono text-[11px] cursor-pointer"><span class="material-symbols-outlined text-[14px]">admin_panel_settings</span> admin access</button>
      </div>
      <div class="flex items-center gap-space-md font-mono text-[11px] text-neutral-400">
        <span>SECURE ENCRYPTED CHECKOUT</span>
        <span>|</span>
        <span class="text-amber-400 font-bold">UN1263 PAINT RELATED MATERIAL</span>
      </div>
    </div>
  </div>
</footer>

{% schema %}
{
  "name": "Footer",
  "settings": [
    {
      "type": "textarea",
      "id": "brand_description",
      "label": "Brand Description",
      "default": "Engineered European distribution hub for professional custom automotive finishes, Iwata instrumentation, and Flake King pneumatic flake dispersal systems."
    },
    {
      "type": "checkbox",
      "id": "show_logistics_hub",
      "label": "Show Logistics Hub Addresses",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_newsletter",
      "label": "Show Newsletter Signup",
      "default": true
    }
  ],
  "presets": [
    {
      "name": "Footer"
    }
  ]
}
{% endschema %}
"""

THEME_SECTIONS = {
    "sections/announcement-bar.liquid": ANNOUNCEMENT_BAR_SECTION,
    "sections/header.liquid": HEADER_SECTION,
    "sections/hero-carousel.liquid": HERO_CAROUSEL_SECTION,
    "sections/storefront-catalog.liquid": STOREFRONT_CATALOG_SECTION,
    "sections/mixing-calculator.liquid": MIXING_CALCULATOR_SECTION,
    "sections/b2b-trade-portal.liquid": B2B_TRADE_PORTAL_SECTION,
    "sections/footer.liquid": FOOTER_SECTION
}

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

    assert p1 != -1 and p2 != -1 and p3 != -1 and p4 != -1 and p5 != -1 and pend != -1, f"Snippet markers missing in index.html: p1={p1}, p2={p2}, p3={p3}, p4={p4}, p5={p5}, pend={pend}"

    raw_snippets = {
        "snippets/header-and-departments.liquid": html[p1:p2].rstrip() + "\n",
        "snippets/storefront-catalog.liquid": html[p2:p3].rstrip() + "\n",
        "snippets/tab-views.liquid": html[p3:p4].rstrip() + "\n",
        "snippets/admin-views.liquid": html[p4:p5].rstrip() + "\n",
        "snippets/modals-and-drawers.liquid": html[p5:pend].rstrip() + "\n"
    }

    snippets = {k: transform_html_for_liquid(v) for k, v in raw_snippets.items()}

    # Add content pages as snippets
    snippets["snippets/page-about.liquid"] = extract_content_page("about.html")
    snippets["snippets/page-support.liquid"] = extract_content_page("support.html")
    snippets["snippets/page-shipping.liquid"] = extract_content_page("shipping.html")
    snippets["snippets/page-privacy.liquid"] = extract_content_page("privacy.html")
    snippets["snippets/page-dealers.liquid"] = extract_content_page("dealers.html")
    snippets["snippets/page-product.liquid"] = extract_content_page("product.html")

    return snippets

def main():
    print(f"Bundling Shopify theme from: {ROOT_DIR}")
    snippets = extract_snippets()
    bundle_code = build_bundle()
    theme_assets, content_media = get_theme_and_media_assets()

    with open(os.path.join(ROOT_DIR, "css", "styles.css"), "r", encoding="utf-8") as f:
        styles_css = f.read()
    with open(os.path.join(ROOT_DIR, "data", "full_ecom_catalog.js"), "r", encoding="utf-8") as f:
        catalog_js = f.read()

    # 1. Build Ultra-Light Theme Zip (coast-airbrush-eu-shopify-theme.zip)
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

                # Strip out obsolete templates/index.liquid in favor of OS 2.0 templates/index.json
                if fname == "templates/index.liquid":
                    print("Stripping obsolete templates/index.liquid from theme zip")
                    continue

                written_files.add(fname)
                if fname == "config/settings_schema.json":
                    zout.writestr(item, SETTINGS_SCHEMA_JSON)
                elif fname == "layout/password.liquid":
                    zout.writestr(item, PASSWORD_LAYOUT_LIQUID)
                elif fname in snippets:
                    zout.writestr(item, snippets[fname])
                elif fname in PAGE_TEMPLATES:
                    zout.writestr(item, PAGE_TEMPLATES[fname])
                elif fname in THEME_SECTIONS:
                    zout.writestr(item, THEME_SECTIONS[fname])
                elif fname == "assets/coast-storefront-bundle.js":
                    zout.writestr(item, bundle_code)
                elif fname == "assets/styles.css":
                    zout.writestr(item, styles_css)
                elif fname == "assets/full_ecom_catalog.js":
                    zout.writestr(item, catalog_js)
                elif fname == "layout/theme.liquid":
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
                    print(f"Added new snippet to theme zip: {snip_path}")

            # Add newly created templates
            for tmpl_path, tmpl_content in PAGE_TEMPLATES.items():
                if tmpl_path not in written_files:
                    zout.writestr(tmpl_path, tmpl_content)
                    written_files.add(tmpl_path)
                    print(f"Added new template to theme zip: {tmpl_path}")

            # Add newly created sections
            for sec_path, sec_content in THEME_SECTIONS.items():
                if sec_path not in written_files:
                    zout.writestr(sec_path, sec_content)
                    written_files.add(sec_path)
                    print(f"Added new section to theme zip: {sec_path}")

            # Add core theme assets (logos, favicon)
            for zip_path, file_path in theme_assets.items():
                if zip_path not in written_files:
                    with open(file_path, "rb") as img_f:
                        zout.writestr(zip_path, img_f.read())
                    written_files.add(zip_path)
                    print(f"Added core theme asset: {zip_path}")

            # Ensure sections directory is represented
            if "sections/.gitkeep" not in written_files:
                zout.writestr("sections/.gitkeep", "")
                written_files.add("sections/.gitkeep")
                print("Added sections/.gitkeep to theme zip")

    os.replace(temp_zip, THEME_ZIP)
    theme_sz = os.path.getsize(THEME_ZIP)
    print(f"Theme successfully updated: {THEME_ZIP} ({theme_sz / 1024:.1f} KB / {theme_sz / (1024*1024):.2f} MB)")

    # 2. Build Companion Media Package for Shopify Admin > Content > Files
    media_zip_temp = MEDIA_ZIP + ".tmp"
    with zipfile.ZipFile(media_zip_temp, "w", zipfile.ZIP_DEFLATED) as mz:
        for filename, filepath in sorted(content_media.items()):
            mz.write(filepath, filename)

    os.replace(media_zip_temp, MEDIA_ZIP)
    media_sz = os.path.getsize(MEDIA_ZIP)
    print(f"Media files package created: {MEDIA_ZIP} ({len(content_media)} files, {media_sz / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    main()
