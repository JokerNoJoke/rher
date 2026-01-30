import { describe, it, expect } from 'vitest'
import { DEFAULT_TTS_PROFILE, type TTSProfile } from '@/types/ttsConfig'

describe('TTS Configuration', () => {
  it('should have a valid default GPT-SoVITS profile', () => {
    const profile: TTSProfile = DEFAULT_TTS_PROFILE

    expect(profile).toBeDefined()
    expect(profile.name).toBe('GPT-SoVITS (Local)')
    expect(profile.method).toBe('POST')
    // Expecting the standard local port for GPT-SoVITS
    expect(profile.url).toContain('127.0.0.1')
    expect(profile.bodyTemplate).toBeDefined()
  })

  it('should allow defining an optional responseType', () => {
    const profile: TTSProfile = {
      ...DEFAULT_TTS_PROFILE,
      id: 'custom-aac',
      responseType: 'audio/aac'
    }

    expect(profile.responseType).toBe('audio/aac')
  })
})
