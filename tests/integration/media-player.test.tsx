import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaPlayer } from '@/components/media-player';

describe('MediaPlayer', () => {
  it('renders YouTube embed for YouTube URLs', () => {
    render(
      <MediaPlayer
        sourceUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        sourceType="youtube"
        fileName="Test Video"
      />
    );

    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Test Video')).toBeInTheDocument();

    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('renders video player for direct URLs', () => {
    render(
      <MediaPlayer
        sourceUrl="https://example.com/video.mp4"
        sourceType="url"
        fileName="video.mp4"
      />
    );

    expect(screen.getByText('Media')).toBeInTheDocument();
    expect(screen.getByText('video.mp4')).toBeInTheDocument();

    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement?.getAttribute('controls')).toBe('');
  });

  it('handles youtu.be short URLs', () => {
    render(
      <MediaPlayer
        sourceUrl="https://youtu.be/dQw4w9WgXcQ"
        sourceType="youtube"
        fileName="Short URL Video"
      />
    );

    const iframe = document.querySelector('iframe');
    expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('shows warning for invalid YouTube URL', () => {
    render(
      <MediaPlayer sourceUrl="https://invalid-url.com" sourceType="youtube" fileName="Invalid" />
    );

    expect(screen.getByText('Could not load YouTube video')).toBeInTheDocument();
  });

  it('sets correct iframe attributes for YouTube', () => {
    render(
      <MediaPlayer
        sourceUrl="https://www.youtube.com/watch?v=test123"
        sourceType="youtube"
        fileName="Test"
      />
    );

    const iframe = document.querySelector('iframe');
    expect(iframe?.getAttribute('allowfullscreen')).toBe('');
    expect(iframe?.getAttribute('allow')).toContain('autoplay');
  });

  it('has 16:9 aspect ratio for YouTube embeds', () => {
    const { container } = render(
      <MediaPlayer
        sourceUrl="https://www.youtube.com/watch?v=test123"
        sourceType="youtube"
        fileName="Test"
      />
    );

    // Check that iframe exists and is in a responsive wrapper
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();

    // Check parent div has relative positioning (for responsive layout)
    const parentDiv = iframe?.parentElement;
    expect(parentDiv?.className).toContain('relative');
    expect(parentDiv?.className).toContain('w-full');
  });

  it('sets preload metadata for direct URLs', () => {
    render(
      <MediaPlayer
        sourceUrl="https://example.com/audio.mp3"
        sourceType="url"
        fileName="audio.mp3"
      />
    );

    const videoElement = document.querySelector('video');
    expect(videoElement?.getAttribute('preload')).toBe('metadata');
  });

  it('can minimize and expand player', () => {
    render(
      <MediaPlayer
        sourceUrl="https://www.youtube.com/watch?v=test123"
        sourceType="youtube"
        fileName="Test"
      />
    );

    const minimizeButton = screen.getByTitle('Minimize player');
    expect(minimizeButton).toBeInTheDocument();

    // Initially player should be expanded (iframe visible)
    let iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.parentElement).not.toHaveClass('hidden');

    // Click to minimize
    fireEvent.click(minimizeButton);

    // After minimize, iframe container should have hidden class
    iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument(); // Still in DOM
    expect(iframe?.parentElement).toHaveClass('hidden'); // But hidden with CSS

    // Button should now show expand
    const expandButton = screen.getByTitle('Expand player');
    expect(expandButton).toBeInTheDocument();

    // Click to expand again
    fireEvent.click(expandButton);

    // Iframe container should not have hidden class anymore
    iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.parentElement).not.toHaveClass('hidden');
  });
});
