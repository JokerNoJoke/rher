self.onmessage = async (e: MessageEvent) => {
    const { text } = e.data;
    const chapters: { title: string; lineIndex: number }[] = [];

    // We can process by lines or by regex on full text.
    // Using regex on full text for start of lines might be faster than splitting everything if we don't return lines
    // But we need lineIndex. So splitting is easiest logic.

    const lines = text.split(/\r?\n/);
    // Matches: "第123章 Title", "Chapter 1", etc.
    // Expanded regex for robustness
    const chapterRegex = /^\s*(第[0-9一二三四五六七八九十百千]+[章回卷集部篇]|Chapter\s+\d+|[0-9]+\.)/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Heuristic: Chapter max length (avoid matching long sentences starting with pattern)
        if (line.length < 100 && chapterRegex.test(line)) {
            chapters.push({
                title: line,
                lineIndex: i,
            });
        }
    }

    self.postMessage({ chapters });
};
