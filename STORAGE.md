# External Storage Configuration

This application supports multiple storage backends for file uploads. You can configure different storage providers through environment variables.

## Supported Storage Providers

### 1. Local Storage (Default)
Store files on the server's local filesystem.

```env
STORAGE_MODE=local
LOCAL_UPLOAD_PATH=uploads
```

### 2. Amazon S3
Store files in Amazon S3 or S3-compatible services.

```env
STORAGE_MODE=s3
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_REGION=us-east-1
S3_BUCKET=your_bucket_name
S3_ENDPOINT=https://s3.amazonaws.com  # Optional: for S3-compatible services
```

**S3-Compatible Services:**
- Amazon S3
- MinIO
- DigitalOcean Spaces
- Wasabi
- Backblaze B2

### 3. SFTP (SSH File Transfer Protocol)
Store files on a remote server via SFTP.

```env
STORAGE_MODE=sftp
SFTP_HOST=your_sftp_host
SFTP_PORT=22
SFTP_USERNAME=your_username
SFTP_PASSWORD=your_password
# OR use private key authentication:
# SFTP_PRIVATE_KEY=path/to/private/key
SFTP_REMOTE_PATH=/uploads
```

### 4. FTP (File Transfer Protocol)
Store files on a remote FTP server.

**Note:** Requires installing the `basic-ftp` package:
```bash
npm install basic-ftp
```

```env
STORAGE_MODE=ftp
FTP_HOST=your_ftp_host
FTP_PORT=21
FTP_USERNAME=your_username
FTP_PASSWORD=your_password
FTP_SECURE=false  # Set to true for FTPS
FTP_REMOTE_PATH=/uploads
```

### 5. WebDAV
Store files on a WebDAV-enabled server.

```env
STORAGE_MODE=webdav
WEBDAV_URL=https://your-webdav-server.com
WEBDAV_USERNAME=your_username
WEBDAV_PASSWORD=your_password
WEBDAV_REMOTE_PATH=/uploads
```

**Compatible Services:**
- Nextcloud
- ownCloud
- Apache HTTP Server with mod_dav
- Microsoft IIS with WebDAV

## Configuration Management

### Runtime Configuration
Visit `/storage` in your application to:
- View current storage configuration
- Test storage connectivity
- Reload configuration without restart

### API Endpoints
- `GET /api/storage/config` - Get current configuration (without sensitive data)
- `POST /api/storage/config` - Reload configuration
- `POST /api/storage/test` - Test storage connectivity

### Docker Configuration
When using Docker, you can pass environment variables:

```bash
docker run -e STORAGE_MODE=s3 -e S3_BUCKET=mybucket ...
```

Or use a `.env` file:
```bash
docker run --env-file .env ...
```

## Security Considerations

1. **Credentials**: Never commit credentials to version control
2. **Network Security**: Use HTTPS/SFTP for remote storage
3. **Access Control**: Configure proper IAM policies for cloud storage
4. **Encryption**: Enable encryption at rest when available

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check network connectivity
   - Verify firewall settings
   - Confirm host/port configuration

2. **Authentication Failed**
   - Verify credentials
   - Check user permissions
   - Ensure account is not locked

3. **Permission Denied**
   - Check file/directory permissions
   - Verify user has write access
   - Confirm remote path exists

### Testing Storage
Use the storage test endpoint to verify configuration:

```bash
curl -X POST http://localhost:3000/api/storage/test
```

This will:
1. Upload a test file
2. Download and verify content
3. List files to confirm visibility
4. Delete the test file
5. Verify deletion

## Migration Between Storage Providers

When changing storage providers, existing files won't be automatically migrated. You'll need to:

1. Download files from the old provider
2. Update configuration
3. Upload files to the new provider

Consider implementing a migration script for production environments.

## Performance Considerations

- **Local**: Fastest, but limited by disk space
- **S3**: Good performance, scalable, CDN integration available
- **SFTP**: Moderate performance, depends on network latency
- **FTP**: Similar to SFTP, less secure
- **WebDAV**: Performance varies by implementation

## Development vs Production

### Development
```env
STORAGE_MODE=local
LOCAL_UPLOAD_PATH=uploads
```

### Production
```env
STORAGE_MODE=s3
S3_ACCESS_KEY=prod_access_key
S3_SECRET_KEY=prod_secret_key
S3_REGION=us-east-1
S3_BUCKET=prod-uploads-bucket
```

## Backup Strategies

1. **Local**: Regular filesystem backups
2. **S3**: Enable versioning and cross-region replication
3. **SFTP/FTP**: Implement regular backup scripts
4. **WebDAV**: Depends on the underlying storage system