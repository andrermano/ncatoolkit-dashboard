// API Response Types
export interface ToolkitResponse<T = any> {
  code: number;
  id?: string;
  job_id: string;
  response: T;
  message: string;
  run_time?: number;
  queue_time?: number;
  total_time?: number;
  pid?: number;
  queue_id?: number;
  queue_length?: number;
  build_number?: string;
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'running' | 'done' | 'failed' | 'submitted';
  endpoint?: string;
  payload?: any;
  response?: any;
  error?: string;
  created_at?: string;
  updated_at?: string;
}

// Media Convert Types
export interface ConvertRequest {
  url: string;
  output_format: string;
  id?: string;
  webhook_url?: string;
}

export interface ConvertResponse {
  original_url: string;
  converted_url: string;
  output_format: string;
  file_size?: number;
  duration?: number;
}

// Media Transcribe Types
export interface TranscribeRequest {
  url: string;
  model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  language?: string;
  task?: 'transcribe' | 'translate';
  id?: string;
  webhook_url?: string;
}

export interface TranscribeResponse {
  original_url: string;
  text: string;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
  language?: string;
  duration?: number;
}

// Media Download Types
export interface DownloadRequest {
  url: string;
  id?: string;
  webhook_url?: string;
}

export interface DownloadResponse {
  original_url: string;
  downloaded_url: string;
  file_size?: number;
  format?: string;
  duration?: number;
}

// Job Tracking
export interface Job {
  id: string;
  endpoint: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  request: any;
  response?: ToolkitResponse;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
