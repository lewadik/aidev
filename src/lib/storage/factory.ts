import { StorageProvider, StorageConfig } from './types';
import { LocalStorageProvider } from './providers/local';
import { S3StorageProvider } from './providers/s3';
import { SFTPStorageProvider } from './providers/sftp';
import { FTPStorageProvider } from './providers/ftp';
import { WebDAVStorageProvider } from './providers/webdav';

export class StorageFactory {
  static create(config: StorageConfig): StorageProvider {
    switch (config.mode) {
      case 'local':
        return new LocalStorageProvider(config.local?.uploadPath || 'uploads');
      
      case 's3':
        if (!config.s3) {
          throw new Error('S3 configuration is required when mode is "s3"');
        }
        return new S3StorageProvider(config.s3);
      
      case 'sftp':
        if (!config.sftp) {
          throw new Error('SFTP configuration is required when mode is "sftp"');
        }
        return new SFTPStorageProvider(config.sftp);
      
      case 'ftp':
        if (!config.ftp) {
          throw new Error('FTP configuration is required when mode is "ftp"');
        }
        return new FTPStorageProvider(config.ftp);
      
      case 'webdav':
        if (!config.webdav) {
          throw new Error('WebDAV configuration is required when mode is "webdav"');
        }
        return new WebDAVStorageProvider(config.webdav);
      
      default:
        throw new Error(`Unsupported storage mode: ${config.mode}`);
    }
  }
}

export function getStorageConfig(): StorageConfig {
  const mode = (process.env.STORAGE_MODE || 'local') as StorageConfig['mode'];
  
  const config: StorageConfig = { mode };
  
  switch (mode) {
    case 's3':
      config.s3 = {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
        region: process.env.S3_REGION || 'us-east-1',
        bucket: process.env.S3_BUCKET || '',
        endpoint: process.env.S3_ENDPOINT,
      };
      break;
    
    case 'sftp':
      config.sftp = {
        host: process.env.SFTP_HOST || '',
        port: parseInt(process.env.SFTP_PORT || '22', 10),
        username: process.env.SFTP_USERNAME || '',
        password: process.env.SFTP_PASSWORD,
        privateKey: process.env.SFTP_PRIVATE_KEY,
        remotePath: process.env.SFTP_REMOTE_PATH || '/uploads',
      };
      break;
    
    case 'ftp':
      config.ftp = {
        host: process.env.FTP_HOST || '',
        port: parseInt(process.env.FTP_PORT || '21', 10),
        username: process.env.FTP_USERNAME || '',
        password: process.env.FTP_PASSWORD || '',
        secure: process.env.FTP_SECURE === 'true',
        remotePath: process.env.FTP_REMOTE_PATH || '/uploads',
      };
      break;
    
    case 'webdav':
      config.webdav = {
        url: process.env.WEBDAV_URL || '',
        username: process.env.WEBDAV_USERNAME || '',
        password: process.env.WEBDAV_PASSWORD || '',
        remotePath: process.env.WEBDAV_REMOTE_PATH || '/uploads',
      };
      break;
    
    case 'local':
    default:
      config.local = {
        uploadPath: process.env.LOCAL_UPLOAD_PATH || 'uploads',
      };
      break;
  }
  
  return config;
}

// Singleton instance
let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageInstance) {
    const config = getStorageConfig();
    storageInstance = StorageFactory.create(config);
  }
  return storageInstance;
}

// Reset instance (useful for testing or config changes)
export function resetStorageProvider(): void {
  storageInstance = null;
}