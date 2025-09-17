import { StorageProvider, FileMetadata } from '../types';
import { Client } from 'ssh2';
import { Readable } from 'stream';

export class SFTPStorageProvider implements StorageProvider {
  private config: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    remotePath: string;
  };

  constructor(config: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    remotePath: string;
  }) {
    this.config = config;
  }

  private async createConnection(): Promise<{ conn: Client; sftp: any }> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ conn, sftp });
        });
      });

      conn.on('error', reject);

      const connectConfig: any = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
      };

      if (this.config.privateKey) {
        connectConfig.privateKey = this.config.privateKey;
      } else if (this.config.password) {
        connectConfig.password = this.config.password;
      }

      conn.connect(connectConfig);
    });
  }

  private getRemotePath(filename: string): string {
    return `${this.config.remotePath}/${filename}`.replace(/\/+/g, '/');
  }

  async upload(filename: string, buffer: Buffer): Promise<void> {
    const { conn, sftp } = await this.createConnection();
    
    try {
      const remotePath = this.getRemotePath(filename);
      
      await new Promise<void>((resolve, reject) => {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
        
        stream.pipe(writeStream);
      });
    } finally {
      conn.end();
    }
  }

  async download(filename: string): Promise<Buffer> {
    const { conn, sftp } = await this.createConnection();
    
    try {
      const remotePath = this.getRemotePath(filename);
      
      return await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const readStream = sftp.createReadStream(remotePath);
        
        readStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        readStream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        
        readStream.on('error', (err: any) => {
          if (err.code === 'ENOENT') {
            reject(new Error(`File not found: ${filename}`));
          } else {
            reject(err);
          }
        });
      });
    } finally {
      conn.end();
    }
  }

  async delete(filename: string): Promise<void> {
    const { conn, sftp } = await this.createConnection();
    
    try {
      const remotePath = this.getRemotePath(filename);
      
      await new Promise<void>((resolve, reject) => {
        sftp.unlink(remotePath, (err: any) => {
          if (err) {
            if (err.code === 'ENOENT') {
              reject(new Error(`File not found: ${filename}`));
            } else {
              reject(err);
            }
          } else {
            resolve();
          }
        });
      });
    } finally {
      conn.end();
    }
  }

  async list(): Promise<FileMetadata[]> {
    const { conn, sftp } = await this.createConnection();
    
    try {
      return await new Promise<FileMetadata[]>((resolve, reject) => {
        sftp.readdir(this.config.remotePath, (err: any, files: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          
          const fileDetails = files
            .filter(file => file.longname.startsWith('-')) // Only files, not directories
            .map(file => ({
              name: file.filename,
              size: file.attrs.size,
              lastModified: new Date(file.attrs.mtime * 1000).toISOString(),
            }))
            .sort((a, b) => 
              new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
            );
          
          resolve(fileDetails);
        });
      });
    } finally {
      conn.end();
    }
  }

  async exists(filename: string): Promise<boolean> {
    const { conn, sftp } = await this.createConnection();
    
    try {
      const remotePath = this.getRemotePath(filename);
      
      return await new Promise<boolean>((resolve) => {
        sftp.stat(remotePath, (err: any) => {
          resolve(!err);
        });
      });
    } finally {
      conn.end();
    }
  }
}