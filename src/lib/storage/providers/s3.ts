import { StorageProvider, FileMetadata } from '../types';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    endpoint?: string;
  }) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && { endpoint: config.endpoint }),
    });
    this.bucket = config.bucket;
  }

  async upload(filename: string, buffer: Buffer, contentType?: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    });

    await this.client.send(command);
  }

  async download(filename: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filename,
    });

    try {
      const response = await this.client.send(command);
      if (!response.Body) {
        throw new Error(`File not found: ${filename}`);
      }
      
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        throw new Error(`File not found: ${filename}`);
      }
      throw error;
    }
  }

  async delete(filename: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: filename,
    });

    await this.client.send(command);
  }

  async list(): Promise<FileMetadata[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
    });

    const response = await this.client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    return response.Contents
      .filter(obj => obj.Key && obj.Size !== undefined && obj.LastModified)
      .map(obj => ({
        name: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified!.toISOString(),
        etag: obj.ETag,
      }))
      .sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
  }

  async exists(filename: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      if (error instanceof Error && (error.name === 'NotFound' || error.name === 'NoSuchKey')) {
        return false;
      }
      throw error;
    }
  }

  async getUrl(filename: string): Promise<string> {
    // For public buckets, return direct URL
    const endpoint = await this.client.config.endpoint?.();
    const region = await this.client.config.region();
    
    if (endpoint) {
      return `${endpoint}/${this.bucket}/${filename}`;
    }
    
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${filename}`;
  }
}