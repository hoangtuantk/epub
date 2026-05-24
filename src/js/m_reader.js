import { ctx } from './m_context.js';
import { saveBookToDB, getBookFromDB, getAllBooksFromDB, deleteBookFromDB } from './m_db.js';
import { showCustomAlert } from './m_modals.js';
import { blobUrlToBase64 } from './m_utils.js';
import { loadSettings, applyReaderSettings } from './m_ui.js';

export async function handleFileSelect(event) {
  const files = event.target.files;
  if (!files.length) return;

  let importCount = 0, errorCount = 0;
  ctx.fileInput.disabled = true;

  for (const file of files) {
    const bookId = `${file.name}-${file.size}`;
    const reader = new FileReader();

    await new Promise((resolve) => {
      reader.onload = async (e) => {
        try {
          if (file.name.toLowerCase().endsWith('.txt')) {
            const bookData = { id: bookId, title: file.name, fileData: e.target.result, type: 'txt', lastOpened: new Date(), coverUrl: null, metadata: null };
            await saveBookToDB(bookData);
          } else if (file.name.toLowerCase().endsWith('.epub')) {
            const buffer = e.target.result;
            const tempBook = ePub(buffer);
            await tempBook.ready;
            const coverUrlBlob = await tempBook.coverUrl();
            const coverUrl = coverUrlBlob ? await blobUrlToBase64(coverUrlBlob) : null;
            const metadata = tempBook.packaging.metadata;
            const bookData = { id: bookId, title: metadata.title || file.name, fileData: buffer, type: 'epub', lastOpened: new Date(), coverUrl, metadata };
            await saveBookToDB(bookData);
            tempBook.destroy();
          }
          importCount++;
        } catch (err) { console.error(`Lỗi xử lý file: ${file.name}`, err); errorCount++; }
        finally { resolve(); }
      };
      reader.onerror = () => { console.error(`Không thể đọc file: ${file.name}`, reader.error); errorCount++; resolve(); };
      if (file.name.toLowerCase().endsWith('.txt')) reader.readAsText(file, 'UTF-8'); else reader.readAsArrayBuffer(file);
    });
  }

  await displayImportedFiles();
  showCustomAlert(`Hoàn tất! Đã nhập thành công ${importCount} sách. ${errorCount > 0 ? `Bỏ qua ${errorCount} sách bị lỗi.` : ''}`);
  ctx.fileInput.disabled = false;
  event.target.value = '';
}

export async function openBookFromDB(bookId) {
  try {
    const bookData = await getBookFromDB(bookId);
    if (bookData) {
      bookData.lastOpened = new Date();
      await saveBookToDB(bookData);
      ctx.currentBookId = bookId;
      ctx.currentBookType = bookData.type;
      if (bookData.type === 'epub') renderEpub(bookData.fileData, bookData.title);
      else if (bookData.type === 'txt') renderTxt(bookData.fileData, bookData.title);
    } else {
      showCustomAlert("Không tìm thấy sách. Có thể đã bị xóa.");
      displayImportedFiles();
    }
  } catch (err) { showCustomAlert(`Lỗi khi mở sách: ${err.message}`); }
}

export function cleanupViewer() {
  if (ctx.rendition) ctx.rendition.destroy();
  ctx.rendition = null;
  ctx.viewer.innerHTML = '';
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'none';
}

export function renderEpub(bookData, title) {
  cleanupViewer();
  try {
    ctx.book = ePub(bookData);
    ctx.rendition = ctx.book.renderTo(ctx.viewer, { flow: "scrolled", width: "100%", height: "100%" });
    const savedLocation = localStorage.getItem(`location-${ctx.currentBookId}`);
    ctx.rendition.display(savedLocation || undefined);
    ctx.book.ready.then(() => {
      updateBookInfo(title);
      populateTOC(ctx.book.navigation.toc);
      loadSettings();
      applyReaderSettings();
    });
    ctx.rendition.on('relocated', location => {
      localStorage.setItem(`location-${ctx.currentBookId}`, location.start.cfi);
      updateChapterInfo(location);
    });
  } catch (err) { showCustomAlert(`Không thể tải file EPUB. Lỗi: ${err.message}`); }
}

