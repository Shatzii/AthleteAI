import React, { useState, useEffect } from 'react';
import { getSupportedLanguages, setUserLanguage, getUserLanguage } from '../utils/api';
import './LanguageSelector.css';

const LanguageSelector = ({ onLanguageChange }) => {
  const [languages, setLanguages] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    loadLanguages();
    loadCurrentLanguage();
  }, []);

  const loadLanguages = async () => {
    try {
      const response = await getSupportedLanguages();
      if (response.success) {
        setLanguages(response.data);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const loadCurrentLanguage = async () => {
    try {
      const response = await getUserLanguage();
      if (response.success) {
        setCurrentLanguage(response.data.language);
      }
    } catch (error) {
      console.error('Error loading current language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (languageCode) => {
    setIsChanging(true);
    try {
      const response = await setUserLanguage(languageCode);
      if (response.success) {
        setCurrentLanguage(languageCode);
        if (onLanguageChange) {
          onLanguageChange(languageCode);
        }
        // Reload page to apply new language
        window.location.reload();
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="language-selector">
        <div className="language-selector-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Loading languages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="language-selector">
      <div className="language-selector-header">
        <i className="fas fa-globe"></i>
        <span>Select Language</span>
      </div>

      <div className="language-grid">
        {languages.map((language) => (
          <button
            key={language.code}
            className={`language-option ${currentLanguage === language.code ? 'active' : ''}`}
            onClick={() => handleLanguageChange(language.code)}
            disabled={isChanging}
          >
            <span className="language-flag">{language.flag}</span>
            <div className="language-info">
              <div className="language-name">{language.name}</div>
              <div className="language-native">{language.nativeName}</div>
            </div>
            {currentLanguage === language.code && (
              <i className="fas fa-check language-check"></i>
            )}
          </button>
        ))}
      </div>

      {isChanging && (
        <div className="language-changing">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Applying language...</span>
        </div>
      )}

      <div className="language-footer">
        <small>Language preference is saved to your account</small>
      </div>
    </div>
  );
};

export default LanguageSelector;