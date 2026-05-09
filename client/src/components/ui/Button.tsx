import type { ReactNode } from "react";

type TBackgroundVariant = 'honeyPattern' | 'redPattern';

const bgStyles = {
    honeyPattern: 'bg-honeyPattern',
    redPattern: 'bg-redPattern',
};
export default function Button({ classNames, backgroundVariant = 'honeyPattern', children, onClick }: { classNames?: string, backgroundVariant?: TBackgroundVariant, children: ReactNode, onClick?: () => void }) {

    return <button onClick={onClick ? onClick : () => { }} className={`${bgStyles[backgroundVariant]} px-4 py-2 rounded-md text-white font-semibold hover:cursor-pointer px-5 py-2 ` + classNames}>{children}</button>;
}

