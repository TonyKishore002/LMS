import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Records Found',
  description = 'There are currently no items to display in this list.',
  action,
}) => {
  return (
    <div className="glass-card p-12 text-center flex flex-col items-center justify-center my-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-subtle">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
