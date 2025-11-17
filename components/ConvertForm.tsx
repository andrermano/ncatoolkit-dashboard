'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Download, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { convertMedia } from '@/lib/api-client';
import { formatBytes, formatDuration, generateId } from '@/lib/utils';
import type { ToolkitResponse, ConvertResponse } from '@/lib/types';

const convertSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  output_format: z.string().min(1, 'Please select an output format'),
});

type ConvertFormData = z.infer<typeof convertSchema>;

const OUTPUT_FORMATS = [
  { value: 'mp4', label: 'MP4 (Video)' },
  { value: 'mp3', label: 'MP3 (Audio)' },
  { value: 'wav', label: 'WAV (Audio)' },
  { value: 'webm', label: 'WebM (Video)' },
  { value: 'mkv', label: 'MKV (Video)' },
  { value: 'avi', label: 'AVI (Video)' },
  { value: 'mov', label: 'MOV (Video)' },
  { value: 'flac', label: 'FLAC (Audio)' },
  { value: 'aac', label: 'AAC (Audio)' },
  { value: 'ogg', label: 'OGG (Audio)' },
];

export default function ConvertForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ToolkitResponse<ConvertResponse> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConvertFormData>({
    resolver: zodResolver(convertSchema),
  });

  const onSubmit = async (data: ConvertFormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await convertMedia({
        ...data,
        id: generateId(),
      });

      setResult(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred during conversion');
      console.error('Conversion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileVideo className="h-6 w-6 text-blue-600" />
          <CardTitle>Media Converter</CardTitle>
        </div>
        <CardDescription>
          Convert audio and video files to different formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Media URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/video.mp4"
              {...register('url')}
              disabled={isLoading}
            />
            {errors.url && (
              <p className="text-sm text-red-600">{errors.url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="output_format">Output Format</Label>
            <Select
              id="output_format"
              {...register('output_format')}
              disabled={isLoading}
            >
              <option value="">Select a format...</option>
              {OUTPUT_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </Select>
            {errors.output_format && (
              <p className="text-sm text-red-600">{errors.output_format.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert Media'
              )}
            </Button>
            {(result || error) && (
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </form>

        {error && (
          <Alert variant="error" className="mt-4">
            <AlertTitle>Conversion Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert variant="success" className="mt-4">
            <AlertTitle>Conversion Successful!</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                <div className="text-sm">
                  <strong>Job ID:</strong> {result.job_id}
                </div>
                {result.response.file_size && (
                  <div className="text-sm">
                    <strong>File Size:</strong> {formatBytes(result.response.file_size)}
                  </div>
                )}
                {result.response.duration && (
                  <div className="text-sm">
                    <strong>Duration:</strong> {formatDuration(result.response.duration)}
                  </div>
                )}
                {result.total_time && (
                  <div className="text-sm">
                    <strong>Processing Time:</strong> {result.total_time.toFixed(2)}s
                  </div>
                )}
                <div className="mt-3">
                  <a
                    href={result.response.converted_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    <Download className="h-4 w-4" />
                    Download Converted File
                  </a>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
