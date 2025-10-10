"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle, AlertCircle, RefreshCw, Download, Upload } from "lucide-react";

interface AIRACCycle {
  id: string;
  effectiveDate: string;
  publicationDate: string;
  cycleNumber: number;
  year: number;
  isActive: boolean;
  nextCycle: string;
  previousCycle: string;
}

interface PublicationSchedule {
  cycle: AIRACCycle;
  publicationDate: string;
  effectiveDate: string;
  deadlines: {
    initialSubmission: string;
    finalSubmission: string;
    review: string;
    publication: string;
    effective: string;
  };
  status: 'planning' | 'submission' | 'review' | 'published' | 'effective' | 'expired';
}

export default function AIRACPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentCycle, setCurrentCycle] = useState<AIRACCycle | null>(null);
  const [nextCycle, setNextCycle] = useState<AIRACCycle | null>(null);
  const [yearCycles, setYearCycles] = useState<AIRACCycle[]>([]);
  const [schedule, setSchedule] = useState<PublicationSchedule | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAIRACData();
    }
  }, [status, selectedYear]);

  const fetchAIRACData = async () => {
    setLoading(true);
    try {
      const [currentRes, nextRes, yearRes] = await Promise.all([
        fetch('/api/airac?action=current'),
        fetch('/api/airac?action=next'),
        fetch(`/api/airac?action=year&year=${selectedYear}`)
      ]);

      const currentData = await currentRes.json();
      const nextData = await nextRes.json();
      const yearData = await yearRes.json();

      if (currentData.success) setCurrentCycle(currentData.data);
      if (nextData.success) setNextCycle(nextData.data);
      if (yearData.success) setYearCycles(yearData.data);

      if (currentData.success) {
        const scheduleRes = await fetch(`/api/airac?action=schedule&cycleId=${currentData.data.id}`);
        const scheduleData = await scheduleRes.json();
        if (scheduleData.success) setSchedule(scheduleData.data);
      }
    } catch (error) {
      console.error('Error fetching AIRAC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-500';
      case 'submission': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'published': return 'bg-green-500';
      case 'effective': return 'bg-green-600';
      case 'expired': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const diff = new Date(dateString).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (status === "loading" || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AIRAC Cycle Management</h1>
            <p className="text-gray-600 mt-2">
              Manage 28-day Aeronautical Information Regulation and Control cycles
            </p>
          </div>
          <Button onClick={fetchAIRACData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Current Cycle Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Current AIRAC Cycle
              </CardTitle>
              <CardDescription>Active cycle information</CardDescription>
            </CardHeader>
            <CardContent>
              {currentCycle && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-blue-600">{currentCycle.id}</span>
                    <Badge className="bg-green-600">Active</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Date:</span>
                      <span className="font-medium">{formatDate(currentCycle.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Publication Date:</span>
                      <span className="font-medium">{formatDate(currentCycle.publicationDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cycle Number:</span>
                      <span className="font-medium">{currentCycle.cycleNumber} / {selectedYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Cycle:</span>
                      <span className="font-medium">{formatDate(currentCycle.nextCycle)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Next AIRAC Cycle
              </CardTitle>
              <CardDescription>Upcoming cycle information</CardDescription>
            </CardHeader>
            <CardContent>
              {nextCycle && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-orange-600">{nextCycle.id}</span>
                    <Badge variant="outline">In {getDaysUntil(nextCycle.effectiveDate)} days</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Date:</span>
                      <span className="font-medium">{formatDate(nextCycle.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Publication Date:</span>
                      <span className="font-medium">{formatDate(nextCycle.publicationDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cycle Number:</span>
                      <span className="font-medium">{nextCycle.cycleNumber} / {nextCycle.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Until Active:</span>
                      <span className="font-medium">{getDaysUntil(nextCycle.effectiveDate)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Publication Schedule */}
        {schedule && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Publication Schedule & Deadlines
              </CardTitle>
              <CardDescription>Key dates for current AIRAC cycle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Initial Submission</p>
                    <p className="text-sm text-gray-600">{formatDate(schedule.deadlines.initialSubmission)}</p>
                  </div>
                  <span className="text-sm text-gray-600">{getDaysUntil(schedule.deadlines.initialSubmission)} days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Final Submission</p>
                    <p className="text-sm text-gray-600">{formatDate(schedule.deadlines.finalSubmission)}</p>
                  </div>
                  <span className="text-sm text-gray-600">{getDaysUntil(schedule.deadlines.finalSubmission)} days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">Review Period</p>
                    <p className="text-sm text-gray-600">{formatDate(schedule.deadlines.review)}</p>
                  </div>
                  <span className="text-sm text-gray-600">{getDaysUntil(schedule.deadlines.review)} days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Publication Date</p>
                    <p className="text-sm text-gray-600">{formatDate(schedule.deadlines.publication)}</p>
                  </div>
                  <span className="text-sm text-gray-600">{getDaysUntil(schedule.deadlines.publication)} days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                  <div>
                    <p className="font-medium">Effective Date</p>
                    <p className="text-sm text-gray-600">{formatDate(schedule.deadlines.effective)}</p>
                  </div>
                  <Badge className={getStatusColor(schedule.status)}>{schedule.status.toUpperCase()}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Year Cycles */}
        <Card>
          <CardHeader>
            <CardTitle>AIRAC Cycles Calendar</CardTitle>
            <CardDescription>View all cycles for the selected year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
                <Button
                  key={year}
                  variant={year === selectedYear ? "default" : "outline"}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {yearCycles.map((cycle) => (
                <Card key={cycle.id} className={cycle.isActive ? "border-green-500 border-2" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cycle.id}</CardTitle>
                      {cycle.isActive && <Badge className="bg-green-600">Active</Badge>}
                    </div>
                    <CardDescription>Cycle {cycle.cycleNumber}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective:</span>
                      <span className="font-medium">{formatDate(cycle.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Published:</span>
                      <span className="font-medium">{formatDate(cycle.publicationDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days until:</span>
                      <span className="font-medium">
                        {getDaysUntil(cycle.effectiveDate) > 0
                          ? `${getDaysUntil(cycle.effectiveDate)} days`
                          : 'Past'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>AIRAC Management Actions</CardTitle>
            <CardDescription>Tools for managing AIRAC cycles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-24 flex-col gap-2">
                <Upload className="h-6 w-6" />
                <span>Schedule Amendment</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2">
                <Download className="h-6 w-6" />
                <span>Export Calendar</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2">
                <AlertCircle className="h-6 w-6" />
                <span>View Pending Changes</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">About AIRAC Cycles</h3>
                <p className="text-sm text-blue-800">
                  AIRAC (Aeronautical Information Regulation and Control) cycles are standardized 28-day periods
                  established by ICAO for updating aeronautical information. Each cycle begins on a Thursday and
                  ensures coordinated publication of critical aviation information worldwide. Changes must be
                  submitted at least 56 days before the effective date to allow proper review and distribution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
