import { Clock, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GameCardProps {
  title: string;
  image: string;
  scheduledTime: string;
  duration: string;
  platform?: string;
  onClick: () => void;
}

export const GameCard = ({ title, image, scheduledTime, duration, platform, onClick }: GameCardProps) => {
  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer bg-gradient-to-br from-card to-card/80 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(145,70,255,0.3)] hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-80" />
        
        {platform && (
          <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs px-2 py-1 rounded-full">
            {platform}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            <span>{scheduledTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            <span>Duração: {duration}</span>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 rounded-lg pointer-events-none transition-all duration-300" />
    </Card>
  );
};
