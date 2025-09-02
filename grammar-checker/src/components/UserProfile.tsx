import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ language, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguageSubmenu, setShowLanguageSubmenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Fallback user data if not authenticated
  const displayUser = user || {
    name: 'Guest User',
    email: 'guest@example.com',
    avatar: null,
    initials: 'GU'
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLanguageSubmenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = (selectedLanguage: Language) => {
    onLanguageChange(selectedLanguage);
    setShowLanguageSubmenu(false);
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    setIsOpen(!isOpen);
    setShowLanguageSubmenu(false);
  };

  const handleLanguageMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLanguageSubmenu(!showLanguageSubmenu);
  };

  const handleSettingsClick = () => {
    // TODO: Implement settings modal
    console.log('Settings clicked');
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Profile Button */}
      <button
        onClick={handleProfileClick}
        className="flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 group min-w-0"
        aria-label="User profile menu"
      >
        {/* User Avatar */}
        <div className="relative flex-shrink-0">
          {displayUser.avatar ? (
            <img 
              src={displayUser.avatar} 
              alt={displayUser.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 group-hover:border-gray-300 transition-colors"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center border-2 border-gray-200 group-hover:border-gray-300 transition-colors">
              <span className="text-white font-semibold text-sm">{displayUser.initials}</span>
            </div>
          )}
          {/* Online Status Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        
        {/* User Info - Hidden on mobile */}
        <div className="hidden sm:flex sm:flex-col sm:items-start sm:justify-center text-left min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors truncate max-w-full">
            {displayUser.name}
          </div>
          <div className="text-xs text-gray-500 flex items-center space-x-1.5 mt-0.5">
            <span className="text-base leading-none">{currentLanguage.flag}</span>
            <span className="font-medium">{currentLanguage.code.toUpperCase()}</span>
          </div>
        </div>
        
        {/* Dropdown Arrow */}
        <div className="flex-shrink-0">
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-200 py-3 z-50 overflow-hidden">
          {/* User Info Section */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              {displayUser.avatar ? (
                <img 
                  src={displayUser.avatar} 
                  alt={displayUser.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-base">{displayUser.initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{displayUser.name}</h3>
                <p className="text-xs text-gray-500 truncate">{displayUser.email}</p>
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Language Settings */}
            <div className="relative">
              <button
                onClick={handleLanguageMenuClick}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors duration-150 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                    <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">Language</div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1.5 mt-0.5">
                      <span className="text-sm">{currentLanguage.flag}</span>
                      <span>{currentLanguage.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      showLanguageSubmenu ? 'rotate-90' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              
              {/* Language Submenu */}
              {showLanguageSubmenu && (
                <div className="bg-gray-50 border-t border-gray-100">
                  <div className="max-h-48 overflow-y-auto">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang.code)}
                        className={`w-full flex items-center space-x-4 px-9 py-3 text-left hover:bg-gray-100 transition-colors duration-150 ${
                          lang.code === language ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-base flex-shrink-0">{lang.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{lang.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{lang.code}</div>
                        </div>
                        {lang.code === language && (
                          <div className="flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center space-x-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors duration-150 group"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">Settings</div>
                <div className="text-xs text-gray-500 mt-0.5">Preferences and configuration</div>
              </div>
            </button>

            {/* Help & Support */}
            <button
              className="w-full flex items-center space-x-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors duration-150 group"
            >
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">Help & Support</div>
                <div className="text-xs text-gray-500 mt-0.5">Get help and documentation</div>
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 my-3"></div>

            {/* Logout */}
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center space-x-4 px-5 py-3.5 text-left hover:bg-red-50 transition-colors duration-150 group"
            >
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-red-900">Sign Out</div>
                <div className="text-xs text-red-500 mt-0.5">Sign out of your account</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;