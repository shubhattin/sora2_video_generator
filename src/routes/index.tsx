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
      {is_user_allowed ? <MainPage /> : <NotAllowed />}
    </div>
  );
}

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
