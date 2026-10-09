export const DEFAULT_TAXONOMY_CONFIG = {
  departments: [
    {
      id: "dept-auto-paint",
      name: "Automotive & Custom Paint",
      icon: "format_paint",
      description: "Solvent paints, mirror chrome, basecoats, reducers and clears",
      categories: ["Mirror Chrome Systems", "Solvent Paints", "Dedicated Clearcoats", "Basecoats", "Reducers & Thinners"]
    },
    {
      id: "dept-special-effects",
      name: "Special Effects & Flakes",
      icon: "auto_awesome",
      description: "Dry metal flakes, holographic flakes, pearls, and kromatic pigments",
      categories: ["Dry Metal Flake (Glitter)", "Kromatic Flakes", "Iridescent Flakes", "Special Effects"]
    },
    {
      id: "dept-equipment",
      name: "Equipment & Hardware",
      icon: "precision_manufacturing",
      description: "Flake King guns, airbrushes, jigs, stands, and spray equipment",
      categories: ["Dry Metal Flake Guns", "Flake King Gun Accessories", "Workstations & Jigs", "Helmet Jigs", "Motorcycle Part Jigs", "Stands"]
    },
    {
      id: "dept-consumables",
      name: "Consumables & Prep",
      icon: "content_cut",
      description: "Fine line masking tapes, surface prep, tack cloths, and cleaners",
      categories: ["Masking Products", "Basecoats & Binders", "Surface Cleaners", "Abrasives"]
    },
    {
      id: "dept-studio",
      name: "Studio & Merchandise",
      icon: "palette",
      description: "Apparel, swag, studio tools, and instructional materials",
      categories: ["Apparel & Merch", "Studio Accessories", "Reference Guides"]
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
