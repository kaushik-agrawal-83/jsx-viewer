import React from 'react';

const btn =
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none px-4 py-2';
const btnVariants: Record<string, string> = {
  default: 'bg-primary text-white hover:bg-primary-dark',
  destructive: 'bg-error text-white hover:opacity-90',
  outline: 'border border-white/20 text-text-primary hover:bg-white/10',
  ghost: 'text-text-primary hover:bg-white/10',
  link: 'text-primary underline-offset-4 hover:underline',
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }
>(({ children, className = '', variant = 'default', ...props }, ref) => (
  <button
    ref={ref}
    className={`${btn} ${btnVariants[variant] ?? btnVariants.default} ${className}`}
    {...props}
  >
    {children}
  </button>
));
Button.displayName = 'Button';

export const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`rounded-xl border border-white/[0.08] bg-surface-raised shadow-md ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight text-text-primary ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-text-secondary ${className}`} {...props}>
    {children}
  </p>
);

const badgeVariants: Record<string, string> = {
  default: 'bg-primary-glow text-primary border-primary/30',
  secondary: 'bg-white/10 text-text-secondary border-white/10',
  destructive: 'bg-error-subtle text-error border-error/30',
  outline: 'border border-white/20 text-text-primary',
};

export const Badge = ({
  children,
  className = '',
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: string }) => (
  <div
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeVariants[variant] ?? badgeVariants.default} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`flex h-10 w-full rounded-md border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-ring disabled:opacity-50 ${className}`}
    {...props}
  />
));
Input.displayName = 'Input';

export const Label = ({ children, className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`text-sm font-medium leading-none text-text-primary ${className}`} {...props}>
    {children}
  </label>
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    className={`flex min-h-[80px] w-full rounded-md border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-ring disabled:opacity-50 ${className}`}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className="flex h-10 w-full rounded-md border border-white/[0.12] bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
    {...props}
  >
    {children}
  </select>
);

export const Table = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="border-b border-white/[0.08]" {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody {...props}>{children}</tbody>
);

export const TableRow = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={`border-b border-white/[0.06] transition-colors hover:bg-white/[0.03] ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead = ({
  children,
  className = '',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-text-secondary ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell = ({
  children,
  className = '',
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`p-4 align-middle text-text-primary ${className}`} {...props}>
    {children}
  </td>
);

// eslint-disable-next-line react-refresh/only-export-components
export const shadcnStubs: Record<string, Record<string, unknown>> = {
  button: { Button },
  card: { Card, CardHeader, CardContent, CardTitle, CardDescription },
  badge: { Badge },
  input: { Input },
  label: { Label },
  textarea: { Textarea },
  select: { Select },
  table: { Table, TableHeader, TableBody, TableRow, TableHead, TableCell },
};