export function renderTxt(textContent, title) {
  cleanupViewer();
  const pre = document.createElement('pre');
  pre.id = 'txt-content';
  pre.textContent = textContent;
  ctx.viewer.appendChild(pre);
  updateBookInfo(title, "File TXT");
  loadSettings();
  applyReaderSettings();
}

export async function displayImportedFiles() {
  const container = document.getElementById('imported-files-container');
  if (!container) return;
  const allBooks = await getAllBooksFromDB();
  if (allBooks && allBooks.length > 0) {
    container.style.display = 'block';
    ctx.importedFilesList.innerHTML = '';
    if (ctx.settings.sortOrder === 'lastOpened') allBooks.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
    else if (ctx.settings.sortOrder === 'title-asc') allBooks.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    else if (ctx.settings.sortOrder === 'title-desc') allBooks.sort((a, b) => b.title.localeCompare(a.title, 'vi'));
    allBooks.forEach(bookMeta => {
      const li = document.createElement('li');
      li.dataset.bookId = bookMeta.id;
      li.innerHTML = `
        <button class="delete-book-btn" title="Xóa sách">&times;</button>
        <div class="book-card-cover"><img src="${bookMeta.coverUrl || './img/logo.png'}" alt="Bìa sách"></div>
        <div class="book-card-title">${bookMeta.title}</div>
        <div class="book-card-actions">
          <button class="info-btn">Thông tin</button>
          <button class="read-btn">Đọc</button>
        </div>`;
      ctx.importedFilesList.appendChild(li);
    });
  } else { container.style.display = 'none'; }
}

export async function showBookInfo(bookId) {
  const bookData = await getBookFromDB(bookId);
  const details = document.getElementById('book-info-details');
  if (!bookData || !bookData.metadata) {
    details.innerHTML = '<p>Không có thông tin chi tiết cho sách này.</p>';
  } else {
    const md = bookData.metadata;
    details.innerHTML = `
      <p><strong>Tên sách:</strong> ${md.title || 'Không có'}</p>
      <p><strong>Tác giả:</strong> ${md.creator || 'Không có'}</p>
      <p><strong>Nhà xuất bản:</strong> ${md.publisher || 'Không có'}</p>
      <p><strong>Ngày xuất bản:</strong> ${md.pubdate || 'Không có'}</p>
      <p class="description"><strong>Mô tả:</strong> ${md.description || 'Không có'}</p>`;
  }
  ctx.bookInfoModal.classList.remove('hidden');
}

export function updateBookInfo(title, chapterText = "") {
  ctx.bookTitleEl.textContent = title;
  ctx.chapterInfoEl.textContent = chapterText;
  localStorage.setItem('lastOpenedBook', ctx.currentBookId);
}

export function updateChapterInfo(location) {
  const currentChapter = ctx.book.navigation.get(location.start.href);
  if (currentChapter && currentChapter.label) {

    // Gộp tất cả các mục lớn/nhỏ lại để đếm tổng số chương chính xác
    const flatToc = [];
    function flatten(items) {
      items.forEach(item => {
        flatToc.push(item);
        if (item.subitems) flatten(item.subitems);
      });
    }
    flatten(ctx.book.navigation.toc);

    const totalChapters = flatToc.length;
    const currentIndex = flatToc.findIndex(item => item.href === currentChapter.href) + 1;

    ctx.chapterInfoEl.textContent = `${currentIndex}/${totalChapters} - ${currentChapter.label.trim()}`;

    // 1. Tự động lấy và xử lý TÊN TRUYỆN thành dạng viết liền không dấu (Ví dụ: "de-ba")
    const bookTitle = ctx.book.package.metadata.title || "truyen";
    const bookSlug = bookTitle.toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-').replace(/-+/g, '-').trim();

    // 2. Tự động lấy và xử lý TIÊU ĐỀ CHƯƠNG thành dạng viết liền không dấu (Ví dụ: "chuong-09-bao-luc")
    const chapterTitle = currentChapter.label.trim();
    const chapterSlug = chapterTitle.toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-').replace(/-+/g, '-').trim();

    // 3. Đổi đường link hiển thị đúng cấu trúc (Ví dụ: /?n=de-ba#11?t=chuong-09-bao-luc)
    window.history.replaceState(null, '', '/?n=' + bookSlug + '#' + currentIndex + '?t=' + chapterSlug);

    // 4. Đổi tiêu đề tab trình duyệt đúng cấu trúc (Ví dụ: Ebook | Đế Bá | Chương 09: Bạo lực)
    //document.title = 'Ebook' + bookTitle + ' | ' + chapterTitle;
    document.title = chapterTitle + ' | ' + bookTitle + ' | ' + 'Trình Đọc Ebook';
  }
}

