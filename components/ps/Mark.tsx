import Logo from './Logo';

/** The shield mark. Kept as a component so every older use now shows the real logo mark. */
export default function Mark({ size = 28 }: { size?: number }) { return <Logo variant="mark" height={size} />; }
