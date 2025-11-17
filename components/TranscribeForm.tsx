'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Copy, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { transcribeMedia } from '@/lib/api-client';
import { formatDuration, generateId } from '@/lib/utils';
import type { ToolkitResponse, TranscribeResponse } from '@/lib/types';

const transcribeSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  model: z.enum(['tiny', 'base', 'small', 'medium', 'large']),
  task: z.enum(['transcribe', 'translate']),
  language: z.string().optional(),
});

type TranscribeFormData = z.infer<typeof transcribeSchema>;

const MODELS = [
  { value: 'tiny', label: 'Tiny (Fastest, less accurate)' },
  { value: 'base', label: 'Base (Fast)' },
  { value: 'small', label: 'Small (Balanced)' },
  { value: 'medium', label: 'Medium (Accurate)' },
  { value: 'large', label: 'Large (Most accurate, slowest)' },
];

const TASKS = [
  { value: 'transcribe', label: 'Transcribe (same language)' },
  { value: 'translate', label: 'Translate to English' },
];

export default function TranscribeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ToolkitResponse<TranscribeResponse> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TranscribeFormData>({
    resolver: zodResolver(transcribeSchema),
    defaultValues: {
      model: 'base',
      task: 'transcribe',
    },
  });

  const onSubmit = async (data: TranscribeFormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const response = await transcribeMedia({
        ...data,
        id: generateId(),
      });

      setResult(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred during transcription');
      console.error('Transcription error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setError(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (result?.response.text) {
      await navigator.clipboard.writeText(result.response.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="h-6 w-6 text-blue-600" />
          <CardTitle>Media Transcription</CardTitle>
        </div>
        <CardDescription>
          Transcribe or translate audio/video using OpenAI Whisper
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transcribe-url">Media URL</Label>
            <Input
              id="transcribe-url"
              type="url"
              placeholder="https://example.com/audio.mp3"
              {...register('url')}
              disabled={isLoading}
            />
            {errors.url && (
              <p className="text-sm text-red-600">{errors.url.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Whisper Model</Label>
              <Select
                id="model"
                {...register('model')}
                disabled={isLoading}
              >
                {MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </Select>
              {errors.model && (
                <p className="text-sm text-red-600">{errors.model.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task">Task</Label>
              <Select
                id="task"
                {...register('task')}
                disabled={isLoading}
              >
                {TASKS.map((task) => (
                  <option key={task.value} value={task.value}>
                    {task.label}
                  </option>
                ))}
              </Select>
              {errors.task && (
                <p className="text-sm text-red-600">{errors.task.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">
              Language (optional, auto-detect if empty)
            </Label>
            <Input
              id="language"
              type="text"
              placeholder="en, fr, es, etc."
              {...register('language')}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Use ISO 639-1 language codes (e.g., en, fr, es, de)
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : (
                'Transcribe Media'
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
            <AlertTitle>Transcription Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-4 space-y-4">
            <Alert variant="success">
              <AlertTitle>Transcription Successful!</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2 text-sm">
                  <div>
                    <strong>Job ID:</strong> {result.job_id}
                  </div>
                  {result.response.language && (
                    <div>
                      <strong>Language:</strong> {result.response.language}
                    </div>
                  )}
                  {result.response.duration && (
                    <div>
                      <strong>Duration:</strong> {formatDuration(result.response.duration)}
                    </div>
                  )}
                  {result.total_time && (
                    <div>
                      <strong>Processing Time:</strong> {result.total_time.toFixed(2)}s
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Transcription Text</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-8"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                {result.response.text}
              </div>
            </div>

            {result.response.segments && result.response.segments.length > 0 && (
              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <summary className="font-semibold text-sm cursor-pointer">
                  View Segments ({result.response.segments.length})
                </summary>
                <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                  {result.response.segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="text-xs bg-white p-2 rounded border border-gray-200"
                    >
                      <div className="text-gray-500 mb-1">
                        {formatDuration(segment.start)} → {formatDuration(segment.end)}
                      </div>
                      <div>{segment.text}</div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
