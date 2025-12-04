const LocalStorage = require('./LocalStorage');
// const S3Storage = require('./S3Storage');

let storageProvider;

if (process.env.NODE_ENV === 'production') {
  // storageProvider = new S3Storage();
  storageProvider = new LocalStorage();
} else {
  storageProvider = new LocalStorage();
}

module.exports = storageProvider;
