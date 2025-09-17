import { StorageProvider, FileMetadata } from '../types';

export class WebDAVStorageProvider implements StorageProvider {
  private config: {
    url: string;
    username: string;
    password: string;
    remotePath: string;
  };

  constructor(config: {
    url: string;
    username: string;
    password: string;
    remotePath: string;
  }) {
    this.config = config;
  }

  private getAuthHeaders(): HeadersInit {
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/octet-stream',
    };
  }

  private getFileUrl(filename: string): string {
    const path = `${this.config.remotePath}/${filename}`.replace(/\/+/g, '/');
    return `${this.config.url.replace(/\/$/, '')}${path}`;
  }

  async upload(filename: string, buffer: Buffer): Promise<void> {
    const url = this.getFileUrl(filename);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: buffer,
    });

    if (!response.ok) {
      throw new Error(`WebDAV upload failed: ${response.status} ${response.statusText}`);
    }
  }

  async download(filename: string): Promise<Buffer> {
    const url = this.getFileUrl(filename);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization as string,
      },
    });

    if (response.status === 404) {
      throw new Error(`File not found: ${filename}`);
    }

    if (!response.ok) {
      throw new Error(`WebDAV download failed: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(filename: string): Promise<void> {
    const url = this.getFileUrl(filename);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization as string,
      },
    });

    if (response.status === 404) {
      throw new Error(`File not found: ${filename}`);
    }

    if (!response.ok) {
      throw new Error(`WebDAV delete failed: ${response.status} ${response.statusText}`);
    }
  }

  async list(): Promise<FileMetadata[]> {
    const url = `${this.config.url.replace(/\/$/, '')}${this.config.remotePath}`;
    
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getcontentlength/>
    <D:getlastmodified/>
    <D:resourcetype/>
  </D:prop>
</D:propfind>`;

    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization as string,
        'Content-Type': 'application/xml',
        'Depth': '1',
      },
      body: propfindBody,
    });

    if (!response.ok) {
      throw new Error(`WebDAV list failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Basic XML parsing - in production, use a proper XML parser
    const files: FileMetadata[] = [];
    const responseRegex = /<D:response[^>]*>(.*?)<\/D:response>/gs;
    let match;

    while ((match = responseRegex.exec(xmlText)) !== null) {
      const responseContent = match[1];
      
      // Skip directories
      if (responseContent.includes('<D:collection/>')) {
        continue;
      }

      const nameMatch = responseContent.match(/<D:displayname[^>]*>(.*?)<\/D:displayname>/s);
      const sizeMatch = responseContent.match(/<D:getcontentlength[^>]*>(.*?)<\/D:getcontentlength>/s);
      const modifiedMatch = responseContent.match(/<D:getlastmodified[^>]*>(.*?)<\/D:getlastmodified>/s);

      if (nameMatch && sizeMatch) {
        const name = nameMatch[1].trim();
        const size = parseInt(sizeMatch[1].trim(), 10);
        const lastModified = modifiedMatch ? new Date(modifiedMatch[1].trim()).toISOString() : new Date().toISOString();

        if (name && !isNaN(size)) {
          files.push({
            name,
            size,
            lastModified,
          });
        }
      }
    }

    return files.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }

  async exists(filename: string): Promise<boolean> {
    const url = this.getFileUrl(filename);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization as string,
      },
    });

    return response.ok;
  }

  async getUrl(filename: string): Promise<string> {
    return this.getFileUrl(filename);
  }
}