export function populateTOC(toc) {
  ctx.tocList.innerHTML = '';
  if (!toc || toc.length === 0) { ctx.tocList.innerHTML = '<li>Không có mục lục.</li>'; return; }

  // Hàm đệ quy tạo danh sách dạng Accordion (Thu gọn/Mở rộng)
  function renderTocItems(items, parentUl) {
    items.forEach(item => {
      const li = document.createElement('li');
      // Tắt CSS mặc định để ta tự trang trí
      li.style.padding = '0';
      li.style.borderBottom = 'none';

      // Tạo vùng bọc chứa tiêu đề và nút bấm (trên 1 hàng ngang)
      const itemDiv = document.createElement('div');
      itemDiv.style.padding = '12px 20px';
      itemDiv.style.borderBottom = '1px solid var(--border-color)';
      itemDiv.style.display = 'flex';
      itemDiv.style.justifyContent = 'space-between';
      itemDiv.style.alignItems = 'center';
      itemDiv.style.cursor = 'pointer';

      // Hiệu ứng đổi màu khi di chuột qua
      itemDiv.addEventListener('mouseenter', () => itemDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.05)');
      itemDiv.addEventListener('mouseleave', () => itemDiv.style.backgroundColor = 'transparent');

      // Phần chữ (Bấm vào đây để chuyển chương sách)
      const textSpan = document.createElement('span');
      textSpan.textContent = item.label.trim();
      textSpan.style.flexGrow = '1';
      textSpan.addEventListener('click', () => {
        if (ctx.rendition) ctx.rendition.display(item.href);
        ctx.tocModal.classList.add('hidden');
      });

      itemDiv.appendChild(textSpan);

      // Nếu mục này CÓ chứa các mục lục con bên trong
      if (item.subitems && item.subitems.length > 0) {
        // Tạo nút bấm hình mũi tên ▼
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'toc-toggle'; // Đặt tên class để hàm tìm kiếm phía dưới sử dụng
        toggleBtn.innerHTML = '&#9660;'; // Mã HTML của hình mũi tên
        toggleBtn.style.padding = '5px 15px';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.style.transition = 'transform 0.3s';
        toggleBtn.style.transform = 'rotate(-90deg)'; // Mặc định mũi tên nằm ngang (trạng thái Đóng)

        // Tạo thư mục con (Ẩn đi theo mặc định)
        const subUl = document.createElement('ul');
        subUl.style.display = 'block';
        subUl.style.listStyle = 'none';
        subUl.style.paddingLeft = '20px'; // Thụt lề vào trong cho đẹp
        subUl.style.margin = '0';

        // Mũi tên chỉ xuống mặc định
        toggleBtn.style.transform = 'rotate(0deg)';

        // Lệnh kích hoạt khi bấm vào mũi tên: Đóng/Mở thư mục
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Ngăn việc click nhầm sang phần chữ đọc truyện
          if (subUl.style.display === 'none') {
            subUl.style.display = 'block'; // Mở
            toggleBtn.style.transform = 'rotate(0deg)'; // Mũi tên chỉ xuống
          } else {
            subUl.style.display = 'none'; // Đóng
            toggleBtn.style.transform = 'rotate(-90deg)'; // Mũi tên chỉ ngang
          }
        });

        itemDiv.appendChild(toggleBtn);
        li.appendChild(itemDiv);

        // Tiếp tục quét các mục con bên trong (vòng lặp đệ quy)
        renderTocItems(item.subitems, subUl);
        li.appendChild(subUl);
      } else {
        // Không có thư mục con thì chỉ hiển thị tiêu đề
        li.appendChild(itemDiv);
      }

      parentUl.appendChild(li);
    });
  }

  // Xóa khoảng cách thừa của danh sách gốc
  ctx.tocList.style.padding = '0';
  renderTocItems(toc, ctx.tocList);
}

