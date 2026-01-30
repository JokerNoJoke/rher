import type { TTSProfile } from '@/types/ttsConfig'
import { invoke } from '@tauri-apps/api/core'

/**
 * Replaces placeholders in the form of {{key}} with values from the provided object.
 */
export function replaceTemplates(template: string, values: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return values[key] !== undefined ? values[key] : match
    })
}

/**
 * Generates the full URL for a TTS request, including query parameters if the method is GET.
 */
export function generateAudioUrl(profile: TTSProfile, values: Record<string, string>): string {
    const baseUrl = profile.url
    
    if (profile.method === 'GET') {
        const url = new URL(baseUrl)
        if (profile.params) {
            Object.entries(profile.params).forEach(([key, template]) => {
                url.searchParams.append(key, replaceTemplates(template, values))
            })
        }
        return url.toString()
    }
    
    return baseUrl
}

/**
 * Executes a TTS request via the backend proxy to avoid CORS issues.
 * Returns the audio blob.
 */
export async function fetchAudio(profile: TTSProfile, values: Record<string, string>): Promise<Blob> {
    const url = generateAudioUrl(profile, values)
    const headers = { ...(profile.headers || {}) }
    let body: string | null = null

    if (profile.method === 'POST' && profile.bodyTemplate) {
        body = replaceTemplates(profile.bodyTemplate, values)
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json'
        }
    }

    try {
        const responseData = await invoke<number[]>('proxy_fetch_audio', {
            url,
            method: profile.method,
            headers,
            body,
            timeoutMs: profile.timeout
        })

        const uint8Array = new Uint8Array(responseData)
        return new Blob([uint8Array], { type: profile.responseType || 'audio/mpeg' })
    } catch (error) {
        console.error('TTS Proxy Request failed:', error)
        throw new Error(`TTS Proxy Request failed: ${error}`)
    }
}
