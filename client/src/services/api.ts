import {
  HealthStatus,
  AddressTransfersResponse,
  TraceInvestigationRequest,
  TraceInvestigationResponse,
  EvaluateAttributionRequest,
  EvaluateAttributionResponse,
  GenerateReportRequest,
  GenerateReportResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function checkBackendHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as HealthStatus;
  } catch (error: any) {
    console.error('Failed to connect to backend health endpoint:', error);
    return {
      status: 'error',
      service: 'HydroTrace (Disconnected)',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    };
  }
}

/**
 * Fetch TRON address transfers from backend API
 */
export async function fetchTronAddressTransfers(
  address: string,
  limit = 25,
  assetFilter: 'USDT' | 'ALL' = 'USDT'
): Promise<AddressTransfersResponse> {
  const cleanAddress = address.trim();
  const endpoint =
    assetFilter === 'USDT'
      ? `${API_BASE_URL}/blockchain/tron/address/${encodeURIComponent(cleanAddress)}/usdt?limit=${limit}`
      : `${API_BASE_URL}/blockchain/tron/address/${encodeURIComponent(cleanAddress)}?limit=${limit}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || `API error (${response.status})`;
    throw new Error(errorMessage);
  }

  return data as AddressTransfersResponse;
}

/**
 * Traces transaction paths and constructs bounded directed graph
 */
export async function traceInvestigationApi(
  payload: TraceInvestigationRequest
): Promise<TraceInvestigationResponse> {
  const response = await fetch(`${API_BASE_URL}/investigations/trace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || `API Error (${response.status})`;
    throw new Error(errorMessage);
  }

  return data as TraceInvestigationResponse;
}

/**
 * Evaluates discovered graph addresses against prototype VASP dataset
 */
export async function evaluateAttributionApi(
  payload: EvaluateAttributionRequest
): Promise<EvaluateAttributionResponse> {
  const response = await fetch(`${API_BASE_URL}/investigations/attribution`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || `API Error (${response.status})`;
    throw new Error(errorMessage);
  }

  return data as EvaluateAttributionResponse;
}

/**
 * Generates an investigation report, evidence bundle, and SAHYOG disclosure payload
 */
export async function generateReportApi(
  payload: GenerateReportRequest
): Promise<GenerateReportResponse> {
  const response = await fetch(`${API_BASE_URL}/investigations/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || `API Error (${response.status})`;
    throw new Error(errorMessage);
  }

  return data as GenerateReportResponse;
}

