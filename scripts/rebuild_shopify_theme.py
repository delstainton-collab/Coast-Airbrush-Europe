#!/usr/bin/env python3
import os, re, sys, zipfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THEME_ZIP = os.path.join(ROOT_DIR, "coast-airbrush-eu-shopify-theme.zip")

MODULE_FILES = [
    "data/hero_config.js",
    "data/kroma_edge.js",
    "data/full_ecom_catalog.js",
    "data/flake_king_tds.js",
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

def transform_html_for_liquid(html):
    def replace_url(m):
        full_path = m.group(1)
        if "Cleaned Skull Image" in full_path:
            filename = "kroma-skull-mirror.jpg"
        else:
            filename = full_path.split("/")[-1]
        return f"url('{{{{ '{filename}' | asset_url }}}}')"

    def replace_src(m):
        prefix = m.group(1)
        full_path = m.group(2)
        quote = m.group(3)
        if "Cleaned Skull Image" in full_path:
            filename = "kroma-skull-mirror.jpg"
        else:
            filename = full_path.split("/")[-1]
        return f"{prefix}{{{{ '{filename}' | asset_url }}}}{quote}"

    out = re.sub(r"url\(['\"]?((?:assets/images/|Images/)[^'\")]+)['\"]?\)", replace_url, html)
    out = re.sub(r"(src=['\"])((?:assets/images/|Images/)[^'\">]+)(['\"])", replace_src, out)
    return out

def transform_theme_liquid(content):
    content = re.sub(r"https://coastairbrush\.eu/assets/images/([a-zA-Z0-9_\-\.]+)", r"https:{{ '\1' | asset_url }}", content)
    content = re.sub(r"assets/images/([a-zA-Z0-9_\-\.]+)", r"{{ '\1' | asset_url }}", content)
    root_script = """    <script>
      window.SHOPIFY_ASSET_URL_ROOT = "{{ 'coast_logo_white.png' | asset_url | split: 'coast_logo_white.png' | first }}";
    </script>\n"""
    if "window.SHOPIFY_ASSET_URL_ROOT" not in content:
        content = content.replace("    <!-- Coast Airbrush Europe Storefront Application Engine -->", root_script + "    <!-- Coast Airbrush Europe Storefront Application Engine -->")
    return content

def get_local_image_assets():
    img_dir = os.path.join(ROOT_DIR, "assets", "images")
    found = {}
    if os.path.exists(img_dir):
        for root, dirs, files in os.walk(img_dir):
            for f in files:
                if f.startswith("."):
                    continue
                ext = os.path.splitext(f)[1].lower()
                if ext in [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"]:
                    found[f"assets/{f}"] = os.path.join(root, f)
    return found

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

    return {k: transform_html_for_liquid(v) for k, v in raw_snippets.items()}

def main():
    print(f"Bundling Shopify theme from: {ROOT_DIR}")
    snippets = extract_snippets()
    bundle_code = build_bundle()
    local_images = get_local_image_assets()
    
    with open(os.path.join(ROOT_DIR, "css", "styles.css"), "r", encoding="utf-8") as f:
        styles_css = f.read()
    with open(os.path.join(ROOT_DIR, "data", "full_ecom_catalog.js"), "r", encoding="utf-8") as f:
        catalog_js = f.read()

    written_files = set()
    temp_zip = THEME_ZIP + ".tmp"
    with zipfile.ZipFile(THEME_ZIP, "r") as zin:
        with zipfile.ZipFile(temp_zip, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                written_files.add(item.filename)
                if item.filename in snippets:
                    zout.writestr(item, snippets[item.filename])
                elif item.filename == "assets/coast-storefront-bundle.js":
                    zout.writestr(item, bundle_code)
                elif item.filename == "assets/styles.css":
                    zout.writestr(item, styles_css)
                elif item.filename == "assets/full_ecom_catalog.js":
                    zout.writestr(item, catalog_js)
                elif item.filename == "layout/theme.liquid":
                    original_theme = zin.read(item.filename).decode("utf-8")
                    zout.writestr(item, transform_theme_liquid(original_theme))
                elif item.filename in local_images:
                    with open(local_images[item.filename], "rb") as img_f:
                        zout.writestr(item, img_f.read())
                else:
                    zout.writestr(item, zin.read(item.filename))

            for zip_path, file_path in local_images.items():
                if zip_path not in written_files:
                    with open(file_path, "rb") as img_f:
                        zout.writestr(zip_path, img_f.read())
                    written_files.add(zip_path)
                    print(f"Added new asset to theme zip: {zip_path}")

    os.replace(temp_zip, THEME_ZIP)
    print(f"Theme successfully updated: {THEME_ZIP} ({os.path.getsize(THEME_ZIP) / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    main()
