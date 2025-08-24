import { ctx } from './m_context.js';
import { adjustColor } from './m_utils.js';
import { clearDB } from './m_db.js';
import { showCustomAlert, showCustomPrompt } from './m_modals.js';

export function loadSettings() {
  const saved = JSON.parse(localStorage.getItem('ebookReaderSettings_v2'));
  if (saved) ctx.settings = { ...ctx.settings, ...saved };
}
export function saveSettings() {
  localStorage.setItem('ebookReaderSettings_v2', JSON.stringify(ctx.settings));
}
export function applyThemeToApp() {
  const theme = ctx.settings.themes.find(t => t.name === ctx.settings.activeThemeName) || ctx.settings.themes[0];
  const root = document.documentElement;
  root.style.setProperty('--app-bg', theme.bg);
  root.style.setProperty('--app-text', theme.text);
  root.style.setProperty('--surface-bg', theme.surface);
  root.style.setProperty('--border-color', theme.border);
}

export function applyReaderSettings() {
  const themeColors = (ctx.settings.activeThemeName === 'custom')
    ? ctx.settings.customColors
    : (ctx.settings.themes.find(t => t.name === ctx.settings.activeThemeName) || ctx.settings.themes[0]);

  if (ctx.currentBookType === 'epub' && ctx.rendition) {
    ctx.rendition.themes.register("baseLayout", { "body": { 'padding': '20px !important', 'box-sizing': 'border-box !important' } });
    const customThemeRules = {
      "body": {
        'max-width': '1140px !important',
        'margin-left': 'auto !important',
        'margin-right': 'auto !important',
        'padding': '20px !important',
        'box-sizing': 'border-box !important',
        'background': `${themeColors.bg} !important`
      },
      "p, li, a, span, div, td, th, h1, h2, h3, h4, h5, h6, blockquote, pre": {
        'color': `${themeColors.text} !important`,
        'font-family': `${ctx.settings.fontFamily} !important`,
        'font-size': `${ctx.settings.fontSize}px !important`,
        'line-height': '1.6 !important',
        'background-color': 'transparent !important'
      },
      "p": { 'text-indent': '0 !important', 'margin-top': '0 !important', 'margin-bottom': '1em !important' },
      "a": { 'color': 'inherit !important', 'text-decoration': 'underline !important' }
    };
    ctx.rendition.themes.register("customTheme", customThemeRules);
    if (ctx.settings.keepOriginalFormat) { ctx.rendition.themes.select("baseLayout"); }
    else { ctx.rendition.themes.select("customTheme"); }
  } else if (ctx.currentBookType === 'txt') {
    const txt = document.getElementById('txt-content');
    if (txt) {
      txt.style.backgroundColor = themeColors.bg;
      txt.style.color = themeColors.text;
      txt.style.fontSize = `${ctx.settings.fontSize}px`;
      txt.style.fontFamily = ctx.settings.fontFamily;
      txt.style.lineHeight = '1.6';
    }
  }
}

export function updateUiWithSettings() {
  ctx.fontSizeInput.value = ctx.settings.fontSize;
  ctx.fontSizeValue.textContent = ctx.settings.fontSize;
  ctx.fontFamilySelect.value = ctx.settings.fontFamily;
  ctx.bgColorPicker.value = ctx.settings.customColors.bg;
  ctx.textColorPicker.value = ctx.settings.customColors.text;
  ctx.originalFormatToggle.checked = ctx.settings.keepOriginalFormat;
  ctx.sortBooksSelect.value = ctx.settings.sortOrder;
  updateActiveThemeButton();
  updateSettingsControlsState();
}

export function updateSettingsControlsState() {
  const isDisabled = ctx.settings.keepOriginalFormat;
  document.querySelectorAll('[data-setting-control]').forEach(w => {
    w.classList.toggle('disabled', isDisabled);
    w.querySelectorAll('input, select').forEach(i => i.disabled = isDisabled);
  });
}

export function renderColorThemes() {
  ctx.colorThemesContainer.innerHTML = '';
  ctx.settings.themes.forEach(theme => {
    const div = document.createElement('div');
    div.className = 'theme-option';
    div.title = theme.name;
    div.style.backgroundColor = theme.bg;
    div.style.borderColor = theme.text;
    div.addEventListener('click', () => {
      if (ctx.settings.keepOriginalFormat) return;
      ctx.settings.activeThemeName = theme.name;
      applyThemeToApp();
      applyReaderSettings();
      updateActiveThemeButton();
      saveSettings();
    });

    if (theme.isCustom) {
      const del = document.createElement('button');
      del.className = 'delete-theme-btn';
      del.innerHTML = '&times;';
      del.title = `Xóa giao diện "${theme.name}"`;
      del.addEventListener('click', (e) => { e.stopPropagation(); deleteTheme(theme.name); });
      div.appendChild(del);
    }
    ctx.colorThemesContainer.appendChild(div);
  });
}

export function updateActiveThemeButton() {
  document.querySelectorAll('.theme-option')
    .forEach(btn => btn.classList.toggle('active', btn.title === ctx.settings.activeThemeName));
}

export function populateFontSelector() {
  ctx.fontFamilySelect.innerHTML = '';
  ctx.popularFonts.forEach(font => {
    const opt = document.createElement('option');
    opt.value = font; opt.textContent = font;
    ctx.fontFamilySelect.appendChild(opt);
  });
}

export async function addTheme() {
  try {
    const name = await showCustomPrompt("Nhập tên cho giao diện mới:");
    if (!name || name.trim() === '') { showCustomAlert("Tên giao diện không được để trống."); return; }
    if (ctx.settings.themes.some(t => t.name.toLowerCase() === name.trim().toLowerCase())) {
      showCustomAlert("Lỗi", "Tên giao diện này đã tồn tại."); return;
    }
    const bg = ctx.bgColorPicker.value;
    const text = ctx.textColorPicker.value;
    const isDark = (parseInt(bg.substring(1, 3), 16) * 0.299 + parseInt(bg.substring(3, 5), 16) * 0.587 + parseInt(bg.substring(5, 7), 16) * 0.114) < 186;
    const surfacePercent = isDark ? 15 : -10;
    const borderPercent = isDark ? 30 : -20;

    const newTheme = {
      name: name.trim(),
      bg, text,
      surface: adjustColor(bg, surfacePercent),
      border: adjustColor(bg, borderPercent),
      isCustom: true
    };

    ctx.settings.themes.push(newTheme);
    saveSettings();
    renderColorThemes();
    updateActiveThemeButton();
  } catch { /* người dùng hủy */ }
}

export function deleteTheme(themeName) {
  showCustomAlert(`Bạn có chắc chắn muốn xóa giao diện "${themeName}" không?`, {
    showCancelButton: true,
    onOk: () => {
      ctx.settings.themes = ctx.settings.themes.filter(t => t.name !== themeName);
      if (ctx.settings.activeThemeName === themeName) {
        ctx.settings.activeThemeName = 'Hồng';
        applyThemeToApp();
        applyReaderSettings();
      }
      saveSettings();
      renderColorThemes();
      updateActiveThemeButton();
    }
  });
}

export function deleteAllData() {
  showCustomAlert("Bạn có chắc chắn muốn xoá toàn bộ dữ liệu?", {
    showCancelButton: true,
    onOk: () => {
      clearDB().then(() => {
        localStorage.clear();
        showCustomAlert('Đã xoá toàn bộ dữ liệu.', { onOk: () => window.location.reload() });
      });
    }
  });
}
