import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const normalizedUrlWithoutScheme = (url: string): string => {
  return url ? url.replace(/^https?:\/\//, '').replace(/\/+$/, '') : '';
};

export const getPodcastUrlID = (url: string): string => {
  const normalizedUrl = normalizedUrlWithoutScheme(url);
  const urlParts = normalizedUrl.split('/');
  return btoa(urlParts[urlParts.length - 1]);
};

// See https://gist.github.com/hagemann/382adfc57adbd5af078dc93feef01fe1
export const slugify = (text: string): string => {
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
};

export const stripHtml = (html: string) => {
  if (typeof window === 'undefined') return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const getTime = (part1: number, part2: number) => {
  if (!part2) part2 = 0;
  return `${part1.toString().padStart(2, '0')}:${part2.toString().padStart(2, '0')}`;
};

export const getTimeStringFromSeconds = (secs: number) => {
  if (!secs) return getTime(0, 0);
  const minutes = secs / 60;
  return getTime(Math.floor(minutes / 60), Math.floor(minutes % 60));
};
