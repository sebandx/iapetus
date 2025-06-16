// src/components/MarkdownRenderer.tsx

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      lineHeight: 1.7,
      color: '#4B5563',
    },
    // Add more styles for specific markdown elements as needed
  };

  return (
    <div style={styles.container}>
      <style>{`
        .markdown-container ul {
          padding-left: 20px;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        .markdown-container li {
          margin-bottom: 5px;
        }
        .markdown-container strong {
          color: #374151;
        }
      `}</style>
      <div className="markdown-container">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownRenderer;
