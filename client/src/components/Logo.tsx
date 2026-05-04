import logo from './../assets/logo.svg';
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <img
      src={logo}
      alt='Al Malaki Logo'
      className=' w-26'
      onClick={onClick ? onClick : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    />
  );
}
