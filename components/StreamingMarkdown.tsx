"use client";

import { useEffect, useState } from "react";
import type { JSX } from "react";

interface StreamingMarkdownProps {
    content: string;
    isStreaming?: boolean;
}

/**
 * Renders markdown-style content with proper formatting
 * Supports bold, italic, headers, code blocks, and lists
 */
export function StreamingMarkdown({ content, isStreaming = false }: StreamingMarkdownProps) {
    const [displayedContent, setDisplayedContent] = useState("");

    useEffect(() => {
        if (!isStreaming) {
            setDisplayedContent(content);
            return;
        }

        // Simulate streaming effect - add chunks of text
        let currentIndex = 0;
        const chunkSize = 15; // Characters per chunk
        const interval = setInterval(() => {
            if (currentIndex < content.length) {
                currentIndex += chunkSize;
                setDisplayedContent(content.substring(0, currentIndex));
            } else {
                clearInterval(interval);
            }
        }, 50); // 50ms between chunks

        return () => clearInterval(interval);
    }, [content, isStreaming]);

    // Parse and render markdown
    const renderContent = (text: string) => {
        const lines = text.split("\n");
        const elements: JSX.Element[] = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Headers (###, ##, #)
            if (line.startsWith("### ")) {
                elements.push(
                    <h4 key={`h4-${i}`} className="font-bold text-sm mt-3 mb-1 text-primary">
                        {renderInlineMarkdown(line.substring(4))}
                    </h4>
                );
            } else if (line.startsWith("## ")) {
                elements.push(
                    <h3 key={`h3-${i}`} className="font-bold text-base mt-4 mb-2 text-primary">
                        {renderInlineMarkdown(line.substring(3))}
                    </h3>
                );
            } else if (line.startsWith("# ")) {
                elements.push(
                    <h2 key={`h2-${i}`} className="font-bold text-lg mt-5 mb-3 text-primary">
                        {renderInlineMarkdown(line.substring(2))}
                    </h2>
                );
            }
            // Bold lines (starting with **)
            else if (line.startsWith("**") && line.endsWith("**")) {
                elements.push(
                    <p key={`bold-${i}`} className="font-semibold text-foreground mt-2">
                        {renderInlineMarkdown(line)}
                    </p>
                );
            }
            // Code blocks
            else if (line.startsWith("```")) {
                const codeLines: string[] = [];
                i++;
                while (i < lines.length && !lines[i].startsWith("```")) {
                    codeLines.push(lines[i]);
                    i++;
                }
                elements.push(
                    <pre
                        key={`code-${i}`}
                        className="bg-secondary/50 border border-border/50 rounded-lg p-3 text-xs overflow-x-auto my-2 text-foreground/80"
                    >
                        <code>{codeLines.join("\n")}</code>
                    </pre>
                );
            }
            // Lists
            else if (line.startsWith("- ")) {
                elements.push(
                    <li key={`li-${i}`} className="ml-4 text-sm text-foreground">
                        {renderInlineMarkdown(line.substring(2))}
                    </li>
                );
            }
            // Numbered lists
            else if (/^\d+\.\s/.test(line)) {
                const match = line.match(/^\d+\.\s(.+)/);
                if (match) {
                    elements.push(
                        <li key={`oli-${i}`} className="ml-4 text-sm text-foreground list-decimal">
                            {renderInlineMarkdown(match[1])}
                        </li>
                    );
                }
            }
            // Empty lines
            else if (line.trim() === "") {
                if (elements.length > 0 && !elements[elements.length - 1].key?.includes("br")) {
                    elements.push(<br key={`br-${i}`} />);
                }
            }
            // Regular paragraphs
            else if (line.trim()) {
                elements.push(
                    <p key={`p-${i}`} className="text-sm text-foreground leading-relaxed mt-1">
                        {renderInlineMarkdown(line)}
                    </p>
                );
            }

            i++;
        }

        return elements;
    };

    // Handle inline markdown (bold, italic, code, links)
    const renderInlineMarkdown = (text: string): JSX.Element | string => {
        const parts: (JSX.Element | string)[] = [];
        let lastIndex = 0;
        let keyCounter = 0;

        // Pattern: **bold**, *italic*, `code`
        const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\*(.+?)\s/g;
        let match;

        const processedMatches = Array.from(text.matchAll(pattern));

        if (processedMatches.length === 0) {
            return text;
        }

        processedMatches.forEach((match) => {
            const index = match.index!;

            // Add text before this match
            if (index > lastIndex) {
                parts.push(text.substring(lastIndex, index));
            }

            if (match[1]) {
                // Bold
                parts.push(
                    <strong key={`b-${keyCounter++}`} className="font-semibold text-foreground">
                        {match[1]}
                    </strong>
                );
            } else if (match[2]) {
                // Italic
                parts.push(
                    <em key={`i-${keyCounter++}`} className="italic text-foreground/80">
                        {match[2]}
                    </em>
                );
            } else if (match[3]) {
                // Code
                parts.push(
                    <code
                        key={`c-${keyCounter++}`}
                        className="bg-secondary/60 px-1.5 py-0.5 rounded text-xs font-mono text-primary"
                    >
                        {match[3]}
                    </code>
                );
            } else if (match[4]) {
                // Bullet marker
                parts.push(
                    <span key={`bullet-${keyCounter++}`} className="font-semibold text-primary">
                        • {match[4]}
                    </span>
                );
            }

            lastIndex = index + match[0].length;
        });

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return <>{parts}</>;
    };

    return (
        <div className="space-y-2">
            {renderContent(displayedContent)}
            {isStreaming && displayedContent.length < content.length && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            )}
        </div>
    );
}
