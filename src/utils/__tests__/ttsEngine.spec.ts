import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAudioUrl, replaceTemplates, fetchAudio } from '@/utils/ttsEngine'
import { DEFAULT_TTS_PROFILE, type TTSProfile } from '@/types/ttsConfig'

// Mock Tauri's invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}))

// Import the mocked invoke to verify calls
import { invoke } from '@tauri-apps/api/core'

describe('ttsEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('replaceTemplates', () => {
        it('should replace {{text}} placeholder', () => {
            const template = 'Hello {{text}}'
            const result = replaceTemplates(template, { text: 'World' })
            expect(result).toBe('Hello World')
        })

        it('should replace multiple placeholders', () => {
            const template = '{{greeting}} {{text}}!'
            const result = replaceTemplates(template, { greeting: 'Hi', text: 'User' })
            expect(result).toBe('Hi User!')
        })

        it('should leave unknown placeholders as is or handles them gracefully', () => {
            const template = 'Hello {{unknown}}'
            const result = replaceTemplates(template, { text: 'World' })
            expect(result).toBe('Hello {{unknown}}')
        })
    })

    describe('generateAudioUrl', () => {
        it('should generate a valid URL for GET method', () => {
            const profile: TTSProfile = {
                ...DEFAULT_TTS_PROFILE,
                method: 'GET',
                url: 'http://localhost:9880/',
                params: { text: '{{text}}', lang: 'zh' }
            }
            const url = generateAudioUrl(profile, { text: '你好' })
            const parsedUrl = new URL(url)
            expect(parsedUrl.origin).toBe('http://localhost:9880')
            expect(parsedUrl.pathname).toBe('/')
            expect(parsedUrl.searchParams.get('text')).toBe('你好')
            expect(parsedUrl.searchParams.get('lang')).toBe('zh')
        })

        it('should NOT append trailing slash if not present', () => {
             const profile: TTSProfile = {
                id: 'test',
                name: 'test',
                method: 'GET',
                url: 'http://localhost:9880/tts',
                params: {}
            }
            const url = generateAudioUrl(profile, { text: 'test' })
            expect(url).toBe('http://localhost:9880/tts')
        })

        it('should respect trailing slash if present', () => {
             const profile: TTSProfile = {
                id: 'test',
                name: 'test',
                method: 'GET',
                url: 'http://localhost:9880/api/',
                params: {}
            }
            const url = generateAudioUrl(profile, { text: 'test' })
            expect(url).toBe('http://localhost:9880/api/')
        })

        it('should handle root URL (URL class appends / to origin)', () => {
             const profile: TTSProfile = {
                id: 'test',
                name: 'test',
                method: 'GET',
                url: 'http://localhost:9880',
                params: {}
            }
            const url = generateAudioUrl(profile, { text: 'test' })
            expect(url).toBe('http://localhost:9880/')
        })

        it('should return plain URL for POST method', () => {
            const profile: TTSProfile = {
                id: 'test',
                name: 'test',
                method: 'POST',
                url: 'http://localhost:9880/tts',
                params: {}
            }
            const url = generateAudioUrl(profile, { text: 'test' })
            expect(url).toBe('http://localhost:9880/tts')
        })
    })

    describe('fetchAudio', () => {
        it('should use profile.responseType when provided', async () => {
            const profile: TTSProfile = {
                ...DEFAULT_TTS_PROFILE,
                responseType: 'audio/aac'
            }
            const mockResponse = new Uint8Array([1, 2, 3])
            
            // @ts-ignore - Mocking invoke implementation
            vi.mocked(invoke).mockResolvedValue(mockResponse)

            const blob = await fetchAudio(profile, { text: 'test' })
            
            expect(blob).toBeInstanceOf(Blob)
            expect(blob.type).toBe('audio/aac')
        })

        it('should default to audio/mpeg when responseType is undefined', async () => {
            const profile: TTSProfile = {
                ...DEFAULT_TTS_PROFILE,
                responseType: undefined
            }
            const mockResponse = new Uint8Array([1, 2, 3])
            
            // @ts-ignore
            vi.mocked(invoke).mockResolvedValue(mockResponse)

            const blob = await fetchAudio(profile, { text: 'test' })
            
            expect(blob.type).toBe('audio/mpeg')
        })
    })
})
