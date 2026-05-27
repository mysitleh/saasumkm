interface Props { className?: string; size?: number }

export default function UMonogram({ className, size = 28 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <rect width="28" height="28" rx="8" fill="#10B981" />
      <text
        x="14"
        y="20.5"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="18"
        fontWeight="700"
        fill="white"
      >
        u
      </text>
    </svg>
  );
}
