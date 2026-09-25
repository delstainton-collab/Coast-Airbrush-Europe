#!/usr/bin/env python3
import os, re, sys, zipfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THEME_ZIP = os.path.join(ROOT_DIR, "coast-airbrush-eu-shopify-theme.zip")

MODULE_FILES = [
    "data/hero_config.js",
    "data/kroma_edge.js",
    "data/full_ecom_catalog.js",
    "data/flake_king_tds.js",
    "data/hok_shimrin2.js",
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
    return content

def get_theme_and_media_assets():
    files_to_scan = [
        "index.html", "about.html", "support.html", "shipping.html", "privacy.html", "dealers.html",
        "css/styles.css", "data/full_ecom_catalog.js", "data/hero_config.js", "data/kroma_edge.js",
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

    body_match = re.search(r"<body[^>]*>(.*?)</body>", html, re.DOTALL)
    body_content = body_match.group(1).strip() if body_match else html

    combined = f"{style_content}\n{body_content}\n"
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
    "name": "Theme settings",
    "settings": []
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
    <link href="https://fonts.googleapis.com/css2?family=Anybody:ital,wght@0,100..900;1,100..900&family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ 'styles.css' | asset_url }}">
    <style>
      .static-bg-overlay {
        background: linear-gradient(180deg, rgba(14, 16, 16, 0.88) 0%, rgba(10, 12, 12, 0.82) 40%, rgba(8, 10, 10, 0.94) 100%),
                    url('{{ 'flake_buggy_hero.jpg' | asset_url }}') no-repeat center center fixed;
        background-size: cover;
      }
    </style>
  </head>
  <body class="static-bg-overlay bg-[#0e1010] text-white min-h-screen flex flex-col justify-between selection:bg-red-600 selection:text-white relative">
    {{ content_for_layout }}
  </body>
</html>
"""

PASSWORD_TEMPLATE_LIQUID = """<div class="w-full flex-grow flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative z-10">
  <div class="max-w-xl w-full p-6 sm:p-10 bg-[#121414]/92 backdrop-blur-xl border-2 border-neutral-400/75 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded text-center space-y-6 my-auto">
    
    <!-- Brand Logo -->
    <div class="flex justify-center">
      <img src="{{ 'coast_logo_white.png' | asset_url }}" alt="Coast Airbrush Europe" class="h-11 sm:h-13 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
    </div>
    
    <!-- Live Launch Status Badge -->
    <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-black/60 border border-red-500/60 text-red-400 font-mono text-[11px] font-bold uppercase tracking-widest shadow-sm">
      <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
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
      <div class="p-2 rounded bg-black/50 border border-neutral-700/80 text-neutral-200 flex flex-col items-center justify-center">
        <span class="text-base sm:text-lg mb-0.5">🇬🇧 🇳🇱</span>
        <span class="font-bold">UK &amp; EU Dispatch</span>
      </div>
      <div class="p-2 rounded bg-black/50 border border-neutral-700/80 text-neutral-200 flex flex-col items-center justify-center">
        <span class="text-base sm:text-lg mb-0.5">🛡️</span>
        <span class="font-bold">REACH Compliant</span>
      </div>
      <div class="p-2 rounded bg-black/50 border border-neutral-700/80 text-neutral-200 flex flex-col items-center justify-center">
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
            <input type="text" name="contact[first_name]" id="VIPFirstName" class="w-full bg-[#0c0e0e] border border-neutral-600 px-3.5 py-2.5 text-xs font-mono text-white rounded focus:border-red-500 focus:outline-none placeholder:text-neutral-600" placeholder="e.g. Marcus" required>
          </div>
          <div>
            <label for="VIPLastName" class="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1">Last Name</label>
            <input type="text" name="contact[last_name]" id="VIPLastName" class="w-full bg-[#0c0e0e] border border-neutral-600 px-3.5 py-2.5 text-xs font-mono text-white rounded focus:border-red-500 focus:outline-none placeholder:text-neutral-600" placeholder="e.g. Vance" required>
          </div>
        </div>

        <div>
          <label for="VIPEmail" class="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1">Email Address</label>
          <input type="email" name="contact[email]" id="VIPEmail" class="w-full bg-[#0c0e0e] border border-neutral-600 px-3.5 py-2.5 text-xs font-mono text-white rounded focus:border-red-500 focus:outline-none placeholder:text-neutral-600" placeholder="painter@customshop.com" required>
        </div>

        <div>
          <label for="VIPRole" class="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1">Painter / Trade Focus (Optional)</label>
          <select name="contact[note]" id="VIPRole" class="w-full bg-[#0c0e0e] border border-neutral-600 px-3.5 py-2.5 text-xs font-mono text-white rounded focus:border-red-500 focus:outline-none">
            <option value="Custom Automotive &amp; Motorcycle Painting">Custom Automotive &amp; Motorcycle Painting</option>
            <option value="Airbrush &amp; Fine Art Refinishing">Airbrush &amp; Fine Art Refinishing</option>
            <option value="Commercial Body Shop / Trade Dealer">Commercial Body Shop / Trade Dealer</option>
            <option value="Model / Scale &amp; Hobbyist">Model / Scale &amp; Hobbyist</option>
          </select>
        </div>

        <button type="submit" class="w-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-mono font-bold text-xs uppercase py-3.5 px-6 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wider">
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

PAGE_TEMPLATES = {
    "templates/password.liquid": PASSWORD_TEMPLATE_LIQUID,
    "templates/page.about.liquid": "{% render 'page-about' %}\n",
    "templates/page.support.liquid": "{% render 'page-support' %}\n",
    "templates/page.shipping.liquid": "{% render 'page-shipping' %}\n",
    "templates/page.privacy.liquid": "{% render 'page-privacy' %}\n",
    "templates/page.dealers.liquid": "{% render 'page-dealers' %}\n",
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
    p2 = html.find(m2)
    p3 = html.find(m3)
    p4 = html.find(m4)
    p5 = html.find(m5)
    pend = html.find(end_marker)

    assert p1 != -1 and p2 != -1 and p3 != -1 and p4 != -1 and p5 != -1 and pend != -1, "Snippet markers missing in index.html"

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

                written_files.add(fname)
                if fname == "config/settings_schema.json":
                    zout.writestr(item, SETTINGS_SCHEMA_JSON)
                elif fname == "layout/password.liquid":
                    zout.writestr(item, PASSWORD_LAYOUT_LIQUID)
                elif fname in snippets:
                    zout.writestr(item, snippets[fname])
                elif fname in PAGE_TEMPLATES:
                    zout.writestr(item, PAGE_TEMPLATES[fname])
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
