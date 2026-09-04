import Link from "next/link";

export function CompactStats({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,10rem)] gap-2">
      {stats.map(({ title, value, href, onClick }) => {
        const className = "flex min-w-0 flex-col justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left";
        const interactiveClassName = `${className} cursor-pointer transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`;
        const content = (
          <>
            <span className="text-xs font-medium leading-4 text-slate-500">{title}</span>
            <span className="break-words text-2xl font-semibold leading-7 tracking-tight text-slate-900 tabular-nums">{value}</span>
          </>
        );
        if (href) return <Link key={title} href={href} className={interactiveClassName}>{content}</Link>;
        if (onClick) return <button key={title} type="button" onClick={onClick} className={interactiveClassName}>{content}</button>;
        return <div key={title} className={className}>{content}</div>;
      })}
    </div>
  );
}
