'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  MessageCircle,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';

interface Review {
  _id: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  reviewer: {
    _id: string;
    name: string;
    email: string;
  };
  comments: string;
  requestedChanges: string[];
  reviewedAt?: string;
  createdAt: string;
}

interface ReviewApprovalPanelProps {
  documentId: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewApprovalPanel({
  documentId,
  onReviewSubmitted,
}: ReviewApprovalPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState('');
  const [requestedChanges, setRequestedChanges] = useState<string[]>(['']);

  useEffect(() => {
    fetchReviews();
  }, [documentId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/review`);
      const data = await res.json();

      if (res.ok) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (status: 'approved' | 'rejected' | 'changes_requested') => {
    if (status === 'changes_requested' && requestedChanges.filter((c) => c.trim()).length === 0) {
      alert('Please specify at least one requested change');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          comments,
          requestedChanges: requestedChanges.filter((c) => c.trim()),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Review ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'submitted'} successfully`);
        setComments('');
        setRequestedChanges(['']);
        await fetchReviews();
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const addRequestedChange = () => {
    setRequestedChanges([...requestedChanges, '']);
  };

  const updateRequestedChange = (index: number, value: string) => {
    const updated = [...requestedChanges];
    updated[index] = value;
    setRequestedChanges(updated);
  };

  const removeRequestedChange = (index: number) => {
    setRequestedChanges(requestedChanges.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'changes_requested':
        return (
          <Badge className="bg-orange-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Changes Requested
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              placeholder="Add your review comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Requested Changes (optional)</Label>
            {requestedChanges.map((change, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  placeholder={`Change ${index + 1}`}
                  value={change}
                  onChange={(e) => updateRequestedChange(index, e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                {requestedChanges.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequestedChange(index)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addRequestedChange}
              className="w-full"
            >
              Add Another Change
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => submitReview('approved')}
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => submitReview('changes_requested')}
              disabled={submitting}
              variant="outline"
              className="flex-1"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Request Changes
            </Button>
            <Button
              onClick={() => submitReview('rejected')}
              disabled={submitting}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">{review.reviewer.name}</p>
                        <p className="text-xs text-gray-500">{review.reviewer.email}</p>
                      </div>
                    </div>
                    {getStatusBadge(review.status)}
                  </div>

                  {review.comments && (
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-sm text-gray-700">{review.comments}</p>
                    </div>
                  )}

                  {review.requestedChanges && review.requestedChanges.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Requested Changes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {review.requestedChanges.map((change, idx) => (
                          <li key={idx} className="text-sm text-gray-700">
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {review.reviewedAt
                        ? `Reviewed on ${new Date(review.reviewedAt).toLocaleString()}`
                        : `Created on ${new Date(review.createdAt).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
