#!/usr/bin/env python3
import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNIPPETS_DIR = os.path.join(ROOT_DIR, "coast-airbrush-eu-shopify-theme", "snippets")

def split_modals_and_drawers():
    orig_path = os.path.join(SNIPPETS_DIR, "modals-and-drawers.liquid")
    with open(orig_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Define the 28 modal/drawer container IDs in exact sequence
    ids = [
        ("modal-trade-portal", "modal-trade-portal"),
        ("modal-trade-account-checkout", "modal-trade-checkout"),
        ("modal-account-order-confirmed", "modal-account-order-confirmed"),
        ("modal-bundle-customizer", "modal-bundle-customizer"),
        ("modal-admin-auth", "modal-admin-auth"),
        ("modal-admin-department-edit", "modal-admin-department-edit"),
        ("modal-admin-formula-edit", "modal-admin-formula-edit"),
        ("modal-admin-product-edit", "modal-admin-product-edit"),
        ("modal-admin-gemini-preview", "modal-admin-gemini-preview"),
        ("modal-admin-hero-ai-copy", "modal-admin-hero-ai-copy"),
        ("modal-admin-hero-ai-enhancer", "modal-admin-hero-ai-enhancer"),
        ("modal-product-detail", "modal-product-detail"),
        ("modal-flake-tds", "modal-flake-tds"),
        ("modal-order-verify", "modal-order-verify"),
        ("modal-post-recipe", "modal-post-recipe"),
        ("modal-vat-invoice", "modal-vat-invoice"),
        ("modal-po", "modal-po"),
        ("drawer-mobile-filters", "drawer-mobile-filters"),
        ("drawer-shopify-cart", "drawer-shopify-cart"),
        ("modal-referral", "modal-referral"),
        ("welcome-launch-modal", "modal-welcome-launch"),
        ("modal-quick-mix", "modal-quick-mix"),
        ("modal-custom-confirm", "modal-custom-confirm"),
        ("modal-product-matrix", "modal-product-matrix"),
        ("modal-deleted-products", "modal-deleted-products"),
        ("modal-fx-update-pricing", "modal-fx-update-pricing"),
        ("modal-review-mode", "modal-review-mode"),
        ("modal-brand-story", "modal-brand-story")
    ]

    # Find starting index of each modal
    positions = []
    for elem_id, snippet_name in ids:
        # Search for div with id
        pattern = re.compile(rf'(<!--[^\n]*?-->\s*\n\s*)?<div\s+id=[\"\']{elem_id}[\"\']')
        m = pattern.search(text)
        if not m:
            # Try without preceding comment
            m = re.search(rf'<div\s+id=[\"\']{elem_id}[\"\']', text)
        assert m, f"Could not find element {elem_id} in modals-and-drawers.liquid"
        positions.append((m.start(), elem_id, snippet_name))

    positions.sort(key=lambda x: x[0])

    render_calls = []
    for i, (pos, elem_id, snippet_name) in enumerate(positions):
        next_pos = positions[i+1][0] if i + 1 < len(positions) else len(text)
        chunk = text[pos:next_pos].strip() + "\n"
        snip_file = os.path.join(SNIPPETS_DIR, f"{snippet_name}.liquid")
        with open(snip_file, "w", encoding="utf-8") as out:
            out.write(chunk)
        render_calls.append(f"{{% render '{snippet_name}' %}}")
        print(f"Created snippet {snippet_name}.liquid ({len(chunk.splitlines())} lines)")

    # Write coordinator
    coord_content = "<!-- Master Modals & Drawers Coordinator (Anti-God Monolith Modular Architecture) -->\n" + "\n".join(render_calls) + "\n"
    with open(orig_path, "w", encoding="utf-8") as out:
        out.write(coord_content)
    print(f"Updated modals-and-drawers.liquid ({len(coord_content.splitlines())} lines)")

def split_tab_views():
    orig_path = os.path.join(SNIPPETS_DIR, "tab-views.liquid")
    with open(orig_path, "r", encoding="utf-8") as f:
        text = f.read()

    views = [
        ("view-calculator", "view-calculator"),
        ("view-scale", "view-scale"),
        ("view-forum", "view-forum"),
        ("view-agent-a", "view-agent-a"),
        ("view-agent-b", "view-agent-b"),
        ("view-agent-c", "view-agent-c"),
        ("view-academy", "view-academy"),
        ("view-agent-d", "view-agent-d")
    ]

    positions = []
    for elem_id, snippet_name in views:
        pattern = re.compile(rf'(<!--[^\n]*?-->\s*\n\s*)?<div\s+id=[\"\']{elem_id}[\"\']')
        m = pattern.search(text)
        if not m:
            m = re.search(rf'<div\s+id=[\"\']{elem_id}[\"\']', text)
        assert m, f"Could not find element {elem_id} in tab-views.liquid"
        positions.append((m.start(), elem_id, snippet_name))

    positions.sort(key=lambda x: x[0])

    render_calls = []
    for i, (pos, elem_id, snippet_name) in enumerate(positions):
        next_pos = positions[i+1][0] if i + 1 < len(positions) else len(text)
        chunk = text[pos:next_pos].strip() + "\n"
        snip_file = os.path.join(SNIPPETS_DIR, f"{snippet_name}.liquid")
        with open(snip_file, "w", encoding="utf-8") as out:
            out.write(chunk)
        render_calls.append(f"{{% render '{snippet_name}' %}}")
        print(f"Created snippet {snippet_name}.liquid ({len(chunk.splitlines())} lines)")

    coord_content = "<!-- Master Tab Views Coordinator (Anti-God Monolith Modular Architecture) -->\n" + "\n".join(render_calls) + "\n"
    with open(orig_path, "w", encoding="utf-8") as out:
        out.write(coord_content)
    print(f"Updated tab-views.liquid ({len(coord_content.splitlines())} lines)")

def split_admin_views():
    orig_path = os.path.join(SNIPPETS_DIR, "admin-views.liquid")
    with open(orig_path, "r", encoding="utf-8") as f:
        text = f.read()

    panels = [
        ("admin-panel-formulas", "admin-panel-formulas"),
        ("admin-panel-preorders", "admin-panel-preorders"),
        ("admin-panel-hero", "admin-panel-hero"),
        ("admin-panel-bundles", "admin-panel-bundles"),
        ("admin-panel-printer", "admin-panel-printer"),
        ("admin-panel-hazmat", "admin-panel-hazmat"),
        ("admin-panel-ai", "admin-panel-ai"),
        ("admin-panel-taxonomy", "admin-panel-taxonomy"),
        ("admin-panel-spreadsheet", "admin-panel-spreadsheet"),
        ("admin-panel-products", "admin-panel-products"),
        ("admin-panel-brands", "admin-panel-brands"),
        ("admin-panel-email", "admin-panel-email")
    ]

    positions = []
    for elem_id, snippet_name in panels:
        pattern = re.compile(rf'(<!--[^\n]*?-->\s*\n\s*)?<div\s+id=[\"\']{elem_id}[\"\']')
        m = pattern.search(text)
        if not m:
            m = re.search(rf'<div\s+id=[\"\']{elem_id}[\"\']', text)
        assert m, f"Could not find element {elem_id} in admin-views.liquid"
        positions.append((m.start(), elem_id, snippet_name))

    positions.sort(key=lambda x: x[0])

    # Header / navigation is everything before the first panel
    first_panel_pos = positions[0][0]
    nav_chunk = text[:first_panel_pos].strip() + "\n"
    with open(os.path.join(SNIPPETS_DIR, "admin-nav-bar.liquid"), "w", encoding="utf-8") as out:
        out.write(nav_chunk)
    print(f"Created snippet admin-nav-bar.liquid ({len(nav_chunk.splitlines())} lines)")

    render_calls = ["{% render 'admin-nav-bar' %}"]
    for i, (pos, elem_id, snippet_name) in enumerate(positions):
        next_pos = positions[i+1][0] if i + 1 < len(positions) else len(text)
        # Check if the last panel has closing tags for the parent container
        chunk = text[pos:next_pos]
        if i == len(positions) - 1:
            # Strip trailing closing </div> of parent container if present
            chunk = chunk.rstrip()
            if chunk.endswith("</div>"):
                chunk = chunk[:-6].rstrip() + "\n"
        chunk = chunk.strip() + "\n"
        snip_file = os.path.join(SNIPPETS_DIR, f"{snippet_name}.liquid")
        with open(snip_file, "w", encoding="utf-8") as out:
            out.write(chunk)
        render_calls.append(f"{{% render '{snippet_name}' %}}")
        print(f"Created snippet {snippet_name}.liquid ({len(chunk.splitlines())} lines)")

    coord_content = "<!-- Master Admin Views Coordinator (Anti-God Monolith Modular Architecture) -->\n" + "\n".join(render_calls) + "\n</div>\n"
    with open(orig_path, "w", encoding="utf-8") as out:
        out.write(coord_content)
    print(f"Updated admin-views.liquid ({len(coord_content.splitlines())} lines)")

if __name__ == "__main__":
    split_modals_and_drawers()
    split_tab_views()
    split_admin_views()
