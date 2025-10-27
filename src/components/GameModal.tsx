import { ExternalLink, ShoppingCart, Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: {
    title: string;
    image: string;
    synopsis: string;
    scheduledTime: string;
    duration: string;
    platform?: string;
    genre?: string[];
    storeLinks?: { name: string; url: string }[];
  } | null;
}

export const GameModal = ({ open, onOpenChange, game }: GameModalProps) => {
  if (!game) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            {game.title}
            {game.platform && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {game.platform}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="relative h-64 rounded-lg overflow-hidden">
            <img 
              src={game.image} 
              alt={game.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-accent" />
              <span>{game.scheduledTime}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-accent" />
              <span>Duração: {game.duration}</span>
            </div>
          </div>
          
          {game.genre && game.genre.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {game.genre.map((g) => (
                <Badge key={g} variant="secondary" className="bg-secondary/50">
                  {g}
                </Badge>
              ))}
            </div>
          )}
          
          <div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">Sinopse</h3>
            <DialogDescription className="text-muted-foreground leading-relaxed">
              {game.synopsis}
            </DialogDescription>
          </div>
          
          {game.storeLinks && game.storeLinks.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Onde Comprar
              </h3>
              <div className="flex flex-wrap gap-2">
                {game.storeLinks.map((link) => (
                  <Button
                    key={link.name}
                    variant="outline"
                    size="sm"
                    className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    {link.name}
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
