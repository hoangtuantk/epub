import { ctx } from './m_context.js';
import { setupModal } from './m_modals.js';
import { addTheme, applyReaderSettings, deleteAllData, saveSettings } from './m_ui.js';
import { handleFileSelect, openBookFromDB, loadHistory, filterTOC, displayImportedFiles, deleteBookFromHistory, deleteBookFromWelcomeScreen } from './m_reader.js';

export function setupEventListeners() {
  ctx.homeBtn.addEventListener('click', () => { window.location.reload(); });
  ctx.fileInput.addEventListener('change', handleFileSelect);
  ctx.prevArea.addEventListener('click', () => ctx.rendition && ctx.rendition.prev());
  ctx.nextArea.addEventListener('click', () => ctx.rendition && ctx.rendition.next());

  setupModal(ctx.tocModal, ctx.tocBtn);
  setupModal(ctx.historyModal, ctx.historyBtn, loadHistory);
  setupModal(ctx.settingsSidebar, ctx.settingsBtn);
  setupModal(ctx.bookInfoModal);

  ctx.addThemeBtn.addEventListener('click', addTheme);
  ctx.tocSearch.addEventListener('input', filterTOC);
  ctx.deleteAllDataBtn.addEventListener('click', deleteAllData);

  ctx.historyList.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-history-btn')) {
      const bookId = event.target.closest('li').dataset.bookId;
      if (bookId) deleteBookFromHistory(bookId);
    }
  });

  ctx.importedFilesList.addEventListener('click', (e) => {
    const card = e.target.closest('li');
    if (!card) return;
    const bookId = card.dataset.bookId;
    if (!bookId) return;

    if (e.target.classList.contains('delete-book-btn')) {
      deleteBookFromWelcomeScreen(bookId);
    } else if (e.target.closest('.info-btn')) {
      import('./m_reader.js').then(m => m.showBookInfo(bookId));
    } else {
      openBookFromDB(bookId);
    }
  });

  ctx.sortBooksSelect.addEventListener('change', (e) => { ctx.settings.sortOrder = e.target.value; saveSettings(); displayImportedFiles(); });
  ctx.originalFormatToggle.addEventListener('change', e => { ctx.settings.keepOriginalFormat = e.target.checked; applyReaderSettings(); updateSettingsControlsStateShim(); saveSettings(); });
  ctx.fontSizeInput.addEventListener('input', e => { ctx.settings.fontSize = parseInt(e.target.value, 10); ctx.fontSizeValue.textContent = e.target.value; applyReaderSettings(); });
  ctx.fontSizeInput.addEventListener('change', saveSettings);
  ctx.fontFamilySelect.addEventListener('change', e => { ctx.settings.fontFamily = e.target.value; applyReaderSettings(); saveSettings(); });
  ctx.bgColorPicker.addEventListener('input', e => { ctx.settings.customColors.bg = e.target.value; ctx.settings.activeThemeName = 'custom'; applyReaderSettings(); updateActiveThemeButtonShim(); });
  ctx.textColorPicker.addEventListener('input', e => { ctx.settings.customColors.text = e.target.value; ctx.settings.activeThemeName = 'custom'; applyReaderSettings(); updateActiveThemeButtonShim(); });
  ctx.bgColorPicker.addEventListener('change', saveSettings);
  ctx.textColorPicker.addEventListener('change', saveSettings);
}

// Hai shim nhỏ để tránh import vòng tròn
function updateActiveThemeButtonShim() {
  import('./m_ui.js').then(m => m.updateActiveThemeButton());
}
function updateSettingsControlsStateShim() {
  import('./m_ui.js').then(m => m.updateSettingsControlsState());
}
