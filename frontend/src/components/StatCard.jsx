import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'sky', trend }) => {
  const colorMap = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="glass-card p-5 glass-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.sky}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {value !== undefined && value !== null ? value : 0}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
