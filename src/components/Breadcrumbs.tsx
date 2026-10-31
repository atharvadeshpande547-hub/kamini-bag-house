import { Link } from 'react-router-dom';

interface BreadcrumbsProps {
  items: { label: string; to?: string }[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-stone-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-stone-300">/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-stone-900 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-stone-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
