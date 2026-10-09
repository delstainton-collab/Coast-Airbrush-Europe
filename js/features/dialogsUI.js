// Custom Industrial Dialogs & Toast Notifications UI Controller
// Extracted per Anti-God Monolith Architecture Skill (Target <= 250 lines)

export class DialogsUI {
  constructor(appRef) {
    this.app = appRef;
  }

  showToast(msg, type = 'info', duration = 3500) {
    const container = document.getElementById('custom-app-toast');
    if (!container) return;

    const toast = document.createElement('div');
    const borderColors = {
      success: 'border-emerald-500/80 text-emerald-300 bg-[#141816]',
      danger: 'border-rose-500/80 text-rose-300 bg-[#1c1214]',
      warning: 'border-amber-500/80 text-amber-300 bg-[#1c1712]',
      info: 'border-primary text-primary bg-[#121618]'
    };
    const iconNames = {
      success: 'check_circle',
      danger: 'error',
      warning: 'warning',
      info: 'info'
    };

    const colorClass = borderColors[type] || borderColors.info;
    const iconName = iconNames[type] || iconNames.info;

    toast.className = `custom-toast-item industrial-card border-2 p-3 font-mono text-xs shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3 ${colorClass}`;
    toast.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="material-symbols-outlined text-[18px] flex-shrink-0">${iconName}</span>
        <span class="text-zinc-100 font-medium leading-tight">${msg}</span>
      </div>
      <button class="text-secondary hover:text-white p-0.5 cursor-pointer ml-2 flex-shrink-0">
        <span class="material-symbols-outlined text-[14px]">close</span>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
      });
    }

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  confirmDialog({
    title = 'Confirm Action',
    subtitle = 'Please review before continuing.',
    message = 'Are you sure you want to proceed?',
    itemDetails = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = true,
    icon = 'warning'
  } = {}) {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-custom-confirm');
      const titleEl = document.getElementById('custom-confirm-title');
      const subEl = document.getElementById('custom-confirm-subtitle');
      const msgEl = document.getElementById('custom-confirm-message');
      const previewEl = document.getElementById('custom-confirm-preview');
      const btnAction = document.getElementById('btn-custom-confirm-action');
      const actionLabel = document.getElementById('custom-confirm-action-label');
      const btnCancel = document.getElementById('btn-custom-confirm-cancel');
      const iconEl = document.getElementById('custom-confirm-icon');
      const iconBox = document.getElementById('custom-confirm-icon-box');

      if (!modal || !btnAction || !btnCancel) {
        resolve(window.confirm(message));
        return;
      }

      if (titleEl) titleEl.innerText = title;
      if (subEl) subEl.innerText = subtitle;
      if (msgEl) msgEl.innerHTML = message;
      if (actionLabel) actionLabel.innerText = confirmText;
      if (btnCancel) {
        if (!cancelText) {
          btnCancel.classList.add('hidden');
        } else {
          btnCancel.classList.remove('hidden');
          btnCancel.innerText = cancelText;
        }
      }
      if (iconEl) iconEl.innerText = icon;

      if (previewEl) {
        if (itemDetails) {
          previewEl.innerHTML = itemDetails;
          previewEl.classList.remove('hidden');
        } else {
          previewEl.innerHTML = '';
          previewEl.classList.add('hidden');
        }
      }

      if (iconBox) {
        if (isDanger) {
          iconBox.className = 'p-2.5 bg-rose-950/40 border border-rose-500/60 text-rose-400 rounded-sm flex items-center justify-center';
          btnAction.className = 'font-mono text-xs font-bold px-4 py-2 border border-rose-500 bg-rose-600 text-white hover:bg-rose-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer';
        } else {
          iconBox.className = 'p-2.5 bg-primary/20 border border-primary/50 text-primary rounded-sm flex items-center justify-center';
          btnAction.className = 'font-mono text-xs font-bold px-4 py-2 border border-primary bg-primary text-black hover:bg-primary/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer';
        }
      }

      const cleanup = () => {
        modal.classList.remove('active');
        if (btnCancel) btnCancel.classList.remove('hidden');
        btnAction.removeEventListener('click', onConfirm);
        btnCancel.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onBackdrop);
      };

      const onConfirm = () => {
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      const onBackdrop = (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(false);
        }
      };

      btnAction.addEventListener('click', onConfirm);
      btnCancel.addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdrop);

      modal.classList.add('active');
    });
  }

  alertDialog({
    title = 'System Notice',
    subtitle = 'Coast Airbrush Europe',
    message = '',
    itemDetails = '',
    confirmText = 'Acknowledge',
    icon = 'info',
    isDanger = false
  } = {}) {
    return this.confirmDialog({
      title,
      subtitle,
      message,
      itemDetails,
      confirmText,
      cancelText: '',
      isDanger,
      icon
    });
  }
}
