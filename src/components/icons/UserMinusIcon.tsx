export const UserMinusIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Person circle */}
      <circle cx="9" cy="7" r="4" />
      {/* Person body */}
      <path d="M1.5 20.5c0-3.5 3.5-6.5 7.5-6.5s7.5 3 7.5 6.5v1.5H1.5v-1.5z" />
      {/* Minus circle background */}
      <circle cx="18.5" cy="18.5" r="5.5" fill="currentColor" />
      {/* Minus sign */}
      <line x1="15" y1="18.5" x2="22" y2="18.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
