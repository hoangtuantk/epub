import { ctx } from './m_context.js';

export function setupModal(modal, openBtn = null, onOpen = null) {
  if (!modal) return;
  const closeModal = () => modal.classList.add('hidden');

  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onOpen) onOpen();
      modal.classList.remove('hidden');
    });
  }

  document.querySelectorAll(`.close-btn[data-target="${modal.id}"]`)
    .forEach(btn => btn.addEventListener('click', closeModal));

  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

export function showCustomPrompt(message) {
  return new Promise((resolve, reject) => {
    ctx.promptMessage.textContent = message;
    ctx.promptInput.value = '';
    ctx.promptModal.classList.remove('hidden');
    ctx.promptInput.focus();

    const oldOk = ctx.promptOkBtn, oldCancel = ctx.promptCancelBtn;
    const ok = oldOk.cloneNode(true), cancel = oldCancel.cloneNode(true);

    const handleOk = () => { ctx.promptModal.classList.add('hidden'); resolve(ctx.promptInput.value); };
    const handleCancel = () => { ctx.promptModal.classList.add('hidden'); reject(); };
    const handleKey = (e) => { if (e.key === 'Enter') handleOk(); else if (e.key === 'Escape') handleCancel(); };

    ok.addEventListener('click', handleOk);
    cancel.addEventListener('click', handleCancel);
    ctx.promptInput.addEventListener('keydown', handleKey);

    oldOk.parentNode.replaceChild(ok, oldOk);
    oldCancel.parentNode.replaceChild(cancel, oldCancel);

    const obs = new MutationObserver(() => {
      if (ctx.promptModal.classList.contains('hidden')) {
        ctx.promptInput.removeEventListener('keydown', handleKey);
        obs.disconnect();
      }
    });
    obs.observe(ctx.promptModal, { attributes: true });
  });
}

export function showCustomAlert(message, options = {}) {
  const okBtn = document.getElementById('custom-alert-ok');
  const cancelBtn = document.getElementById('custom-alert-cancel');
  document.getElementById('custom-alert-message').textContent = message;

  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener('click', () => {
    ctx.alertModal.classList.add('hidden');
    if (options.onOk) options.onOk();
  });

  const newCancel = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
  newCancel.addEventListener('click', () => { ctx.alertModal.classList.add('hidden'); });
  newCancel.style.display = options.showCancelButton ? 'inline-block' : 'none';

  ctx.alertModal.classList.remove('hidden');
}