export function filterTOC() {
  const filter = ctx.tocSearch.value.toUpperCase();
  const items = ctx.tocList.getElementsByTagName('li');
  for (let i = 0; i < items.length; i++) {
    items[i].style.display = items[i].textContent.toUpperCase().includes(filter) ? "" : "none";
  }
}

export async function loadHistory() {
  ctx.historyList.innerHTML = '<li>Đang tải...</li>';
  const allBooks = await getAllBooksFromDB();
  allBooks.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
  ctx.historyList.innerHTML = '';
  if (allBooks.length === 0) { ctx.historyList.innerHTML = '<li>Chưa có sách nào.</li>'; return; }
  allBooks.forEach(bookMeta => {
    const li = document.createElement('li');
    li.dataset.bookId = bookMeta.id;
    li.innerHTML = `
      <div class="history-item-info">
        <span class="history-title">${bookMeta.title}</span>
        <span class="history-date">${new Date(bookMeta.lastOpened).toLocaleString('vi-VN')}</span>
      </div>
      <button class="delete-history-btn" title="Xóa khỏi lịch sử">&times;</button>`;
    li.querySelector('.history-item-info').addEventListener('click', () => {
      openBookFromDB(bookMeta.id);
      ctx.historyModal.classList.add('hidden');
    });
    ctx.historyList.appendChild(li);
  });
}

export function deleteBookFromHistory(bookId) {
  showCustomAlert(`Bạn có chắc muốn xóa sách này khỏi lịch sử? Thao tác này không thể hoàn tác.`, {
    showCancelButton: true,
    onOk: () => {
      deleteBookFromDB(bookId).then(() => {
        const item = ctx.historyList.querySelector(`li[data-book-id="${bookId}"]`);
        if (item) item.remove();
        if (ctx.historyList.children.length === 0) ctx.historyList.innerHTML = '<li>Chưa có sách nào.</li>';
        if (ctx.currentBookId === bookId) window.location.reload();
        else displayImportedFiles();
      }).catch(err => showCustomAlert(`Lỗi khi xóa sách: ${err.message}`));
    }
  });
}

export function deleteBookFromWelcomeScreen(bookId) {
  showCustomAlert(`Bạn có chắc muốn xóa vĩnh viễn sách này? Thao tác này không thể hoàn tác.`, {
    showCancelButton: true,
    onOk: () => {
      deleteBookFromDB(bookId)
        .then(() => {
          if (ctx.currentBookId === bookId) window.location.reload();
          else displayImportedFiles();
        })
        .catch(err => showCustomAlert(`Lỗi khi xóa sách: ${err.message}`));
    }
  });
}

// Logic xử lý nút Tìm kiếm toàn văn
document.getElementById('search-btn').addEventListener('click', async () => {
  const query = prompt("Nhập từ khóa cần tìm trong sách:");
  if (!query) return;

  // Hiển thị thông báo đang tìm kiếm (do tìm toàn bộ sách sẽ mất chút thời gian)
  const originalText = ctx.chapterInfoEl.textContent;
  ctx.chapterInfoEl.textContent = "Đang tìm kiếm...";

  // Quét toàn bộ nội dung trong các chương
  let results = [];
  for (let spineItem of ctx.book.spine.spineItems) {
    let content = await spineItem.load(ctx.book.load.bind(ctx.book));
    let matches = spineItem.find(query);
    results = results.concat(matches);
  }

  ctx.chapterInfoEl.textContent = originalText; // Trả lại text cũ

  if (results.length === 0) {
    alert("Không tìm thấy kết quả nào!");
  } else {
    // Nếu tìm thấy, chuyển tới kết quả đầu tiên
    alert(`Tìm thấy ${results.length} kết quả. Đang chuyển đến vị trí đầu tiên...`);
    ctx.rendition.display(results[0].cfi);
  }
});