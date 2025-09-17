import { StorageProvider, FileMetadata } from '../types';
import { readFile, writeFile, unlink, readdir, stat, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export class LocalStorageProvider implements StorageProvider {
  private uploadPath: string;

  constructor(uploadPath: string = 'uploads') {
    this.uploadPath = path.resolve(uploadPath);
  }

  private async ensureDirectory(): Promise<void> {
    if (!existsSync(this.uploadPath)) {
      await mkdir(this.uploadPath, { recursive: true });
    }
  }

  private getFilePath(filename: string): string {
    return path.join(this.uploadPath, filename);
  }

  async upload(filename: string, buffer: Buffer): Promise<void> {
    await this.ensureDirectory();
    const filepath = this.getFilePath(filename);
    await writeFile(filepath, buffer);
  }

  async download(filename: string): Promise<Buffer> {
    const filepath = this.getFilePath(filename);
    if (!existsSync(filepath)) {
      throw new Error(`File not found: ${filename}`);
    }
    return await readFile(filepath);
  }

  async delete(filename: string): Promise<void> {
    const filepath = this.getFilePath(filename);
    if (!existsSync(filepath)) {
      throw new Error(`File not found: ${filename}`);
    }
    await unlink(filepath);
  }

  async list(): Promise<FileMetadata[]> {
    await this.ensureDirectory();
    
    if (!existsSync(this.uploadPath)) {
      return [];
    }

    const files = await readdir(this.uploadPath);
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filepath = this.getFilePath(filename);
        const stats = await stat(filepath);
        
        return {
          name: filename,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
        };
      })
    );

    return fileDetails.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }

  async exists(filename: string): Promise<boolean> {
    const filepath = this.getFilePath(filename);
    return existsSync(filepath);
  }
}