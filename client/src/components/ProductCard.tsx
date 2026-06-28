import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';

interface ProductCardProps {
  name?: string;
  image?: string;
  slug?: string;
}

export function ProductCard({ name, image, slug }: ProductCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleDetailsClick = () => {
    if (slug) {
      navigate(`/products/${slug}`);
    }
  };

  return (
    <article className='w-full'>
      <div className='w-full aspect-square bg-[#d9d9d9] flex items-center justify-center overflow-hidden'>
        {image && (
          <img
            src={image}
            alt={name || 'Product'}
            className='w-full h-full object-cover'
          />
        )}
      </div>
      <h3 className='mt-2 text-center qq text-4xl md:text-2xl font-italic leading-[1.05] text-black'>
        {name || t('products.name')}
      </h3>
      <div className='mt-2 flex justify-center'>
        <Button
          classNames='px-12 py-2 rounded-[81px]! bg-[#e6d7c2] font-[var(--font-abhaya)] text-lg cursor-pointer leading-[1.05] font-extrabold text-[#370d0f] hover:bg-[#e6d7c2]/90 transition duration-300 '
          onClick={handleDetailsClick}
        >
          <span className='text-dark-red font-semibold text-xl'>
            {t('products.button')}
          </span>
        </Button>
      </div>
    </article>
  );
}
