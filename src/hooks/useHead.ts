import { useLayoutEffect } from 'preact/hooks';

export type HeadData = {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
};

export const defaultHeadData = {
  title: '1tuner | listen to radio and podcasts',
  description: 'Listen to radio and podcasts for free. Discover new music and shows, create your own playlists.',
  image: `${import.meta.env.VITE_BASE_URL}/assets/icons/icon-512x512.png`,
  url: import.meta.env.VITE_BASE_URL,
  type: 'website',
};

export const useHead = (data: HeadData) => {
  // For prerendering
  if (
    typeof window === 'undefined' &&
    (typeof (globalThis as any).__HEAD_DATA__ === 'undefined' || (globalThis as any).__HEAD_DATA__.title !== data.title)
  ) {
    (globalThis as any).__HEAD_DATA__ = { ...defaultHeadData, ...data, title: `${data.title} | 1tuner.com` };
  }

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    const updateMetaTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const updateHead = (newData: HeadData) => {
      document.title = newData.title ? `${newData.title} | 1tuner.com` : defaultHeadData.title;
      updateMetaTag('og:title', newData.title || defaultHeadData.title);
      updateMetaTag('og:description', newData.description || '');
      updateMetaTag('og:image', newData.image || defaultHeadData.image);
      updateMetaTag('og:url', newData.url || defaultHeadData.url);
      updateMetaTag('og:type', newData.type || defaultHeadData.type);
    };
    updateHead(data);

    return () => {
      if (typeof document === 'undefined') return;
      updateHead(defaultHeadData);
    };
  }, [data]);
};
