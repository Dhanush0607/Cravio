import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChatWidget } from '../components/assistant/ChatWidget.jsx';
import { assistantService } from '../services/assistantService.js';

vi.mock('../services/assistantService.js', () => ({
  assistantService: { chat: vi.fn() },
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { name: 'Demo Customer' } }),
}));

vi.mock('../context/LocationContext.jsx', () => ({
  useLocation: () => ({ city: { name: 'Bengaluru' } }),
}));

function openWidget() {
  render(
    <MemoryRouter>
      <ChatWidget />
    </MemoryRouter>
  );

  expect(screen.queryByRole('dialog', { name: 'Cravio assistant' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ask the Cravio assistant' }));
  return screen.getByRole('dialog', { name: 'Cravio assistant' });
}

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens with a welcome message and closes with Escape', () => {
    openWidget();

    expect(screen.getByText(/Hi Demo! I am the CRAVIO assistant/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'What should I order?' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Cravio assistant' })).not.toBeInTheDocument();
  });

  it('sends the question with the active city and renders the reply', async () => {
    assistantService.chat.mockResolvedValue({
      reply: 'SPECIAL80 gives you 80% off up to ₹80 on orders above ₹199.',
      suggestions: ['Show me restaurants'],
      actions: [{ label: 'Go to cart', href: '/cart' }],
    });

    openWidget();

    fireEvent.change(screen.getByLabelText('Ask the Cravio assistant'), {
      target: { value: 'Show me offers' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(assistantService.chat).toHaveBeenCalledWith({
        message: 'Show me offers',
        city: 'Bengaluru',
        history: [],
      });
    });

    expect(
      await screen.findByText('SPECIAL80 gives you 80% off up to ₹80 on orders above ₹199.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to cart/ })).toHaveAttribute('href', '/cart');
  });

  it('shows a retry action when the request fails', async () => {
    assistantService.chat.mockRejectedValueOnce({
      response: { data: { message: 'Too many requests. Please wait a moment and try again.' } },
    });

    openWidget();

    fireEvent.change(screen.getByLabelText('Ask the Cravio assistant'), {
      target: { value: 'Where is my order?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(
      await screen.findByText('Too many requests. Please wait a moment and try again.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
