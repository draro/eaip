'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Book, User, LogOut, Settings, Radio } from 'lucide-react';

interface HeaderProps {
  currentPage?: 'home' | 'documents' | 'versions' | 'exports' | 'eaip';
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center mr-8">
              <Book className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">eAIP Editor</h1>
            </Link>

            <nav className="flex space-x-4">
              <Link href="/eaip">
                <Button variant={currentPage === 'eaip' ? 'default' : 'ghost'}>
                  <Radio className="h-4 w-4 mr-1" />
                  eAIP
                </Button>
              </Link>
              {session && (
                <>
                  <Link href="/documents">
                    <Button variant={currentPage === 'documents' ? 'default' : 'ghost'}>
                      Documents
                    </Button>
                  </Link>
                  <Link href="/versions">
                    <Button variant={currentPage === 'versions' ? 'default' : 'ghost'}>
                      Versions
                    </Button>
                  </Link>
                  <Link href="/exports">
                    <Button variant={currentPage === 'exports' ? 'default' : 'ghost'}>
                      Exports
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      {session.user?.name}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>User Profile</DialogTitle>
                      <DialogDescription>
                        Your account information and settings
                      </DialogDescription>
                    </DialogHeader>
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Name</label>
                            <p className="text-sm text-gray-900">{session.user?.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-sm text-gray-900">{session.user?.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Role</label>
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {session.user?.role}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </>
            ) : status === 'loading' ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}