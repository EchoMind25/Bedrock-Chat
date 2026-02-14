import React from 'react';

/**
 * Basic markdown parser for message content
 * Supports: bold, italic, code blocks, inline code, blockquotes, mentions
 */

export interface ParsedContent {
	type: 'text' | 'bold' | 'italic' | 'code' | 'codeblock' | 'blockquote' | 'mention';
	content: string;
	language?: string; // for code blocks
}

export function parseMarkdown(text: string): ParsedContent[] {
	const result: ParsedContent[] = [];
	let remaining = text;

	// Handle code blocks first (```lang\ncode\n```)
	const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
	const parts: Array<{ type: 'codeblock' | 'text'; content: string; language?: string }> = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = codeBlockRegex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
		}
		parts.push({
			type: 'codeblock',
			content: match[2],
			language: match[1] || 'text',
		});
		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < text.length) {
		parts.push({ type: 'text', content: text.slice(lastIndex) });
	}

	// Process each part
	for (const part of parts) {
		if (part.type === 'codeblock') {
			result.push({
				type: 'codeblock',
				content: part.content,
				language: part.language,
			});
			continue;
		}

		// Process inline markdown
		remaining = part.content;
		const tokens: ParsedContent[] = [];
		let pos = 0;

		while (pos < remaining.length) {
			// Check for blockquote (> at start of line)
			if (remaining[pos] === '>' && (pos === 0 || remaining[pos - 1] === '\n')) {
				const lineEnd = remaining.indexOf('\n', pos);
				const end = lineEnd === -1 ? remaining.length : lineEnd;
				tokens.push({
					type: 'blockquote',
					content: remaining.slice(pos + 1, end).trim(),
				});
				pos = end + 1;
				continue;
			}

			// Check for mention (@username)
			if (remaining[pos] === '@') {
				const mentionMatch = remaining.slice(pos).match(/^@(\w+)/);
				if (mentionMatch) {
					tokens.push({
						type: 'mention',
						content: mentionMatch[1],
					});
					pos += mentionMatch[0].length;
					continue;
				}
			}

			// Check for bold (**text**)
			if (remaining.slice(pos, pos + 2) === '**') {
				const endPos = remaining.indexOf('**', pos + 2);
				if (endPos !== -1) {
					tokens.push({
						type: 'bold',
						content: remaining.slice(pos + 2, endPos),
					});
					pos = endPos + 2;
					continue;
				}
			}

			// Check for italic (*text*)
			if (remaining[pos] === '*' && remaining[pos + 1] !== '*') {
				const endPos = remaining.indexOf('*', pos + 1);
				if (endPos !== -1) {
					tokens.push({
						type: 'italic',
						content: remaining.slice(pos + 1, endPos),
					});
					pos = endPos + 1;
					continue;
				}
			}

			// Check for inline code (`code`)
			if (remaining[pos] === '`' && remaining.slice(pos, pos + 3) !== '```') {
				const endPos = remaining.indexOf('`', pos + 1);
				if (endPos !== -1) {
					tokens.push({
						type: 'code',
						content: remaining.slice(pos + 1, endPos),
					});
					pos = endPos + 1;
					continue;
				}
			}

			// Regular text - collect until next special character
			let textEnd = pos + 1;
			while (
				textEnd < remaining.length &&
				remaining[textEnd] !== '*' &&
				remaining[textEnd] !== '`' &&
				remaining[textEnd] !== '@' &&
				remaining[textEnd] !== '>'
			) {
				textEnd++;
			}

			tokens.push({
				type: 'text',
				content: remaining.slice(pos, textEnd),
			});
			pos = textEnd;
		}

		result.push(...tokens);
	}

	return result;
}

export function renderMarkdown(parsed: ParsedContent[]): React.ReactNode {
	return parsed.map((token, i) => {
		const key = `${token.type}-${i}`;

		switch (token.type) {
			case 'bold':
				return (
					<strong key={key} className="font-semibold text-white">
						{token.content}
					</strong>
				);

			case 'italic':
				return (
					<em key={key} className="italic">
						{token.content}
					</em>
				);

			case 'code':
				return (
					<code
						key={key}
						className="px-1.5 py-0.5 rounded-sm text-sm font-mono bg-black/40 text-[oklch(0.8_0.08_190)]"
					>
						{token.content}
					</code>
				);

			case 'codeblock':
				return (
					<pre
						key={key}
						className="my-2 p-3 rounded-lg bg-black/40 border border-white/10 overflow-x-auto"
					>
						<code className="text-sm font-mono text-white/90">{token.content}</code>
					</pre>
				);

			case 'blockquote':
				return (
					<blockquote
						key={key}
						className="my-1 pl-3 border-l-4 border-white/30 text-white/70 italic"
					>
						{token.content}
					</blockquote>
				);

			case 'mention':
				return (
					<span
						key={key}
						className="px-1 py-0.5 rounded-sm bg-[oklch(0.35_0.08_250)] text-[oklch(0.75_0.15_250)] hover:bg-[oklch(0.4_0.1_250)] cursor-pointer transition-colors"
					>
						@{token.content}
					</span>
				);

			case 'text':
			default:
				return token.content;
		}
	});
}
