const fs = require('fs');
const path = require('path');

class LocalStorage {
  constructor() {
    this.baseDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async save(fileBuffer, fileName, folder = '') {
    const targetPath = path.join(this.baseDir, folder, fileName);
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(targetPath, fileBuffer);

    const folderPrefix = folder ? `${folder}/` : '';
    return `/avatars/${folderPrefix}${fileName}`;
  }

  async delete(filePath) {
    if (!filePath || filePath.startsWith('http') || filePath.startsWith('https')) {
      return;
    }

    try {
      const relativePath = filePath.replace(/^\/avatars\//, '');
      const fullPath = path.join(this.baseDir, relativePath);

      await fs.promises.access(fullPath);
      await fs.promises.unlink(fullPath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`[LocalStorage] Erro ao deletar: ${filePath}`, err);
      }
    }
  }
}

module.exports = LocalStorage;
