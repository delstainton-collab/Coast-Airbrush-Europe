import { isKromaEdgeSolventItem, registerKromaEuWaitlist } from './kromaEuWaitlist.js';

export class CartDrawerUI {
  constructor(appRef) {
    this.app = appRef;
  }

  setup() {
    const drawer = document.getElementById('drawer-shopify-cart');
    const closeBtn = document.getElementById('btn-close-cart-drawer');
    const openBtn = document.getElementById('btn-open-cart-drawer');
    const headerCartBtn = document.getElementById('btn-header-cart');
    const toggleCartBtn = document.getElementById('btn-toggle-cart-drawer');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCartDrawer());
    if (openBtn) openBtn.addEventListener('click', () => this.openCartDrawer());
    if (headerCartBtn) headerCartBtn.addEventListener('click', () => this.openCartDrawer());
    if (toggleCartBtn) toggleCartBtn.addEventListener('click', () => this.openCartDrawer());
    if (drawer) {
      drawer.addEventListener('click', (e) => {
        if (e.target === drawer) this.closeCartDrawer();
      });
    }

    const btnShopify = document.getElementById('btn-drawer-checkout-shopify');
    if (btnShopify) {
      btnShopify.addEventListener('click', () => this.checkoutShopify());
    }

    const btnCloseTradeAccount = document.getElementById('btn-close-trade-account-modal');
    if (btnCloseTradeAccount) {
      btnCloseTradeAccount.addEventListener('click', () => this.closeTradeAccountModal());
    }

    const btnSubmitAccount = document.getElementById('btn-submit-account-order');
    if (btnSubmitAccount) {
      btnSubmitAccount.addEventListener('click', () => this.submitTradeAccountOrder());
    }

    const btnCloseConfirmed = document.getElementById('btn-close-order-confirmed');
    if (btnCloseConfirmed) {
      btnCloseConfirmed.addEventListener('click', () => this.closeOrderConfirmedModal());
    }

