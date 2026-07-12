import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('toggles the review history sidebar', async () => {
  render(<App />);

  const toggleButton = screen.getByRole('button', { name: /open sidebar/i });
  expect(toggleButton).toBeInTheDocument();

  await userEvent.click(toggleButton);
  expect(screen.getByText(/review history/i)).toBeInTheDocument();

  await userEvent.click(toggleButton);
  expect(screen.queryByText(/review history/i)).not.toBeInTheDocument();
});

test('toggles the app theme from dark to light', async () => {
  render(<App />);

  const themeButton = screen.getByRole('button', { name: /toggle dark mode/i });
  const appRoot = document.querySelector('.app');

  expect(appRoot).toHaveAttribute('data-theme', 'dark');
  expect(appRoot).toHaveClass('dark-theme');

  await userEvent.click(themeButton);

  expect(appRoot).toHaveAttribute('data-theme', 'light');
  expect(appRoot).toHaveClass('light-theme');
});

test('renders copy and download buttons with matching shared action styling', () => {
  render(<App />);

  const copyButton = screen.getByRole('button', { name: /copy/i });
  const downloadButton = screen.getByRole('button', { name: /download/i });

  expect(copyButton).toHaveClass('review-action-btn');
  expect(downloadButton).toHaveClass('review-action-btn');
});
