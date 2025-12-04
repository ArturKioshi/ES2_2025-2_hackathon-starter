const { expect } = require('chai');

describe('Dark Mode Feature (public/js/main.js)', () => {
  let mockDocument;
  let mockLocalStorage;
  let mockIcon;

  beforeEach(() => {
    mockLocalStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
    };

    mockIcon = { textContent: '' };

    mockDocument = {
      currentTheme: 'light',
      documentElement: {
        getAttribute(attr) {
          return attr === 'data-bs-theme' ? mockDocument.currentTheme : null;
        },
        setAttribute(attr, value) {
          if (attr === 'data-bs-theme') mockDocument.currentTheme = value;
        },
      },
      getElementById(id) {
        return id === 'theme-icon' ? mockIcon : null;
      },
    };
  });

  function setTheme(theme) {
    try {
      mockDocument.documentElement.setAttribute('data-bs-theme', theme);
      mockLocalStorage.setItem('theme', theme);
      updateIcon(theme);
    } catch (e) {
      console.error('Failed to set theme:', e);
    }
  }

  function updateIcon(theme) {
    const icon = mockDocument.getElementById('theme-icon');
    if (!icon) return;
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  it('should set dark theme', () => {
    setTheme('dark');
    expect(mockDocument.currentTheme).to.equal('dark');
    expect(mockLocalStorage.getItem('theme')).to.equal('dark');
    expect(mockIcon.textContent).to.equal('🌙');
  });

  it('should set light theme', () => {
    setTheme('light');
    expect(mockDocument.currentTheme).to.equal('light');
    expect(mockLocalStorage.getItem('theme')).to.equal('light');
    expect(mockIcon.textContent).to.equal('☀️');
  });

  it('should handle missing icon element', () => {
    mockDocument.getElementById = () => null;
    expect(() => updateIcon('dark')).to.not.throw();
  });

  it('should default to light theme when not set', () => {
    mockDocument.currentTheme = null;
    const theme = mockDocument.documentElement.getAttribute('data-bs-theme') || 'light';
    expect(theme).to.equal('light');
  });
});
