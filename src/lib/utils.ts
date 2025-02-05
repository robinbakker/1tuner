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
  return btoa(normalizedUrl);
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

export const getTimeStringFromMinutes = (minutes: number) => {
  return getTimeStringFromSeconds(minutes * 60);
};

export const getTimeInMinutesFromTimeString = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const roundTo15Minutes = (minutes: number) => {
  return Math.round(minutes / 15) * 15;
};

export const getColorString = (text: string) => {
  if (!text) return 'rgba(50,50,50,.75)';
  let idNrTxt = `${[...text].map((c) => c.charCodeAt(0)).reduce((v1, v2) => v1 + v2)}`;
  let offset = 140;
  let nr1 = +idNrTxt.substring(0, 2);
  let nr2 = +idNrTxt.substring(2);
  let r = offset + nr1 - 90,
    g = offset - nr1 + text.length,
    b = offset + nr2;
  return `rgba(${r},${g},${b},.75)`;
};
