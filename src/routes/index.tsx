import { createFileRoute } from "@tanstack/react-router";
import { signIn, useSession, signOut } from "~/lib/auth-client";
import { LogIn, LogOut, Video, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import MainPage from "@/components/pages/main/MainPage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const session = useSession();
  if (!session || session.isPending) {
    return <></>;
  }
  const user = session.data?.user;
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-amber-950/20 dark:to-yellow-950/20">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500 p-4 rounded-full">
                <Video className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500 bg-clip-text text-transparent">
              Sora 2 Video Generator
            </CardTitle>
            {/* <CardDescription className="text-base">
              Create stunning AI-generated videos with the power of Sora 2
            </CardDescription> */}
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() =>
                signIn.social({
                  provider: "google",
                  callbackURL: location.href,
                })
              }
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 dark:from-amber-400 dark:to-orange-500 dark:hover:from-amber-500 dark:hover:to-orange-600 text-white h-12 text-base"
              size="lg"
            >
              <LogIn className="mr-2" /> Sign in with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Sign in to start generating videos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const is_user_allowed = user.role === "admin";
  return (
    <div
      className={cn(
        "min-h-screen"
        // "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-amber-950/20 dark:to-yellow-950/20"
      )}
    >
      <Header user={user} />
      {is_user_allowed ? <MainPage /> : <NotAllowed />}
    </div>
  );
}

const Header = ({ user }: { user: any }) => {
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
        <UserControlMenu user={user} />
      </div>
    </header>
  );
};

const UserControlMenu = ({ user }: { user: any }) => {
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
            <AvatarImage src={user.image} alt={user.name} />
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
              <AvatarImage src={user.image} alt={user.name} />
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

const NotAllowed = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-amber-200 dark:border-amber-900/40">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-full">
              <ShieldAlert className="w-6 h-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Access required</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account does not have permission to generate videos yet. If
              you believe this is a mistake, please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
