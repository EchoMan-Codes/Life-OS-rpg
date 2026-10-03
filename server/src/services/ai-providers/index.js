import { HeuristicAiProvider } from './heuristic.provider.js';
import { GeminiAiProvider } from './gemini.provider.js';

/**
 * AI Provider Factory.
 * Resolves the active provider dynamically based on environment configuration.
 * Server-authoritative: Keeps all keys and credentials strictly server-side.
 */
class AiProviderFactory {
  constructor() {
    this.heuristic = new HeuristicAiProvider();
    if (process.env.GEMINI_API_KEY) {
      this.cloud = new GeminiAiProvider(process.env.GEMINI_API_KEY);
    }
  }

  getActiveProvider() {
    if (process.env.GEMINI_API_KEY && this.cloud) {
      return this.cloud;
    }
    return this.heuristic;
  }

  getHeuristicProvider() {
    return this.heuristic;
  }
}

export const aiProviderFactory = new AiProviderFactory();
