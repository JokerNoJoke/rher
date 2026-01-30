import { describe, it, expect } from 'vitest'
import { splitIntoChunks } from '@/utils/textChunker'

describe('textChunker', () => {
    it('should split text by common sentence terminators', () => {
        const text = '你好。今天天气不错！我们去公园吗？'
        const chunks = splitIntoChunks(text)
        expect(chunks).toHaveLength(3)
        expect(chunks[0]).toBe('你好。')
        expect(chunks[1]).toBe('今天天气不错！')
        expect(chunks[2]).toBe('我们去公园吗？')
    })

    it('should handle English punctuation', () => {
        const text = 'Hello world. How are you! I am fine?'
        const chunks = splitIntoChunks(text)
        expect(chunks).toHaveLength(3)
        expect(chunks[0]).toBe('Hello world.')
        expect(chunks[1]).toBe('How are you!')
        expect(chunks[2]).toBe('I am fine?')
    })

    it('should group short segments if needed or handle empty strings', () => {
        const text = '...'
        const chunks = splitIntoChunks(text)
        expect(chunks).toEqual(['...'])
    })

    it('should handle newline characters', () => {
        const text = '第一句。\n第二句。'
        const chunks = splitIntoChunks(text)
        expect(chunks).toHaveLength(2)
        expect(chunks[0]).toBe('第一句。')
        expect(chunks[1]).toBe('第二句。')
    })
})
