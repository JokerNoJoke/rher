export interface TTSProfile {
    id: string;
    name: string;
    method: 'GET' | 'POST';
    url: string;
    headers?: Record<string, string>;
    params?: Record<string, string>; // Query params for GET
    bodyTemplate?: string; // JSON string with {{placeholders}} for POST
    timeout?: number; // Request timeout in milliseconds
    responseType?: string; // MIME type of the audio response (e.g., 'audio/mpeg', 'audio/aac')
}

export interface TTSConfig {
    enabled: boolean;
    activeProfileId: string;
    profiles: TTSProfile[];
}

export const DEFAULT_TTS_PROFILE: TTSProfile = {
    id: 'gpt-sovits-local',
    name: 'GPT-SoVITS (Local)',
    method: 'POST',
    url: 'http://127.0.0.1:9880/tts',
    bodyTemplate: JSON.stringify({
        text: '{{text}}',
        text_lang: 'zh',
        ref_audio_path: 'vocals.wav',
        prompt_text: '',
        prompt_lang: 'zh',
        text_split_method: 'cut0',
        seed: '0',
        media_type: 'aac',
        streaming_mode: 'true'
    })
};

export const DEFAULT_TTS_CONFIG: TTSConfig = {
    enabled: false,
    activeProfileId: DEFAULT_TTS_PROFILE.id,
    profiles: [DEFAULT_TTS_PROFILE]
};
