// Master Forum & Preorder UI Controller
// Extracted per Anti-God Monolith Architecture Skill (Target <= 250 lines)

export class ForumPreorderUI {
  constructor(appRef) {
    this.app = appRef;
  }

  get forumEngine() {
    return this.app.forumEngine;
  }

  setup() {
    const revSlider = document.getElementById('slider-preorder-rev');
    if (revSlider) {
      revSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.updateReinvestmentDisplay(val);
      });
      this.updateReinvestmentDisplay(parseInt(revSlider.value, 10));
    }

    // Verify Order Modal
    this.app.addSafeListener('btn-open-verify-modal', 'click', () => {
      const modal = document.getElementById('modal-order-verify');
      if (modal) modal.classList.add('active');
    });

    this.app.addSafeListener('btn-close-verify-modal', 'click', () => {
      const modal = document.getElementById('modal-order-verify');
      if (modal) modal.classList.remove('active');
    });

    this.app.addSafeListener('btn-submit-verify-order', 'click', () => {
      const input = document.getElementById('input-verify-order-id');
      const feedback = document.getElementById('verify-feedback-msg');
      if (!input || !feedback) return;

      const res = this.forumEngine.verifyOrder(input.value);
      feedback.classList.remove('hidden');
      feedback.style.color = res.success ? '#34d399' : '#ef4444';
      feedback.innerText = res.message;

      if (res.success) {
        setTimeout(() => {
          const modal = document.getElementById('modal-order-verify');
          if (modal) modal.classList.remove('active');
          this.renderForumThreads();
        }, 1200);
      }
    });

    // Post Recipe Modal
    this.app.addSafeListener('btn-open-post-recipe-modal', 'click', () => {
      const modal = document.getElementById('modal-post-recipe');
      if (modal) modal.classList.add('active');
    });

    this.app.addSafeListener('btn-close-post-recipe-modal', 'click', () => {
      const modal = document.getElementById('modal-post-recipe');
      if (modal) modal.classList.remove('active');
    });

    this.app.addSafeListener('btn-submit-new-thread', 'click', () => {
      const titleInput = document.getElementById('input-post-title');
      const contentInput = document.getElementById('input-post-content');
      if (!titleInput || !contentInput) return;

      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      if (!title || !content) {
        this.app.showToast("Please provide both a thread title and spray instructions.", "warning");
        return;
      }

      this.forumEngine.createThread(title, content);
      titleInput.value = '';
      contentInput.value = '';

      const modal = document.getElementById('modal-post-recipe');
      if (modal) modal.classList.remove('active');

      this.renderForumThreads();
    });

    this.renderForumThreads();
  }

  updateReinvestmentDisplay(revEUR) {
    const calc = this.forumEngine.calculateReinvestment(revEUR);
    const revEl = document.getElementById('reinvest-rev-display');
    const profitEl = document.getElementById('reinvest-gross-profit');
    const stockPoolEl = document.getElementById('reinvest-stock-pool');
    const retailFundedEl = document.getElementById('reinvest-retail-funded');

    if (revEl) revEl.innerText = `€${calc.revenueEUR.toLocaleString()}`;
    if (profitEl) profitEl.innerText = `€${Math.round(calc.grossProfitPool).toLocaleString()}`;
    if (stockPoolEl) stockPoolEl.innerText = `€${Math.round(calc.reinvestmentPool).toLocaleString()} (60% NL / 40% UK)`;
    if (retailFundedEl) retailFundedEl.innerText = `€${Math.round(calc.retailStockPurchased).toLocaleString()}`;
  }

  addPreorderTier(packageId) {
    this.forumEngine.addPreorderToCart(packageId);
    this.app.openCartDrawer();
  }

  renderForumThreads() {
    const container = document.getElementById('forum-threads-container');
    if (!container) return;
    container.innerHTML = '';

    this.forumEngine.threads.forEach(thread => {
      const card = document.createElement('div');
      card.className = 'industrial-card p-6';
      
      const badgeClass = thread.authorBadge.includes('MASTER') ? 'metal-spec-plate-red' : 'metal-spec-plate';
      
      const recipeAction = thread.recipe ? `
        <button class="btn-load-recipe mech-button-primary !text-[10px] !py-1 !px-2.5 cursor-pointer">
          ⚡ Load Formula into Lab (${thread.recipe.volumeMl}mL)
        </button>
      ` : `
        <span class="text-secondary font-mono text-[11px]">💬 Discussion</span>
      `;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-3 border-b border-secondary pb-2">
          <div class="flex items-center gap-2">
            <span class="${badgeClass} text-[10px]">${thread.authorBadge}</span>
            <span class="font-label-xs text-xs text-primary font-bold">@${thread.author} (${thread.authorRegion})</span>
          </div>
          <span class="font-label-xs text-xs text-secondary">${thread.timeAgo}</span>
        </div>
        <h3 class="font-headline text-xl text-on-surface uppercase mb-2">${thread.title}</h3>
        <p class="font-body-md text-sm text-on-surface-variant mb-4 leading-relaxed">${thread.content}</p>
        <div class="flex items-center justify-between font-label-xs text-xs border-t border-secondary pt-3">
          <span class="text-secondary">💬 ${thread.repliesCount} Replies • ⬆️ ${thread.upvotes} Upvotes</span>
          ${recipeAction}
        </div>
      `;

      const loadRecipeBtn = card.querySelector('.btn-load-recipe');
      if (loadRecipeBtn && thread.recipe) {
        loadRecipeBtn.addEventListener('click', () => {
          this.app.switchTab('tab-calculator', 'view-calculator');
          const sysSelect = document.getElementById('select-mixing-system');
          if (sysSelect) {
            sysSelect.value = thread.recipe.systemId;
            this.app.onSystemChange(thread.recipe.systemId);
          }
          const volInput = document.getElementById('input-total-volume');
          if (volInput) {
            volInput.value = thread.recipe.volumeMl;
            this.app.updateCalculation();
          }
        });
      }

      container.appendChild(card);
    });
  }
}
