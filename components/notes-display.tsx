'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { LectureNotes } from '@/types';
import { MediaPlayer } from './media-player';

interface NotesDisplayProps {
  notes: LectureNotes;
}

export function NotesDisplay({ notes }: NotesDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [copied, setCopied] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);

  if (!notes) {
    return null;
  }

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'paragraphs', label: 'Detailed Notes' },
    { id: 'concepts', label: 'Key Concepts' },
    { id: 'definitions', label: 'Definitions' },
    { id: 'problems', label: 'Examples' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'actions', label: 'Action Items' },
    { id: 'transcript', label: 'Full Transcript' },
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

  const handleDownloadTranscript = () => {
    if (!notes.transcript) return;

    let content = `# ${notes.title}\n\n`;
    content += `## Full Transcript\n\n`;
    content += `Source: ${notes.metadata.originalFilename}\n`;
    content += `Generated: ${formatDate(notes.metadata.generatedAt)}\n`;
    content += `Word Count: ${notes.metadata.wordCount.toLocaleString()}\n\n`;
    content += `---\n\n`;
    content += notes.transcript;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notes.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
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

    if (notes.quizQuestions && notes.quizQuestions.length > 0) {
      markdown += `## Quiz Questions\n\n`;
      notes.quizQuestions.forEach((quiz, idx) => {
        markdown += `### Question ${idx + 1}\n\n`;
        markdown += `${quiz.question}\n\n`;
        quiz.options.forEach((option, optIdx) => {
          const isCorrect = optIdx === quiz.correctAnswer;
          markdown += `${String.fromCharCode(65 + optIdx)}. ${option}${isCorrect ? ' ✓' : ''}\n`;
        });
        markdown += '\n';
        if (quiz.explanation) {
          markdown += `**Explanation**: ${quiz.explanation}\n\n`;
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

  const getTabContent = (tabId: string): string => {
    switch (tabId) {
      case 'summary':
        let summaryText = `# ${notes.title}\n\n## Summary\n\n${notes.summary}`;
        if (notes.bulletPoints.length > 0) {
          summaryText += '\n\n## Key Points\n\n';
          notes.bulletPoints.forEach((point) => {
            summaryText += `- ${point}\n`;
          });
        }
        return summaryText;

      case 'paragraphs':
        return `# ${notes.title}\n\n## Detailed Notes\n\n${notes.paragraphs.join('\n\n')}`;

      case 'concepts':
        if (notes.keyConcepts.length === 0) return 'No key concepts identified';
        let conceptsText = `# ${notes.title}\n\n## Key Concepts\n\n`;
        notes.keyConcepts.forEach((concept) => {
          conceptsText += `### ${concept.concept} (${concept.importance})\n\n${concept.explanation}\n\n`;
        });
        return conceptsText;

      case 'definitions':
        if (notes.definitions.length === 0) return 'No definitions found';
        let defsText = `# ${notes.title}\n\n## Definitions\n\n`;
        notes.definitions.forEach((def) => {
          defsText += `**${def.term}**: ${def.definition}\n`;
          if (def.context) defsText += `\n*Context: ${def.context}*\n`;
          defsText += '\n';
        });
        return defsText;

      case 'problems':
        if (notes.exampleProblems.length === 0) return 'No example problems found';
        let problemsText = `# ${notes.title}\n\n## Example Problems\n\n`;
        notes.exampleProblems.forEach((problem, idx) => {
          problemsText += `### Problem ${idx + 1}\n\n${problem.problem}\n\n`;
          if (problem.solution) problemsText += `**Solution**: ${problem.solution}\n\n`;
          if (problem.explanation) problemsText += `${problem.explanation}\n\n`;
        });
        return problemsText;

      case 'actions':
        if (notes.actionItems.length === 0) return 'No action items identified';
        let actionsText = `# ${notes.title}\n\n## Action Items\n\n`;
        notes.actionItems.forEach((item) => {
          actionsText += `- [ ] ${item}\n`;
        });
        return actionsText;

      case 'quiz':
        if (notes.quizQuestions?.length === 0) return 'No quiz questions available';
        let quizText = `# ${notes.title}\n\n## Quiz Questions\n\n`;
        notes.quizQuestions?.forEach((q, idx) => {
          quizText += `### Question ${idx + 1}\n\n${q.question}\n\n`;
          q.options.forEach((opt, optIdx) => {
            const isCorrect = optIdx === q.correctAnswer;
            quizText += `${String.fromCharCode(65 + optIdx)}. ${opt}${isCorrect ? ' ✓' : ''}\n`;
          });
          if (q.explanation) quizText += `\n**Explanation**: ${q.explanation}\n`;
          quizText += '\n';
        });
        return quizText;

      case 'transcript':
        return notes.transcript || 'Transcript not available';

      default:
        return '';
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const content = getTabContent(activeTab);
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
          <div className="flex flex-wrap gap-2">
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

      {notes.metadata.sourceUrl && notes.metadata.sourceType && (
        <div className="p-6 border-b border-gray-200">
          <div className="mb-3 flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-md">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Media Player:</strong> This feature is available for YouTube and direct URL
              sources only. File uploads are not stored for playback.
            </span>
          </div>
          <MediaPlayer
            sourceUrl={notes.metadata.sourceUrl}
            sourceType={notes.metadata.sourceType}
            fileName={notes.metadata.originalFilename}
          />
        </div>
      )}

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
        <div className="flex justify-end mb-4">
          <button
            onClick={handleCopyToClipboard}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>
        </div>

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes.summary}</ReactMarkdown>
            </div>
            {notes.bulletPoints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Points</h3>
                <ul className="space-y-3">
                  {notes.bulletPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-primary-600 mr-3 mt-1">•</span>
                      <div className="prose prose-sm max-w-none flex-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{point}</ReactMarkdown>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'paragraphs' && (
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-em:text-gray-600 prose-ul:text-gray-700 prose-ol:text-gray-700">
            {notes.paragraphs.map((para, idx) => (
              <div key={idx} className="mb-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{para}</ReactMarkdown>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="space-y-6">
            {notes.keyConcepts.length > 0 ? (
              notes.keyConcepts.map((concept, idx) => (
                <div key={idx} className="border-l-4 border-primary-500 pl-4 py-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{concept.concept}</h3>
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
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{concept.explanation}</ReactMarkdown>
                  </div>
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
                <div key={idx} className="bg-gray-50 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{def.term}</h3>
                  <div className="prose prose-sm max-w-none mb-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{def.definition}</ReactMarkdown>
                  </div>
                  {def.context && (
                    <div className="text-sm text-gray-600 italic mt-3 pt-3 border-t border-gray-200">
                      <strong>Context:</strong> {def.context}
                    </div>
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
                <div key={idx} className="border border-gray-200 rounded-lg p-5 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Problem {idx + 1}</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <span className="text-sm font-semibold text-blue-900 block mb-2">
                        Problem:
                      </span>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.problem}</ReactMarkdown>
                      </div>
                    </div>
                    {problem.solution && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <span className="text-sm font-semibold text-green-900 block mb-2">
                          Solution:
                        </span>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {problem.solution}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {problem.explanation && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm font-semibold text-gray-900 block mb-2">
                          Explanation:
                        </span>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {problem.explanation}
                          </ReactMarkdown>
                        </div>
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

        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {notes.quizQuestions && notes.quizQuestions.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Test Your Knowledge ({notes.quizQuestions.length} Questions)
                  </h3>
                  {showResults && (
                    <div className="text-sm">
                      <span className="font-medium">
                        Score:{' '}
                        {
                          Object.keys(selectedAnswers).filter(
                            (key) =>
                              selectedAnswers[parseInt(key)] ===
                              notes.quizQuestions[parseInt(key)].correctAnswer
                          ).length
                        }{' '}
                        / {notes.quizQuestions.length}
                      </span>
                    </div>
                  )}
                </div>
                {notes.quizQuestions.map((quiz, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-6 bg-white">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Question {idx + 1}</h4>
                    <p className="text-gray-700 mb-4">{quiz.question}</p>
                    <div className="space-y-3">
                      {quiz.options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[idx] === optIdx;
                        const isCorrect = optIdx === quiz.correctAnswer;
                        const showCorrect = showResults && isCorrect;
                        const showIncorrect = showResults && isSelected && !isCorrect;

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (!showResults) {
                                setSelectedAnswers({ ...selectedAnswers, [idx]: optIdx });
                              }
                            }}
                            disabled={showResults}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                              showCorrect
                                ? 'bg-green-50 border-green-500'
                                : showIncorrect
                                  ? 'bg-red-50 border-red-500'
                                  : isSelected
                                    ? 'bg-primary-50 border-primary-500'
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                            } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  showCorrect
                                    ? 'border-green-600 bg-green-600'
                                    : showIncorrect
                                      ? 'border-red-600 bg-red-600'
                                      : isSelected
                                        ? 'border-primary-600 bg-primary-600'
                                        : 'border-gray-400'
                                }`}
                              >
                                {(isSelected || showCorrect) && (
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    {showCorrect ? (
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    ) : showIncorrect ? (
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    ) : (
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    )}
                                  </svg>
                                )}
                              </div>
                              <span
                                className={
                                  showCorrect
                                    ? 'text-green-900 font-medium'
                                    : showIncorrect
                                      ? 'text-red-900'
                                      : 'text-gray-700'
                                }
                              >
                                {String.fromCharCode(65 + optIdx)}. {option}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {showResults && quiz.explanation && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Explanation:</p>
                        <p className="text-sm text-blue-800">{quiz.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-center">
                  {!showResults ? (
                    <button
                      onClick={() => setShowResults(true)}
                      disabled={Object.keys(selectedAnswers).length < notes.quizQuestions.length}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedAnswers({});
                        setShowResults(false);
                      }}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Retake Quiz
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">No quiz questions available</p>
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
                  <div className="prose prose-sm max-w-none flex-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{item}</ReactMarkdown>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No action items identified</p>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            {notes.transcript ? (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Full Transcript</h3>
                  <button
                    onClick={handleDownloadTranscript}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download TXT
                  </button>
                </div>
                <div
                  className="prose prose-base max-w-none 
                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-primary-200
                  prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-primary-800
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-em:text-gray-600 prose-em:italic
                  prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-primary-50 prose-blockquote:pl-6 prose-blockquote:py-3 prose-blockquote:rounded-r-lg prose-blockquote:my-4
                  prose-ul:text-gray-700 prose-ul:my-4
                  prose-ol:text-gray-700 prose-ol:my-4
                  prose-li:my-1
                  prose-code:text-primary-600 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
                  prose-hr:border-gray-300 prose-hr:my-8
                  prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                "
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes.transcript}</ReactMarkdown>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                  <p>Word count: {notes.metadata.wordCount.toLocaleString()}</p>
                  <p>Characters: {notes.transcript.length.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Transcript not available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
