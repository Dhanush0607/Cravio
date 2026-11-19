import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  registerUser: vi.fn(),
  login: vi.fn(),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    register: auth.registerUser,
    login: auth.login,
  }),
}));

vi.mock('../context/ToastContext.jsx', () => ({
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }),
}));

const { default: RegisterPage } = await import('../pages/Auth/RegisterPage.jsx');
const { default: LoginPage } = await import('../pages/Auth/LoginPage.jsx');

function renderPage(element) {
  return render(<MemoryRouter initialEntries={['/']}>{element}</MemoryRouter>);
}

async function fillRegistration(user, overrides = {}) {
  const values = {
    name: 'Test Customer',
    email: 'test.customer@cravio.dev',
    phone: '+919876543210',
    password: 'StrongPass123',
    confirmPassword: 'StrongPass123',
    ...overrides,
  };

  await user.type(screen.getByLabelText('Full name'), values.name);
  await user.type(screen.getByLabelText('Email address'), values.email);
  await user.type(screen.getByLabelText('Phone number'), values.phone);
  await user.type(screen.getByLabelText('Password'), values.password);
  await user.type(screen.getByLabelText('Confirm password'), values.confirmPassword);
  if (values.confirmPassword) await user.click(screen.getByRole('checkbox'));
  return values;
}

describe('authentication forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.registerUser.mockResolvedValue({ name: 'Test Customer' });
    auth.login.mockResolvedValue({ name: 'Test Customer', role: 'customer' });
  });

  it('shows field errors for an empty registration submission', async () => {
    const user = userEvent.setup();
    renderPage(<RegisterPage />);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(
      screen.getByText('Enter a valid phone number with 10-15 digits')
    ).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Accept the terms to create an account')).toBeInTheDocument();
    expect(auth.registerUser).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords before calling the API', async () => {
    const user = userEvent.setup();
    renderPage(<RegisterPage />);

    await fillRegistration(user, { confirmPassword: 'StrongPass124' });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(auth.registerUser).not.toHaveBeenCalled();
  });

  it('submits trimmed registration values when the form is valid', async () => {
    const user = userEvent.setup();
    renderPage(<RegisterPage />);

    await fillRegistration(user, { email: '  test.customer@cravio.dev  ' });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(auth.registerUser).toHaveBeenCalledTimes(1);
    expect(auth.registerUser).toHaveBeenCalledWith({
      name: 'Test Customer',
      email: 'test.customer@cravio.dev',
      phone: '+919876543210',
      password: 'StrongPass123',
      confirmPassword: 'StrongPass123',
    });
  });

  it('validates the login form and submits credentials', async () => {
    const user = userEvent.setup();
    renderPage(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Email address'), 'demo@cravio.dev');
    await user.type(screen.getByLabelText('Password'), 'DemoCustomer123!');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(auth.login).toHaveBeenCalledWith({
      email: 'demo@cravio.dev',
      password: 'DemoCustomer123!',
    });
  });
});
