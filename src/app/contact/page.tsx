'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail, Phone, MapPin, Send, Globe, Clock,
  CheckCircle, MessageSquare, HeadphonesIcon
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('https://automation.flyclim.com/webhook/contact-us', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'contact-page',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log('Contact form submitted successfully');
        setSubmitted(true);

        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            name: '',
            email: '',
            organization: '',
            phone: '',
            subject: '',
            message: '',
          });
        }, 3000);
      } else {
        console.error('Failed to submit contact form');
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PublicNav />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="bg-blue-800 p-4 rounded-full">
                  <MessageSquare className="h-12 w-12 text-blue-300" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Get in Touch
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                We're here to help you transform your aeronautical information publication process
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Send us a Message</CardTitle>
                    <CardDescription>
                      Fill out the form below and our team will get back to you within 24 hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submitted ? (
                      <div className="text-center py-12">
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Message Sent Successfully!
                        </h3>
                        <p className="text-gray-600">
                          Thank you for contacting us. We'll get back to you soon.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => handleChange('name', e.target.value)}
                              placeholder="John Doe"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              placeholder="john@aviation.gov"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="organization">Organization *</Label>
                            <Input
                              id="organization"
                              value={formData.organization}
                              onChange={(e) => handleChange('organization', e.target.value)}
                              placeholder="Civil Aviation Authority"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleChange('phone', e.target.value)}
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="subject">Subject *</Label>
                          <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            placeholder="Request for Demo / Pricing Information / Technical Support"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="message">Message *</Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            placeholder="Tell us about your requirements..."
                            rows={6}
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          {submitting ? (
                            'Sending...'
                          ) : (
                            <>
                              <Send className="h-5 w-5 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start">
                      <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                        <a href="mailto:info@flyclim.com" className="text-blue-600 hover:underline">
                          info@flyclim.com
                        </a>
                        <p className="text-sm text-gray-600 mt-1">We'll respond within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                        <div className="space-y-1">
                          <div>
                            <a href="tel:+19894472494" className="text-blue-600 hover:underline">
                              +1 989 447 2494
                            </a>
                          </div>
                          <div>
                            <a href="tel:+972538344355" className="text-blue-600 hover:underline">
                              +972 53 834 4355
                            </a>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Monday - Friday, 9AM - 6PM EST</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Business Hours</h4>
                        <p className="text-gray-700">
                          Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                          Saturday - Sunday: Closed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <HeadphonesIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Enterprise Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">
                      For existing customers, we offer 24/7 enterprise support with dedicated
                      account managers.
                    </p>
                    <Link href="/auth/signin">
                      <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                        Access Support Portal
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-blue-600" />
                      Global Presence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">
                      Serving Civil Aviation Authorities across:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• North America</li>
                      <li>• Europe</li>
                      <li>• Asia Pacific</li>
                      <li>• Middle East</li>
                      <li>• Latin America</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600">
                Quick answers to common questions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How long does implementation take?
                </h3>
                <p className="text-gray-600">
                  Typical implementation takes 2-4 weeks, including data migration, user training,
                  and system configuration. We provide dedicated support throughout.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What support do you offer?
                </h3>
                <p className="text-gray-600">
                  Enterprise customers receive 24/7 support with dedicated account managers,
                  regular check-ins, and priority response times.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I request a demo?
                </h3>
                <p className="text-gray-600">
                  Yes! Contact us to schedule a personalized demo where we'll showcase features
                  relevant to your specific requirements.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is the system ICAO compliant?
                </h3>
                <p className="text-gray-600">
                  Absolutely. We maintain 100% compliance with ICAO Annex 15 and EUROCONTROL
                  Specification 3.0 standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}