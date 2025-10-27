import { Twitch, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface StreamerHeaderProps {
  name: string;
  avatar: string;
  bio: string;
  twitchUrl: string;
  followers?: string;
}

export const StreamerHeader = ({ name, avatar, bio, twitchUrl, followers }: StreamerHeaderProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/80 border border-primary/20 p-6 mb-6 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50" />
      
      <div className="relative flex flex-col sm:flex-row items-center gap-4">
        <Avatar className="h-20 w-20 border-2 border-primary shadow-[0_0_20px_rgba(145,70,255,0.5)]">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 flex items-center justify-center sm:justify-start gap-2">
            {name}
            <Twitch className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-muted-foreground mb-2">{bio}</p>
          {followers && (
            <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
              <span className="text-accent font-semibold">{followers}</span> seguidores
            </p>
          )}
        </div>
        
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(145,70,255,0.3)] hover:shadow-[0_0_30px_rgba(145,70,255,0.5)] transition-all duration-300"
          onClick={() => window.open(twitchUrl, '_blank')}
        >
          <Twitch className="mr-2 h-4 w-4" />
          Assista na Twitch
        </Button>
      </div>
    </div>
  );
};
