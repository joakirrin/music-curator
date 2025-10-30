import { Button } from './ui/button';
import { Music2 } from 'lucide-react';

export const SpotifyButton = () => {
  const handleClick = () => {
    alert('Spotify integration coming soon! This will allow you to sync playlists directly.');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <Button
          onClick={handleClick}
          disabled
          className="bg-green-600 hover:bg-green-700"
        >
          <Music2 className="mr-2 h-4 w-4" />
          Connect with Spotify
        </Button>
        <p className="mt-2 text-sm text-gray-600">
          Coming soon: Direct integration with your Spotify account
        </p>
      </div>
    </div>
  );
};
