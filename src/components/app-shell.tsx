'use client';

import { headerTitle } from '@/lib/store';
import { ArrowLeft, Headphones, Home, Radio, Settings, Share2 } from 'lucide-preact';
import { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';

interface AppShellProps {
  children: ComponentChildren;
}

export function AppShell({ children }: AppShellProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const menuItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Radio', href: '/radio-stations', icon: Radio },
    { name: 'Podcasts', href: '/podcasts', icon: Headphones },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    const mainElement = document.querySelector('main');

    const handleScroll = () => {
      const isMainScrolled = (mainElement?.scrollTop ?? 0) > 100;
      setIsScrolled(isMainScrolled);
    };

    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleBackClick = () => {
    history.back();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: headerTitle.value,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      console.log('Web Share API not supported');
      // Fallback behavior could be implemented here
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg md:relative md:h-full md:w-20 md:flex-shrink-0">
        <ul className="flex h-16 items-center justify-around md:h-full md:flex-col md:justify-start md:py-4">
          {menuItems.map((item) => (
            <li key={item.name} className="w-full">
              <a
                href={`${item.href}`}
                className="flex flex-col items-center justify-center p-2 hover:bg-gray-200 transition-colors duration-200"
              >
                <item.icon className="h-6 w-6 text-gray-600" />
                <span className="text-xs mt-1 text-center">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 overflow-auto">
        {!!headerTitle.value && (
          <header
            className={`sticky top-0 z-20 transition-all duration-300 ${isScrolled ? 'bg-white/20 backdrop-blur-md shadow-md' : 'bg-transparent'}`}
          >
            <div className="flex items-center justify-between p-4">
              <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200">
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className={`text-lg font-semibold transition-opacity truncate duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
                {headerTitle.value}
              </h1>
              <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200">
                <Share2 className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </header>
        )}
        <div className={'p-4'}>{children}</div>
      </main>
    </div>
  );
}
