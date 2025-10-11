'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import FileFolderBrowser from '@/components/dms/FileFolderBrowser';

export default function DMSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-2">
            Upload, organize, and manage your files with tags for quick search
          </p>
        </div>

        <FileFolderBrowser
          userRole={session.user.role || 'viewer'}
          onFileSelect={(file) => {
            console.log('File selected:', file);
          }}
          onFolderSelect={(folder) => {
            console.log('Folder selected:', folder);
          }}
        />
      </div>
    </Layout>
  );
}
