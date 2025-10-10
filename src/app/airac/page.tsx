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

  const user = session?.user as any;

  if (status === "loading" || loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AIRAC Cycle Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage 28-day Aeronautical Information Regulation and Control cycles
            </p>
          </div>
          <Button onClick={fetchAIRACData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Current Cycle Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Calendar className="h-4 w-4" />
                <CardTitle className="text-base font-semibold">Current AIRAC Cycle</CardTitle>
              </div>
              <CardDescription className="text-xs">Active cycle information</CardDescription>
            </CardHeader>
            <CardContent>
              {currentCycle && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl font-bold text-blue-600">{currentCycle.id}</span>
                    <Badge className="bg-green-600 text-white">Active</Badge>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(currentCycle.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Publication Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(currentCycle.publicationDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cycle Number:</span>
                      <span className="font-medium text-gray-900">{currentCycle.cycleNumber} / {selectedYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Cycle:</span>
                      <span className="font-medium text-gray-900">{formatDate(currentCycle.nextCycle)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="h-4 w-4" />
                <CardTitle className="text-base font-semibold">Next AIRAC Cycle</CardTitle>
              </div>
              <CardDescription className="text-xs">Upcoming cycle information</CardDescription>
            </CardHeader>
            <CardContent>
              {nextCycle && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl font-bold text-orange-600">{nextCycle.id}</span>
                    <Badge variant="outline" className="font-normal">In {getDaysUntil(nextCycle.effectiveDate)} days</Badge>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(nextCycle.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Publication Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(nextCycle.publicationDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cycle Number:</span>
                      <span className="font-medium text-gray-900">{nextCycle.cycleNumber} / {nextCycle.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Until Active:</span>
                      <span className="font-medium text-gray-900">{getDaysUntil(nextCycle.effectiveDate)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Publication Schedule - Hidden for cleaner layout */}

        {/* Year Cycles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">AIRAC Cycles Calendar</h2>
              <p className="text-sm text-gray-600 mt-0.5">View all cycles for the selected year</p>
            </div>
          </div>

          <div className="flex gap-2">
            {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
              <Button
                key={year}
                variant={year === selectedYear ? "default" : "outline"}
                onClick={() => setSelectedYear(year)}
                className="px-6"
              >
                {year}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {yearCycles.map((cycle) => (
              <Card key={cycle.id} className={cycle.isActive ? "border-l-4 border-l-green-500" : "border-l-4 border-l-transparent"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">{cycle.id}</CardTitle>
                    {cycle.isActive && <Badge className="bg-green-600 text-white">Active</Badge>}
                  </div>
                  <CardDescription className="text-xs">Cycle {cycle.cycleNumber}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effective:</span>
                    <span className="font-medium text-gray-900">{formatDate(cycle.effectiveDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published:</span>
                    <span className="font-medium text-gray-900">{formatDate(cycle.publicationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days until:</span>
                    <span className="font-medium text-gray-900">
                      {getDaysUntil(cycle.effectiveDate) > 0
                        ? getDaysUntil(cycle.effectiveDate)
                        : <span className="text-gray-500">Past</span>}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions - Hidden for cleaner layout */}
        {/* Info Box - Hidden for cleaner layout */}
      </div>
    </Layout>
  );
}
