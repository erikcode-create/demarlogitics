import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { signInWithOtp, toast, navigate } = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  toast: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp,
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

vi.mock('@/assets/demar-logo.png', () => ({
  default: 'demar-logo.png',
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

import Auth from './Auth';

describe('Auth', () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
    signInWithOtp.mockResolvedValue({ error: null });
    toast.mockReset();
    navigate.mockReset();
    window.history.replaceState({}, '', '/auth');
  });

  it('normalizes the email before requesting the CRM magic link', async () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: ' Shayne@DeMarTransportation.com ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(1));

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'shayne@demartransportation.com',
      options: {
        emailRedirectTo: `${window.location.origin}/sales/dashboard`,
      },
    });
    expect(await screen.findByText(/shayne@demartransportation.com/)).toBeInTheDocument();
  });
});
