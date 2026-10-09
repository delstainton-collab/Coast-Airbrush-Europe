// Storefront Autonomous AI Agents UI Controller (Dave / Agent A, Agent B, Agent C, Agent D)
// Extracted per Anti-God Monolith Architecture Skill (Laws 1, 2, and 3)

import { MILESTONE_STAGES } from '../agentB.js';

export class StorefrontAiAgentsUI {
  constructor(appRef) {
    this.app = appRef;
    this.selectedTrackingOrder = null;
    this.selectedEvalSku = 'AOS-WB-1001';
    this.selectedEvalQty = 50;
    this.handleDaveFloatingSend = null;
  }

  get agentA() { return this.app.agentA; }
  get agentB() { return this.app.agentB; }
  get agentC() { return this.app.agentC; }
  get agentD() { return this.app.agentD; }

  getAssetUrl(path) {
    return this.app.getAssetUrl ? this.app.getAssetUrl(path) : path;
  }

  setupAgentC() {
    const dmSendBtn = document.getElementById('btn-social-dm-send');
    const dmInput = document.getElementById('input-social-dm');
    const dmChatBox = document.getElementById('social-dm-chat');

    const handleDmSend = (customText) => {
      const text = (customText || (dmInput ? dmInput.value : '')).trim();
      if (!text) return;

      const userMsg = document.createElement('div');
      userMsg.className = 'agent-msg user';
      userMsg.innerHTML = `
        <div class="agent-avatar"><span class="material-symbols-outlined text-[16px]">person</span></div>
        <div class="agent-bubble text-xs">${text}</div>
      `;
      dmChatBox.appendChild(userMsg);
      if (dmInput) dmInput.value = '';

      const res = this.agentC.processSocialDM(text);

      const aiMsg = document.createElement('div');
      aiMsg.className = 'agent-msg ai';
      aiMsg.innerHTML = `
        <div class="agent-avatar">🚀</div>
        <div class="agent-bubble text-xs">
          <div class="whitespace-pre-line leading-relaxed">${res.replyMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
          <div class="mt-3 pt-2 border-t border-secondary flex justify-between items-center">
            <span class="text-[11px] font-bold text-rose-400">Featured: $${res.featuredItem.priceUSD.toFixed(2)}</span>
            <button class="btn-dm-cart-add mech-btn-primary !text-[11px] !py-1 !px-2.5 !bg-rose-600 hover:!bg-rose-700">
              🛒 Add to Cart Drawer
            </button>
          </div>
        </div>
      `;

      const addBtn = aiMsg.querySelector('.btn-dm-cart-add');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          this.agentC.addSocialItemToCart(res.featuredItem);
          this.app.openCartDrawer();
        });
      }

      dmChatBox.appendChild(aiMsg);
      dmChatBox.scrollTop = dmChatBox.scrollHeight;
    };

    if (dmSendBtn) dmSendBtn.addEventListener('click', () => handleDmSend());
    if (dmInput) {
      dmInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleDmSend();
      });
    }

    document.querySelectorAll('.btn-quick-dm').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-msg');
        handleDmSend(msg);
      });
    });

    this.renderSocialCampaigns();
  }

  renderSocialCampaigns() {
    const container = document.getElementById('social-campaigns-container');
    if (!container) return;
    container.innerHTML = '';

    this.agentC.campaigns.forEach(camp => {
      const card = document.createElement('div');
      card.className = 'industrial-card p-5 flex flex-col md:flex-row gap-5';
      card.innerHTML = `
        <div class="w-full md:w-44 h-36 bg-surface-dim border border-secondary overflow-hidden flex-shrink-0 relative">
          <video src="${camp.localVideo || ''}" poster="${camp.videoUrl}" class="w-full h-full object-cover" controls preload="metadata" playsinline></video>
          <div class="absolute top-2 left-2 bg-surface/90 text-rose-400 text-[10px] font-mono font-bold px-1.5 py-0.5 border border-rose-500 pointer-events-none">
            ${camp.platform}
          </div>
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start">
              <h5 class="font-headline text-base uppercase text-on-surface">${camp.title}</h5>
              <span class="font-label-xs text-[10px] text-secondary font-mono">${camp.scheduledTime}</span>
            </div>
            <p class="font-mono text-xs text-rose-300 font-bold my-1">"${camp.hook}"</p>
            <p class="font-body-md text-xs text-secondary leading-relaxed">${camp.caption}</p>
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${camp.hashtags.map(h => `<span class="font-mono text-[10px] text-accent-cyan">${h}</span>`).join(' ')}
            </div>
          </div>
          <div class="flex justify-between items-center border-t border-secondary pt-3 mt-3">
            <div class="font-mono text-[11px] text-secondary">
              Est. Views: <strong class="text-on-surface">${camp.projectedViews}</strong> • CVR: <strong class="text-emerald-400">${camp.estConversionRate}</strong>
            </div>
            <button class="btn-preview-cart-link mech-btn-secondary !text-xs !py-1 !px-2.5">
              🔗 Copy 1-Click Link
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-preview-cart-link').addEventListener('click', () => {
        const link = `https://coastairbrush.eu/cart/add?id=${camp.featuredSku}&quantity=1`;
        navigator.clipboard?.writeText(link);
        this.app.showToast("⚡ Direct 1-Click Cart Link Copied to Clipboard!", "success");
      });

      container.appendChild(card);
    });
  }

  renderDaiveFormattedMessage(markdown) {
    if (!markdown) return '';

    let text = markdown
      .replace(/\r/g, '')
      .replace(/`([^`]+)`/g, '<code class="bg-[#090d0e] text-[#38bdf8] px-1.5 py-0.5 rounded font-mono text-[11px] border border-cyan-500/20 font-bold">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
        if (url.startsWith('#')) {
          const prodId = url.substring(1);
          return `<a href="javascript:void(0)" onclick="window.openDetailModal && window.openDetailModal('${prodId}')" class="inline-flex items-center gap-1 text-[#38bdf8] font-bold underline hover:text-white transition-colors cursor-pointer" title="View product details">${label} ↗</a>`;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[#38bdf8] font-bold underline hover:text-white transition-colors">${label} ↗</a>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em class="text-neutral-300 italic">$2</em>$3');

    const rawLines = text.split('\n');
    const outputBlocks = [];
    let currentStepCard = false;

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i].trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        if (currentStepCard) {
          outputBlocks[outputBlocks.length - 1] += '</div>';
          currentStepCard = false;
        }
        continue;
      }

      // Heading: ### Heading
      if (trimmed.startsWith('### ')) {
        if (currentStepCard) {
          outputBlocks[outputBlocks.length - 1] += '</div>';
          currentStepCard = false;
        }
        const headingText = trimmed.replace(/^###\s+/, '');
        outputBlocks.push(
          `<div class="daive-heading">${headingText}</div>`
        );
        continue;
      }

      // Numbered Step: 1. **Title**: or 1. Title
      const stepMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (stepMatch) {
        if (currentStepCard) {
          outputBlocks[outputBlocks.length - 1] += '</div>';
          currentStepCard = false;
        }
        const stepNum = stepMatch[1];
        const stepContent = stepMatch[2];
        outputBlocks.push(
          `<div class="daive-step-card">` +
            `<div class="font-bold text-white text-xs mb-1.5 flex items-start gap-2">` +
              `<span class="bg-[#38bdf8]/20 text-[#38bdf8] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0">${stepNum}</span>` +
              `<div class="flex-1">${stepContent}</div>` +
            `</div>`
        );
        currentStepCard = true;
        continue;
      }

      // Indented sub-bullet: (2+ spaces or tab followed by • or - or 1.)
      const isSubItem = (line.startsWith('   ') || line.startsWith('  ') || line.startsWith('\t'));
      if (isSubItem && (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed))) {
        let subContent = trimmed.replace(/^[•\-]\s*/, '');
        let subBadge = '<span class="text-[#38bdf8]/70 text-[9px] mt-1 flex-shrink-0">▪</span>';
        
        const subNumMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (subNumMatch) {
          subBadge = `<span class="bg-white/10 text-neutral-300 px-1 py-0.2 rounded text-[9px] font-mono font-bold flex-shrink-0">${subNumMatch[1]}</span>`;
          subContent = subNumMatch[2];
        }

        const subBulletHtml = 
          `<div class="daive-sub-bullet">` +
            `${subBadge}` +
            `<div>${subContent}</div>` +
          `</div>`;

        if (currentStepCard) {
          outputBlocks[outputBlocks.length - 1] += subBulletHtml;
        } else {
          outputBlocks.push(subBulletHtml);
        }
        continue;
      }

      if (currentStepCard) {
        outputBlocks[outputBlocks.length - 1] += '</div>';
        currentStepCard = false;
      }

      // Top-level bullet: • or -
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
        const bulletContent = trimmed.replace(/^[•\-]\s*/, '');
        
        // Check if it's a key-value spec with an actual value: e.g. • **SKU**: VAX-JG-SKBD
        const kvMatch = bulletContent.match(/^<strong class="text-white font-semibold">([^<]+)<\/strong>:\s*(.+)$/);
        if (kvMatch && kvMatch[2].trim().length > 0) {
          const key = kvMatch[1];
          const val = kvMatch[2];
          outputBlocks.push(
            `<div class="daive-spec-row">` +
              `<span class="text-neutral-400 font-semibold">• ${key}:</span>` +
              `<span class="text-white font-bold text-right">${val}</span>` +
            `</div>`
          );
        } else {
          outputBlocks.push(
            `<div class="daive-bullet">` +
              `<span class="text-[#38bdf8] text-sm mt-[-1px] flex-shrink-0">•</span>` +
              `<div>${bulletContent}</div>` +
            `</div>`
          );
        }
        continue;
      }

      // Callout / Tip / Action: starts with 👉 or *(Tip:
      if (trimmed.startsWith('👉') || trimmed.startsWith('<em>(') || (trimmed.startsWith('<em>') && trimmed.includes('Tip:')) || (trimmed.startsWith('<em>') && trimmed.endsWith('</em>') && trimmed.includes('?'))) {
        outputBlocks.push(
          `<div class="daive-callout">` +
            trimmed +
          `</div>`
        );
        continue;
      }

      // Normal paragraph text
      outputBlocks.push(
        `<p class="daive-paragraph">` +
          trimmed +
        `</p>`
      );
    }

    if (currentStepCard) {
      outputBlocks[outputBlocks.length - 1] += '</div>';
      currentStepCard = false;
    }

    return outputBlocks.join('');
  }

  setupAgentA() {
    const sendBtn = document.getElementById('btn-agent-a-send') || document.getElementById('btn-agent-send');
    const queryInput = document.getElementById('input-agent-a-query') || document.getElementById('input-agent-query');
    const tempSelect = document.getElementById('select-agent-temp') || document.getElementById('agent-shop-temp');
    const msgContainer = document.getElementById('agent-a-messages') || document.getElementById('agent-chat-messages');

    const handleSend = () => {
      const query = (queryInput ? queryInput.value : '').trim();
      if (!query) return;

      const tempC = parseInt(tempSelect ? tempSelect.value : '21', 10);

      const userMsg = document.createElement('div');
      userMsg.className = 'agent-msg user';
      userMsg.innerHTML = `
        <div class="agent-avatar"><span class="material-symbols-outlined text-[18px]">person</span></div>
        <div class="agent-bubble">${query}</div>
      `;
      msgContainer.appendChild(userMsg);
      if (queryInput) queryInput.value = '';

      const result = this.agentA.consult(query, tempC);
      const htmlBody = this.renderDaiveFormattedMessage(result.markdownResponse);

      let actionButtons = '';
      if (result.matchedProduct) {
        const p = result.matchedProduct;
        const priceGbp = p.priceGbp ? `£${Number(p.priceGbp).toFixed(2)}` : '';
        const priceEur = p.priceEur ? `€${Number(p.priceEur).toFixed(2)}` : '';
        const priceStr = [priceGbp, priceEur].filter(Boolean).join(' / ');
        const inStockText = p.inStock ? '<span style="color:#4ade80; font-weight:bold;">● In Stock</span>' : (p.isPreOrder ? '<span style="color:#f59e0b; font-weight:bold;">● Pre-Order</span>' : '<span style="color:#94a3b8;">Available to Order</span>');

        actionButtons = `
          <div class="mt-3 p-3 bg-surface-dim border border-accent-cyan/50 rounded flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              ${p.image ? `<img src="${this.getAssetUrl(p.image)}" alt="${p.name}" style="width:52px; height:52px; object-fit:contain; background:#0c0f10; border:1px solid #333; border-radius:4px; padding:2px;">` : ''}
              <div>
                <div style="color:#fff; font-weight:bold; font-size:13px;">${p.name}</div>
                <div style="font-size:11px; color:#aaa; font-family:monospace; margin-top:2px;">SKU: ${p.sku || p.id} | <span style="color:#38bdf8; font-weight:bold;">${priceStr}</span> | ${inStockText}</div>
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick="window.openDetailModal && window.openDetailModal('${p.id}')" class="mech-btn-secondary !text-xs !py-1.5 !px-3 cursor-pointer">
                🔍 View Details
              </button>
              <button onclick="window.paintApp && window.paintApp.addProductToCartById && window.paintApp.addProductToCartById('${p.id}')" class="mech-btn-primary !text-xs !py-1.5 !px-3 cursor-pointer">
                🛒 Add to Cart
              </button>
            </div>
          </div>
        `;
      } else if (result.kit) {
        actionButtons = `
          <div class="kit-action-box mt-3 p-3 bg-surface-dim border border-primary-container flex justify-between items-center flex-wrap gap-2">
            <div>
              <strong style="color: #38bdf8; font-size: 13px;">${result.kit.title}</strong>
              <div style="font-size: 11px; color: #c6c6c6;">${result.kit.items.length} Pre-Configured Items Included</div>
            </div>
            <button class="btn-add-kit-to-cart mech-btn-primary !text-xs !py-1.5 !px-3">
              🛒 Add Kit to Shopify Cart
            </button>
          </div>
        `;
      }

      const aiMsg = document.createElement('div');
      aiMsg.className = 'agent-msg ai';
      aiMsg.innerHTML = `
        <div class="agent-avatar">🤖</div>
        <div class="agent-bubble">
          ${htmlBody}
          ${actionButtons}
        </div>
      `;

      const addKitBtn = aiMsg.querySelector('.btn-add-kit-to-cart');
      if (addKitBtn && result.kit) {
        addKitBtn.addEventListener('click', () => {
          this.agentA.addKitToShopifyCart(result.kit);
          this.app.openCartDrawer();
        });
      }

      msgContainer.appendChild(aiMsg);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (queryInput) {
      queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }

    document.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (queryInput && prompt) {
          queryInput.value = prompt;
          handleSend();
        }
      });
    });

    // Wire Floating Dave Assistant Widget
    const floatSendBtn = document.getElementById('btn-floating-dave-send');
    const floatInput = document.getElementById('input-floating-dave');
    const floatMessages = document.getElementById('floating-dave-messages');

    this.handleDaveFloatingSend = () => {
      const q = (floatInput ? floatInput.value : '').trim();
      if (!q) return;

      const userBubble = document.createElement('div');
      userBubble.className = 'bg-surface-container border-l-2 border-accent-cyan p-3 text-right self-end';
      userBubble.innerHTML = `<p class="text-on-surface font-bold">${q}</p>`;
      if (floatMessages) floatMessages.appendChild(userBubble);
      if (floatInput) floatInput.value = '';

      const res = this.agentA.consult(q, 21);
      const cleanHtml = this.renderDaiveFormattedMessage(res.markdownResponse);

      let productCardHtml = '';
      if (res.matchedProduct) {
        const p = res.matchedProduct;
        const priceGbp = p.priceGbp ? `£${Number(p.priceGbp).toFixed(2)}` : '';
        const priceEur = p.priceEur ? `€${Number(p.priceEur).toFixed(2)}` : '';
        const priceStr = [priceGbp, priceEur].filter(Boolean).join(' / ');
        const inStockBadge = p.inStock ? '<span style="color:#4ade80; font-weight:bold;">● In Stock</span>' : (p.isPreOrder ? '<span style="color:#f59e0b; font-weight:bold;">● Pre-Order</span>' : '<span style="color:#94a3b8;">Available</span>');

        productCardHtml = `
          <div class="mt-2 p-2 bg-[#0a0c0d] border border-primary-container/70 rounded flex flex-col gap-2">
            <div class="flex items-center gap-2">
              ${p.image ? `<img src="${this.getAssetUrl(p.image)}" alt="${p.name}" class="w-11 h-11 object-contain bg-black border border-white/10 rounded p-0.5 flex-shrink-0">` : ''}
              <div class="flex-1 min-w-0">
                <div class="font-bold text-[11px] text-white truncate" title="${p.name}">${p.name}</div>
                <div class="text-[10px] text-neutral-300 font-mono mt-0.5"><span class="text-accent-cyan font-bold">${priceStr}</span> • ${inStockBadge}</div>
                <div class="text-[9px] text-neutral-400 font-mono">SKU: ${p.sku || p.id}</div>
              </div>
            </div>
            <div class="flex gap-1.5 pt-1.5 border-t border-white/10">
              <button onclick="window.openDetailModal && window.openDetailModal('${p.id}')" class="flex-1 bg-surface-container hover:bg-surface-container-high text-white text-[10px] py-1 px-2 rounded border border-white/20 text-center font-bold cursor-pointer transition-colors">
                🔍 View Product
              </button>
              <button onclick="window.paintApp && window.paintApp.addProductToCartById && window.paintApp.addProductToCartById('${p.id}')" class="flex-1 bg-primary text-black hover:bg-primary-hover text-[10px] py-1 px-2 rounded font-bold text-center cursor-pointer transition-colors">
                🛒 Add to Cart
              </button>
            </div>
          </div>
        `;
      }

      const daveBubble = document.createElement('div');
      daveBubble.className = 'bg-[#121618] border-l-2 border-[#38bdf8] p-3 flex flex-col gap-2 rounded-r shadow-md';
      daveBubble.innerHTML = `
        <div class="text-neutral-200 leading-relaxed text-xs">
          ${cleanHtml}
        </div>
        ${productCardHtml}
        ${res.kit && !res.matchedProduct ? `
          <button class="btn-float-add-kit mech-btn-primary !text-[11px] !py-1 !px-2 self-start mt-1">
            🛒 Add ${res.kit.title.split(' ')[0]} Kit to Cart
          </button>
        ` : ''}
      `;

      const addBtn = daveBubble.querySelector('.btn-float-add-kit');
      if (addBtn && res.kit) {
        addBtn.addEventListener('click', () => {
          this.agentA.addKitToShopifyCart(res.kit);
          this.app.openCartDrawer();
        });
      }

      if (floatMessages) {
        floatMessages.appendChild(daveBubble);
        floatMessages.scrollTop = floatMessages.scrollHeight;
      }
    };

    if (floatSendBtn) floatSendBtn.addEventListener('click', this.handleDaveFloatingSend);
    if (floatInput) {
      floatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleDaveFloatingSend();
        }
      });
    }
  }

  setupAgentB() {
    const trackBtn = document.getElementById('btn-track-order');
    const searchInput = document.getElementById('input-order-search');
    const conciergeSendBtn = document.getElementById('btn-concierge-send');
    const conciergeInput = document.getElementById('input-concierge-chat');
    const conciergeMsgContainer = document.getElementById('concierge-chat-messages');

    document.querySelectorAll('.btn-select-order-demo').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order');
        if (searchInput) searchInput.value = orderId;
        const order = this.agentB.getOrder(orderId);
        if (order) {
          this.selectedTrackingOrder = order;
          this.renderOrderTracking(order);
        }
      });
    });

    const handleTrack = () => {
      const term = (searchInput ? searchInput.value : '').trim();
      const order = this.agentB.getOrder(term);
      if (order) {
        this.selectedTrackingOrder = order;
        this.renderOrderTracking(order);
      } else {
        this.app.showToast(`Order "${term}" not found. Try demo orders: EU-10492, UK-88214, or EU-10505.`, "warning");
      }
    };

    if (trackBtn) trackBtn.addEventListener('click', handleTrack);
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleTrack();
      });
    }

    this.app.addSafeListener('btn-simulate-whatsapp-alert', 'click', () => {
      if (!this.selectedTrackingOrder) return;
      const notif = this.agentB.generateNotification(this.selectedTrackingOrder, 'whatsapp');
      const badge = document.getElementById('notif-badge');
      const time = document.getElementById('notif-time');
      const content = document.getElementById('notif-content');
      if (badge) badge.innerHTML = `📱 WhatsApp Notification Stream (${notif.recipient})`;
      if (time) time.innerHTML = `Dispatched: Just Now • Status: ${this.selectedTrackingOrder.currentStage.toUpperCase()}`;
      if (content) content.innerText = `${notif.header}\n\n${notif.body}`;
    });

    this.app.addSafeListener('btn-view-vat-invoice', 'click', () => {
      if (this.selectedTrackingOrder) {
        this.openVatInvoiceModal(this.selectedTrackingOrder);
      }
    });

    this.app.addSafeListener('btn-close-vat-modal', 'click', () => {
      const modal = document.getElementById('modal-vat-invoice');
      if (modal) modal.classList.remove('active');
    });

    const handleConciergeSend = () => {
      const query = (conciergeInput ? conciergeInput.value : '').trim();
      if (!query) return;

      const userMsg = document.createElement('div');
      userMsg.className = 'agent-msg user';
      userMsg.innerHTML = `
        <div class="agent-avatar"><span class="material-symbols-outlined text-[16px]">person</span></div>
        <div class="agent-bubble text-xs">${query}</div>
      `;
      conciergeMsgContainer.appendChild(userMsg);
      if (conciergeInput) conciergeInput.value = '';

      const res = this.agentB.answerCustomerQuery(query);

      const aiMsg = document.createElement('div');
      aiMsg.className = 'agent-msg ai';
      aiMsg.innerHTML = `
        <div class="agent-avatar">📦</div>
        <div class="agent-bubble text-xs">
          <div class="whitespace-pre-line">${res.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-surface text-primary px-1 rounded font-mono">$1</code>')}</div>
        </div>
      `;
      conciergeMsgContainer.appendChild(aiMsg);
      conciergeMsgContainer.scrollTop = conciergeMsgContainer.scrollHeight;

      if (res.order) {
        this.selectedTrackingOrder = res.order;
        this.renderOrderTracking(res.order);
      }
    };

    if (conciergeSendBtn) conciergeSendBtn.addEventListener('click', handleConciergeSend);
    if (conciergeInput) {
      conciergeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleConciergeSend();
      });
    }

    this.renderOrderTracking(this.selectedTrackingOrder);
  }

  renderOrderTracking(order) {
    if (!order) return;

    const idBadge = document.getElementById('order-id-badge');
    const custName = document.getElementById('order-customer-name');
    const carrierName = document.getElementById('order-carrier-name');
    const trackNum = document.getElementById('order-tracking-num');
    const batchId = document.getElementById('order-batch-id');
    const estDelivery = document.getElementById('order-est-delivery');
    const adrTag = document.getElementById('order-adr-tag');

    if (idBadge) idBadge.innerText = `ORDER #${order.orderId}`;
    if (custName) custName.innerText = order.customerName;
    if (carrierName) carrierName.innerText = order.carrier;
    if (trackNum) trackNum.innerText = order.trackingNumber;
    if (batchId) batchId.innerText = order.batchId;
    if (estDelivery) estDelivery.innerText = order.estimatedDelivery;
    if (adrTag) adrTag.innerText = "UN1263 Class 3 (ADR LQ)";

    const timelineEl = document.getElementById('order-milestone-timeline');
    if (timelineEl) {
      timelineEl.innerHTML = '';
      const currentIdx = MILESTONE_STAGES.findIndex(s => s.key === order.currentStage);

      MILESTONE_STAGES.forEach((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isActive = idx === currentIdx;
        const statusClass = isCompleted ? 'completed' : isActive ? 'active' : '';

        const stepEl = document.createElement('div');
        stepEl.className = `milestone-step ${statusClass}`;
        stepEl.innerHTML = `
          <div class="milestone-icon">
            <span class="material-symbols-outlined">${stage.icon}</span>
          </div>
          <div class="milestone-label">${stage.label}</div>
        `;
        timelineEl.appendChild(stepEl);
      });
    }

    const notif = this.agentB.generateNotification(order, 'whatsapp');
    const badge = document.getElementById('notif-badge');
    const time = document.getElementById('notif-time');
    const content = document.getElementById('notif-content');
    if (badge) badge.innerHTML = `📱 WhatsApp Notification Stream (${notif.recipient})`;
    if (time) time.innerHTML = `Dispatched: Live Simulated • Milestone: ${order.currentStage.replace(/_/g, ' ').toUpperCase()}`;
    if (content) content.innerText = `${notif.header}\n\n${notif.body}`;
  }

  openVatInvoiceModal(order) {
    const invoice = this.agentB.generateVatInvoice(order);
    const container = document.getElementById('invoice-printable-content');
    const modal = document.getElementById('modal-vat-invoice');
    if (!invoice || !container || !modal) return;

    let itemsHtml = invoice.lineItems.map(item => `
      <tr>
        <td style="font-family:monospace; font-weight:700;">${item.sku}</td>
        <td>${item.description}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:right;">$${item.unitPriceUSD.toFixed(2)}</td>
        <td style="text-align:right; font-weight:700;">$${item.totalPriceUSD.toFixed(2)}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:16px; margin-bottom:16px;">
        <div>
          <h2 style="font-size:22px; font-weight:900; color:#b91c1c; margin:0;">COAST AIRBRUSH EUROPE B.V.</h2>
          <p style="font-size:11px; color:#475569; margin:2px 0 0 0;">Official European Master Distributor • Hazardous Chemicals Registry</p>
          <p style="font-size:11px; color:#475569; margin:0;">${invoice.seller.address}</p>
          <p style="font-size:11px; color:#475569; margin:0;"><strong>VAT / OSS:</strong> ${invoice.seller.vatId} | <strong>EORI:</strong> ${invoice.seller.eori}</p>
        </div>
        <div style="text-align:right;">
          <h3 style="font-size:18px; font-weight:800; margin:0;">TAX INVOICE</h3>
          <p style="font-size:12px; font-weight:700; color:#0284c7; margin:2px 0 0 0;">${invoice.invoiceNumber}</p>
          <p style="font-size:11px; color:#64748b; margin:0;">Date: ${invoice.invoiceDate}</p>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; background:#f8fafc; padding:12px; border-radius:4px; margin-bottom:16px;">
        <div>
          <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; display:block;">Invoice To (Buyer):</span>
          <strong style="font-size:13px;">${invoice.buyer.name}</strong>
          <p style="font-size:11px; color:#334155; margin:2px 0 0 0;">${invoice.buyer.address}</p>
          <p style="font-size:11px; color:#334155; margin:0;"><strong>Customer VAT/Tax ID:</strong> ${invoice.buyer.vatNumber}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Description</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit (USD)</th>
            <th style="text-align:right;">Total (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        <div style="max-width:55%; background:#fff1f2; border:1px solid #fda4af; padding:10px; border-radius:4px;">
          <span style="font-size:10px; font-weight:800; color:#be123c; text-transform:uppercase; display:block;">⚠️ ADR Hazmat Transport Compliance:</span>
          <p style="font-size:10px; color:#881337; font-family:monospace; margin:2px 0 0 0;">${invoice.hazmatDeclaration}</p>
        </div>

        <div style="width:38%; text-align:right;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span>Subtotal (Net):</span>
            <span>$${invoice.totals.subtotalUSD}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span>VAT (${invoice.totals.vatRatePercent}):</span>
            <span>$${invoice.totals.vatAmountUSD}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:800; border-top:2px solid #0f172a; padding-top:6px; margin-top:6px;">
            <span>Total USD:</span>
            <span>$${invoice.totals.totalUSD}</span>
          </div>
          <div style="font-size:12px; font-weight:700; color:#0284c7; margin-top:2px;">
            ≈ €${invoice.totals.totalEUR} EUR / £${invoice.totals.totalGBP} GBP
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  setupAgentD() {
    this.app.addSafeListener('select-eval-qty', 'change', (e) => {
      this.selectedEvalQty = parseInt(e.target.value, 10);
      this.renderSourcingEvaluation(this.selectedEvalSku, this.selectedEvalQty);
    });

    this.app.addSafeListener('btn-draft-po-japan', 'click', () => {
      this.openPurchaseOrderModal(1);
    });

    this.app.addSafeListener('btn-draft-po-usa', 'click', () => {
      this.openPurchaseOrderModal(2);
    });

    this.app.addSafeListener('btn-close-po-modal', 'click', () => {
      const modal = document.getElementById('modal-po');
      if (modal) modal.classList.remove('active');
    });

    this.app.addSafeListener('btn-export-po-katana', 'click', () => {
      const po = this.agentD.generatePurchaseOrder(1);
      const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(po, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', jsonStr);
      a.setAttribute('download', `${po.poNumber}_katana_xero.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    this.renderInventoryDashboard();
  }

  renderInventoryDashboard() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    let totalNL = 0;
    let totalUK = 0;
    let totalUS = 0;

    this.agentD.items.forEach(item => {
      totalNL += item.stockNL;
      totalUK += item.stockUK;
      totalUS += item.stockUS_Buffer;

      const lean = this.agentD.calculateLeanMetrics(item);
      const isSelected = item.sku === this.selectedEvalSku;

      const row = document.createElement('tr');
      row.className = `border-b border-secondary hover:bg-surface-dim cursor-pointer transition-colors ${isSelected ? 'bg-surface-dim' : ''}`;
      row.innerHTML = `
        <td class="py-3 pr-2">
          <div class="font-bold text-on-surface">${item.name}</div>
          <div class="text-[10px] text-secondary">SKU: ${item.sku} • HS: ${item.hsCode}</div>
        </td>
        <td class="py-3 text-center text-on-surface font-bold">${lean.totalEUStock}</td>
        <td class="py-3 text-center text-secondary">${item.dailyVelocity}</td>
        <td class="py-3 text-center text-on-surface">${lean.daysOfCover}d</td>
        <td class="py-3 text-right">
          <span style="background:${lean.statusColor}20; color:${lean.statusColor}; border:1px solid ${lean.statusColor}60;" class="px-2 py-0.5 rounded text-[10px] font-bold">
            ${lean.status.replace(/_/g, ' ')}
          </span>
        </td>
      `;

      row.addEventListener('click', () => {
        this.selectedEvalSku = item.sku;
        this.renderInventoryDashboard();
        this.renderSourcingEvaluation(item.sku, this.selectedEvalQty);
      });

      tableBody.appendChild(row);
    });

    // Update Top Overview Stats
    const statNL = document.getElementById('stat-nl-stock');
    const statUK = document.getElementById('stat-uk-stock');
    const statUS = document.getElementById('stat-us-stock');
    if (statNL) statNL.innerText = `${totalNL} Units Active`;
    if (statUK) statUK.innerText = `${totalUK} Units Active`;
    if (statUS) statUS.innerText = `${totalUS} Units Standby`;

    this.renderSourcingEvaluation(this.selectedEvalSku, this.selectedEvalQty);
  }

  renderSourcingEvaluation(sku, qty = 50) {
    const item = this.agentD.items.find(i => i.sku === sku) || this.agentD.items[0];
    if (!item) return;

    const evalData = this.agentD.evaluateSourcingScenario(item, qty);

    const skuBadge = document.getElementById('eval-sku-badge');
    const recBox = document.getElementById('sourcing-recommendation-box');
    const landedJP = document.getElementById('eval-landed-jp');
    const marginJP = document.getElementById('eval-margin-jp');
    const landedUS = document.getElementById('eval-landed-us');
    const marginUS = document.getElementById('eval-margin-us');

    if (skuBadge) skuBadge.innerText = `${item.sku} (${item.brand})`;
    if (recBox) {
      recBox.innerHTML = `
        <div style="font-weight:700; color:${evalData.recommendedScenario === 1 ? '#34d399' : '#38bdf8'}; margin-bottom:4px;">
          AGENT D RECOMMENDATION: ${evalData.recommendedScenario === 1 ? 'SCENARIO 1 (SIGNAL JAPAN BULK OCEAN)' : 'SCENARIO 2 (COAST USA AIR BUFFER)'}
        </div>
        <div>${evalData.rationale}</div>
      `;
    }

    if (landedJP) landedJP.innerText = `€${evalData.scenario1_Japan.landedCostEUR}`;
    if (marginJP) marginJP.innerText = `${evalData.scenario1_Japan.grossMarginPercent}%`;
    if (landedUS) landedUS.innerText = `€${evalData.scenario2_USA.landedCostEUR}`;
    if (marginUS) marginUS.innerText = `${evalData.scenario2_USA.grossMarginPercent}%`;
  }

  openPurchaseOrderModal(scenarioNumber = 1) {
    const po = this.agentD.generatePurchaseOrder(scenarioNumber);
    const container = document.getElementById('po-printable-content');
    const modal = document.getElementById('modal-po');
    if (!po || !container || !modal) return;

    let linesHtml = po.lines.map(line => `
      <tr>
        <td style="font-family:monospace; font-weight:700;">${line.sku}</td>
        <td>${line.name}</td>
        <td style="font-family:monospace; text-align:center;">${line.hsCode}</td>
        <td style="text-align:center; font-weight:700;">${line.qty}</td>
        <td style="text-align:right;">$${line.unitFOB_USD.toFixed(2)}</td>
        <td style="text-align:right; font-weight:700;">$${line.totalFOB_USD}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:16px; margin-bottom:16px;">
        <div>
          <h2 style="font-size:20px; font-weight:900; color:#b91c1c; margin:0;">COAST AIRBRUSH EUROPE B.V.</h2>
          <p style="font-size:11px; color:#475569; margin:2px 0 0 0;">${po.shipTo.name}</p>
          <p style="font-size:11px; color:#475569; margin:0;">${po.shipTo.address} • EORI: ${po.shipTo.eori}</p>
        </div>
        <div style="text-align:right;">
          <h3 style="font-size:18px; font-weight:800; margin:0;">PURCHASE ORDER</h3>
          <p style="font-size:13px; font-weight:700; color:#b45309; margin:2px 0 0 0;">${po.poNumber}</p>
          <p style="font-size:11px; color:#64748b; margin:0;">Date: ${po.date}</p>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; background:#f8fafc; padding:12px; border-radius:4px; margin-bottom:16px;">
        <div>
          <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; display:block;">Vendor / Supplier:</span>
          <strong style="font-size:13px;">${po.vendor.name}</strong>
          <p style="font-size:11px; color:#334155; margin:2px 0 0 0;">${po.vendor.address}</p>
          ${po.vendor.rexNumber ? `<p style="font-size:11px; color:#047857; margin:0;"><strong>REX Statement ID:</strong> ${po.vendor.rexNumber}</p>` : ''}
        </div>
        <div style="text-align:right;">
          <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; display:block;">Procurement Scenario:</span>
          <span style="font-size:11px; font-weight:700; color:#0f172a;">${po.scenario}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Description</th>
            <th style="text-align:center;">HS Code</th>
            <th style="text-align:center;">Order Qty</th>
            <th style="text-align:right;">FOB Unit (USD)</th>
            <th style="text-align:right;">Total (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${linesHtml}
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        <div style="max-width:55%; background:#ecfdf5; border:1px solid #a7f3d0; padding:10px; border-radius:4px;">
          <span style="font-size:10px; font-weight:800; color:#047857; text-transform:uppercase; display:block;">📜 Customs & Origin Declaration:</span>
          <p style="font-size:10px; color:#065f46; font-family:monospace; margin:2px 0 0 0;">${po.customsDeclaration}</p>
        </div>

        <div style="width:38%; text-align:right;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span>Total FOB USD:</span>
            <span style="font-weight:700;">$${po.summary.totalFOB_USD}</span>
          </div>
          ${po.summary.totalJPY ? `
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; color:#047857;">
            <span>Equivalent JPY:</span>
            <span style="font-weight:700;">¥${po.summary.totalJPY}</span>
          </div>` : ''}
          <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:800; border-top:2px solid #0f172a; padding-top:6px; margin-top:6px;">
            <span>Est. Landed EUR:</span>
            <span>€${po.summary.totalLandedEUR}</span>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }
}
