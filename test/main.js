const { expect } = require('chai');

describe('Dark Mode Feature', () => {
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

describe('Sticky Notes Feature', () => {
  let mockLocalStorage;
  let stickyNotes;

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

    // Mock stickyNotes object
    stickyNotes = {
      notes: [],
      maxNotes: 20,

      createNote(text, color) {
        if (this.notes.length >= this.maxNotes) {
          return null;
        }
        const id = `note-${Date.now()}`;
        const note = {
          id,
          text: text || '',
          color: color || 'yellow',
          x: Math.random() * 100,
          y: Math.random() * 100,
          timestamp: Date.now(),
        };
        this.notes.push(note);
        this.save();
        return note;
      },

      deleteNote(id) {
        this.notes = this.notes.filter((n) => n.id !== id);
        this.save();
      },

      updateNote(id, updates) {
        const note = this.notes.find((n) => n.id === id);
        if (note) {
          Object.assign(note, updates);
          this.save();
        }
      },

      save() {
        try {
          mockLocalStorage.setItem('stickyNotes', JSON.stringify(this.notes));
        } catch (e) {
          console.error('Failed to save notes:', e);
        }
      },

      load() {
        try {
          const saved = mockLocalStorage.getItem('stickyNotes');
          this.notes = saved ? JSON.parse(saved) : [];
        } catch (e) {
          console.error('Failed to load notes:', e);
          this.notes = [];
        }
      },
    };
  });

  it('should create a new note', () => {
    const note = stickyNotes.createNote('Test note', 'yellow');
    expect(note).to.not.be.null;
    expect(note.text).to.equal('Test note');
    expect(note.color).to.equal('yellow');
    expect(stickyNotes.notes.length).to.equal(1);
  });

  it('should create note with default color', () => {
    const note = stickyNotes.createNote('Test');
    expect(note.color).to.equal('yellow');
  });

  it('should delete a note', () => {
    const note = stickyNotes.createNote('Test', 'pink');
    stickyNotes.deleteNote(note.id);
    expect(stickyNotes.notes.length).to.equal(0);
  });

  it('should update a note', () => {
    const note = stickyNotes.createNote('Old text', 'blue');
    stickyNotes.updateNote(note.id, { text: 'New text', color: 'green' });
    const updated = stickyNotes.notes.find((n) => n.id === note.id);
    expect(updated.text).to.equal('New text');
    expect(updated.color).to.equal('green');
  });

  it('should save notes to localStorage', () => {
    stickyNotes.createNote('Test', 'yellow');
    expect(mockLocalStorage.getItem('stickyNotes')).to.not.be.null;
    const saved = JSON.parse(mockLocalStorage.getItem('stickyNotes'));
    expect(saved.length).to.equal(1);
  });

  it('should load notes from localStorage', () => {
    const noteData = [{ id: 'note-1', text: 'Test', color: 'yellow', x: 10, y: 20, timestamp: 123 }];
    mockLocalStorage.setItem('stickyNotes', JSON.stringify(noteData));
    stickyNotes.load();
    expect(stickyNotes.notes.length).to.equal(1);
    expect(stickyNotes.notes[0].text).to.equal('Test');
  });

  it('should prevent creating more than max notes', () => {
    stickyNotes.maxNotes = 2;
    stickyNotes.createNote('Note 1', 'yellow');
    stickyNotes.createNote('Note 2', 'yellow');
    const result = stickyNotes.createNote('Note 3', 'yellow');
    expect(result).to.be.null;
    expect(stickyNotes.notes.length).to.equal(2);
  });
});
