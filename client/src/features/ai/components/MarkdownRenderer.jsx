import { useState } from 'react';
import PropTypes from 'prop-types';
import { Copy, Check } from 'lucide-react';
import clsx from 'clsx';

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-2.5 rounded-2xl overflow-hidden border border-white/15 bg-slate-950/80 text-slate-100 shadow-md font-mono text-xs backdrop-blur-xl">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.04] border-b border-white/10 text-[10px] text-white/60">
        <span className="font-semibold uppercase tracking-wider text-amber-400">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto leading-relaxed scrollbar-thin text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

CodeBlock.propTypes = {
  language: PropTypes.string,
  code: PropTypes.string.isRequired,
};

function parseInlineFormatting(text) {
  if (!text) return text;

  const tokens = [];
  let keyIdx = 0;

  // Regex matches inline code `...`, bold **...**, strikethrough ~~...~~, italic *...*
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*)/g;
  let match;
  let lastIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const tokenStr = match[0];

    if (tokenStr.startsWith('`') && tokenStr.endsWith('`')) {
      tokens.push(
        <code
          key={keyIdx++}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-white/15 text-amber-300 border border-white/15 font-mono text-[11px] font-semibold"
        >
          {tokenStr.slice(1, -1)}
        </code>
      );
    } else if (tokenStr.startsWith('**') && tokenStr.endsWith('**')) {
      tokens.push(
        <strong key={keyIdx++} className="font-bold text-white tracking-wide">
          {tokenStr.slice(2, -2)}
        </strong>
      );
    } else if (tokenStr.startsWith('~~') && tokenStr.endsWith('~~')) {
      tokens.push(
        <del key={keyIdx++} className="opacity-50">
          {tokenStr.slice(2, -2)}
        </del>
      );
    } else if (tokenStr.startsWith('*') && tokenStr.endsWith('*')) {
      tokens.push(
        <em key={keyIdx++} className="italic text-slate-200">
          {tokenStr.slice(1, -1)}
        </em>
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}

export function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  // Split content by code blocks first
  const blocks = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: 'code',
      language: match[1] || 'text',
      code: match[2].trim(),
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return (
    <div className={clsx('space-y-2.5 text-xs sm:text-sm leading-relaxed break-words font-sans text-slate-100', className)}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return <CodeBlock key={bIdx} language={block.language} code={block.code} />;
        }

        // Render paragraphs, headings, bullet lists, blockquotes, tables in text blocks
        const paragraphs = block.content.split('\n\n');

        return paragraphs.map((para, pIdx) => {
          const trimmed = para.trim();
          if (!trimmed) return null;

          // Blockquotes (> ...)
          if (trimmed.startsWith('>')) {
            const quoteContent = trimmed.replace(/^>\s*/, '');
            return (
              <div
                key={`${bIdx}-${pIdx}`}
                className="my-2.5 p-3 rounded-xl bg-amber-500/10 border-l-2 border-amber-400 text-amber-200/90 text-xs sm:text-[13px] leading-relaxed backdrop-blur-md"
              >
                {parseInlineFormatting(quoteContent)}
              </div>
            );
          }

          // Headings
          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={`${bIdx}-${pIdx}`} className="text-base sm:text-lg font-bold font-display text-white pt-2 pb-1 border-b border-white/10">
                {parseInlineFormatting(trimmed.replace(/^#\s+/, ''))}
              </h2>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={`${bIdx}-${pIdx}`} className="text-sm sm:text-base font-bold font-display text-white pt-1.5 pb-0.5">
                {parseInlineFormatting(trimmed.replace(/^##\s+/, ''))}
              </h3>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={`${bIdx}-${pIdx}`} className="text-xs sm:text-sm font-bold text-amber-400 pt-1 pb-0.5 uppercase tracking-wide">
                {parseInlineFormatting(trimmed.replace(/^###\s+/, ''))}
              </h4>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h5 key={`${bIdx}-${pIdx}`} className="text-xs font-semibold text-indigo-300 pt-0.5">
                {parseInlineFormatting(trimmed.replace(/^####\s+/, ''))}
              </h5>
            );
          }

          // Tables
          if (trimmed.includes('|') && trimmed.split('\n').some((l) => l.includes('---'))) {
            const tableLines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'));
            if (tableLines.length >= 2) {
              const headers = tableLines[0].split('|').map((c) => c.trim()).filter(Boolean);
              const dataRows = tableLines.slice(2).map((row) =>
                row.split('|').map((c) => c.trim()).filter(Boolean)
              );

              return (
                <div key={`${bIdx}-${pIdx}`} className="my-2 overflow-x-auto rounded-xl border border-white/15 bg-black/20">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-white/10 text-white font-bold border-b border-white/15">
                      <tr>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} className="px-3 py-2 font-bold">
                            {parseInlineFormatting(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {dataRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2">
                              {parseInlineFormatting(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
          }

          // Bullet / numbered lists
          if (trimmed.split('\n').every((l) => /^([•*-]|\d+\.)\s+/.test(l.trim()))) {
            const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
            return (
              <ul key={`${bIdx}-${pIdx}`} className="space-y-1.5 my-1.5 pl-1 text-slate-200 text-xs sm:text-sm">
                {lines.map((line, lIdx) => {
                  const isNumbered = /^\d+\.\s+/.test(line.trim());
                  const marker = isNumbered ? line.trim().match(/^\d+\./)[0] : '•';
                  const cleanText = line.trim().replace(/^([•*-]|\d+\.)\s+/, '');

                  return (
                    <li key={lIdx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-amber-400 font-bold shrink-0 text-xs select-none">
                        {marker}
                      </span>
                      <span className="flex-1">{parseInlineFormatting(cleanText)}</span>
                    </li>
                  );
                })}
              </ul>
            );
          }

          // Regular paragraph (crisp high contrast)
          return (
            <p key={`${bIdx}-${pIdx}`} className="leading-relaxed text-slate-100/95">
              {parseInlineFormatting(trimmed)}
            </p>
          );
        });
      })}
    </div>
  );
}

MarkdownRenderer.propTypes = {
  content: PropTypes.string,
  className: PropTypes.string,
};
