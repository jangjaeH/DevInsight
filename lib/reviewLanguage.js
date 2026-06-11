const supportedLanguages = ['TypeScript', 'JavaScript', 'Java', 'Python'];

function getLanguageFromFileName(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension === 'java') return 'Java';
    if (extension === 'ts' || extension === 'tsx') return 'TypeScript';
    if (extension === 'js' || extension === 'jsx') return 'JavaScript';
    if (extension === 'py') return 'Python';

    return undefined;
}

function detectLanguage(code) {
    const trimmed = code.trim();

    if (!trimmed) {
        return { language: 'Unknown', confidence: 'low' };
    }

    if (
        /\b(public|private|protected)\s+(class|interface|enum)\b/.test(trimmed)
        || /\bpublic\s+static\s+void\s+main\s*\(/.test(trimmed)
        || /^\s*import\s+java\./m.test(trimmed)
        || /\bSystem\.out\.println\(/.test(trimmed)
    ) {
        return { language: 'Java', confidence: 'high' };
    }

    if (
        /\b(class|interface|enum)\s+\w+[\s\S]*\{/.test(trimmed)
        && /;\s*(?:\r?\n|$)/.test(trimmed)
        && !/\b(const|let|var|function|=>)\b/.test(trimmed)
    ) {
        return { language: 'Java', confidence: 'medium' };
    }

    if (/\b(String|int|long|double|float|boolean|List<|Map<|Set<)\s+\w+\s*(?:=|;|\))/.test(trimmed)) {
        return { language: 'Java', confidence: 'medium' };
    }

    if (/^\s*(from\s+\w+\s+import|import\s+(?!java\.)\w+|def\s+\w+\(|class\s+\w+\s*[:(])/m.test(trimmed)) {
        return { language: 'Python', confidence: 'high' };
    }

    if (/\b(type|interface)\s+\w+\b|:\s*(string|number|boolean|unknown|never|Record<|Array<)|\bas\s+(const|string|number|boolean|\w+)/.test(trimmed)) {
        return { language: 'TypeScript', confidence: 'high' };
    }

    if (/\b(const|let|var|function|import|export|=>)\b/.test(trimmed)) {
        return { language: 'JavaScript', confidence: 'medium' };
    }

    return { language: 'Unknown', confidence: 'low' };
}

module.exports = {
    supportedLanguages,
    getLanguageFromFileName,
    detectLanguage,
};
