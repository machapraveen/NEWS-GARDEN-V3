import { Link } from 'react-router-dom';
import { ArrowLeft, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NewsChannelsGlobe from '@/components/NewsChannelsGlobe';

const Channels = () => {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4]">
              <Globe2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold tracking-wider text-primary text-glow">
                NEWS CHANNELS
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Global News Channel Directory
              </p>
            </div>
          </div>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm" className="glass border-border/30 text-xs">
            <Globe2 className="mr-1.5 h-3.5 w-3.5" />
            News Globe
          </Button>
        </Link>
      </div>

      {/* Globe */}
      <div className="flex-1 overflow-hidden">
        <NewsChannelsGlobe />
      </div>
    </div>
  );
};

export default Channels;
