import TxtWorker from '../worker/txtParser.worker?worker'

export interface Chapter {
    title: string
    lineIndex: number
}

export function parseChapters(text: string): Promise<Chapter[]> {
    return new Promise((resolve, reject) => {
        const worker = new TxtWorker()
        worker.onmessage = (e) => {
            resolve(e.data.chapters)
            worker.terminate()
        }
        worker.onerror = (e) => {
            reject(e)
            worker.terminate()
        }
        worker.postMessage({ text })
    })
}
