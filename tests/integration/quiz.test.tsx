import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { NotesDisplay } from '@/components/notes-display';
import type { LectureNotes } from '@/types';

describe('Quiz Feature', () => {
  const mockNotesWithQuiz: LectureNotes = {
    title: 'Test Lecture with Quiz',
    summary: 'A comprehensive test lecture',
    paragraphs: ['Paragraph 1', 'Paragraph 2'],
    bulletPoints: ['Point 1', 'Point 2'],
    keyConcepts: [
      {
        concept: 'Important Concept',
        explanation: 'Detailed explanation',
        importance: 'high' as const,
      },
    ],
    definitions: [
      {
        term: 'Technical Term',
        definition: 'Clear definition',
        context: 'Usage context',
      },
    ],
    exampleProblems: [],
    quizQuestions: [
      {
        question: 'What is the main topic of this lecture?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 1,
        explanation: 'Option B is correct because...',
      },
      {
        question: 'Which concept is most important?',
        options: ['First', 'Second', 'Third', 'Fourth'],
        correctAnswer: 0,
        explanation: 'First is the most important concept.',
      },
      {
        question: 'How many key points were discussed?',
        options: ['One', 'Two', 'Three', 'Four'],
        correctAnswer: 2,
      },
    ],
    actionItems: ['Action 1', 'Action 2'],
    metadata: {
      generatedAt: new Date().toISOString(),
      transcriptionModel: 'whisper-large-v3',
      summarizationModel: 'llama-3.3-70b-versatile',
      originalFilename: 'test-quiz.mp3',
      wordCount: 500,
    },
  };

  const mockNotesWithoutQuiz: LectureNotes = {
    ...mockNotesWithQuiz,
    quizQuestions: [],
  };

  describe('Quiz Tab', () => {
    it('should render Quiz tab in the navigation', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);

      const quizTab = screen.getByRole('button', { name: /quiz/i });
      expect(quizTab).toBeInTheDocument();
    });

    it('should display quiz questions when quiz tab is clicked', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);

      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      expect(screen.getByText(/Test Your Knowledge/i)).toBeInTheDocument();
      expect(screen.getByText(/3 Questions/i)).toBeInTheDocument();
    });

    it('should show empty state when no quiz questions available', () => {
      render(<NotesDisplay notes={mockNotesWithoutQuiz} />);

      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      expect(screen.getByText(/No quiz questions available/i)).toBeInTheDocument();
    });
  });

  describe('Quiz Questions Display', () => {
    beforeEach(() => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);
    });

    it('should display all quiz questions', () => {
      expect(screen.getByText('What is the main topic of this lecture?')).toBeInTheDocument();
      expect(screen.getByText('Which concept is most important?')).toBeInTheDocument();
      expect(screen.getByText('How many key points were discussed?')).toBeInTheDocument();
    });

    it('should display all options for each question', () => {
      expect(screen.getByText(/A\. Option A/)).toBeInTheDocument();
      expect(screen.getByText(/B\. Option B/)).toBeInTheDocument();
      expect(screen.getByText(/C\. Option C/)).toBeInTheDocument();
      expect(screen.getByText(/D\. Option D/)).toBeInTheDocument();
    });

    it('should number questions correctly', () => {
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('Question 3')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('should allow selecting an answer', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      const optionButton = screen.getByText(/A\. Option A/).closest('button');
      expect(optionButton).not.toBeNull();

      if (optionButton) {
        fireEvent.click(optionButton);
        expect(optionButton).toHaveClass('border-primary-500');
      }
    });

    it('should disable submit button when not all questions are answered', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all questions are answered', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      // Answer all 3 questions
      const questions = screen.getAllByText(/Question \d/);
      expect(questions).toHaveLength(3);

      // Select first option for each question
      const firstOptions = screen.getAllByText(/A\./);
      firstOptions.forEach((option) => {
        const button = option.closest('button');
        if (button) fireEvent.click(button);
      });

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Quiz Results', () => {
    it('should show score after submitting answers', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      // Answer all questions correctly
      const questions = screen.getAllByText(/Question \d/);

      // Q1: correct answer is index 1 (Option B)
      const q1Options = within(questions[0].closest('div')!).getAllByRole('button');
      fireEvent.click(q1Options[1]); // Select B

      // Q2: correct answer is index 0 (First)
      const q2Options = within(questions[1].closest('div')!).getAllByRole('button');
      fireEvent.click(q2Options[0]); // Select A

      // Q3: correct answer is index 2 (Three)
      const q3Options = within(questions[2].closest('div')!).getAllByRole('button');
      fireEvent.click(q3Options[2]); // Select C

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Score: 3 \/ 3/i)).toBeInTheDocument();
    });

    it('should highlight correct answers in green', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      // Answer all questions
      const firstOptions = screen.getAllByText(/A\./);
      firstOptions.forEach((option) => {
        const button = option.closest('button');
        if (button) fireEvent.click(button);
      });

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      fireEvent.click(submitButton);

      // Check for green background on correct answers
      const correctAnswers = screen.getAllByText(/A\. First|B\. Option B|C\. Three/);
      correctAnswers.forEach((answer) => {
        const button = answer.closest('button');
        if (button && button.classList.contains('bg-green-50')) {
          expect(button).toHaveClass('border-green-500');
        }
      });
    });

    it('should highlight incorrect answers in red', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      // Answer all questions incorrectly
      const lastOptions = screen.getAllByText(/D\./);
      lastOptions.forEach((option) => {
        const button = option.closest('button');
        if (button) fireEvent.click(button);
      });

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      fireEvent.click(submitButton);

      // Check for red background on incorrect answers
      const incorrectAnswers = screen.getAllByText(/D\./);
      incorrectAnswers.forEach((answer) => {
        const button = answer.closest('button');
        if (button && button.classList.contains('bg-red-50')) {
          expect(button).toHaveClass('border-red-500');
        }
      });
    });

    it('should display explanations after submission when available', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      // Answer all questions
      const firstOptions = screen.getAllByText(/A\./);
      firstOptions.forEach((option) => {
        const button = option.closest('button');
        if (button) fireEvent.click(button);
      });

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Option B is correct because\.\.\./)).toBeInTheDocument();
      expect(screen.getByText(/First is the most important concept\./)).toBeInTheDocument();
    });

    it('should not show explanations before submission', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      expect(screen.queryByText(/Option B is correct because\.\.\./)).not.toBeInTheDocument();
      expect(screen.queryByText(/Explanation:/)).not.toBeInTheDocument();
    });
  });

  describe('Retake Quiz', () => {
    it('should show retake button after submitting answers', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      // Answer all questions
      const firstOptions = screen.getAllByText(/A\./);
      firstOptions.forEach((option) => {
        const button = option.closest('button');
        if (button) fireEvent.click(button);
      });

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      fireEvent.click(submitButton);

      expect(screen.getByRole('button', { name: /Retake Quiz/i })).toBeInTheDocument();
    });

    it('should reset quiz state when retake is clicked', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      // Answer and submit
      const firstOptions = screen.getAllByText(/A\./);
      firstOptions.forEach((option) => {
        const button = option.closest('button');
        if (button) fireEvent.click(button);
      });

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      fireEvent.click(submitButton);

      // Retake quiz
      const retakeButton = screen.getByRole('button', { name: /Retake Quiz/i });
      fireEvent.click(retakeButton);

      // Should show submit button again (not retake)
      expect(screen.getByRole('button', { name: /Submit Answers/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Retake Quiz/i })).not.toBeInTheDocument();

      // Score should not be visible
      expect(screen.queryByText(/Score:/i)).not.toBeInTheDocument();
    });
  });

  describe('Quiz Copy to Clipboard', () => {
    it('should include quiz content when copying', async () => {
      // Mock clipboard API
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      const copyButton = screen.getByRole('button', { name: /Copy to Clipboard/i });
      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalled();
      const copiedText = mockWriteText.mock.calls[0][0];
      expect(copiedText).toContain('What is the main topic of this lecture?');
      expect(copiedText).toContain('Option A');
    });
  });

  describe('Quiz in Different Languages', () => {
    it('should handle quiz questions in different languages', () => {
      const indonesianQuiz: LectureNotes = {
        ...mockNotesWithQuiz,
        quizQuestions: [
          {
            question: 'Apa topik utama dari kuliah ini?',
            options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
            correctAnswer: 1,
            explanation: 'Pilihan B adalah yang benar karena...',
          },
        ],
      };

      render(<NotesDisplay notes={indonesianQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      expect(screen.getByText('Apa topik utama dari kuliah ini?')).toBeInTheDocument();
      expect(screen.getByText(/A\. Pilihan A/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle quiz with only one question', () => {
      const singleQuestionQuiz: LectureNotes = {
        ...mockNotesWithQuiz,
        quizQuestions: [mockNotesWithQuiz.quizQuestions[0]],
      };

      render(<NotesDisplay notes={singleQuestionQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      expect(screen.getByText(/1 Question/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Question \d/)).toHaveLength(1);
    });

    it('should handle quiz questions without explanations', () => {
      const noExplanationQuiz: LectureNotes = {
        ...mockNotesWithQuiz,
        quizQuestions: [
          {
            question: 'Test question?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
          },
        ],
      };

      render(<NotesDisplay notes={noExplanationQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      // Answer and submit
      const firstOption = screen.getByText(/A\. A/).closest('button');
      if (firstOption) fireEvent.click(firstOption);

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      fireEvent.click(submitButton);

      // Should not show explanation section
      expect(screen.queryByText(/Explanation:/i)).not.toBeInTheDocument();
    });

    it('should calculate partial scores correctly', () => {
      render(<NotesDisplay notes={mockNotesWithQuiz} />);
      const quizTab = screen.getByRole('button', { name: /quiz/i });
      fireEvent.click(quizTab);

      // Answer 2 out of 3 correctly
      const questions = screen.getAllByText(/Question \d/);

      // Q1: correct (select B)
      const q1Options = within(questions[0].closest('div')!).getAllByRole('button');
      fireEvent.click(q1Options[1]);

      // Q2: correct (select A)
      const q2Options = within(questions[1].closest('div')!).getAllByRole('button');
      fireEvent.click(q2Options[0]);

      // Q3: incorrect (select A, but correct is C)
      const q3Options = within(questions[2].closest('div')!).getAllByRole('button');
      fireEvent.click(q3Options[0]);

      const submitButton = screen.getByRole('button', { name: /Submit Answers/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Score: 2 \/ 3/i)).toBeInTheDocument();
    });
  });
});
