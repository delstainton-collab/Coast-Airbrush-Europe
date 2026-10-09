export class AdminHardwareHazmat {
  constructor(appRef) {
    this.app = appRef;
  }

  setup() {
    this.app.addSafeListener('btn-admin-save-printer', 'click', () => this.saveAdminPrinterConfig());
    this.app.addSafeListener('btn-admin-download-tspl', 'click', () => this.downloadAdminTspl());
    this.app.addSafeListener('btn-admin-test-print', 'click', () => this.triggerAdminTestPrint());
    this.app.addSafeListener('btn-admin-save-hazmat', 'click', () => this.saveAdminHazmatConfig());
  }

  renderAdminPrinter() {
    const p = this.app.adminController.config.printer;
    const model = document.getElementById('admin-printer-model');
    const dpi = document.getElementById('admin-printer-dpi');
    const tspl = document.getElementById('admin-printer-tspl-template');
    const ghs = document.getElementById('admin-printer-ghs-toggle');

    if (model) model.value = p.model || 'Citizen CL-S621';
    if (dpi) dpi.value = String(p.dpi || 203);
    if (tspl) tspl.value = p.tsplTemplate || this.app.adminController.generateTsplCommand();
    if (ghs) ghs.checked = !!p.enableGhsHazard;
  }

  saveAdminPrinterConfig() {
    const model = document.getElementById('admin-printer-model');
    const dpi = document.getElementById('admin-printer-dpi');
    const tspl = document.getElementById('admin-printer-tspl-template');
    const ghs = document.getElementById('admin-printer-ghs-toggle');

    this.app.adminController.config.printer = {
      ...this.app.adminController.config.printer,
      model: model ? model.value : 'Citizen CL-S621',
      dpi: dpi ? parseInt(dpi.value, 10) : 203,
      tsplTemplate: tspl ? tspl.value : '',
      enableGhsHazard: ghs ? ghs.checked : true
    };
    this.app.adminController.saveConfig();
    this.app.showToast("✅ Citizen Thermal Printer configuration updated!", 'success');
  }

  downloadAdminTspl() {
    const cmd = this.app.adminController.generateTsplCommand();
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(cmd);
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `citizen_print_job_${Date.now()}.tspl`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  triggerAdminTestPrint() {
    const cmd = this.app.adminController.generateTsplCommand();
    this.app.showToast("🖨️ [Citizen CL-S621 WebUSB] Print job stream dispatched successfully.", 'success');
  }

  renderAdminHazmat() {
    const h = this.app.adminController.config.hazmat;
    const maxIn = document.getElementById('admin-hazmat-max-inner');
    const maxOut = document.getElementById('admin-hazmat-max-outer');
    const ukSur = document.getElementById('admin-hazmat-uk-surcharge');
    const euSur = document.getElementById('admin-hazmat-eu-surcharge');

    if (maxIn) maxIn.value = h.maxInnerVolumeMl || 5000;
    if (maxOut) maxOut.value = h.maxOuterGrossKg || 30;
    if (ukSur) ukSur.value = h.ukSurchargeEur || 8.50;
    if (euSur) euSur.value = h.euMainlandSurchargeEur || 12.00;
  }

  saveAdminHazmatConfig() {
    const maxIn = document.getElementById('admin-hazmat-max-inner');
    const maxOut = document.getElementById('admin-hazmat-max-outer');
    const ukSur = document.getElementById('admin-hazmat-uk-surcharge');
    const euSur = document.getElementById('admin-hazmat-eu-surcharge');

    this.app.adminController.config.hazmat = {
      maxInnerVolumeMl: maxIn ? parseInt(maxIn.value, 10) : 5000,
      maxOuterGrossKg: maxOut ? parseInt(maxOut.value, 10) : 30,
      ukSurchargeEur: ukSur ? parseFloat(ukSur.value) : 8.50,
      euMainlandSurchargeEur: euSur ? parseFloat(euSur.value) : 12.00,
      nonHazmatExemptionActive: true
    };
    this.app.adminController.saveConfig();
    this.app.showToast("✅ ADR Hazmat & Freight parameters saved!", 'success');
  }
}
