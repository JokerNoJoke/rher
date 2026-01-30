/**
 * Splits a long text into smaller chunks based on sentence terminators.
 * This is used to feed the TTS engine with manageable pieces.
 */
export function splitIntoChunks(text: string): string[] {
    if (!text) return []

    // Split by common terminators (Chinese and English), preserving the terminator.
    // Regex explanation:
    // ([。！？.!?\n]+) matches one or more terminators.
    // The parentheses around it cause it to be included in the split result.
    const segments = text.split(/([。！？.!?\n]+)/g)

    const chunks: string[] = []
    let currentChunk = ''

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        if (!seg) continue

        // If it's a terminator segment, append it to the currentChunk
        if (/^[。！？.!?\n]+$/.test(seg)) {
            currentChunk += seg
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim())
            }
            currentChunk = ''
        } else {
            // It's a text segment
            currentChunk += seg
        }
    }

    // Handle any remaining text that didn't end with a terminator
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
    }

    return chunks
}
