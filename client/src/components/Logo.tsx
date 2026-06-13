import logo from './../assets/logo.svg';
export function Logo({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <img
      src={logo}
      alt='Al Malaki Logo'
      className={className + ' w-26 -mt-3'}
      onClick={onClick ? onClick : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    />
  );
}
