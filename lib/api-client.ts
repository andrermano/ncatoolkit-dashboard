import axios, { AxiosError } from 'axios';
import type {
  ToolkitResponse,
  ConvertRequest,
  ConvertResponse,
  TranscribeRequest,
  TranscribeResponse,
  DownloadRequest,
  DownloadResponse,
} from './types';

const apiClient = axios.create({
  baseURL: '/api/toolkit',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleError = (error: AxiosError<any>) => {
  if (error.response) {
    throw new ApiError(
      error.response.data?.message || 'API request failed',
      error.response.status,
      error.response.data
    );
  } else if (error.request) {
    throw new ApiError('No response from server');
  } else {
    throw new ApiError(error.message || 'Request setup failed');
  }
};

// Convert endpoint
export const convertMedia = async (
  data: ConvertRequest
): Promise<ToolkitResponse<ConvertResponse>> => {
  try {
    const response = await apiClient.post<ToolkitResponse<ConvertResponse>>(
      '/convert',
      data
    );
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError);
  }
};

// Transcribe endpoint
export const transcribeMedia = async (
  data: TranscribeRequest
): Promise<ToolkitResponse<TranscribeResponse>> => {
  try {
    const response = await apiClient.post<ToolkitResponse<TranscribeResponse>>(
      '/transcribe',
      data
    );
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError);
  }
};

// Download endpoint
export const downloadMedia = async (
  data: DownloadRequest
): Promise<ToolkitResponse<DownloadResponse>> => {
  try {
    const response = await apiClient.post<ToolkitResponse<DownloadResponse>>(
      '/download',
      data
    );
    return response.data;
  } catch (error) {
    throw handleError(error as AxiosError);
  }
};

export default apiClient;
