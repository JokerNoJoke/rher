import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAudio } from '@/utils/ttsEngine'
import type { TTSProfile } from '@/types/ttsConfig'

// Mock the Tauri invoke function
const invokeMock = vi.fn()

vi.mock('@tauri-apps/api/core', () => ({
    invoke: (cmd: string, args: any) => invokeMock(cmd, args)
}))

describe('ttsEngine Proxy', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should call proxy_fetch_audio via invoke for GET request', async () => {
        const profile: TTSProfile = {
            id: 'test',
            name: 'Test Profile',
            url: 'http://localhost:5000/api',
            method: 'GET',
            params: { text: '{{text}}' },
            headers: { 'Authorization': 'Bearer token' }
        }
        const values = { text: 'Hello' }
        const mockResponse = new Uint8Array([1, 2, 3])
        invokeMock.mockResolvedValue(mockResponse)

        const result = await fetchAudio(profile, values)

        expect(invokeMock).toHaveBeenCalledWith('proxy_fetch_audio', {
            url: 'http://localhost:5000/api?text=Hello',
            method: 'GET',
            headers: { 'Authorization': 'Bearer token' },
            body: null,
            timeoutMs: undefined // Assuming optional
        })
        expect(result).toBeInstanceOf(Blob)
    })

    it('should call proxy_fetch_audio via invoke for POST request', async () => {
        const profile: TTSProfile = {
            id: 'test-post',
            name: 'Test Post',
            url: 'http://localhost:5000/tts',
            method: 'POST',
            bodyTemplate: '{"text": "{{text}}"}',
            headers: { 'Content-Type': 'application/json' }
        }
        const values = { text: 'World' }
        const mockResponse = new Uint8Array([4, 5, 6])
        invokeMock.mockResolvedValue(mockResponse)

        await fetchAudio(profile, values)

        expect(invokeMock).toHaveBeenCalledWith('proxy_fetch_audio', {
            url: 'http://localhost:5000/tts',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{"text": "World"}',
            timeoutMs: undefined
        })
    })

    it('should handle backend errors', async () => {
        const profile: TTSProfile = {
            id: 'error-test',
            name: 'Error Test',
            url: 'http://fail.com',
            method: 'GET'
        }
        invokeMock.mockRejectedValue('Backend Error')

        await expect(fetchAudio(profile, { text: 'test' })).rejects.toThrow('Backend Error')
    })
})
