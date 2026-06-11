import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { detectLanguage, getLanguageFromFileName } = require('../lib/reviewLanguage.js');

const javaServiceCode = `
import java.util.List;

public class MesWorkOrderService {
    public static void main(String[] args) {
        System.out.println("ready");
    }
}
`;

const javaClassWithoutModifier = `
class WorkOrderSync {
    String workProcessId;

    void save() {
        int count = 1;
    }
}
`;

const pythonCode = `
from pathlib import Path

class Runner:
    def run(self):
        return Path.cwd()
`;

assert.equal(getLanguageFromFileName('MPS010Service.java'), 'Java');
assert.equal(getLanguageFromFileName('review-target.py'), 'Python');
assert.equal(getLanguageFromFileName('review-target.tsx'), 'TypeScript');

assert.deepEqual(detectLanguage(javaServiceCode), { language: 'Java', confidence: 'high' });
assert.deepEqual(detectLanguage(javaClassWithoutModifier), { language: 'Java', confidence: 'medium' });
assert.deepEqual(detectLanguage(pythonCode), { language: 'Python', confidence: 'high' });

console.log('review language detection tests passed');
