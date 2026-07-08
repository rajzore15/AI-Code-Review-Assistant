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
