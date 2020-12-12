export function getColorString(text) {
  if (!text) {
    return 'rgba(50,50,50,.75)';
  }
  let idNrTxt =
    text
      .split('')
      .map((c) => c.charCodeAt())
      .reduce((v1, v2) => v1 + v2) + '';
  let offset = 140;
  let nr1 = parseInt(idNrTxt.substr(0, 2));
  let nr2 = parseInt(idNrTxt.substr(-2));
  let r = offset + nr1 - 90,
    g = offset - nr1 + text.length,
    b = offset + nr2;
  return `rgba(${r},${g},${b},.75)`;
}

export function getUrlQueryParameterByName(name, url) {
  if (!url || !url.length) return;
  name = name.replace(/[\[\]]/g, '\\$&');
  if (url[0] != '?' && url[0] != '&') {
    url = `?${url}`;
  }
  var regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export function isValidUrl(url) {
  var pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~:+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ); // fragment locator
  return !!pattern.test(url);
}

export function removeHtml(text) {
  if (!text) return null;
  var temporalDivElement = document.createElement('div');
  temporalDivElement.innerHTML = text;
  return temporalDivElement.textContent || temporalDivElement.innerText || '';
}

export function getTime(part1, part2) {
  if (!part2) part2 = 0;
  part1 += '';
  part2 += '';
  return `${part1.padStart(2, '0')}:${part2.padStart(2, '0')}`;
}

export function getTimeFromSeconds(secs) {
  if (!secs) {
    return getTime(0, 0);
  }
  return getTime(Math.floor(secs / 60), Math.floor(secs % 60));
}
export function getSecondsFromTime(timeString) {
  if (!timeString) return 0;
  let partsArray = timeString.split(':');
  if (partsArray.length === 1) {
    return isNaN(partsArray[0]) ? 0 : parseInt(partsArray[0]); // assume just seconds
  }
  let secs = 0;
  if (partsArray.length === 2) {
    // assume minutes:seconds
    if (!isNaN(partsArray[0])) {
      let mins = parseInt(partsArray[0]);
      secs = mins > 0 ? mins * 60 : 0;
    }
    if (!isNaN(partsArray[1])) {
      secs += parseInt(partsArray[1]);
    }
    return secs;
  }
  if (partsArray.length === 3) {
    // assume hours:minutes:seconds
    if (!isNaN(partsArray[0])) {
      let hrs = parseInt(partsArray[0]);
      secs = hrs > 0 ? hrs * 3600 : 0;
    }
    if (!isNaN(partsArray[1])) {
      let mins = parseInt(partsArray[1]);
      secs += mins > 0 ? mins * 60 : 0;
    }
    if (!isNaN(partsArray[2])) {
      secs += parseInt(partsArray[1]);
    }
    return secs;
  }
  return 0;
}

export function getFlagEmojiFromLanguage(languageCode) {
  let code = languageCode;
  if (!code) return '';
  if (code.indexOf('-') != -1) {
    code = code.split('-')[1];
  }
  if (!/^[a-z]{2}$/i.test(code)) {
    return '';
  }
  // Copyright (c) 2019 Kelvin Liu - See https://github.com/thekelvinliu/country-code-emoji
  const OFFSET = 127397; // offset between uppercase ascii and regional indicator symbols
  const chars = [...code.toUpperCase()].map((c) => c.charCodeAt() + OFFSET);
  return String.fromCodePoint(...chars);
}

export function setDocumentMetaTags(title, description, image, url, hideUrl) {
  if (typeof window === 'undefined') return;
  title = title || '1tuner';
  description = description || 'Listen to radio, podcasts and create playlists.';
  image = image || 'https://1tuner.com/assets/icons/icon-512x512.png';
  url = url || window.location.href || 'https://1tuner.com';
  document.title = title + ' | ' + description;
  let metaTags = document.getElementsByTagName('meta');
  metaTags = Array.prototype.slice.call(metaTags);
  metaTags.forEach((tag) => {
    if (tag.hasAttribute('property')) {
      switch (tag.getAttribute('property')) {
        case 'og:title':
          tag.setAttribute('content', title);
          break;
        case 'og:url':
          tag.setAttribute('content', url);
          break;
        case 'og:image':
          tag.setAttribute('content', image);
          break;
        case 'og:description':
          tag.setAttribute('content', description);
          break;
      }
    }
  });
  let canonical = document.querySelector('link[rel="canonical"');
  if (hideUrl) {
    if (canonical) {
      document.querySelector('head').removeChild(canonical);
    }
    return;
  } else if (!canonical) {
    const headElement = document.head || document.querySelector('head');
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    headElement.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

// See https://gist.github.com/hagemann/382adfc57adbd5af078dc93feef01fe1
export function slugify(text) {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}
