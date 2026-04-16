import honeySpoon from '../assets/honey_spoon.png';
export function Footer() {
  return (
    <footer className='relative p-0  overflow-hidden bg-dark-red mt-5 md:mt-10'>
      <div className='relative mx-auto h-full w-full flex items-center justify-end '>
        <img
          src={honeySpoon}
          alt='Honey Spoon'
          className='-mt-15 -mr-5 w-48 md:w-auto'
        />
      </div>
    </footer>
  );
}
