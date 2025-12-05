import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Checkbox from '../components/ui/Checkbox.jsx';

function SignIn() {
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Access your admin dashboard"
      leftTitle={'Welcome to Accident\nPrevention System'}
      leftDescription="Monitor real-time traffic, manage emergency responses, and prevent accidents with AI-powered analytics and smart city infrastructure."
      leftBullets={[
        'Real-time monitoring and alerts.',
        'AI-powered accident prediction.',
        'Smart city infrastructure integration.',
      ]}
    >
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-safe-text-dark">
            Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-safe-text-gray/60">
              <i className="bi bi-envelope text-xs" />
            </span>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-safe-border bg-safe-bg/40 text-safe-text-dark placeholder:text-safe-text-gray-light focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/20 focus:border-safe-blue-btn"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-safe-text-dark">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-safe-text-gray/60">
              <i className="bi bi-lock text-xs" />
            </span>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-safe-border bg-safe-bg/40 text-safe-text-dark placeholder:text-safe-text-gray-light focus:outline-none focus:ring-2 focus:ring-safe-blue-btn/20 focus:border-safe-blue-btn"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-safe-text-gray/70 text-xs"
            >
              <i className="bi bi-eye" />
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            className="flex items-center gap-2 text-safe-text-gray"
            onClick={() => setRemember(!remember)}
          >
            <Checkbox
              checked={remember}
              onChange={setRemember}
              className="w-4 h-4 shadow-none"
            />
            <span>Remember me</span>
          </button>
          <Link
            to="/forgot-password"
            className="text-safe-blue-btn hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* MFA info row */}
        <div className="flex items-start gap-3 rounded-lg border border-safe-border bg-safe-bg/60 px-3 py-3">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <i className="bi bi-shield text-safe-blue-btn text-lg font-bold" />
          </div>
          <div className="text-[11px] leading-relaxed text-safe-text-gray">
            <p className="font-semibold text-safe-text-dark mb-0.5">
              Multi-Factor Authentication
            </p>
            <p>
              For enhanced security, MFA will be required after sign in.
            </p>
          </div>
        </div>

        {/* Primary button */}
        <Button
          variant="primary"
          size="md"
          className="w-full"
          type="button"
          onClick={() => navigate('/two-factor')}
        >
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
}

export default SignIn;
