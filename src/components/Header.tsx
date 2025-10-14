import { LogOut, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { signOut, useSession } from "~/lib/auth-client";

export default function Header() {
  const session = useSession();
  if (!session || session.isPending) {
    return <></>;
  }
  const user = session.data?.user;
  if (!user) {
    return <></>;
  }

  return (
    <header className="border-b border-amber-200 dark:border-amber-900/40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500 p-2 rounded-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500 bg-clip-text text-transparent">
              Sora 2
            </h1>
            <p className="text-xs text-muted-foreground">AI Video Generation</p>
          </div>
        </div>
        <UserControlMenu />
      </div>
    </header>
  );
}

const UserControlMenu = () => {
  const session = useSession();
  const user = session.data?.user!;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-amber-200 dark:border-amber-900/40">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-500 dark:to-orange-600 text-white">
              {getInitials(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-amber-200 dark:border-amber-900/40">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-500 dark:to-orange-600 text-white">
                {getInitials(user.name || user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
