export interface FileMetadata {
  name: string;
  size: number;
  lastModified: string;
  contentType?: string;
  etag?: string;
}

export interface StorageProvider {
  upload(filename: string, buffer: Buffer, contentType?: string): Promise<void>;
  download(filename: string): Promise<Buffer>;
  delete(filename: string): Promise<void>;
  list(): Promise<FileMetadata[]>;
  exists(filename: string): Promise<boolean>;
  getUrl?(filename: string): Promise<string>;
}

export interface StorageConfig {
  mode: 'local' | 's3' | 'sftp' | 'ftp' | 'webdav';
  
  // S3 Config
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    endpoint?: string; // For S3-compatible services
  };
  
  // SFTP Config
  sftp?: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    remotePath: string;
  };
  
  // FTP Config
  ftp?: {
    host: string;
    port: number;
    username: string;
    password: string;
    secure: boolean; // FTPS
    remotePath: string;
  };
  
  // WebDAV Config
  webdav?: {
    url: string;
    username: string;
    password: string;
    remotePath: string;
  };
  
  // Local Config
  local?: {
    uploadPath: string;
  };
}