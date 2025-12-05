/* eslint-env jquery, browser */
/* global $ */

$(() => {
  function setTheme(theme) {
    try {
      document.documentElement.setAttribute('data-bs-theme', theme);
      localStorage.setItem('theme', theme);
      updateIcon(theme);
    } catch (e) {
      console.error('Failed to set theme:', e);
    }
  }

  function updateIcon(theme) {
    var icon = document.getElementById('theme-icon');
    if (!icon) return;
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-bs-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  var initial = document.documentElement.getAttribute('data-bs-theme') || 'light';
  updateIcon(initial);

  var stickyNotes = {
    notes: [],
    maxNotes: 20,

    createNote(text, color) {
      if (this.notes.length >= this.maxNotes) {
        console.warn('Maximum notes reached');
        return null;
      }

      var viewportWidth = Math.max(0, window.innerWidth || 0);
      var viewportHeight = Math.max(0, window.innerHeight || 0);

      var id = `note-${Date.now()}`;
      var x = viewportWidth ? Math.random() * (viewportWidth - 270) : 24;
      var y = viewportHeight ? Math.random() * (viewportHeight - 270) : 120;

      var note = {
        id: id,
        text: text || '',
        color: color || 'yellow',
        x: Math.max(12, x),
        y: Math.max(12, y),
        timestamp: Date.now(),
      };

      this.notes.push(note);
      this.save();
      return note;
    },

    deleteNote(id) {
      this.notes = this.notes.filter(function (n) {
        return n.id !== id;
      });
      this.save();
      this.render();
    },

    updateNote(id, updates) {
      var note = this.notes.find(function (n) {
        return n.id === id;
      });
      if (note) {
        Object.assign(note, updates);
        this.save();
      }
    },

    save() {
      try {
        localStorage.setItem('stickyNotes', JSON.stringify(this.notes));
      } catch (e) {
        console.error('Failed to save notes:', e);
      }
    },

    load() {
      try {
        var saved = localStorage.getItem('stickyNotes');
        this.notes = saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error('Failed to load notes:', e);
        this.notes = [];
      }
    },

    render() {
      var container = document.getElementById('notes-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'notes-container';
        document.body.appendChild(container);
      }
      container.innerHTML = '';
      var self = this;
      this.notes.forEach(function (note) {
        var el = self.createNoteElement(note);
        container.appendChild(el);
      });
    },

    createNoteElement(note) {
      var div = document.createElement('div');
      div.className = `sticky-note ${note.color}`;
      div.id = note.id;
      div.style.left = `${note.x}px`;
      div.style.top = `${note.y}px`;
      div.style.width = '250px';
      div.style.height = '250px';
      div.style.padding = '12px';
      div.style.position = 'fixed';
      div.style.zIndex = '1501';
      div.style.cursor = 'move';
      div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      div.style.borderRadius = '8px';
      div.style.background = '#fef3c7';
      div.style.border = '2px solid #fcd34d';

      var date = new Date(note.timestamp).toLocaleString();
      div.innerHTML = `<div class="note-header"><button class="note-close">&times;</button></div><textarea class="note-text">${note.text}</textarea><small class="note-date">${date}</small>`;

      var self = this;
      div.querySelector('.note-close').onclick = function () {
        return self.deleteNote(note.id);
      };
      div.querySelector('textarea').onchange = function (e) {
        return self.updateNote(note.id, { text: e.target.value });
      };

      this.makeDraggable(div, note.id);
      return div;
    },

    makeDraggable(element, noteId) {
      var pos1 = 0;
      var pos2 = 0;
      var pos3 = 0;
      var pos4 = 0;
      var self = this;

      element.onmousedown = function (e) {
        pos3 = e.clientX;
        pos4 = e.clientY;

        document.onmouseup = function () {
          document.onmousemove = null;
        };

        document.onmousemove = function (e) {
          pos1 = pos3 - e.clientX;
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;

          var newTop = element.offsetTop - pos2;
          var newLeft = element.offsetLeft - pos1;

          element.style.top = `${newTop}px`;
          element.style.left = `${newLeft}px`;

          self.updateNote(noteId, { x: newLeft, y: newTop });
        };
      };
    },
  };

  stickyNotes.load();
  stickyNotes.render();

  var newNoteBtn = document.getElementById('new-note-btn');
  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', function () {
      stickyNotes.createNote('Sua nota aqui...', 'yellow');
      stickyNotes.render();
    });
  }

  window.stickyNotes = stickyNotes;
});
