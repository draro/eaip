'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface RequestApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistId: string;
  checklistTitle: string;
  onSuccess: () => void;
}

export default function RequestApprovalModal({
  open,
  onOpenChange,
  checklistId,
  checklistTitle,
  onSuccess,
}: RequestApprovalModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
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
      const response = await fetch('/api/users?roles=org_admin,atc_supervisor&limit=10000');
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

  const toggleApprover = (userId: string) => {
    setSelectedApprovers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (selectedApprovers.length === 0) {
      setError('Please select at least one approver');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/checklists/instances/${checklistId}/request-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverIds: selectedApprovers }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setSuccess(false);
          setSelectedApprovers([]);
        }, 1500);
      } else {
        setError(data.error || 'Failed to request approval');
      }
    } catch (err) {
      setError('Failed to request approval');
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Approval</DialogTitle>
          <DialogDescription>
            Select users to approve: <span className="font-semibold">{checklistTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Approval request sent successfully!
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
              No eligible approvers found
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-3">
                Select Approvers ({selectedApprovers.length} selected)
              </div>
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedApprovers.includes(user._id)
                      ? 'bg-green-50 border-green-300'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => toggleApprover(user._id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedApprovers.includes(user._id)}
                      onCheckedChange={() => toggleApprover(user._id)}
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
          <Button onClick={handleSubmit} disabled={loading || selectedApprovers.length === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Requesting...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Request Approval ({selectedApprovers.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
