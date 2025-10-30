import { Badge } from './ui/badge';
import { Platform } from '../types/song';

const platformColors: Record<Platform, string> = {
  Spotify: 'bg-green-500 hover:bg-green-600 text-white',
  YouTube: 'bg-red-500 hover:bg-red-600 text-white',
  Bandcamp: 'bg-cyan-500 hover:bg-cyan-600 text-white',
  SoundCloud: 'bg-orange-500 hover:bg-orange-600 text-white',
};

interface PlatformBadgeProps {
  platform: Platform;
  onRemove?: () => void;
}

export const PlatformBadge = ({ platform, onRemove }: PlatformBadgeProps) => {
  return (
    <Badge
      className={`${platformColors[platform]} cursor-pointer`}
      onClick={onRemove}
    >
      {platform}
      {onRemove && <span className="ml-1">×</span>}
    </Badge>
  );
};
