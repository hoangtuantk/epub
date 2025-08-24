export const ctx = {
  // DOM refs (khởi tạo sau DOMContentLoaded)
  viewer: null, fileInput: null, prevArea: null, nextArea: null,
  bookTitleEl: null, chapterInfoEl: null,
  tocModal: null, historyModal: null, settingsSidebar: null,
  alertModal: null, bookInfoModal: null,
  promptModal: null, promptMessage: null, promptInput: null, promptOkBtn: null, promptCancelBtn: null,
  homeBtn: null, tocBtn: null, historyBtn: null, settingsBtn: null,
  tocList: null, tocSearch: null, historyList: null, importedFilesList: null, sortBooksSelect: null,
  fontSizeInput: null, fontSizeValue: null, fontFamilySelect: null, colorThemesContainer: null,
  bgColorPicker: null, textColorPicker: null, deleteAllDataBtn: null, originalFormatToggle: null, addThemeBtn: null,

  // State
  book: null, rendition: null, currentBookId: null, currentBookType: null,
  dbName: 'EbookReaderDB_v2', db: null,
  settings: null,
  popularFonts: ['Arial', 'Times New Roman', 'Helvetica', 'Courier New', 'Verdana', 'Georgia', 'Tahoma', 'Calibri', 'Garamond', 'Roboto', 'Open Sans', 'Montserrat'],
};

export function initDomRefs() {
  ctx.viewer = document.getElementById('viewer');
  ctx.fileInput = document.getElementById('file-input');
  ctx.prevArea = document.getElementById('prev-area');
  ctx.nextArea = document.getElementById('next-area');
  ctx.bookTitleEl = document.getElementById('book-title');
  ctx.chapterInfoEl = document.getElementById('chapter-info');

  ctx.tocModal = document.getElementById('toc-modal');
  ctx.historyModal = document.getElementById('history-modal');
  ctx.settingsSidebar = document.getElementById('settings-sidebar');
  ctx.alertModal = document.getElementById('custom-alert-overlay');
  ctx.bookInfoModal = document.getElementById('book-info-modal');

  ctx.promptModal = document.getElementById('custom-prompt-overlay');
  ctx.promptMessage = document.getElementById('custom-prompt-message');
  ctx.promptInput = document.getElementById('custom-prompt-input');
  ctx.promptOkBtn = document.getElementById('custom-prompt-ok');
  ctx.promptCancelBtn = document.getElementById('custom-prompt-cancel');

  ctx.homeBtn = document.getElementById('home-btn');
  ctx.tocBtn = document.getElementById('toc-btn');
  ctx.historyBtn = document.getElementById('history-btn');
  ctx.settingsBtn = document.getElementById('settings-btn');

  ctx.tocList = document.getElementById('toc-list');
  ctx.tocSearch = document.getElementById('toc-search');
  ctx.historyList = document.getElementById('history-list');
  ctx.importedFilesList = document.getElementById('imported-files-list');
  ctx.sortBooksSelect = document.getElementById('sort-books-select');

  ctx.fontSizeInput = document.getElementById('font-size-input');
  ctx.fontSizeValue = document.getElementById('font-size-value');
  ctx.fontFamilySelect = document.getElementById('font-family-select');
  ctx.colorThemesContainer = document.getElementById('color-themes-container');
  ctx.bgColorPicker = document.getElementById('bg-color-picker');
  ctx.textColorPicker = document.getElementById('text-color-picker');
  ctx.deleteAllDataBtn = document.getElementById('delete-all-data');
  ctx.originalFormatToggle = document.getElementById('original-format-toggle');
  ctx.addThemeBtn = document.getElementById('add-theme-btn');
}

export function initDefaultSettings() {
  ctx.settings = {
    fontSize: 32,
    fontFamily: 'Arial',
    activeThemeName: 'Hồng',
    keepOriginalFormat: false,
    sortOrder: 'lastOpened',
    customColors: { bg: '#1a1a1a', text: '#e0e0e0' },
    themes: [
      { name: 'Tối', bg: '#121212', text: '#E0E0E0', surface: '#1e1e1e', border: '#3a3a3a', isCustom: false },
      { name: 'Giấy', bg: '#FBF0D9', text: '#5B4636', surface: '#f4e8c8', border: '#e6d5b0', isCustom: false },
      { name: 'Xám', bg: '#D3D3D3', text: '#111111', surface: '#c0c0c0', border: '#aaaaaa', isCustom: false },
      { name: 'Xanh', bg: '#002B36', text: '#93A1A1', surface: '#003c4d', border: '#00556e', isCustom: false },
      { name: 'Hồng', bg: 'rgb(35, 38, 39)', text: 'rgb(247, 183, 183)', surface: '#36393a', border: '#4a4e4f', isCustom: false }
    ]
  };
}
