import { LogOut, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { signOut, useSession } from '~/lib/auth-client';

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
    <header className="sticky top-0 z-50 border-b border-amber-200 bg-white/80 shadow-sm backdrop-blur-md dark:border-amber-900/40 dark:bg-gray-950/80">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 p-2 dark:from-amber-400 dark:to-orange-500">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-2xl font-bold text-transparent dark:from-amber-500 dark:to-orange-500">
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
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-amber-200 dark:border-amber-900/40">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-600 text-white dark:from-amber-500 dark:to-orange-600">
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
              <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-600 text-white dark:from-amber-500 dark:to-orange-600">
                {getInitials(user.name || user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm leading-none font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
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
