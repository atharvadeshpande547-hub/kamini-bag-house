import { Link } from 'react-router-dom';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="group relative block rounded-xl overflow-hidden aspect-[4/5] bg-stone-100"
    >
      <img
        src={category.image_url}
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-lg">{category.name}</h3>
        {category.product_count !== undefined && (
          <p className="text-white/80 text-xs mt-0.5">
            {category.product_count} {category.product_count === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>
    </Link>
  );
}
