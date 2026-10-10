// Storefront Taxonomy Filtering, Category Buttons, & Search UI Controller
// Extracted per Anti-God Monolith Architecture Skill (Laws 2 & 3)

import { MASTER_TAXONOMY, findTaxonomyCategory } from '../../data/taxonomy.js';
import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';

export class StorefrontFiltersUI {
  constructor(appRef) {
    this.app = appRef;
  }

  get activeBrandFilter() { return this.app.activeBrandFilter; }
  set activeBrandFilter(v) { this.app.activeBrandFilter = v; }

  get activeCategoryFilter() { return this.app.activeCategoryFilter; }
  set activeCategoryFilter(v) { this.app.activeCategoryFilter = v; }

  get activeFlakeSubcat() { return this.app.activeFlakeSubcat; }
  set activeFlakeSubcat(v) { this.app.activeFlakeSubcat = v; }

  get searchQuery() { return this.app.searchQuery; }
  set searchQuery(v) { this.app.searchQuery = v; }

  get activeSort() { return this.app.activeSort; }
  set activeSort(v) { this.app.activeSort = v; }

  escapeHtml(str) {
    return this.app.escapeHtml ? this.app.escapeHtml(str) : String(str || '');
  }

  matchCategory(product, catId) {
    if (!catId || catId === 'all') return true;

    // 5 Core Master Departments
    if (catId === 'spray-equipment' || catId === 'Paint & Spray Equipment' || catId === 'equipment') {
      return product.department === 'Spray Equipment' || product.departmentId === 'spray-equipment' || ['Dry Metal Flake Guns', 'Flake King Gun Accessories'].includes(product.category);
    }
    if (catId === 'paints-coatings' || catId === 'Solvent Paints' || catId === 'Water Based Paint') {
      return product.department === 'Paints & Coatings' || product.departmentId === 'paints-coatings' || ['Mirror Chrome Systems', 'Dedicated Clearcoats', 'Basecoats & Binders', 'Solvent Paints', 'Wet Products'].includes(product.category);
    }
    if (catId === 'flakes-special-fx' || catId === 'Dry Special FX Products' || catId === 'dry-special-fx') {
      return product.department === 'Flakes & Special FX' || product.departmentId === 'flakes-special-fx' || product.category === 'Dry Metal Flake (Glitter)' || product.category === 'Metal Flake';
    }
    if (catId === 'workstations-jigs' || catId === 'vsionair-all' || catId === 'Workstations & Jigs') {
      return product.department === 'Workstations, Stands & Jigs' || product.departmentId === 'workstations-jigs' || product.brand === 'VsionAir';
    }
    if (catId === 'masking-prep' || catId === 'Masking Products' || catId === 'masking-products') {
      return product.department === 'Masking & Prep' || product.departmentId === 'masking-prep' || product.category === 'Masking Products';
    }

    // Direct Chemistry Filters
    if (catId === 'chem-solvent' || catId === 'Solvent' || catId === 'solvent-chemistry') {
      return (product.chemistry || '').toLowerCase() === 'solvent';
    }
    if (catId === 'chem-water' || catId === 'Water-Based' || catId === 'waterborne' || catId === 'water-based-chemistry') {
      return (product.chemistry || '').toLowerCase() === 'water-based';
    }

    // Direct brand & category overrides for precision storefront filtering
    if (catId === 'Water-Based Basecoats' || catId === 'Waterborne Basecoats' || catId === 'wb-basecoats' || catId === 'Waterborne Base' || catId === 'Water-Based Base' || catId === 'Prime Black Water-Based Base' || catId === 'Prime Black Waterborne Base') {
      return product.subcategoryId === 'wb-basecoats' || product.subcategory === 'Water-Based Basecoats' || product.subcategory === 'Waterborne Basecoats' || (product.name && product.name.includes('FK100'));
    }
    if (catId === 'Water-Based Binders & Thinners' || catId === 'Waterborne Binders & Thinners' || catId === 'wb-binders' || catId === 'Waterborne Binders' || catId === 'Water-Based Binders' || catId === 'Waterborne Intercoats & Binders' || catId === 'Water-Based Intercoats & Binders') {
      return product.subcategoryId === 'wb-binders' || product.subcategory === 'Water-Based Binders & Thinners' || product.subcategory === 'Waterborne Binders & Thinners' || (product.name && (product.name.includes('FK50') || product.name.includes('FK55')));
    }
    if (catId === 'Basecoats & Binders' || catId === 'basecoats-binders' || catId === 'Wet Products') return product.category === 'Basecoats & Binders' || product.category === 'Wet Products';
    if (catId === 'Mirror Chrome Systems' || catId === 'mirror-chrome' || catId === 'Sprayable Chrome') return product.category === 'Mirror Chrome Systems';
    if (catId === 'Dedicated Clearcoats' || catId === 'clear-coat' || catId === 'Clearcoats') return product.category === 'Dedicated Clearcoats';
    if (catId === 'Dry Metal Flake Guns' || catId === 'dry-flake-guns') return product.category === 'Dry Metal Flake Guns';
    if (catId === 'Flake King Gun Accessories') return product.category === 'Flake King Gun Accessories';
    if (catId === 'flake-guns-all') return product.category === 'Dry Metal Flake Guns' || product.category === 'Flake King Gun Accessories';
    if (catId === 'flake-candy' || catId === 'Candy Color Flakes' || catId === 'candy') return (product.category === 'Dry Metal Flake (Glitter)' || product.department === 'Flakes & Special FX') && (product.subcategory === 'Candy Color Flakes' || (product.name || '').toLowerCase().includes('candy'));
    if (catId === 'flake-kromatic' || catId === 'Kromatic Shift Flakes' || catId === 'kromatic') return (product.category === 'Dry Metal Flake (Glitter)' || product.department === 'Flakes & Special FX') && (product.subcategory === 'Kromatic Shift Flakes' || (product.name || '').toLowerCase().includes('kromatic'));
    if (catId === 'flake-specialty' || catId === 'Specialty Flakes' || catId === 'Specialty & Show Krome' || catId === 'specialty') return (product.category === 'Dry Metal Flake (Glitter)' || product.department === 'Flakes & Special FX') && !(product.name || '').toLowerCase().includes('candy') && !(product.name || '').toLowerCase().includes('kromatic');
    if (catId === 'Dry Metal Flake (Glitter)' || catId === 'dry-flakes' || catId === 'Metal Flake' || catId === 'Metal Flakes') return product.category === 'Dry Metal Flake (Glitter)' || product.category === 'Metal Flake';
    if (catId === 'Masking Products' || catId === 'fine-line-tapes' || catId === 'Fine Line Tapes') return product.category === 'Masking Products';

    // Check MASTER_TAXONOMY first
    if (typeof findTaxonomyCategory === 'function') {
      const taxMatch = findTaxonomyCategory(catId);
      if (taxMatch) {
        const prodCat = (product.category || product.productType || product.type || '').trim().toLowerCase();
        const prodTags = Array.isArray(product.tags) ? product.tags.map(t => String(t).toLowerCase()) : [];

        if (taxMatch.type === 'subcategory') {
          if (product.subcategoryId && product.subcategoryId === taxMatch.sub.id) return true;
          if (product.subcategory && product.subcategory.toLowerCase() === taxMatch.sub.name.toLowerCase()) return true;
          return taxMatch.sub.matchValues.some(val => {
            const v = val.toLowerCase();
            return prodCat === v || prodTags.includes(v);
          });
        } else if (taxMatch.type === 'department') {
          if (product.departmentId && product.departmentId === taxMatch.dept.id) return true;
          if (product.department && product.department.toLowerCase() === taxMatch.dept.name.toLowerCase()) return true;
          return taxMatch.dept.subcategories.some(sub => {
            return sub.matchValues.some(val => {
              const v = val.toLowerCase();
              return prodCat === v || prodTags.includes(v);
            });
          });
        }
      }
    }

    if (catId === 'vsionair-all') return product.brand === 'VsionAir';
    if (catId === 'Work-Holding Jigs' || catId === 'vsionair-jigs') {
      return product.brand === 'VsionAir' && (product.category === 'Work-Holding Jigs' || ['Helmet Jigs', 'Motorcycle Part Jigs', 'Canvass Jig', 'Vsion Easel Modules', 'Car & Motorcycle Wheel Jig', 'Skateboard Jig', 'Thermal Mug Jig', 'Guitar Parts Jigs'].includes(product.category));
    }
    if (catId === 'Base Stands & Easels') return product.brand === 'VsionAir' && (product.category === 'Base Stands & Easels' || product.category === 'Stands' || product.category === 'Accessories');
    if (catId === 'Tool Bars & Lighting Rigs') return product.brand === 'VsionAir' && (product.category === 'Tool Bars & Lighting Rigs' || product.category === 'VsionAir Frame');
    if (catId === 'Tool & Airbrush Holders') return product.brand === 'VsionAir' && (product.category === 'Tool & Airbrush Holders' || product.category === 'Airbrush Specific' || product.category === 'Storage, Comfort & Environment');
    if (catId === 'Fixings, Knobs & Hardware') return product.brand === 'VsionAir' && (product.category === 'Fixings, Knobs & Hardware' || product.category === 'VsionAir Knobs' || product.category === 'VsionAir Brackets' || product.category === 'VsionAir Fasteners');
    if (catId === 'Helmet Jigs') return product.brand === 'VsionAir' && product.category === 'Helmet Jigs';
    if (catId === 'Motorcycle Part Jigs') return product.brand === 'VsionAir' && product.category === 'Motorcycle Part Jigs';
    if (catId === 'Canvass Jig') return product.brand === 'VsionAir' && (product.category === 'Canvass Jig' || product.category === 'Vsion Easel Modules');
    if (catId === 'Car & Motorcycle Wheel Jig') return product.brand === 'VsionAir' && product.category === 'Car & Motorcycle Wheel Jig';
    if (catId === 'Specialty Jigs') return product.brand === 'VsionAir' && ['Skateboard Jig', 'Thermal Mug Jig', 'Guitar Parts Jigs'].includes(product.category);
    if (catId === 'Stands') return product.brand === 'VsionAir' && (product.category === 'Stands' || product.category === 'Accessories');
    if (catId === 'Airbrush Specific') return product.brand === 'VsionAir' && product.category === 'Airbrush Specific';
    if (catId === 'Storage, Comfort & Environment') return product.brand === 'VsionAir' && product.category === 'Storage, Comfort & Environment';
    if (catId === 'VsionAir Knobs') return product.brand === 'VsionAir' && product.category === 'VsionAir Knobs';
    if (catId === 'VsionAir Brackets') return product.brand === 'VsionAir' && product.category === 'VsionAir Brackets';
    if (catId === 'VsionAir Fasteners') return product.brand === 'VsionAir' && product.category === 'VsionAir Fasteners';

    if (catId === 'flakeking-all') return product.brand === 'Flake King';
    if (catId === 'Dry Metal Flake (Glitter)' || catId === 'Metal Flake') {
      return product.category === 'Dry Metal Flake (Glitter)' || product.category === 'Metal Flake';
    }
    if (catId === 'Dry Metal Flake Guns') return product.category === 'Dry Metal Flake Guns';
    if (catId === 'Flake King Gun Accessories') return product.category === 'Flake King Gun Accessories';
    if (catId === 'flake-guns-all') return product.category === 'Dry Metal Flake Guns' || product.category === 'Flake King Gun Accessories';
    if (catId === 'Masking Products') return product.category === 'Masking Products';
    if (catId === 'Wet Products' || catId === 'Basecoats & Binders') return product.category === 'Basecoats & Binders' || product.category === 'Wet Products';

    if (catId === 'kromaedge-all') return product.brand === 'Kroma Edge';
    if (catId === 'Solvent Paints') return product.brand === 'Kroma Edge' || product.category === 'Solvent Paints';
    if (catId === 'Dedicated Clearcoats' || catId === 'Clearcoats' || catId === 'clearcoat') {
      return product.category === 'Dedicated Clearcoats' || (product.name && product.name.includes('Topcoat Clear'));
    }

    const prodCat = product.category || product.productType || product.type || '';
    if (Array.isArray(prodCat)) {
      if (prodCat.some(c => c.toLowerCase() === catId.toLowerCase() || c.toLowerCase().includes(catId.toLowerCase()))) return true;
    } else if (prodCat.toLowerCase() === catId.toLowerCase() || prodCat.toLowerCase().includes(catId.toLowerCase())) {
      return true;
    }

    const prodDept = (product.department || (this.app.getDefaultDepartmentForProduct ? this.app.getDefaultDepartmentForProduct(product) : '') || '').toLowerCase();
    if (prodDept === catId.toLowerCase()) return true;

    return false;
  }

