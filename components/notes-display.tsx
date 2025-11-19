'use client';

import { useState } from 'react';
import type { LectureNotes } from '@/types';

interface NotesDisplayProps {
  notes: LectureNotes;
}

export function NotesDisplay({ notes }: NotesDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>('summary');

  if (!notes) {
    return null;
  }

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'paragraphs', label: 'Detailed Notes' },
    { id: 'concepts', label: 'Key Concepts' },
    { id: 'definitions', label: 'Definitions' },
    { id: 'problems', label: 'Examples' },
    { id: 'actions', label: 'Action Items' },
  ];

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = () => {
    const content = JSON.stringify(notes, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notes.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    let markdown = `# ${notes.title}\n\n`;
    markdown += `## Summary\n\n${notes.summary}\n\n`;
    
    if (notes.paragraphs.length > 0) {
      markdown += `## Detailed Notes\n\n`;
      notes.paragraphs.forEach((para) => {
        markdown += `${para}\n\n`;
      });
    }

    if (notes.bulletPoints.length > 0) {
      markdown += `## Key Points\n\n`;
      notes.bulletPoints.forEach((point) => {
        markdown += `- ${point}\n`;
      });
      markdown += '\n';
    }

    if (notes.keyConcepts.length > 0) {
      markdown += `## Key Concepts\n\n`;
      notes.keyConcepts.forEach((concept) => {
        markdown += `### ${concept.concept}\n\n`;
        markdown += `${concept.explanation}\n\n`;
        markdown += `*Importance: ${concept.importance}*\n\n`;
      });
    }

    if (notes.definitions.length > 0) {
      markdown += `## Definitions\n\n`;
      notes.definitions.forEach((def) => {
        markdown += `**${def.term}**: ${def.definition}\n\n`;
        if (def.context) {
          markdown += `*Context: ${def.context}*\n\n`;
        }
      });
    }

    if (notes.exampleProblems.length > 0) {
      markdown += `## Example Problems\n\n`;
      notes.exampleProblems.forEach((problem, idx) => {
        markdown += `### Problem ${idx + 1}\n\n`;
        markdown += `${problem.problem}\n\n`;
        if (problem.solution) {
          markdown += `**Solution**: ${problem.solution}\n\n`;
        }
        if (problem.explanation) {
          markdown += `${problem.explanation}\n\n`;
        }
      });
    }

    if (notes.actionItems.length > 0) {
      markdown += `## Action Items\n\n`;
      notes.actionItems.forEach((item) => {
        markdown += `- [ ] ${item}\n`;
      });
      markdown += '\n';
    }

    markdown += `---\n\n`;
    markdown += `*Generated on ${formatDate(notes.metadata.generatedAt)}*\n`;
    markdown += `*Source: ${notes.metadata.originalFilename}*\n`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notes.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{notes.title}</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>Source: {notes.metadata.originalFilename}</span>
              <span>Words: {notes.metadata.wordCount.toLocaleString()}</span>
              <span>Generated: {formatDate(notes.metadata.generatedAt)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Download MD
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Download JSON
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">{notes.summary}</p>
            {notes.bulletPoints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Points</h3>
                <ul className="space-y-2">
                  {notes.bulletPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'paragraphs' && (
          <div className="space-y-4">
            {notes.paragraphs.map((para, idx) => (
              <p key={idx} className="text-gray-700 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="space-y-6">
            {notes.keyConcepts.length > 0 ? (
              notes.keyConcepts.map((concept, idx) => (
                <div key={idx} className="border-l-4 border-primary-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {concept.concept}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        concept.importance === 'high'
                          ? 'bg-red-100 text-red-800'
                          : concept.importance === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {concept.importance}
                    </span>
                  </div>
                  <p className="text-gray-700">{concept.explanation}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No key concepts identified</p>
            )}
          </div>
        )}

        {activeTab === 'definitions' && (
          <div className="space-y-4">
            {notes.definitions.length > 0 ? (
              notes.definitions.map((def, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{def.term}</h3>
                  <p className="text-gray-700 mb-2">{def.definition}</p>
                  {def.context && (
                    <p className="text-sm text-gray-600 italic">Context: {def.context}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No definitions found</p>
            )}
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="space-y-6">
            {notes.exampleProblems.length > 0 ? (
              notes.exampleProblems.map((problem, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Problem {idx + 1}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Problem:</span>
                      <p className="text-gray-700 mt-1">{problem.problem}</p>
                    </div>
                    {problem.solution && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Solution:</span>
                        <p className="text-gray-700 mt-1">{problem.solution}</p>
                      </div>
                    )}
                    {problem.explanation && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Explanation:</span>
                        <p className="text-gray-700 mt-1">{problem.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No example problems found</p>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-2">
            {notes.actionItems.length > 0 ? (
              notes.actionItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No action items identified</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
