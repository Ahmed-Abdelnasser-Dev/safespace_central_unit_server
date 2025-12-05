// src/components/AuthLayout.jsx
import AuthLeftPanel from './AuthLeftPanel.jsx';
import AuthRightPanel from './AuthRightPanel.jsx';

/**
 * 2-column auth layout (left hero + right form card)
 */
function AuthLayout({
  children,
  title,
  subtitle,
  icon,          // optional icon
  leftTitle,
  leftDescription,
  leftBullets,
}) {
  return (
    <div className="min-h-screen w-full bg-safe-bg flex items-center">
      {/* Left hero */}
      <div className="w-1/2 h-[80vh] flex items-center">
        <AuthLeftPanel
          title={leftTitle}
          description={leftDescription}
          bullets={leftBullets}
        />
      </div>

      {/* Right card – centered in its half */}
      <div className="w-1/2 h-[80vh] flex items-center justify-center px-16">
        <AuthRightPanel icon={icon} title={title} subtitle={subtitle}>
          {children}
        </AuthRightPanel>
      </div>
    </div>
  );
}

export default AuthLayout;