  renderCategoryButtons() {
    const pillBar = document.getElementById('top-category-pill-bar');
    const activeBadge = document.getElementById('active-category-title-badge');
    const flakeSubcatBar = document.getElementById('flake-subcat-bar');

    const PRIMARY_DEPARTMENTS = [
      { id: "all", label: "All Products", icon: "apps", brand: "all" },
      { id: "spray-equipment", label: "Spray Equipment", icon: "precision_manufacturing", brand: "all" },
      { id: "paints-coatings", label: "Paints & Coatings", icon: "format_paint", brand: "all" },
      { id: "flakes-special-fx", label: "Flakes & Special FX", icon: "auto_awesome", brand: "Flake King" },
      { id: "workstations-jigs", label: "Workstations & Jigs", icon: "handyman", brand: "VsionAir" },
      { id: "masking-prep", label: "Fine Line Tapes", icon: "content_cut", brand: "Flake King" }
    ];

    const VSIONAIR_SUBCATS = [
      { id: "workstations-jigs", label: "All Workstations & Jigs" },
      { id: "Work-Holding Jigs", label: "Work-Holding Jigs (10)" },
      { id: "Tool & Airbrush Holders", label: "Airbrush & Tool Holders (18)" },
      { id: "Tool Bars & Lighting Rigs", label: "Lighting Rigs & Tool Bars (9)" },
      { id: "Base Stands & Easels", label: "Base Stands & Easels (7)" },
      { id: "Fixings, Knobs & Hardware", label: "Fixings, Knobs & Hardware (25)" }
    ];

    const FLAKE_SUBCATS = [
      { id: "all", label: "All Flakes" },
      { id: "candy", label: "Candy Color" },
      { id: "kromatic", label: "Kromatic" },
      { id: "specialty", label: "Specialty & Chrome" }
    ];

    const GUN_SUBCATS = [
      { id: "spray-equipment", label: "All Spray Tools" },
      { id: "Dry Metal Flake Guns", label: "Flake Guns & Kits" },
      { id: "Flake King Gun Accessories", label: "Gun Accessories & Jars" },
      { id: "flake-guns-all", label: "All Gun Hardware" }
    ];

    const PAINT_SUBCATS = [
      { id: "paints-coatings", label: "All Paints & Coatings (5)" },
      { id: "chem-water", label: "💧 Water-Based Systems (3)" },
      { id: "chem-solvent", label: "🧪 Solvent Systems (2)" }
    ];

    const getCount = (catId) => {
      let items = [...ECOM_CATALOG];
      if (this.activeBrandFilter && this.activeBrandFilter !== 'all') {
        items = items.filter(p => (p.brand || '').toLowerCase().includes(this.activeBrandFilter.toLowerCase()));
      }
      if (catId === 'all') return items.length;
      return items.filter(p => this.matchCategory(p, catId)).length;
    };

    // 1. Render Primary & Custom Department Pills
    if (pillBar) {
      let html = '';
      
      PRIMARY_DEPARTMENTS.forEach(dept => {
        if (this.activeBrandFilter !== 'all' && dept.brand !== 'all' && dept.brand.toLowerCase() !== this.activeBrandFilter.toLowerCase()) {
          return;
        }

        const count = getCount(dept.id);
        if (count === 0 && dept.id !== 'all') return;

        // Check if primary is active (or if child subcategory is active)
        const isVsionAirChild = VSIONAIR_SUBCATS.some(s => s.id === this.activeCategoryFilter) || this.activeCategoryFilter === 'vsionair-all';
        const isGunChild = GUN_SUBCATS.some(s => s.id === this.activeCategoryFilter);
        const isPaintChild = PAINT_SUBCATS.some(s => s.id === this.activeCategoryFilter);
        const isFlakeChild = (this.activeCategoryFilter === 'Dry Metal Flake (Glitter)' || this.activeCategoryFilter === 'Metal Flake');
        const isMaskingChild = (this.activeCategoryFilter === 'Masking Products');

        const isActive = (this.activeCategoryFilter === dept.id) || 
                         (dept.id === 'workstations-jigs' && isVsionAirChild) ||
                         (dept.id === 'spray-equipment' && isGunChild) ||
                         (dept.id === 'paints-coatings' && isPaintChild) ||
                         (dept.id === 'flakes-special-fx' && isFlakeChild) ||
                         (dept.id === 'masking-prep' && isMaskingChild);

        html += `
          <button type="button" data-cat-pill="${dept.id}" class="top-category-pill ${isActive ? 'active' : ''}">
            <span class="material-symbols-outlined text-[15px]">${dept.icon}</span>
            <span>${dept.label}</span>
            <span class="pill-count">${count}</span>
          </button>
        `;
      });

      // Render custom taxonomy departments if they contain products or are selected
      if (this.app.adminController && typeof this.app.adminController.getDepartments === 'function') {
        const customTaxDepts = (this.app.adminController.getDepartments() || []).filter(d => {
          return !PRIMARY_DEPARTMENTS.some(p => p.label.toLowerCase() === d.name.toLowerCase() || p.id.toLowerCase() === d.name.toLowerCase());
        });

        customTaxDepts.forEach(dept => {
          const count = getCount(dept.name);
          if (count === 0 && dept.name !== this.activeCategoryFilter) return;
          const isActive = (this.activeCategoryFilter === dept.name);
          html += `
            <button type="button" data-cat-pill="${this.escapeHtml(dept.name)}" class="top-category-pill ${isActive ? 'active' : ''}">
              <span class="material-symbols-outlined text-[15px]">${this.escapeHtml(dept.icon || 'category')}</span>
              <span>${this.escapeHtml(dept.name)}</span>
              <span class="pill-count">${count}</span>
            </button>
          `;
        });
      }

      pillBar.innerHTML = html;

      // Bind click events on pills
      pillBar.querySelectorAll('.top-category-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const catId = btn.getAttribute('data-cat-pill');
          if (catId === 'all') {
            this.activeBrandFilter = 'all';
            this.activeFlakeSubcat = 'all';
            this.searchQuery = '';
            this.setCategoryFilter('all', 'all');
          } else {
            const foundDept = PRIMARY_DEPARTMENTS.find(d => d.id === catId);
            if (foundDept && foundDept.brand !== 'all') {
              this.activeBrandFilter = foundDept.brand;
            } else {
              this.activeBrandFilter = 'all';
            }
            this.setCategoryFilter(catId);
          }
        });
      });
    }

    // 2. Render Secondary Subcategory Sub-Bar
    if (flakeSubcatBar) {
      const isFlakeSelected = this.activeCategoryFilter === 'flakes-special-fx' || this.activeCategoryFilter === 'Dry Metal Flake (Glitter)' || this.activeCategoryFilter === 'Metal Flake';
      const isVsionAirSelected = this.activeCategoryFilter === 'workstations-jigs' || this.activeCategoryFilter === 'vsionair-all' || VSIONAIR_SUBCATS.some(s => s.id === this.activeCategoryFilter);
      const isGunSelected = this.activeCategoryFilter === 'spray-equipment' || this.activeCategoryFilter === 'Dry Metal Flake Guns' || this.activeCategoryFilter === 'Flake King Gun Accessories' || this.activeCategoryFilter === 'flake-guns-all';
      const isPaintSelected = this.activeCategoryFilter === 'paints-coatings' || PAINT_SUBCATS.some(s => s.id === this.activeCategoryFilter);

      if (isFlakeSelected) {
        flakeSubcatBar.style.display = 'flex';
        flakeSubcatBar.innerHTML = FLAKE_SUBCATS.map(sub => {
          const isActive = (this.activeFlakeSubcat === sub.id) || (sub.id === 'all' && (!this.activeFlakeSubcat || this.activeFlakeSubcat === 'all'));
          return `
            <button type="button" data-sub-val="${sub.id}" class="subcat-chip ${isActive ? 'active' : ''}">
              ${sub.label}
            </button>
          `;
        }).join('');

        flakeSubcatBar.querySelectorAll('.subcat-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-sub-val');
            this.setFlakeSubcat(val);
          });
        });
      } else if (isVsionAirSelected) {
        flakeSubcatBar.style.display = 'flex';
        flakeSubcatBar.innerHTML = VSIONAIR_SUBCATS.map(sub => {
          const isActive = (this.activeCategoryFilter === sub.id);
          return `
            <button type="button" data-sub-val="${sub.id}" class="subcat-chip ${isActive ? 'active' : ''}">
              ${sub.label}
            </button>
          `;
        }).join('');

        flakeSubcatBar.querySelectorAll('.subcat-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-sub-val');
            this.activeBrandFilter = 'VsionAir';
            this.setCategoryFilter(val);
          });
        });
      } else if (isGunSelected) {
        flakeSubcatBar.style.display = 'flex';
        flakeSubcatBar.innerHTML = GUN_SUBCATS.map(sub => {
          const isActive = (this.activeCategoryFilter === sub.id);
          return `
            <button type="button" data-sub-val="${sub.id}" class="subcat-chip ${isActive ? 'active' : ''}">
              ${sub.label}
            </button>
          `;
        }).join('');

        flakeSubcatBar.querySelectorAll('.subcat-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-sub-val');
            this.activeBrandFilter = 'Flake King';
            this.setCategoryFilter(val);
          });
        });
      } else if (isPaintSelected) {
        flakeSubcatBar.style.display = 'flex';
        flakeSubcatBar.innerHTML = PAINT_SUBCATS.map(sub => {
          const isActive = (this.activeCategoryFilter === sub.id);
          return `
            <button type="button" data-sub-val="${sub.id}" class="subcat-chip ${isActive ? 'active' : ''}">
              ${sub.label}
            </button>
          `;
        }).join('');

        flakeSubcatBar.querySelectorAll('.subcat-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-sub-val');
            this.setCategoryFilter(val);
          });
        });
      } else {
        flakeSubcatBar.style.display = 'none';
        flakeSubcatBar.innerHTML = '';
      }
    }

    // 3. Update Title & Count Badge
    if (activeBadge) {
      let title = "All European Inventory";
      if (this.activeCategoryFilter === 'vsionair-all') {
        title = "VsionAir™ Workstations, Jigs & Studio Rigs";
      } else if (this.activeCategoryFilter === 'Work-Holding Jigs') {
        title = "VsionAir™ Custom Work-Holding Jigs";
      } else if (this.activeCategoryFilter === 'Base Stands & Easels') {
        title = "VsionAir™ Tri-Stand Easels & Bench Mounts";
      } else if (this.activeCategoryFilter === 'Tool Bars & Lighting Rigs') {
        title = "VsionAir™ Tool Bars, Frames & Studio Lighting";
      } else if (this.activeCategoryFilter === 'Tool & Airbrush Holders') {
        title = "VsionAir™ Magnetic Airbrush & Tool Holders";
      } else if (this.activeCategoryFilter === 'Fixings, Knobs & Hardware') {
        title = "VsionAir™ Precision Knobs, Brackets & Hardware";
      } else if (this.activeCategoryFilter === 'Solvent Paints') {
        title = "Kroma Edge™ Solvent Chrome Paint Systems";
      } else if (this.activeCategoryFilter === 'Dry Metal Flake (Glitter)') {
        title = "Flake King™ Dry Metal Flakes (Direct Gun Mount)";
      } else if (this.activeCategoryFilter === 'Dry Metal Flake Guns') {
        title = "Flake King™ Dry Flake Guns & Complete Application Kits";
      } else if (this.activeCategoryFilter === 'Flake King Gun Accessories') {
        title = "Flake King™ Gun Adapters, Lids & Replacement Parts";
      } else if (this.activeCategoryFilter === 'flake-guns-all') {
        title = "Flake King™ Guns, Accessories & Application Hardware";
      } else if (this.activeCategoryFilter === 'Masking Products') {
        title = "Flake King™ Fine Line & Specialty Masking Tapes";
      } else if (this.activeCategoryFilter === 'Basecoats & Binders') {
        title = "Flake King™ Wet Products, Resins & Clears";
      } else if (this.activeCategoryFilter !== 'all') {
        title = this.activeCategoryFilter;
      }
      activeBadge.textContent = title;
    }

    this.renderActiveFilterChips();
  }

  renderActiveFilterChips() {
    const container = document.getElementById('active-filter-chips');
    if (!container) return;

    let html = '';
    if (this.activeBrandFilter && this.activeBrandFilter !== 'all') {
      html += `
        <span class="bg-primary/20 border border-primary text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
          Brand: ${this.escapeHtml(this.activeBrandFilter)}
          <button onclick="window.paintApp.setBrandFilter('all')" class="hover:text-primary font-bold cursor-pointer">✕</button>
        </span>
      `;
    }
    if (this.activeCategoryFilter && this.activeCategoryFilter !== 'all') {
      const CATEGORY_NAMES = {
        'Solvent Paints': 'Sprayable Chrome',
        'Dry Metal Flake (Glitter)': 'Metal Flakes',
        'Dry Metal Flake Guns': 'Flake Guns & Kits',
        'Flake King Gun Accessories': 'Gun Accessories & Jars',
        'flake-guns-all': 'All Flake Hardware',
        'vsionair-all': 'Workstations & Jigs',
        'Masking Products': 'Fine Line Tapes',
        'Basecoats & Binders': 'Basecoats & Binders',
        'Wet Products': 'Basecoats & Binders'
      };
      let catLabel = CATEGORY_NAMES[this.activeCategoryFilter] || this.activeCategoryFilter;
      if (typeof findTaxonomyCategory === 'function') {
        const taxMatch = findTaxonomyCategory(this.activeCategoryFilter);
        if (taxMatch) {
          catLabel = (taxMatch.type === 'subcategory') ? `${taxMatch.dept.name} > ${taxMatch.sub.name}` : taxMatch.dept.name;
        }
      }
      html += `
        <span class="bg-primary/20 border border-primary text-white text-[10px] px-2.5 py-0.5 rounded font-mono font-bold flex items-center gap-1.5 shadow-sm">
          <span>Category: <span class="text-primary">${this.escapeHtml(catLabel)}</span></span>
          <button onclick="window.paintApp.setCategoryFilter('all')" class="hover:text-primary font-bold cursor-pointer text-xs" title="Clear Category Filter">✕</button>
        </span>
      `;
    }
    if (this.activeFlakeSubcat && this.activeFlakeSubcat !== 'all') {
      html += `
        <span class="bg-amber-950 border border-amber-500 text-amber-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
          Flake: ${this.escapeHtml(this.activeFlakeSubcat)}
          <button onclick="window.paintApp.setFlakeSubcat('all')" class="hover:text-white font-bold cursor-pointer">✕</button>
        </span>
      `;
    }
    if (this.searchQuery) {
      html += `
        <span class="bg-sky-950 border border-sky-500 text-sky-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
          Search: "${this.escapeHtml(this.searchQuery)}"
          <button onclick="window.paintApp.onSearchInput('');" class="hover:text-white font-bold cursor-pointer">✕</button>
        </span>
      `;
    }

    if ((this.activeBrandFilter && this.activeBrandFilter !== 'all') || (this.activeCategoryFilter && this.activeCategoryFilter !== 'all') || (this.activeFlakeSubcat && this.activeFlakeSubcat !== 'all') || this.searchQuery) {
      html += `
        <button onclick="window.paintApp.resetAllFilters ? window.paintApp.resetAllFilters() : null;" class="text-secondary/70 hover:text-white underline text-[10px] ml-2 font-mono uppercase cursor-pointer">Clear All</button>
      `;
    }

    container.innerHTML = html;
  }

  setCategoryFilter(catId, brandName = null) {
    this.activeCategoryFilter = catId;
    if (brandName) {
      this.activeBrandFilter = brandName;
    } else if (catId === 'all') {
      this.activeBrandFilter = 'all';
    } else if (this.activeBrandFilter && this.activeBrandFilter !== 'all') {
      // If the current active brand has no items in the newly selected category, reset brand to 'all'
      const brandHasProducts = (typeof this.app.getEffectiveProducts === 'function' ? this.app.getEffectiveProducts() : ECOM_CATALOG).some(p => 
        !p.hideFromStorefront &&
        (p.brand || '').toLowerCase().includes(this.activeBrandFilter.toLowerCase()) &&
        this.matchCategory(p, catId)
      );
      if (!brandHasProducts) {
        this.activeBrandFilter = 'all';
      }
    }

    const selectCat = document.getElementById('select-shop-category');
    if (selectCat && selectCat.value !== catId) {
      selectCat.value = catId;
    }
    const selectBrand = document.getElementById('select-shop-brand');
    if (selectBrand) {
      selectBrand.value = this.activeBrandFilter || 'all';
    }

    const brandPills = document.querySelectorAll('#brand-filter-pills .brand-pill');
    brandPills.forEach(btn => {
      const match = (btn.getAttribute('data-cat-val') === catId) || 
                    (catId === 'flake-guns-all' && btn.getAttribute('data-cat-val') === 'Dry Metal Flake Guns') ||
                    (this.activeBrandFilter === 'all' && btn.getAttribute('data-brand-val') === 'all') ||
                    (btn.getAttribute('data-brand-val') === this.activeBrandFilter);
      btn.className = match ? 'brand-pill active px-3 py-1.5 border border-primary bg-primary-container text-white font-bold transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'brand-pill px-3 py-1.5 border border-secondary bg-black/60 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer';
    });

    this.renderCategoryButtons();
    this.renderActiveFilterChips();
    this.app.renderStorefrontGrid();
  }

  setBrandFilter(brandName) {
    this.activeBrandFilter = brandName;
    const selectBrand = document.getElementById('select-shop-brand');
    if (selectBrand && selectBrand.value !== brandName) {
      selectBrand.value = brandName;
    }
    const brandPills = document.querySelectorAll('#brand-filter-pills .brand-pill');
    brandPills.forEach(btn => {
      const match = (btn.getAttribute('data-brand-val') === brandName);
      btn.className = match ? 'brand-pill active px-3 py-1.5 border border-primary bg-primary-container text-white font-bold transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'brand-pill px-3 py-1.5 border border-secondary bg-black/60 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer';
    });
    this.renderCategoryButtons();
    this.renderActiveFilterChips();
    this.app.renderStorefrontGrid();
  }

  setFlakeSubcat(subcat) {
    this.activeFlakeSubcat = subcat;
    const flakeSubcatBar = document.getElementById('flake-subcat-bar');
    if (flakeSubcatBar) {
      flakeSubcatBar.querySelectorAll('.subcat-chip').forEach(btn => {
        const val = btn.getAttribute('data-sub-val');
        btn.classList.toggle('active', val === subcat);
      });
    }
    this.renderActiveFilterChips();
    this.app.renderStorefrontGrid();
  }

  onSearchInput(query) {
    this.searchQuery = query;
    this.renderActiveFilterChips();
    this.app.renderStorefrontGrid();
  }

  setCategoryAndScroll(catId, brandName = null) {
    if (typeof window !== 'undefined' && typeof window.closeAllNavDropdowns === 'function') {
      window.closeAllNavDropdowns();
    }
    if (catId === 'all' || !brandName) {
      this.activeBrandFilter = brandName || 'all';
      this.activeFlakeSubcat = 'all';
      this.searchQuery = '';
      const searchInput = document.getElementById('input-shop-search');
      if (searchInput) searchInput.value = '';
      const storeHeaderSearch = document.getElementById('store-search-input');
      if (storeHeaderSearch) storeHeaderSearch.value = '';
      const mobileSearchInput = document.getElementById('mobile-shop-search');
      if (mobileSearchInput) mobileSearchInput.value = '';
    }
    this.setCategoryFilter(catId, brandName);
    if (document.getElementById('tab-storefront')) {
      this.app.switchTab('tab-storefront', 'view-storefront', false);
    } else if (document.getElementById('tab-ecom')) {
      this.app.switchTab('tab-ecom', 'view-ecom', false);
    }
    setTimeout(() => {
      const anchor = document.getElementById('storefront-catalog-anchor') || document.getElementById('top-category-pill-bar');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  syncShopifyCatalog() {
    if (typeof window !== 'undefined' && Array.isArray(window.SHOPIFY_CATALOG) && window.SHOPIFY_CATALOG.length > 0) {
      window.SHOPIFY_CATALOG.forEach(shopifyProd => {
        const cat = shopifyProd.category || shopifyProd.productType || shopifyProd.product_type || shopifyProd.type || '';
        const normalized = {
          ...shopifyProd,
          category: cat,
          productType: cat
        };
        const existingIdx = ECOM_CATALOG.findIndex(p => p.id === normalized.id || (p.sku && normalized.sku && p.sku === normalized.sku));
        if (existingIdx >= 0) {
          ECOM_CATALOG[existingIdx] = { ...ECOM_CATALOG[existingIdx], ...normalized };
        } else {
          ECOM_CATALOG.push(normalized);
        }
      });
    }
  }

  resetAllFilters() {
    this.activeCategoryFilter = 'all';
    this.activeBrandFilter = 'all';
    this.activeFlakeSubcat = 'all';
    this.searchQuery = '';
    const selectCat = document.getElementById('select-shop-category');
    if (selectCat) selectCat.value = 'all';
    const selectBrand = document.getElementById('select-shop-brand');
    if (selectBrand) selectBrand.value = 'all';
    const selectSort = document.getElementById('select-shop-sort');
    if (selectSort) selectSort.value = 'popular';
    const searchInput = document.getElementById('input-shop-search');
    if (searchInput) searchInput.value = '';
    const storeHeaderSearch = document.getElementById('store-search-input');
    if (storeHeaderSearch) storeHeaderSearch.value = '';
    this.renderCategoryDropdown();
    this.renderCategoryButtons();
    this.renderActiveFilterChips();
    this.app.renderStorefrontGrid();
  }

  renderCategoryDropdown() {
    this.syncShopifyCatalog();
    const selectCat = document.getElementById('select-shop-category');
    const selectBrand = document.getElementById('select-shop-brand');

    const activeProducts = (typeof this.app.getEffectiveProducts === 'function' ? this.app.getEffectiveProducts() : ECOM_CATALOG)
      .filter(p => !p.hideFromStorefront);

    // 1. Populate Category Dropdown using MASTER_TAXONOMY (GOLDEN RULE: 0-product categories are invisible)
    if (selectCat) {
      let optionsHtml = `<option value="all">ALL CATEGORIES (${activeProducts.length})</option>`;
      const categorizedProductIds = new Set();

      if (Array.isArray(MASTER_TAXONOMY)) {
        MASTER_TAXONOMY.forEach(dept => {
          const deptSubOptions = [];
          let deptTotalCount = 0;

          dept.subcategories.forEach(sub => {
            const matchingProds = activeProducts.filter(p => {
              if (p.subcategoryId) {
                return p.subcategoryId === sub.id;
              }
              if (p.subcategory && p.subcategory.toLowerCase() === sub.name.toLowerCase()) return true;
              const prodCat = (p.category || p.productType || p.type || '').trim().toLowerCase();
              const prodTags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : [];
              return sub.matchValues.some(val => {
                const v = val.toLowerCase();
                return prodCat === v || prodTags.includes(v);
              });
            });

            const count = matchingProds.length;
            // RULE: If count === 0, it is INVISIBLE until we do have products!
            if (count > 0) {
              matchingProds.forEach(p => categorizedProductIds.add(p.id || p.sku));
              deptTotalCount += count;
              const isSelected = (this.activeCategoryFilter === sub.id || this.activeCategoryFilter === sub.name);
              deptSubOptions.push(`  <option value="${sub.id}" ${isSelected ? 'selected' : ''}>${sub.name} (${count})</option>`);
            }
          });

          // Only render optgroup if the department has active products!
          if (deptSubOptions.length > 0) {
            const isDeptSelected = (this.activeCategoryFilter === dept.id);
            optionsHtml += `<optgroup label="${dept.name.toUpperCase()}">`;
            optionsHtml += `  <option value="${dept.id}" ${isDeptSelected ? 'selected' : ''}>All ${dept.name} (${deptTotalCount})</option>`;
            optionsHtml += deptSubOptions.join('\n');
            optionsHtml += `</optgroup>`;
          }
        });
      }

      // Check for dynamic / uncategorized categories from Shopify catalog
      const uncategorized = activeProducts.filter(p => !categorizedProductIds.has(p.id || p.sku));
      if (uncategorized.length > 0) {
        const uncategorizedCounts = new Map();
        uncategorized.forEach(p => {
          const cat = (p.category || p.productType || p.type || 'Other').trim();
          uncategorizedCounts.set(cat, (uncategorizedCounts.get(cat) || 0) + 1);
        });
        if (uncategorizedCounts.size > 0) {
          optionsHtml += `<optgroup label="ADDITIONAL SPECIALTIES">`;
          uncategorizedCounts.forEach((count, cat) => {
            if (count > 0) {
              const isSelected = (this.activeCategoryFilter === cat);
              optionsHtml += `  <option value="${this.escapeHtml(cat)}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(cat.toUpperCase())} (${count})</option>`;
            }
          });
          optionsHtml += `</optgroup>`;
        }
      }

      selectCat.innerHTML = optionsHtml;
      selectCat.value = this.activeCategoryFilter || 'all';
    }

    // 2. Populate Brand Dropdown (GOLDEN RULE: Only brands with > 0 products are visible)
    if (selectBrand) {
      let brandHtml = `<option value="all">ALL BRANDS (${activeProducts.length})</option>`;
      const brandCounts = new Map();
      activeProducts.forEach(p => {
        const b = (p.brand || '').trim();
        if (b) {
          brandCounts.set(b, (brandCounts.get(b) || 0) + 1);
        }
      });

      const sortedBrands = Array.from(brandCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      sortedBrands.forEach(([brandName, count]) => {
        if (count > 0) {
          const isSelected = (this.activeBrandFilter && this.activeBrandFilter.toLowerCase() === brandName.toLowerCase());
          brandHtml += `<option value="${this.escapeHtml(brandName)}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(brandName.toUpperCase())} (${count})</option>`;
        }
      });

      selectBrand.innerHTML = brandHtml;
      selectBrand.value = this.activeBrandFilter || 'all';
    }
  }

  renderCategoryPills() {
    this.syncShopifyCatalog();
    this.renderCategoryDropdown();

    const container = document.getElementById('brand-filter-pills');
    if (!container) return;

    // Remove existing dynamic or static category pills to prevent duplication
    const existingCatPills = container.querySelectorAll('button[data-cat-val]');
    existingCatPills.forEach(btn => btn.remove());

    const activeProducts = (typeof this.app.getEffectiveProducts === 'function' ? this.app.getEffectiveProducts() : ECOM_CATALOG)
      .filter(p => !p.hideFromStorefront);

    const categoryCounts = new Map();
    activeProducts.forEach(p => {
      const cat = (p.category || p.productType || p.type || '').trim();
      if (!cat) return;
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });

    categoryCounts.forEach((count, cat) => {
      if (count <= 0) return;
      const btn = document.createElement('button');
      btn.setAttribute('data-cat-val', cat);
      const isActive = (this.activeCategoryFilter === cat) || 
                      (cat === 'Dry Metal Flake Guns' && this.activeCategoryFilter === 'flake-guns-all');
      btn.className = isActive
        ? 'brand-pill active px-3 py-1.5 border border-primary bg-primary-container text-white font-bold transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
        : 'brand-pill px-3 py-1.5 border border-secondary bg-black/60 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer';
      btn.textContent = `${cat.toUpperCase()} (${count})`;
      btn.addEventListener('click', () => {
        this.activeBrandFilter = 'all';
        this.setCategoryFilter(cat);
      });
      container.appendChild(btn);
    });
  }

  setupShopFilters() {
    const searchInput = document.getElementById('input-shop-search');
    const storeHeaderSearch = document.getElementById('store-search-input');
    const sortSelect = document.getElementById('select-shop-sort');
    const selectCat = document.getElementById('select-shop-category');
    const selectBrand = document.getElementById('select-shop-brand');
    const subcatBtns = document.querySelectorAll('.flake-subcat-btn');
    const resetBtn = document.getElementById('btn-reset-filters');
    const brandPills = document.querySelectorAll('#brand-filter-pills .brand-pill');

    // Mobile specific controls
    const mobileSearchInput = document.getElementById('mobile-shop-search');
    const mobileSortSelect = document.getElementById('mobile-shop-sort');
    const mobileBrandSelect = document.getElementById('mobile-shop-brand');

    const handleSearch = (e) => {
      const q = e.target.value;
      if (searchInput && searchInput !== e.target) searchInput.value = q;
      if (mobileSearchInput && mobileSearchInput !== e.target) mobileSearchInput.value = q;
      if (storeHeaderSearch && storeHeaderSearch !== e.target) storeHeaderSearch.value = q;
      this.onSearchInput(q);
    };

    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (mobileSearchInput) mobileSearchInput.addEventListener('input', handleSearch);
    if (storeHeaderSearch) {
      storeHeaderSearch.addEventListener('input', (e) => {
        this.app.switchTab('tab-ecom', 'view-ecom');
        handleSearch(e);
      });
    }

    const handleSortChange = (e) => {
      this.activeSort = e.target.value;
      if (sortSelect && sortSelect !== e.target) sortSelect.value = this.activeSort;
      if (mobileSortSelect && mobileSortSelect !== e.target) mobileSortSelect.value = this.activeSort;
      this.app.renderStorefrontGrid();
    };

    if (sortSelect) sortSelect.addEventListener('change', handleSortChange);
    if (mobileSortSelect) mobileSortSelect.addEventListener('change', handleSortChange);

    if (selectCat) {
      selectCat.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'all') {
          this.activeBrandFilter = 'all';
          this.setCategoryFilter('all', 'all');
        } else {
          this.setCategoryFilter(val);
        }
      });
    }

    if (selectBrand) {
      selectBrand.addEventListener('change', (e) => {
        this.setBrandFilter(e.target.value);
      });
    }

    if (mobileBrandSelect) {
      mobileBrandSelect.addEventListener('change', (e) => {
        this.setBrandFilter(e.target.value);
      });
    }

    brandPills.forEach(btn => {
      btn.addEventListener('click', () => {
        const brandVal = btn.getAttribute('data-brand-val');
        const catVal = btn.getAttribute('data-cat-val');

        brandPills.forEach(b => {
          b.className = 'brand-pill px-3 py-1.5 border border-secondary bg-black/60 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer';
        });
        btn.className = 'brand-pill active px-3 py-1.5 border border-primary bg-primary-container text-white font-bold transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';

        if (catVal) {
          this.activeBrandFilter = 'all';
          this.setCategoryFilter(catVal);
        } else if (brandVal) {
          this.activeCategoryFilter = 'all';
          this.setBrandFilter(brandVal);
        }
      });
    });

    subcatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        subcatBtns.forEach(b => b.className = 'flake-subcat-btn metal-spec-plate text-[10px] uppercase cursor-pointer');
        btn.className = 'flake-subcat-btn metal-spec-plate-red text-[10px] uppercase cursor-pointer';
        const sub = btn.getAttribute('data-flake-subcat');
        this.setFlakeSubcat(sub);
      });
    });

    // Reset All Filters
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.activeBrandFilter = 'all';
        this.activeCategoryFilter = 'all';
        this.activeFlakeSubcat = 'all';
        this.searchQuery = '';
        this.activeSort = 'popular';
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'popular';
        if (mobileSortSelect) mobileSortSelect.value = 'popular';
        if (mobileBrandSelect) mobileBrandSelect.value = 'all';
        if (mobileSearchInput) mobileSearchInput.value = '';
        
        brandPills.forEach(btn => {
          const match = !btn.getAttribute('data-cat-val') && ((btn.getAttribute('data-brand-val') || 'all') === 'all');
          btn.className = match ? 'brand-pill active px-3 py-1.5 border border-primary bg-primary-container text-white font-bold transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'brand-pill px-3 py-1.5 border border-secondary bg-black/60 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer';
        });

        subcatBtns.forEach(b => {
          const match = (b.getAttribute('data-flake-subcat') || 'all') === 'all';
          b.className = match ? 'flake-subcat-btn metal-spec-plate-red text-[10px] uppercase cursor-pointer' : 'flake-subcat-btn metal-spec-plate text-[10px] uppercase cursor-pointer';
        });

        this.renderCategoryButtons();
        this.app.renderStorefrontGrid();
      });
    }
  }
}
