import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:   'bg-blue-600 hover:bg-blue-500 text-white',
  secondary: 'bg-[#1c1c1c] hover:bg-[#262626] text-[#e8e8e8] border border-[#303030]',
  danger:    'bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20',
  ghost:     'hover:bg-[#1c1c1c] text-[#909090] hover:text-[#e8e8e8]',
};

const SIZES = {
  sm: 'h-7 px-3 text-[12px]',
  md: 'h-8 px-4 text-[13px]',
  lg: 'h-10 px-5 text-[14px]',
};

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
}

export function AdminButton({
  variant = 'secondary',
  size = 'md',
  loading,
  disabled,
  className = '',
  children,
  ...rest
}: AdminButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </button>
  );
}
