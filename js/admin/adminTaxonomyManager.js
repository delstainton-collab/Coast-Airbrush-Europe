export const DEFAULT_TAXONOMY_CONFIG = {
  departments: [
    {
      id: "dept-spray-equipment",
      name: "Spray Equipment",
      icon: "precision_manufacturing",
      description: "Professional airbrushes, automotive spray guns, and dry flake dispersal equipment",
      categories: ["Dry Metal Flake Guns", "Flake King Gun Accessories", "Airbrushes", "Spray Guns", "Striping Brushes & Pinstriping"]
    },
    {
      id: "dept-paints-coatings",
      name: "Paints & Coatings",
      icon: "format_paint",
      description: "Solvent and waterborne primers, basecoats, clears, candies, and special effect paint systems",
      categories: ["Mirror Chrome Systems", "Dedicated Clearcoats", "Basecoats & Binders", "Solvent Primers", "Solvent Basecoats", "Waterborne Primers", "Waterborne Basecoats"]
    },
    {
      id: "dept-flakes-special-fx",
      name: "Flakes & Special FX",
      icon: "auto_awesome",
      description: "Solvent-proof dry metal flakes, color-shifting pigments, pearls, and leafing materials",
      categories: ["Dry Metal Flake (Glitter)", "Candy Color Flakes", "Kromatic Shift Flakes", "Specialty & Show Krome", "Pearls & Chameleons", "Gold & Metal Leaf"]
    },
    {
      id: "dept-workstations-jigs",
      name: "Workstations, Stands & Jigs",
      icon: "handyman",
      description: "Modular workpiece holding jigs, magnetic holders, studio lighting rigs, and base stands",
      categories: ["Work-Holding Jigs", "Tool & Airbrush Holders", "Tool Bars & Lighting Rigs", "Base Stands & Easels", "Fixings, Knobs & Hardware"]
    },
    {
      id: "dept-masking-prep",
      name: "Masking & Prep",
      icon: "content_cut",
      description: "Fine line precision tapes, surface degreasers, and surface preparation consumables",
      categories: ["Masking Products", "Fine Line Masking Tapes", "Surface Cleaners & Degreasers", "Abrasives & Scuff Pads"]
    }
  ]
};

export class AdminTaxonomyManager {
  constructor(adminController) {
    this.admin = adminController;
  }

  get config() {
    return this.admin.config;
  }

  getTaxonomy() {
    if (!this.config.taxonomy || !Array.isArray(this.config.taxonomy.departments)) {
      this.config.taxonomy = JSON.parse(JSON.stringify(DEFAULT_TAXONOMY_CONFIG));
      this.admin.saveConfig();
    }
    return this.config.taxonomy;
  }

  getDepartments() {
    return this.getTaxonomy().departments;
  }

  getDepartment(deptId) {
    return this.getDepartments().find(d => d.id === deptId || d.name.toLowerCase() === (deptId || '').toLowerCase());
  }

  saveDepartment(deptData) {
    const tax = this.getTaxonomy();
    if (!deptData.id) {
      deptData.id = 'dept-' + deptData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const idx = tax.departments.findIndex(d => d.id === deptData.id || d.name.toLowerCase() === deptData.name.toLowerCase());
    if (idx >= 0) {
      tax.departments[idx] = {
        ...tax.departments[idx],
        ...deptData,
        categories: Array.isArray(deptData.categories) ? deptData.categories : (tax.departments[idx].categories || [])
      };
    } else {
      tax.departments.push({
        id: deptData.id,
        name: deptData.name.trim(),
        icon: deptData.icon || 'category',
        description: deptData.description || '',
        categories: Array.isArray(deptData.categories) ? deptData.categories : []
      });
    }
    this.admin.saveConfig();
    return deptData;
  }

  deleteDepartment(deptId) {
    const tax = this.getTaxonomy();
    tax.departments = tax.departments.filter(d => d.id !== deptId && d.name !== deptId);
    this.admin.saveConfig();
  }

  addCategoryToDepartment(deptId, categoryName) {
    const trimmed = (categoryName || '').trim();
    if (!trimmed) return false;
    const dept = this.getDepartment(deptId);
    if (!dept) return false;
    if (!dept.categories) dept.categories = [];
    if (!dept.categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      dept.categories.push(trimmed);
      this.admin.saveConfig();
      return true;
    }
    return false;
  }

  removeCategoryFromDepartment(deptId, categoryName) {
    const dept = this.getDepartment(deptId);
    if (!dept || !dept.categories) return false;
    dept.categories = dept.categories.filter(c => c.toLowerCase() !== categoryName.toLowerCase());
    this.admin.saveConfig();
    return true;
  }

  getAllCategories() {
    const depts = this.getDepartments();
    const set = new Set();
    depts.forEach(d => {
      (d.categories || []).forEach(c => set.add(c));
    });
    return Array.from(set).sort();
  }
}
