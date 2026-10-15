/**
 * Signed-in catalog of models the current user can call.
 */

import { apiClient } from './client'

export interface AvailableModelCard {
  name: string
  group_name?: string
  billing_mode: string
  input_price: number | null
  output_price: number | null
  cache_write_price: number | null
  cache_read_price: number | null
  per_request_price: number | null
}

export async function listAvailableModels(options?: { signal?: AbortSignal }): Promise<AvailableModelCard[]> {
  const { data } = await apiClient.get<{ models: AvailableModelCard[] }>('/user/available-models', {
    signal: options?.signal
  })
  return data.models ?? []
}
