// Admin AI Specialists Operations
// Extracted per Anti-God Monolith Architecture Skill (Laws 1 & 2)

export class AdminAiSpecialists {
  constructor(appRef) {
    this.app = appRef;
  }

  renderAdminAI() {
    const ai = this.app.adminController.config.aiAgents;
    const aDisc = document.getElementById('admin-ai-agent-a-discount');
    const aStyle = document.getElementById('admin-ai-agent-a-style');
    const bWa = document.getElementById('admin-ai-agent-b-whatsapp');
    const bSms = document.getElementById('admin-ai-agent-b-sms');
    const cSched = document.getElementById('admin-ai-agent-c-schedule');
    const cTags = document.getElementById('admin-ai-agent-c-tags');
    const dBuf = document.getElementById('admin-ai-agent-d-buffer');
    const dOcean = document.getElementById('admin-ai-agent-d-ocean');

    if (aDisc) aDisc.value = ai.agentA.maxDiscountAllowed || 15;
    if (aStyle) aStyle.value = ai.agentA.temperaturePrompt || 'Strict Technical Precision';
    if (bWa) bWa.checked = !!ai.agentB.enableWhatsApp;
    if (bSms) bSms.checked = !!ai.agentB.enableSMS;
    if (cSched) cSched.value = ai.agentC.postSchedule || '09:00, 14:00, 19:00 CET';
    if (cTags) cTags.value = (ai.agentC.monitoredTags || []).join(', ');
    if (dBuf) dBuf.value = ai.agentD.safetyBufferDays || 30;
    if (dOcean) dOcean.value = ai.agentD.japanOceanThresholdUnits || 150;
  }

  saveAdminAiConfig() {
    const aDisc = document.getElementById('admin-ai-agent-a-discount');
    const aStyle = document.getElementById('admin-ai-agent-a-style');
    const bWa = document.getElementById('admin-ai-agent-b-whatsapp');
    const bSms = document.getElementById('admin-ai-agent-b-sms');
    const cSched = document.getElementById('admin-ai-agent-c-schedule');
    const cTags = document.getElementById('admin-ai-agent-c-tags');
    const dBuf = document.getElementById('admin-ai-agent-d-buffer');
    const dOcean = document.getElementById('admin-ai-agent-d-ocean');

    this.app.adminController.config.aiAgents = {
      agentA: {
        name: "Master Painter AI",
        maxDiscountAllowed: aDisc ? parseInt(aDisc.value, 10) : 15,
        temperaturePrompt: aStyle ? aStyle.value : 'Strict Technical Precision'
      },
      agentB: {
        name: "Order Concierge AI",
        enableWhatsApp: bWa ? bWa.checked : true,
        enableSMS: bSms ? bSms.checked : true
      },
      agentC: {
        name: "Kustom Marketer AI",
        postSchedule: cSched ? cSched.value : '09:00, 14:00, 19:00 CET',
        monitoredTags: cTags ? cTags.value.split(',').map(t => t.trim()) : []
      },
      agentD: {
        name: "Stock Guru AI",
        safetyBufferDays: dBuf ? parseInt(dBuf.value, 10) : 30,
        japanOceanThresholdUnits: dOcean ? parseInt(dOcean.value, 10) : 150
      }
    };
    this.app.adminController.saveConfig();
    this.app.showToast("✅ AI Specialist Agent thresholds updated!", 'success');
  }
}
