import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useJobs } from '@/hooks/useJobs'
import * as jobsService from '@/services/jobs'

// Mock the jobs service
jest.mock('@/services/jobs')
const mockDeleteJob = jobsService.deleteJob as jest.MockedFunction<typeof jobsService.deleteJob>
const mockGetJobs = jobsService.getJobs as jest.MockedFunction<typeof jobsService.getJobs>

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useJobs optimistic delete', () => {
  const mockJobs = [
    {
      id: 'job-1',
      binder_title: 'Test Binder 1',
      status: 'completed',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'user-1',
      storage_path: 'test-path-1',
      deleted_at: null,
      version: 1,
    },
    {
      id: 'job-2',
      binder_title: 'Test Binder 2',
      status: 'completed',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'user-1',
      storage_path: 'test-path-2',
      deleted_at: null,
      version: 1,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetJobs.mockResolvedValue(mockJobs)
  })

  it('should optimistically remove job from UI immediately', async () => {
    mockDeleteJob.mockResolvedValue(undefined)
    
    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    })

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2)
    })

    // Perform optimistic delete
    act(() => {
      result.current.deleteJob('job-1')
    })

    // Job should be immediately removed from UI (optimistic update)
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].id).toBe('job-2')

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.deleteJobStatus.isPending).toBe(false)
    })

    // Verify deleteJob was called with correct parameters
    expect(mockDeleteJob).toHaveBeenCalledWith('job-1')
  })

  it('should rollback optimistic update when delete fails', async () => {
    mockDeleteJob.mockRejectedValue(new Error('Delete failed'))
    
    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    })

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2)
    })

    // Perform optimistic delete
    act(() => {
      result.current.deleteJob('job-1')
    })

    // Job should be immediately removed from UI (optimistic update)
    expect(result.current.data).toHaveLength(1)

    // Wait for mutation to fail and rollback
    await waitFor(() => {
      expect(result.current.deleteJobStatus.isError).toBe(true)
    })

    // Job should be restored to UI after rollback
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.find((job: any) => job.id === 'job-1')).toBeDefined()
  })

  it('should handle delete mutation loading state', async () => {
    // Mock a slow delete operation
    mockDeleteJob.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    })

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2)
    })

    // Start delete mutation
    act(() => {
      result.current.deleteJob('job-1')
    })

    // Should be in loading state
    expect(result.current.deleteJobStatus.isPending).toBe(true)
    
    // Job should still be optimistically removed
    expect(result.current.data).toHaveLength(1)
  })

  it('should filter out soft-deleted jobs from initial query', async () => {
    const jobsWithDeleted = [
      ...mockJobs,
      {
        id: 'job-3',
        binder_title: 'Deleted Binder',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1',
        storage_path: 'test-path-3',
        deleted_at: '2024-01-01T01:00:00Z', // This job is soft-deleted
        version: 1,
      },
    ]

    mockGetJobs.mockResolvedValue(jobsWithDeleted)
    
    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    })

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2) // Should only show non-deleted jobs
    })

    // Verify soft-deleted job is not included
    expect(result.current.data?.find((job: any) => job.id === 'job-3')).toBeUndefined()
  })
}) 