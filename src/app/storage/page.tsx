import { StorageConfig } from '@/components/storage/StorageConfig';

export default function StoragePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Storage Management</h1>
          <p className="text-muted-foreground">
            Configure and manage your external storage providers. Supports local storage, 
            Amazon S3, SFTP, FTP, and WebDAV.
          </p>
        </div>

        <StorageConfig />

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Configuration Guide</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">Environment Variables</h3>
              <p className="text-muted-foreground mb-2">
                Configure storage by setting these environment variables in your .env file:
              </p>
              <div className="bg-background p-3 rounded border font-mono text-xs space-y-1">
                <div># Set storage mode</div>
                <div>STORAGE_MODE=local|s3|sftp|ftp|webdav</div>
                <div></div>
                <div># For S3:</div>
                <div>S3_ACCESS_KEY=your_key</div>
                <div>S3_SECRET_KEY=your_secret</div>
                <div>S3_REGION=us-east-1</div>
                <div>S3_BUCKET=your_bucket</div>
                <div></div>
                <div># For SFTP:</div>
                <div>SFTP_HOST=your_host</div>
                <div>SFTP_USERNAME=your_user</div>
                <div>SFTP_PASSWORD=your_password</div>
                <div>SFTP_REMOTE_PATH=/uploads</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Supported Storage Types</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Local:</strong> Store files on the server filesystem</li>
                <li><strong>S3:</strong> Amazon S3 or S3-compatible services (MinIO, DigitalOcean Spaces)</li>
                <li><strong>SFTP:</strong> Secure File Transfer Protocol over SSH</li>
                <li><strong>FTP:</strong> File Transfer Protocol (requires basic-ftp package)</li>
                <li><strong>WebDAV:</strong> Web Distributed Authoring and Versioning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}