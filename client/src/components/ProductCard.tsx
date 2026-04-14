interface ProductCardProps {
  name: string;
  image?: string;
}

export function ProductCard({ name, image }: ProductCardProps) {
  return (
    <div className='bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow'>
      <div className='bg-gray-200 h-64 flex items-center justify-center'>
        {image ? (
          <img src={image} alt={name} className='w-full h-full object-cover' />
        ) : (
          <div className='text-gray-400'>Product Image</div>
        )}
      </div>

      <div className='p-6'>
        <h3 className='text-dark-red font-italic text-lg mb-4'>{name}</h3>

        <button className='w-full border-2 border-dark-red text-dark-red hover:bg-dark-red hover:text-white font-bold py-2 px-4 rounded-full transition-colors'>
          Show details
        </button>
      </div>
    </div>
  );
}
