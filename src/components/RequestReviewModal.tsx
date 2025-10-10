'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface RequestReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistId: string;
  checklistTitle: string;
  onSuccess: () => void;
}

export default function RequestReviewModal({
  open,
  onOpenChange,
  checklistId,
  checklistTitle,
  onSuccess,
}: RequestReviewModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      const response = await fetch('/api/users?roles=org_admin,atc_supervisor,editor&limit=10000');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setFetchingUsers(false);
    }
  };

  const toggleReviewer = (userId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (selectedReviewers.length === 0) {
      setError('Please select at least one reviewer');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/checklists/instances/${checklistId}/request-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerIds: selectedReviewers }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setSuccess(false);
          setSelectedReviewers([]);
        }, 1500);
      } else {
        setError(data.error || 'Failed to request review');
      }
    } catch (err) {
      setError('Failed to request review');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'org_admin':
        return 'bg-purple-100 text-purple-800';
      case 'atc_supervisor':
        return 'bg-orange-100 text-orange-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Review</DialogTitle>
          <DialogDescription>
            Select users to review: <span className="font-semibold">{checklistTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Review request sent successfully!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {fetchingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No eligible reviewers found
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-3">
                Select Reviewers ({selectedReviewers.length} selected)
              </div>
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedReviewers.includes(user._id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => toggleReviewer(user._id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedReviewers.includes(user._id)}
                      onCheckedChange={() => toggleReviewer(user._id)}
                    />
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedReviewers.length === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Requesting...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Request Review ({selectedReviewers.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
