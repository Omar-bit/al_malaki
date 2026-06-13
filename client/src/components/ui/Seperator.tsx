import { motion } from 'framer-motion';
import crown from './../../assets/crown.svg';
const LINE_SIZES: { [key: string]: string } = {
  thin: 'h-[1px]',
  medium: 'h-[2px]',
  thick: 'h-[3px]',
};

const CROW_SIZES: { [key: string]: string } = {
  small: 'size-[100px]',

  medium: 'size-[150px]',
  large: 'size-[200px]',
};
export default function Seperator({
  lineColor = 'dark-red',
  crownSize = 'medium',
  lineSize = 'medium',
}: {
  lineColor?: string;
  crownSize?: keyof typeof CROW_SIZES;
  lineSize?: keyof typeof LINE_SIZES;
}) {
  const seperatorColor = 'bg-' + lineColor;
  const seperatorSize = LINE_SIZES[lineSize] || LINE_SIZES.medium;
  const crownDimension = CROW_SIZES[crownSize] || CROW_SIZES.medium;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className='relative flex items-center justify-center'
    >
      <div
        className={`absolute left-0 ${seperatorSize} w-[45%] ${seperatorColor}`}
      ></div>
      <div
        className={`absolute right-0 ${seperatorSize} w-[45%] ${seperatorColor}`}
      ></div>
      <img src={crown} alt='crown' className={`z-10 ${crownDimension} `} />
    </motion.div>
  );
}
