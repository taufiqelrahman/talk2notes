# Testing Guide

This document describes the testing infrastructure and how to run tests in Talk2Notes.

## Testing Framework

We use **Vitest** as our testing framework with **@testing-library/react** for component testing.

### Key Features

- ⚡️ **Fast**: Vitest runs tests in parallel with hot-reload
- 🎯 **TypeScript**: Full TypeScript support out of the box
- 🧪 **Jest Compatible**: Similar API to Jest for easy migration
- 📊 **Coverage**: Built-in code coverage with v8
- 🎨 **UI Mode**: Interactive test UI for debugging

## Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Run tests with UI interface
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

### Watch Mode

By default, `pnpm test` runs in watch mode and will:

- Re-run tests when files change
- Allow filtering by filename or test name
- Show which tests failed

Press `h` in watch mode to see all available commands.

## Test Structure

### Directory Layout

```
tests/
├── setup.ts                          # Global test setup
└── integration/                      # Integration tests
    ├── file-validation.test.ts       # File validation logic
    ├── file-security.test.ts         # Magic bytes validation
    ├── rate-limiter.test.ts          # Rate limiting
    ├── ai-config.test.ts             # AI configuration
    └── history.test.ts               # History management
```

### Test Categories

#### 1. File Validation Tests (`file-validation.test.ts`)

Tests for basic file validation logic:

- File type detection (audio/video)
- Size limits (25MB audio, 500MB video)
- Extension validation
- MIME type validation
- Filename sanitization
- File size formatting

#### 2. File Security Tests (`file-security.test.ts`)

Tests for magic bytes validation and security checks:

- MP3, WAV, FLAC, OGG signature validation
- File integrity checks (signature vs claimed type)
- Malicious content detection
- Executable file detection
- Script injection detection
- Integration tests for `validateFileSecurely()`

#### 3. Rate Limiter Tests (`rate-limiter.test.ts`)

Tests for rate limiting functionality:

- Request counting within time windows
- Limit enforcement
- Window expiration and reset
- Status reporting
- Manual reset capability
- Time formatting utilities

#### 4. AI Configuration Tests (`ai-config.test.ts`)

Tests for AI provider configuration:

- OpenAI configuration
- Groq configuration
- Default model selection
- API key handling
- Provider validation

#### 5. History Management Tests (`history.test.ts`)

Tests for localStorage-based history:

- Saving transcription history
- Retrieving history items
- Deleting specific items
- Clearing all history
- Timestamp handling
- Sorting by recency

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Using Mocks

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('With Mocks', () => {
  it('should mock a function', () => {
    const mockFn = vi.fn();
    mockFn.mockReturnValue('mocked value');

    expect(mockFn()).toBe('mocked value');
  });
});
```

### Testing Async Code

```typescript
import { describe, it, expect } from 'vitest';

describe('Async Tests', () => {
  it('should handle promises', async () => {
    const result = await asyncFunction();
    expect(result).toBeDefined();
  });
});
```

### File System Tests

For tests that need to create/read files:

```typescript
import { beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';

describe('File Tests', () => {
  const testDir = './test-files';

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should read file', async () => {
    const filepath = `${testDir}/test.txt`;
    await fs.writeFile(filepath, 'content');

    const content = await fs.readFile(filepath, 'utf-8');
    expect(content).toBe('content');
  });
});
```

## Test Configuration

### Vitest Config (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Browser-like environment
    globals: true, // Global test APIs
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### Setup File (`tests/setup.ts`)

The setup file runs before all tests and:

- Imports `@testing-library/jest-dom` matchers
- Configures cleanup after each test
- Mocks Next.js modules (router, navigation)
- Sets up environment variables

## Mocking Next.js

Next.js modules are automatically mocked in `tests/setup.ts`:

```typescript
// next/navigation is mocked globally
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));
```

## Code Coverage

Generate coverage reports with:

```bash
pnpm test:coverage
```

This creates:

- Text summary in terminal
- HTML report in `coverage/` directory
- JSON report for CI tools

### Coverage Thresholds

Current coverage (to be improved):

- **Statements**: TBD
- **Branches**: TBD
- **Functions**: TBD
- **Lines**: TBD

## Best Practices

### 1. Test Naming

```typescript
// ✅ Good: Descriptive test names
it('should reject files exceeding max size', () => {});

// ❌ Bad: Vague test names
it('test file size', () => {});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should validate MP3 files', () => {
  // Arrange
  const file = createMockFile('test.mp3');

  // Act
  const result = validateFile(file);

  // Assert
  expect(result.valid).toBe(true);
});
```

### 3. One Assertion Per Concept

```typescript
// ✅ Good: Tests single behavior
it('should validate file type', () => {
  expect(result.valid).toBe(true);
});

it('should detect correct file type', () => {
  expect(result.fileType).toBe('audio');
});

// ❌ Bad: Tests multiple unrelated things
it('should do everything', () => {
  expect(result.valid).toBe(true);
  expect(result.fileType).toBe('audio');
  expect(result.size).toBeLessThan(1000);
  expect(result.name).toBe('test.mp3');
});
```

### 4. Use beforeEach/afterEach for Cleanup

```typescript
describe('Tests with setup', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });
});
```

### 5. Mock External Dependencies

```typescript
// Mock external APIs
vi.mock('openai', () => ({
  OpenAI: vi.fn(() => ({
    audio: {
      transcriptions: {
        create: vi.fn().mockResolvedValue({ text: 'transcription' }),
      },
    },
  })),
}));
```

## Continuous Integration

Tests are designed to run in CI environments:

```bash
# CI mode (exits after run)
pnpm test:run

# With coverage
pnpm test:coverage
```

## Troubleshooting

### Tests Failing Locally

1. **Clear cache**: `rm -rf node_modules/.vitest`
2. **Reinstall deps**: `pnpm install`
3. **Check Node version**: Node 18+ required

### File System Tests Failing

Make sure test directories are cleaned up:

```typescript
afterEach(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});
```

### Module Resolution Issues

Check `vitest.config.ts` has correct path alias:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './'),
  },
},
```

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Add API route testing
- [ ] Add component testing with React Testing Library
- [ ] Increase code coverage to 80%+
- [ ] Add visual regression testing
- [ ] Add performance benchmarks

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
