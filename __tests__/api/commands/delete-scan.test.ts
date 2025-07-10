import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/commands/delete-scan/route'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('@supabase/supabase-js')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/api/commands/delete-scan', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({ error: null }))
          }))
        })),
        insert: jest.fn(() => ({ error: null })),
      })),
      rpc: jest.fn(() => 1),
    }
    mockCreateClient.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should soft delete scan and enqueue command successfully', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      body: { scanId: 'scan-123' },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(202)
    expect(data).toEqual({ accepted: true, commandType: 'DELETE_SCAN' })

    // Verify soft delete was called
    expect(mockSupabase.from).toHaveBeenCalledWith('scan_uploads')
    expect(mockSupabase.from().update).toHaveBeenCalledWith({
      deleted_at: expect.any(String),
      version: expect.any(Number),
    })

    // Verify command was enqueued
    expect(mockSupabase.from).toHaveBeenCalledWith('command_queue')
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({
      type: 'DELETE_SCAN',
      payload: { scanId: 'scan-123', userId: 'test-user-123' },
    })
  })

  it('should return 401 when user ID is missing', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { scanId: 'scan-123' },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized - User ID required')
  })

  it('should return 400 when scanId is missing', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      body: {},
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('scanId is required')
  })

  it('should return 404 when scan not found', async () => {
    mockSupabase.from = jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({ error: { code: 'PGRST116' } }))
        }))
      })),
    }))

    const { req } = createMocks({
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      body: { scanId: 'nonexistent-scan' },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Scan not found or no permission')
  })

  it('should return 500 when enqueue fails', async () => {
    mockSupabase.from = jest.fn((table) => {
      if (table === 'scan_uploads') {
        return {
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({ error: null }))
            }))
          })),
        }
      }
      if (table === 'command_queue') {
        return {
          insert: jest.fn(() => ({ error: new Error('Enqueue failed') })),
        }
      }
    })

    const { req } = createMocks({
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      body: { scanId: 'scan-123' },
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to enqueue delete command')
  })
}) 