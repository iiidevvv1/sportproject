import type { ReactNode } from 'react';

interface HeaderProps {
  leftIcon?: ReactNode;
  centerContent: ReactNode;
  rightIcon?: ReactNode;
}

export default function Header({ leftIcon, centerContent, rightIcon }: HeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-white flex items-center justify-between px-6 py-4 shadow-sm border-b border-slate-100/50">
      <div className="w-12 flex items-center justify-start">
        {leftIcon}
      </div>
      <div className="flex-1 flex justify-center overflow-hidden">
        {centerContent}
      </div>
      <div className="w-12 flex items-center justify-end">
        {rightIcon}
      </div>
    </header>
  );
}
