
export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <h3 className={`text-lg font-bold ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-4 pt-0 ${className}`}>{children}</div>;
}
