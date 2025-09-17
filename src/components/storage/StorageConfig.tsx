'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, RefreshCw, TestTube } from 'lucide-react';

interface StorageConfig {
  mode: string;
  s3?: {
    region: string;
    bucket: string;
    endpoint?: string;
  };
  sftp?: {
    host: string;
    port: number;
    username: string;
    remotePath: string;
  };
  ftp?: {
    host: string;
    port: number;
    username: string;
    secure: boolean;
    remotePath: string;
  };
  webdav?: {
    url: string;
    username: string;
    remotePath: string;
  };
  local?: {
    uploadPath: string;
  };
}

interface TestResults {
  upload: boolean;
  download: boolean;
  exists: boolean;
  list: boolean;
  delete: boolean;
}

export function StorageConfig() {
  const [config, setConfig] = useState<StorageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    message: string;
    testResults?: TestResults;
  } | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/storage/config');
      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Failed to load storage config:', error);
    } finally {
      setLoading(false);
    }
  };

  const reloadConfig = async () => {
    try {
      setLoading(true);
      await fetch('/api/storage/config', { method: 'POST' });
      await loadConfig();
    } catch (error) {
      console.error('Failed to reload storage config:', error);
    }
  };

  const testStorage = async () => {
    try {
      setTesting(true);
      setTestResults(null);
      
      const response = await fetch('/api/storage/test', { method: 'POST' });
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Storage test failed:', error);
      setTestResults({
        success: false,
        message: 'Failed to run storage test',
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading storage configuration...</span>
        </CardContent>
      </Card>
    );
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'local': return 'bg-blue-100 text-blue-800';
      case 's3': return 'bg-orange-100 text-orange-800';
      case 'sftp': return 'bg-green-100 text-green-800';
      case 'ftp': return 'bg-purple-100 text-purple-800';
      case 'webdav': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderConfigDetails = () => {
    if (!config) return null;

    switch (config.mode) {
      case 's3':
        return config.s3 && (
          <div className="space-y-2 text-sm">
            <div><strong>Region:</strong> {config.s3.region}</div>
            <div><strong>Bucket:</strong> {config.s3.bucket}</div>
            {config.s3.endpoint && <div><strong>Endpoint:</strong> {config.s3.endpoint}</div>}
          </div>
        );
      
      case 'sftp':
        return config.sftp && (
          <div className="space-y-2 text-sm">
            <div><strong>Host:</strong> {config.sftp.host}:{config.sftp.port}</div>
            <div><strong>Username:</strong> {config.sftp.username}</div>
            <div><strong>Remote Path:</strong> {config.sftp.remotePath}</div>
          </div>
        );
      
      case 'ftp':
        return config.ftp && (
          <div className="space-y-2 text-sm">
            <div><strong>Host:</strong> {config.ftp.host}:{config.ftp.port}</div>
            <div><strong>Username:</strong> {config.ftp.username}</div>
            <div><strong>Secure:</strong> {config.ftp.secure ? 'Yes (FTPS)' : 'No'}</div>
            <div><strong>Remote Path:</strong> {config.ftp.remotePath}</div>
          </div>
        );
      
      case 'webdav':
        return config.webdav && (
          <div className="space-y-2 text-sm">
            <div><strong>URL:</strong> {config.webdav.url}</div>
            <div><strong>Username:</strong> {config.webdav.username}</div>
            <div><strong>Remote Path:</strong> {config.webdav.remotePath}</div>
          </div>
        );
      
      case 'local':
      default:
        return config.local && (
          <div className="space-y-2 text-sm">
            <div><strong>Upload Path:</strong> {config.local.uploadPath}</div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Storage Configuration
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={reloadConfig}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testStorage}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Storage
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Current storage provider configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Mode:</span>
                <Badge className={getModeColor(config.mode)}>
                  {config.mode.toUpperCase()}
                </Badge>
              </div>
              
              {renderConfigDetails()}
            </div>
          )}
        </CardContent>
      </Card>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Storage Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={testResults.success ? 'border-green-200' : 'border-red-200'}>
              <AlertDescription>
                {testResults.message}
              </AlertDescription>
            </Alert>
            
            {testResults.testResults && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(testResults.testResults).map(([test, passed]) => (
                  <div
                    key={test}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${
                      passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {passed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="capitalize">{test}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}