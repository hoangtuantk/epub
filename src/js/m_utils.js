export function adjustColor(hex, percent) {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.min(255, Math.max(0, r + (r * percent / 100)));
  g = Math.min(255, Math.max(0, g + (g * percent / 100)));
  b = Math.min(255, Math.max(0, b + (b * percent / 100)));

  const toHex = c => ('0' + Math.round(c).toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function blobUrlToBase64(blobUrl) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', blobUrl, true);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status === 200) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(xhr.response);
      } else { resolve(null); }
    };
    xhr.onerror = () => resolve(null);
    xhr.send();
  });
}