    const btnCloseReview = document.getElementById('btn-close-review-modal');
    if (btnCloseReview) {
      btnCloseReview.addEventListener('click', () => this.closeReviewModeModal());
    }
  }

  openCartDrawer() {
    const drawer = document.getElementById('drawer-shopify-cart');
    if (drawer) drawer.classList.add('active');
  }

  closeCartDrawer() {
    const drawer = document.getElementById('drawer-shopify-cart');
    if (drawer) drawer.classList.remove('active');
  }

  renderCartSummary(rawSummary) {
    const country = this.app.euLocalization.getCountry();
    const summary = this.app.shopifyCartManager.getCartSummary(country.currency);

    const countBadge = document.getElementById('header-cart-count');
    const subtotalEl = document.getElementById('cart-drawer-subtotal');
    const vatLabelEl = document.getElementById('cart-drawer-vat-label');
    const vatAmountEl = document.getElementById('cart-drawer-vat-amount');
    const carrierEl = document.getElementById('cart-drawer-carrier');
    const carrierLabelEl = document.getElementById('cart-drawer-carrier-label');
    const shippingAmountEl = document.getElementById('cart-drawer-shipping-amount');
    const smallOrderRowEl = document.getElementById('cart-drawer-small-order-row');
    const smallOrderLabelEl = document.getElementById('cart-drawer-small-order-label');
    const smallOrderAmountEl = document.getElementById('cart-drawer-small-order-amount');
    const savingsRowEl = document.getElementById('cart-drawer-savings-row');
    const savingsAmountEl = document.getElementById('cart-drawer-savings-amount');
    const ddpRowEl = document.getElementById('cart-drawer-ddp-row');
    const ddpAmountEl = document.getElementById('cart-drawer-ddp-amount');
    const totalEl = document.getElementById('cart-drawer-total');
    const convertedTotalEl = document.getElementById('cart-drawer-converted-total');
    const itemsContainer = document.getElementById('cart-drawer-items');

    // Calculate small order packaging fee in EUR for tax engine
    const feeEur = summary.hasSmallOrderFee ? (country.currency === 'GBP' ? summary.smallOrderFee / 0.85 : summary.smallOrderFee) : 0.0;
    const taxData = this.app.euLocalization.calculateTaxAndTotal(summary.subtotal, { smallOrderFeeEur: feeEur });

    if (countBadge) countBadge.textContent = summary.itemCount;
    if (subtotalEl) {
      subtotalEl.textContent = country.currency === 'EUR'
        ? `€${taxData.subtotalEur.toFixed(2)}`
        : `${country.symbol}${taxData.subtotalLocal.toFixed(2)}`;
    }
    
    if (vatLabelEl) {
      if (taxData.isUK) {
        vatLabelEl.textContent = `UK VAT (20% HMRC):`;
      } else if (taxData.isVatExempt) {
        vatLabelEl.textContent = `EU VAT (0% Reverse-Charge):`;
      } else {
        vatLabelEl.textContent = `EU VAT (${taxData.vatRatePercent}% ${country.code} IOSS/DDP):`;
      }
    }

    if (vatAmountEl) {
      vatAmountEl.textContent = country.currency === 'EUR'
        ? `€${taxData.vatAmountEur.toFixed(2)}`
        : `${country.symbol}${taxData.vatAmountLocal.toFixed(2)}`;
    }

    // Small Order Consumables & Packaging Surcharge Row
    if (smallOrderRowEl && smallOrderAmountEl) {
      if (summary.hasSmallOrderFee) {
        smallOrderRowEl.classList.remove('hidden');
        if (smallOrderLabelEl) smallOrderLabelEl.textContent = 'Small Order Packaging Prep:';
        smallOrderAmountEl.textContent = `${country.symbol}${summary.smallOrderFee.toFixed(2)}`;
        smallOrderAmountEl.className = 'font-mono text-amber-400 font-bold';
      } else if (summary.tier === 'retail' && summary.itemCount > 0 && summary.isMovMet) {
        smallOrderRowEl.classList.remove('hidden');
        if (smallOrderLabelEl) smallOrderLabelEl.textContent = 'Small Order Packaging Prep:';
        smallOrderAmountEl.textContent = 'WAIVED (FREE)';
        smallOrderAmountEl.className = 'font-mono text-emerald-400 font-bold';
      } else {
        smallOrderRowEl.classList.add('hidden');
      }
    }

    // Wholesale Trade Margin Savings Row
    if (savingsRowEl && savingsAmountEl) {
      if (summary.isB2B && summary.totalSavings > 0) {
        savingsRowEl.classList.remove('hidden');
        savingsAmountEl.textContent = `-${country.symbol}${summary.totalSavings.toFixed(2)}`;
      } else {
        savingsRowEl.classList.add('hidden');
      }
    }

    if (shippingAmountEl) {
      if (taxData.shippingBaseEur === 0 || (summary.isB2B && summary.isMovMet)) {
        shippingAmountEl.textContent = 'FREE';
        shippingAmountEl.className = 'font-mono text-emerald-400 font-bold';
      } else {
        shippingAmountEl.textContent = country.currency === 'EUR'
          ? `€${taxData.shippingBaseEur.toFixed(2)}`
          : `${country.symbol}${this.app.euLocalization.convertPrice(taxData.shippingBaseEur).toFixed(2)}`;
        shippingAmountEl.className = 'font-mono text-on-surface';
      }
    }

    if (ddpRowEl && ddpAmountEl) {
      if (taxData.ddpAdminFeeEur > 0 && !summary.isB2B) {
        ddpRowEl.classList.remove('hidden');
        ddpAmountEl.textContent = country.currency === 'EUR'
          ? `€${taxData.ddpAdminFeeEur.toFixed(2)}`
          : `${country.symbol}${taxData.ddpAdminFeeLocal.toFixed(2)}`;
      } else {
        ddpRowEl.classList.add('hidden');
      }
    }

    if (carrierEl) {
      if (summary.isB2B) {
        carrierEl.textContent = summary.tier === 'distributor' ? 'Regional Pallet Road Freight (Included)' : 'Commercial Express Courier (Included)';
      } else {
        const threshold = taxData.isUK ? '£150' : '€200';
        carrierEl.textContent = `${country.carrier} (Free > ${threshold})`;
      }
    }

    if (totalEl) {
      if (country.currency === 'GBP') {
        totalEl.textContent = `£${taxData.totalLocal.toFixed(2)}`;
        if (convertedTotalEl) convertedTotalEl.textContent = `(€${taxData.totalEur.toFixed(2)} EUR)`;
      } else if (country.currency === 'EUR') {
        totalEl.textContent = `€${taxData.totalEur.toFixed(2)}`;
        const gbp = taxData.totalEur * 0.85;
        if (convertedTotalEl) convertedTotalEl.textContent = `(£${gbp.toFixed(2)} GBP)`;
      } else {
        totalEl.textContent = `${country.symbol}${taxData.totalLocal.toFixed(2)}`;
        if (convertedTotalEl) convertedTotalEl.textContent = `(€${taxData.totalEur.toFixed(2)} EUR)`;
      }
    }

    // Update Drawer Items
    if (itemsContainer) {
      itemsContainer.innerHTML = '';
      if (summary.items.length === 0) {
        itemsContainer.innerHTML = `<div class="py-12 text-center font-mono text-xs text-secondary">Your project cart is currently empty.</div>`;
      } else {
        summary.items.forEach((item, idx) => {
          const itemPriceLocal = (country.currency === 'GBP') ? (item.priceGbp || item.priceEur * 0.85) : item.priceEur * country.rateToEur;
          const itemSubtotalLocal = itemPriceLocal * item.quantity;
          const priceDisplay = `${country.symbol}${itemSubtotalLocal.toFixed(2)}`;

          const row = document.createElement('div');
          row.className = 'cart-drawer-item p-3 flex justify-between items-center';
          row.innerHTML = `
            <div>
              <h5 class="font-headline text-sm uppercase text-on-surface">${item.title}</h5>
              <div class="font-mono text-[11px] text-secondary">SKU: ${item.sku} | ${item.variantDetails || 'Std'} | Qty: ${item.quantity} ${item.moq && item.moq > 1 ? `<span class="text-neutral-400 font-normal">(Case: ${item.moq})</span>` : ''}</div>
              ${item.retailPriceEur && item.retailPriceEur > item.priceEur ? `<div class="font-mono text-[10px] text-emerald-400">Wholesale Trade Price (Retail: ${country.currency === 'GBP' ? '£' + (item.retailPriceGbp || item.retailPriceEur * 0.85).toFixed(2) : '€' + item.retailPriceEur.toFixed(2)})</div>` : ''}
            </div>
            <div class="text-right">
              <div class="font-headline text-base ${summary.isB2B ? 'text-emerald-400' : 'text-primary'}">${priceDisplay}</div>
              <button onclick="window.paintApp.removeItem(${idx})" class="font-label-xs text-[10px] text-error hover:underline cursor-pointer">Remove</button>
            </div>
          `;
          itemsContainer.appendChild(row);
        });
      }
    }

    // Dynamic Meter Calculation (Retail small order waiver vs. Dealer MOV vs. Distributor MOV)
    const isUK = taxData.isUK;
    const currSymbol = isUK ? '£' : '€';
    const topMeterText = document.getElementById('shipping-meter-text');
    const topMeterFill = document.getElementById('shipping-meter-fill');
    const drawerMeterText = document.getElementById('drawer-shipping-text');
    const drawerMeterPercent = document.getElementById('drawer-shipping-percent');
    const drawerMeterFill = document.getElementById('drawer-shipping-fill');

    if (summary.isB2B) {
      const tierName = summary.tier === 'distributor' ? 'DISTRIBUTOR' : 'DEALER';
      if (!summary.isMovMet) {
        const warningHtml = `<span class="material-symbols-outlined text-amber-400 text-[16px]">lock</span><span>${tierName} MINIMUM: <strong>${currSymbol}${summary.activeSubtotal.toFixed(2)}</strong> / ${currSymbol}${summary.movThreshold.toFixed(2)} (Add <strong class="text-amber-300 font-bold">${currSymbol}${summary.movRemaining.toFixed(2)}</strong> • Mix &amp; Match Permitted)</span>`;
        if (topMeterText) topMeterText.innerHTML = warningHtml;
        if (drawerMeterText) drawerMeterText.innerHTML = warningHtml;
        if (drawerMeterPercent) drawerMeterPercent.textContent = `${summary.movProgressPercent}% OF MOV`;
        if (topMeterFill) {
          topMeterFill.style.width = `${summary.movProgressPercent}%`;
          topMeterFill.classList.remove('shipping-progress-unlocked');
        }
        if (drawerMeterFill) {
          drawerMeterFill.style.width = `${summary.movProgressPercent}%`;
          drawerMeterFill.classList.remove('shipping-progress-unlocked');
        }
      } else {
        const successHtml = `<span class="text-emerald-400 font-bold flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">verified</span> ${tierName} MINIMUM REACHED (${currSymbol}${summary.activeSubtotal.toFixed(2)}) — WHOLESALE CHECKOUT UNLOCKED</span>`;
        if (topMeterText) topMeterText.innerHTML = successHtml;
        if (drawerMeterText) drawerMeterText.innerHTML = successHtml;
        if (drawerMeterPercent) drawerMeterPercent.textContent = '100% UNLOCKED';
        if (topMeterFill) {
          topMeterFill.style.width = '100%';
          topMeterFill.classList.add('shipping-progress-unlocked');
        }
        if (drawerMeterFill) {
          drawerMeterFill.style.width = '100%';
          drawerMeterFill.classList.add('shipping-progress-unlocked');
        }
      }
    } else if (summary.hasSmallOrderFee) {
      // Retail customer under £25/€30 threshold: show fee waiver progress
      const waiverHtml = `<span class="material-symbols-outlined text-amber-400 text-[16px]">handyman</span><span>Add <strong id="drawer-shipping-remaining" class="text-amber-300 font-bold">${currSymbol}${summary.movRemaining.toFixed(2)}</strong> more to <span class="text-emerald-400 font-bold">WAIVE</span> the ${currSymbol}${summary.smallOrderFee.toFixed(2)} Packaging Prep Fee!</span>`;
      if (topMeterText) topMeterText.innerHTML = waiverHtml;
      if (drawerMeterText) drawerMeterText.innerHTML = waiverHtml;
      if (drawerMeterPercent) drawerMeterPercent.textContent = `${summary.movProgressPercent}% towards waiver`;
      if (topMeterFill) {
        topMeterFill.style.width = `${summary.movProgressPercent}%`;
        topMeterFill.classList.remove('shipping-progress-unlocked');
      }
      if (drawerMeterFill) {
        drawerMeterFill.style.width = `${summary.movProgressPercent}%`;
        drawerMeterFill.classList.remove('shipping-progress-unlocked');
      }
    } else {
      // Normal Retail customer over £25/€30: standard free shipping progress
      const thresholdVal = isUK ? 150 : 200;
      const currentVal = isUK ? taxData.subtotalLocal : taxData.subtotalEur;
      const remainingVal = Math.max(0, thresholdVal - currentVal);
      const progressPercent = Math.min(100, Math.round((currentVal / thresholdVal) * 100));

      if (remainingVal <= 0 && currentVal > 0) {
        const unlockedHtml = `<span class="text-emerald-400 font-bold flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">celebration</span> FREE APC OVERNIGHT SHIPPING UNLOCKED!</span>`;
        if (topMeterText) topMeterText.innerHTML = unlockedHtml;
        if (topMeterFill) {
          topMeterFill.style.width = '100%';
          topMeterFill.classList.add('shipping-progress-unlocked');
        }
        if (drawerMeterText) drawerMeterText.innerHTML = unlockedHtml;
        if (drawerMeterPercent) drawerMeterPercent.textContent = '100% UNLOCKED';
        if (drawerMeterFill) {
          drawerMeterFill.style.width = '100%';
          drawerMeterFill.classList.add('shipping-progress-unlocked');
        }
      } else {
        if (topMeterText) {
          topMeterText.innerHTML = `Add <strong id="shipping-meter-remaining" class="text-amber-300 font-bold">${currSymbol}${remainingVal.toFixed(2)}</strong> to unlock <span class="text-emerald-400 font-bold">FREE APC OVERNIGHT SHIPPING</span> 🚚`;
        }
        if (topMeterFill) {
          topMeterFill.style.width = `${progressPercent}%`;
          topMeterFill.classList.remove('shipping-progress-unlocked');
        }
        if (drawerMeterText) {
          drawerMeterText.innerHTML = `<span class="material-symbols-outlined text-amber-400 text-[16px]">local_shipping</span><span>Add <strong id="drawer-shipping-remaining" class="text-amber-300 font-bold">${currSymbol}${remainingVal.toFixed(2)}</strong> for FREE Express Delivery</span>`;
        }
        if (drawerMeterPercent) drawerMeterPercent.textContent = `${progressPercent}%`;
        if (drawerMeterFill) {
          drawerMeterFill.style.width = `${progressPercent}%`;
          drawerMeterFill.classList.remove('shipping-progress-unlocked');
        }
      }
    }

    // Render 1-Click Upsells in Cart Drawer
    const upsellContainer = document.getElementById('drawer-upsell-items');
    if (upsellContainer) {
      const cartSkus = summary.items.map(it => it.sku || '');
      const potentialUpsells = [
        { id: 'fk-tape-orange', title: 'Orange Fineline Tape (3mm)', priceEur: 6.95, priceGbp: 5.95 },
        { id: 'fk-2603', title: '0.015 Kromatic Holo Flake (30g)', priceEur: 16.95, priceGbp: 14.49 },
        { id: 'kroma-topcoat-clr-180', title: 'Kroma Dedicated Clear (180 Set)', priceEur: 76.47, priceGbp: 65.00 },
        { id: 'fk-1970', title: 'Flake King 550 Mini Gun', priceEur: 116.99, priceGbp: 99.99 }
      ];
      const eligibleUpsells = potentialUpsells.filter(u => !cartSkus.some(s => s.toLowerCase().includes(u.id))).slice(0, 2);

      upsellContainer.innerHTML = eligibleUpsells.map(u => {
        const pDisplay = isUK ? `£${u.priceGbp.toFixed(2)}` : `€${u.priceEur.toFixed(2)}`;
        return `
          <div class="bg-[#181a1c] border border-white/10 p-2.5 rounded flex flex-col justify-between">
            <div class="text-[11px] font-bold text-white truncate" title="${u.title}">${u.title}</div>
            <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10">
              <span class="text-amber-300 text-xs font-bold font-mono">${pDisplay}</span>
              <button onclick="window.paintApp.addProductToCartById('${u.id}')" class="px-2 py-0.5 bg-primary/20 hover:bg-primary/40 border border-primary/50 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer">
                <span>+ ADD</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // KromaEdge Solvent Restrictions vs EU Destination
    const kromaItems = summary.items.filter(it => isKromaEdgeSolventItem(it));
    const hasKromaInCart = kromaItems.length > 0;
    const isBlockedByEuKroma = !isUK && hasKromaInCart;

    // Manage in-drawer KromaEdge EU Solvent Alert Card
    let kromaAlertEl = document.getElementById('cart-drawer-kroma-eu-alert');
    if (!kromaAlertEl) {
      kromaAlertEl = document.createElement('div');
      kromaAlertEl.id = 'cart-drawer-kroma-eu-alert';
      const checkoutActionsEl = document.getElementById('cart-drawer-checkout-actions');
      if (checkoutActionsEl && checkoutActionsEl.parentNode) {
        checkoutActionsEl.parentNode.insertBefore(kromaAlertEl, checkoutActionsEl);
      }
    }

    if (kromaAlertEl) {
      if (isBlockedByEuKroma) {
        const nonKromaCount = summary.items.length - kromaItems.length;
        kromaAlertEl.className = 'p-3.5 mb-2 bg-[#1c1408] border-2 border-amber-500/70 rounded text-xs font-mono space-y-2.5 shadow-md block';
        kromaAlertEl.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[11px]">
              <span class="material-symbols-outlined text-[16px]">science</span>
              <span>ADR Class 3 Solvent Notice (${country.name})</span>
            </div>
            <span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold">UK DISPATCH ONLY</span>
          </div>
          <p class="text-neutral-200 text-[11px] leading-relaxed font-body">
            <strong>${kromaItems.map(i => i.title).join(', ')}</strong> contains volatile solvent mirror resins (UN1263 Class 3). Road dangerous goods routes into ${country.name} are currently in final carrier onboarding.
          </p>
          ${nonKromaCount > 0 ? `
            <div class="p-2 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] leading-normal font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Your Flake King dry flakes, FK50 waterborne binder &amp; hardware ship to ${country.name} immediately!</span>
            </div>
            <button type="button" onclick="window.paintApp.removeKromaEdgeFromCart()" class="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md">
              <span class="material-symbols-outlined text-[16px]">remove_shopping_cart</span>
              <span>Remove KromaEdge &amp; Ship Other Items Now &rarr;</span>
            </button>
          ` : `
            <div class="space-y-1.5 pt-1">
              <div class="text-[10px] text-amber-300 font-bold uppercase">Reserve Priority Allocation for ${country.name}:</div>
              <form onsubmit="event.preventDefault(); window.paintApp.submitKromaWaitlistFromCart(this, '${country.code}', '${country.name}')" class="flex gap-1.5">
                <input type="email" required placeholder="painter@bodyshop.${country.code.toLowerCase()}" class="flex-1 bg-black/60 border border-neutral-700 rounded px-2.5 py-1 text-white text-xs outline-none focus:border-amber-400">
                <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-black font-bold px-3 py-1 rounded uppercase text-[10px] shrink-0 cursor-pointer">Notify Me</button>
              </form>
            </div>
          `}
        `;
      } else {
        kromaAlertEl.className = 'hidden';
        kromaAlertEl.innerHTML = '';
      }
    }

    // Checkout Buttons Handling (Two-Path B2B vs Standard Retail)
    const btnShopify = document.getElementById('btn-drawer-checkout-shopify');
    const btnAccount = document.getElementById('btn-drawer-checkout-account');
    const btnAccountText = document.getElementById('btn-drawer-account-text');

    if (isBlockedByEuKroma) {
      if (btnShopify) {
        btnShopify.disabled = true;
        btnShopify.innerHTML = `<span class="flex items-center justify-center gap-1.5"><span class="material-symbols-outlined text-[16px]">lock</span> <span>KROMAEDGE: UK DISPATCH ONLY (REMOVE TO CHECKOUT)</span></span>`;
        btnShopify.className = 'mech-button-primary !w-full !justify-center !py-3.5 !text-xs font-bold opacity-60 cursor-not-allowed !bg-neutral-800 !border-neutral-600 !text-neutral-400';
      }
      if (btnAccount) {
        btnAccount.classList.add('hidden');
      }
    } else if (summary.isB2B) {
      if (!summary.isMovMet) {
        if (btnShopify) {
          btnShopify.disabled = true;
          btnShopify.innerHTML = `<span class="flex items-center justify-center gap-1.5"><span class="material-symbols-outlined text-[16px]">lock</span> <span>MINIMUM ${currSymbol}${summary.movThreshold.toFixed(0)} ORDER VALUE REQUIRED</span></span>`;
          btnShopify.className = 'mech-button-primary !w-full !justify-center !py-3.5 !text-xs font-bold opacity-60 cursor-not-allowed !bg-neutral-800 !border-neutral-600 !text-neutral-400';
        }
        if (btnAccount) {
          btnAccount.classList.add('hidden');
        }
      } else {
        if (btnShopify) {
          btnShopify.disabled = false;
          btnShopify.innerHTML = `<span class="flex items-center justify-center gap-1.5"><span class="material-symbols-outlined text-[16px]">credit_card</span> <span>PAY ON ORDER NOW (${currSymbol}${taxData.totalLocal.toFixed(2)})</span></span>`;
          btnShopify.className = 'mech-button-primary !w-full !justify-center !py-3.5 !text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] !bg-primary cursor-pointer';
        }
        if (btnAccount) {
          btnAccount.classList.add('hidden');
        }
      }
    } else {
      if (btnShopify) {
        btnShopify.disabled = (summary.itemCount === 0);
        btnShopify.innerHTML = 'PROCEED TO EUROPEAN CHECKOUT &rarr;';
        btnShopify.className = 'mech-button-primary !w-full !justify-center !py-3.5 !text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]';
      }
      if (btnAccount) {
        btnAccount.classList.add('hidden');
      }
    }
  }

  removeItem(index) {
    this.app.shopifyCartManager.removeItem(index);
  }

  removeKromaEdgeFromCart() {
    this.app.shopifyCartManager.cartItems = this.app.shopifyCartManager.cartItems.filter(it => !isKromaEdgeSolventItem(it));
    this.app.shopifyCartManager.notifyListeners();
    this.app.showToast("Removed KromaEdge solvent items. Your Flake King and hardware items are ready for European checkout!", "success", 5000);
  }

  async submitKromaWaitlistFromCart(form, countryCode, countryName) {
    const input = form.querySelector('input[type="email"]');
    const email = input ? input.value : '';
    if (!email) return;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.textContent = 'Saving...';
    const res = await registerKromaEuWaitlist(email, countryCode, countryName);
    this.app.showToast(res.message, res.success ? "success" : "warning", 6000);
    if (res.success) {
      form.innerHTML = `<span class="text-emerald-400 font-bold text-[11px] flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check_circle</span> You're registered for ${countryName} launch allocation!</span>`;
    }
  }

  checkoutShopify() {
    const country = this.app.euLocalization.getCountry();
    const summary = this.app.shopifyCartManager.getCartSummary(country.currency);
    if (summary.items.length === 0) {
      this.app.showToast("Please add items to your cart before proceeding to checkout.", "warning");
      return;
    }
    if (country.code !== 'GB' && summary.items.some(it => isKromaEdgeSolventItem(it))) {
      this.app.showToast(`⚠️ KromaEdge is currently restricted to UK dispatch pending final European ADR courier onboarding. Remove KromaEdge to checkout your other items.`, "warning", 6000);
      return;
    }
    if (summary.isB2B && !summary.isMovMet) {
      this.app.showToast(`⚠️ Minimum Order Value not reached. Requires ${country.symbol}${summary.movThreshold.toFixed(2)} spend. Shortfall: ${country.symbol}${summary.movRemaining.toFixed(2)}.`, "warning", 5000);
      return;
    }
    if (this.app.reviewMode) {
      this.showReviewModeModal();
      return;
    }
    const permalink = this.app.shopifyCartManager.generateShopifyCartPermalink();
    window.open(permalink, '_blank');
  }

  openTradeAccountModal() {
    const country = this.app.euLocalization.getCountry();
    const summary = this.app.shopifyCartManager.getCartSummary(country.currency);

    if (!this.app.b2bSession) {
      this.app.showToast("Please sign in with your trade credentials to charge on account.", "warning");
      this.app.openTradePortalModal();
      return;
    }

    if (!summary.isMovMet) {
      this.app.showToast(`⚠️ Minimum Order Value of ${country.symbol}${summary.movThreshold.toFixed(2)} must be reached before placing orders on account.`, "warning");
      return;
    }

    const modal = document.getElementById('modal-trade-account-checkout');
    if (!modal) return;

    const compEl = document.getElementById('modal-account-company');
    const contactEl = document.getElementById('modal-account-contact');
    const vatEl = document.getElementById('modal-account-vat');
    const countryEl = document.getElementById('modal-account-country');
    const termsBadge = document.getElementById('modal-account-terms-badge');
    const subtotalEl = document.getElementById('modal-account-subtotal');
    const vatLabelEl = document.getElementById('modal-account-vat-label');
    const vatAmountEl = document.getElementById('modal-account-vat-amount');
    const totalEl = document.getElementById('modal-account-total');
    const errEl = document.getElementById('modal-account-error');

    if (errEl) errEl.classList.add('hidden');
    if (compEl) compEl.textContent = this.app.b2bSession.company;
    if (contactEl) contactEl.textContent = `Contact: ${this.app.b2bSession.contactName} (${this.app.b2bSession.email})`;
    if (vatEl) vatEl.textContent = `VAT: ${this.app.b2bSession.vat || 'Verified'}`;
    if (countryEl) countryEl.textContent = `Dispatch: ${this.app.b2bSession.country || country.name}`;
    if (termsBadge) termsBadge.textContent = `${this.app.b2bSession.paymentTerms || 'Net 30 Days'} • Verified ${this.app.b2bSession.tierLabel || 'Trade Account'}`;

    const isUK = country.code === 'GB' || (this.app.b2bSession.country && this.app.b2bSession.country.toLowerCase().includes('united kingdom'));
    const isExVat = !isUK && Boolean(this.app.b2bSession.vat);
    const vatRate = isUK ? 0.20 : (isExVat ? 0.0 : country.vatRate);
    const vatAmt = summary.activeSubtotal * vatRate;
    const totalLanded = summary.activeSubtotal + vatAmt;

    if (subtotalEl) subtotalEl.textContent = `${country.symbol}${summary.activeSubtotal.toFixed(2)}`;
    if (vatLabelEl) vatLabelEl.textContent = isUK ? 'UK VAT (20% HMRC):' : (isExVat ? 'EU VAT (0% Reverse Charge Art 138):' : `VAT (${(country.vatRate * 100).toFixed(0)}%):`);
    if (vatAmountEl) vatAmountEl.textContent = `${country.symbol}${vatAmt.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `${country.symbol}${totalLanded.toFixed(2)}`;

    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  closeTradeAccountModal() {
    const modal = document.getElementById('modal-trade-account-checkout');
    if (modal) modal.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.classList.remove('modal-open');
    }
  }

  async submitTradeAccountOrder() {
    const poInput = document.getElementById('modal-po-input');
    const notesInput = document.getElementById('modal-account-notes');
    const errEl = document.getElementById('modal-account-error');
    const btn = document.getElementById('btn-submit-account-order');

    const poNumber = (poInput?.value || '').trim();
    const notes = (notesInput?.value || '').trim();

    if (!poNumber) {
      if (errEl) {
        errEl.textContent = "Please enter your internal Purchase Order (PO) number to link with your accounting ledger.";
        errEl.classList.remove('hidden');
      }
      return;
    }

    const token = localStorage.getItem('cae_trade_token');
    if (!token) {
      if (errEl) {
        errEl.textContent = "Your trade session has expired. Please sign in again.";
        errEl.classList.remove('hidden');
      }
      return;
    }

    const country = this.app.euLocalization.getCountry();
    const summary = this.app.shopifyCartManager.getCartSummary(country.currency);

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Confirming Commercial Order...`;
    }

    try {
      const resp = await fetch('/api/trade/place-account-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          poNumber,
          notes,
          items: summary.items,
          currency: country.currency,
          subtotal: summary.activeSubtotal
        })
      });

      const data = await resp.json();
      if (!data.success) {
        if (errEl) {
          errEl.textContent = data.error || "Failed to process commercial order.";
          errEl.classList.remove('hidden');
        }
        return;
      }

      // Successful order placement on account
      this.closeTradeAccountModal();
      this.app.shopifyCartManager.clearCart();

      // Show confirmation modal
      const confModal = document.getElementById('modal-account-order-confirmed');
      if (confModal && data.order) {
        const idEl = document.getElementById('confirmed-order-id');
        const poEl = document.getElementById('confirmed-po-number');
        const termsEl = document.getElementById('confirmed-terms');
        const dueEl = document.getElementById('confirmed-due-date');
        const totEl = document.getElementById('confirmed-total');

        if (idEl) idEl.textContent = data.order.orderId;
        if (poEl) poEl.textContent = data.order.poNumber;
        if (termsEl) termsEl.textContent = data.order.paymentTerms;
        if (dueEl) dueEl.textContent = data.order.dueDate;
        if (totEl) totEl.textContent = `${country.symbol}${data.order.financials.total.toFixed(2)}`;

        confModal.classList.add('active');
        document.body.classList.add('modal-open');
      }

      this.app.showToast(`✅ Commercial Order ${data.order.orderId} Confirmed on ${data.order.paymentTerms}!`, "success", 6000);
    } catch (e) {
      if (errEl) {
        errEl.textContent = "Network communication error. Please try again or contact your account manager.";
        errEl.classList.remove('hidden');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">verified</span> <span>CONFIRM &amp; DISPATCH ON ACCOUNT</span>`;
      }
    }
  }

  closeOrderConfirmedModal() {
    const confModal = document.getElementById('modal-account-order-confirmed');
    if (confModal) confModal.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.classList.remove('modal-open');
    }
  }

  showReviewModeModal() {
    const modal = document.getElementById('modal-review-mode');
    const summaryBox = document.getElementById('review-cart-summary-box');
    if (summaryBox) {
      const summary = this.app.shopifyCartManager.getCartSummary();
      if (summary.items.length > 0) {
        const itemsHtml = summary.items.map(i => `
          <div class="flex justify-between items-center py-1.5 px-2 border-b border-white/5 hover:bg-white/5 rounded-sm transition-colors">
            <span class="text-neutral-200">${i.quantity}x ${this.app.escapeHtmlAttr(i.title)} <span class="text-[10px] text-neutral-400">(${this.app.escapeHtmlAttr(i.variantDetails || 'Std')})</span></span>
            <span class="font-bold text-amber-300">€${(i.priceEur * i.quantity).toFixed(2)}</span>
          </div>
        `).join('');
        summaryBox.innerHTML = `
          <div class="font-bold text-white mb-2 flex justify-between border-b border-white/10 pb-1 text-xs">
            <span>Cart Review &amp; Formulation Audit (${summary.itemCount} items)</span>
            <span class="text-emerald-400 font-bold">Subtotal: €${summary.subtotal.toFixed(2)}</span>
          </div>
          <div class="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">${itemsHtml}</div>
        `;
      } else {
        summaryBox.innerHTML = `<span class="text-neutral-400">Cart is empty. Add items from the shop or mixing lab to inspect calculations.</span>`;
      }
    }
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closeReviewModeModal() {
    const modal = document.getElementById('modal-review-mode');
    if (modal) modal.classList.add('hidden');
  }
}
