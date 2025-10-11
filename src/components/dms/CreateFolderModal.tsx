'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderPlus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateComplete: () => void;
  parentFolderId?: string;
  parentFolderName?: string;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreateComplete,
  parentFolderId = 'root',
  parentFolderName = 'Home',
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    if (name.length > 100) {
      setError('Folder name cannot exceed 100 characters');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const response = await fetch('/api/dms/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          parentFolder: parentFolderId === 'root' ? null : parentFolderId,
          isPublic: false,
          allowedRoles: ['org_admin', 'atc_supervisor', 'atc', 'editor'],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create folder');
      }

      onCreateComplete();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError('');
    setCreating(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="text-sm text-gray-600">
              Location: <span className="font-medium text-gray-900">{parentFolderName}</span>
            </Label>
          </div>

          <div>
            <Label htmlFor="folderName">
              Folder Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="folderName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              disabled={creating}
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">{name.length}/100 characters</p>
          </div>

          <div>
            <Label htmlFor="folderDescription">Description (Optional)</Label>
            <Textarea
              id="folderDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this folder..."
              rows={3}
              disabled={creating}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">{description.length}/500 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4 mr-2" />
                Create Folder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
