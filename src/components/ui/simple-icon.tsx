export interface SimpleIcon {
  path: string;
}

export const SimpleIcon = ({ icon, size = 24 }: { icon: SimpleIcon; size?: number }) => (
  <svg role="img" viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d={icon.path} />
  </svg>
);
