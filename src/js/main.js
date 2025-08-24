import { ctx, initDomRefs, initDefaultSettings } from './m_context.js';
import { initDB } from './m_db.js';
import { loadSettings, applyThemeToApp, populateFontSelector, renderColorThemes, updateUiWithSettings } from './m_ui.js';
import { setupEventListeners } from './m_events.js';
import { displayImportedFiles } from './m_reader.js';

function initializeApp() {
  if (typeof ePub === 'undefined') {
    import('./m_modals.js').then(({ showCustomAlert }) => showCustomAlert("Lỗi nghiêm trọng: Không thể tải thư viện ePub.js."));
    return;
  }
  initDefaultSettings();
  initDB().then(() => {
    loadSettings();
    applyThemeToApp();
    populateFontSelector();
    renderColorThemes();
    updateUiWithSettings();
    setupEventListeners();
    displayImportedFiles();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDomRefs();
  initializeApp();
});
