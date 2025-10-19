import { createFileRoute } from '@tanstack/react-router';
import { signIn, useSession } from '~/lib/auth-client';
import { LogIn, Video, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainPage from '@/components/pages/main/MainPage';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/')({
  component: App
});

function App() {
  const session = useSession();
  if (!session || session.isPending) {
    return <></>;
  }
  const user = session.data?.user;
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-amber-950/20 dark:to-yellow-950/20">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 p-4 dark:from-amber-400 dark:to-orange-500">
                <Video className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-3xl font-bold text-transparent dark:from-amber-500 dark:to-orange-500">
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
                  provider: 'google',
                  callbackURL: location.href
                })
              }
              className="h-12 w-full bg-gradient-to-r from-amber-500 to-orange-600 text-base text-white hover:from-amber-600 hover:to-orange-700 dark:from-amber-400 dark:to-orange-500 dark:hover:from-amber-500 dark:hover:to-orange-600"
              size="lg"
            >
              <LogIn className="mr-2" /> Sign in with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Sign in to start generating videos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const is_user_allowed = user.role === 'admin';
  return (
    <div
      className={cn(
        'min-h-screen'
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
      <div className="mx-auto max-w-2xl">
        <Card className="border-amber-200 shadow-lg dark:border-amber-900/40">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/40">
              <ShieldAlert className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Access required</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account does not have permission to generate videos yet. If you believe this is a
              mistake, please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
