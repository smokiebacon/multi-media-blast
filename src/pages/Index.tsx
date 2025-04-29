import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, DollarSign, HelpCircle, ArrowRight, Twitter, Instagram, Youtube, Facebook, Linkedin } from 'lucide-react';
import { platforms } from '@/data/platforms';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for user's preferred color scheme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    // Apply dark mode class if needed
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Handle scrolling to section if coming from navigation
    if (location.state && location.state.scrollTo) {
      const sectionId = location.state.scrollTo;
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.state]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      interval: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Post to 2 social accounts',
        'Basic analytics',
        'Media uploads up to 10MB',
        'Community support'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '$19',
      interval: 'per month',
      description: 'For content creators and small businesses',
      features: [
        'Post to 10 social accounts',
        'Advanced analytics',
        'Media uploads up to 1GB',
        'Priority support',
        'Schedule posts',
        'AI-powered caption suggestions'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$49',
      interval: 'per month',
      description: 'For agencies and large businesses',
      features: [
        'Unlimited social accounts',
        'Team collaboration',
        'Custom analytics reports',
        'Media uploads up to 10GB',
        '24/7 dedicated support',
        'White-label options',
        'API access'
      ],
      popular: false
    }
  ];

  const reviews = [
    {
      name: 'Sarah K.',
      role: 'Content Creator',
      content: 'MultiMediaBlast has revolutionized my content strategy. I can now post to all my platforms in seconds, saving me hours every week!',
      rating: 5
    },
    {
      name: 'Mark J.',
      role: 'Social Media Manager',
      content: 'The ability to schedule posts across multiple platforms has transformed how our agency handles client accounts. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emily T.',
      role: 'Small Business Owner',
      content: 'As someone who struggles with technology, MultiMediaBlast makes social media management so simple. The interface is intuitive and the support is excellent.',
      rating: 4
    }
  ];

  const features = [
    {
      title: 'Cross-Platform Posting',
      description: 'Upload once and post to multiple social media platforms with a single click.',
      icon: ArrowRight
    },
    {
      title: 'Smart Scheduling',
      description: 'Schedule your posts for optimal engagement times across different platforms.',
      icon: CheckCircle
    },
    {
      title: 'Engagement Analytics',
      description: 'Track performance across all platforms with unified analytics dashboards.',
      icon: Star
    }
  ];

  const faqs = [
    {
      question: 'Which social media platforms are supported?',
      answer: 'We currently support Instagram, Facebook, YouTube, TikTok, Twitter, LinkedIn, and more platforms are being added regularly.'
    },
    {
      question: 'How do I connect my social media accounts?',
      answer: 'After signing up, navigate to the Dashboard and click on "Connect Accounts". You\'ll be guided through the authorization process for each platform.'
    },
    {
      question: 'Is there a limit to how many posts I can schedule?',
      answer: 'Free accounts can schedule up to 10 posts per month. Pro accounts can schedule up to 100 posts per month, and Enterprise accounts have unlimited scheduling.'
    },
    {
      question: 'Can I customize posts for different platforms?',
      answer: 'Yes! You can customize captions, hashtags, and other details for each platform while still using the same media file.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-brand-purple/20 to-brand-teal/20 dark:from-brand-purple/10 dark:to-brand-teal/10">
          <div className="container mx-auto max-w-6xl text-center">
            <Badge variant="secondary" className="mb-4">New features available</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-brand-purple to-brand-teal bg-clip-text text-transparent">
              Post Once, Share Everywhere
            </h1>
            <p className="text-xl mb-10 max-w-3xl mx-auto text-muted-foreground">
              Save time by uploading your photos and videos to all your social media platforms simultaneously. 
              Schedule, customize, and analyze your content in one place.
            </p>
            {!user && (
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/auth')} variant="default" size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
                <Button onClick={() => navigate('/auth')} variant="outline" size="lg">
                  Login
                </Button>
              </div>
            )}
          </div>
        </section>
        
        {user && <Dashboard />}

        {/* Platforms Section */}
        {!user && (
          <section id="platforms" className="py-16 px-4">
            <div className="container mx-auto max-w-6xl text-center">
              <h2 className="text-3xl font-bold mb-4">Supported Platforms</h2>
              <p className="text-xl mb-10 max-w-3xl mx-auto text-muted-foreground">
                Connect all your social accounts and manage them from one dashboard.
              </p>
              <div className="flex flex-wrap justify-center gap-8 mb-8">
                <div className="flex items-center justify-center gap-2 rounded-full bg-media-instagram/10 px-4 py-2">
                  <Instagram className="text-media-instagram" />
                  <span>Instagram</span>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-full bg-media-facebook/10 px-4 py-2">
                  <Facebook className="text-media-facebook" />
                  <span>Facebook</span>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-full bg-media-youtube/10 px-4 py-2">
                  <Youtube className="text-media-youtube" />
                  <span>YouTube</span>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-2">
                  <Twitter className="text-[#1DA1F2]" />
                  <span>Twitter</span>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-2">
                  <Linkedin className="text-[#0A66C2]" />
                  <span>LinkedIn</span>
                </div>
              </div>
              <p className="text-muted-foreground">More platforms coming soon!</p>
            </div>
          </section>
        )}

        {/* Features Section */}
        {!user && (
          <section id="features" className="py-16 px-4 bg-muted/50">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
                <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
                  Streamline your social media workflow with these time-saving tools.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pricing Section */}
        {!user && (
          <section id="pricing" className="py-16 px-4">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
                <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
                  Choose the plan that works best for you and your content needs.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {pricingPlans.map((plan, index) => (
                  <Card 
                    key={index} 
                    className={`border relative ${plan.popular ? 'border-primary shadow-lg' : 'border-border shadow'}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-0 right-0 mx-auto w-fit">
                        <Badge className="bg-primary">Most Popular</Badge>
                      </div>
                    )}
                    <CardContent className="p-6 pt-8">
                      <div className="text-center mb-4">
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <div className="mt-2">
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground ml-1">{plan.interval}</span>
                        </div>
                        <p className="text-muted-foreground mt-2">{plan.description}</p>
                      </div>
                      
                      <div className="mt-6 space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-8">
                        <Button 
                          variant={plan.popular ? "default" : "outline"} 
                          className="w-full"
                          onClick={() => navigate('/auth')}
                        >
                          Get Started
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        {!user && (
          <section id="testimonials" className="py-16 px-4 bg-muted/50">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
                <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
                  Discover how MultiMediaBlast has helped content creators and businesses streamline their social media presence.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reviews.map((review, index) => (
                  <Card key={index} className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <p className="mb-4 italic">"{review.content}"</p>
                      <div className="flex items-center">
                        <div className="ml-2">
                          <p className="font-semibold">{review.name}</p>
                          <p className="text-sm text-muted-foreground">{review.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {!user && (
          <section id="faq" className="py-16 px-4">
            <div className="container mx-auto max-w-3xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
                  Still have questions? We've got answers.
                </p>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <div className="text-center mt-12">
                <p className="mb-4 text-muted-foreground">Still have questions? Contact our support team.</p>
                <Button variant="outline" onClick={() => window.location.href = 'mailto:support@multimediablast.com'}>
                  Contact Support
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {!user && (
          <section className="py-16 px-4 bg-gradient-to-br from-brand-purple to-brand-teal text-white">
            <div className="container mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Social Media?</h2>
              <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
                Join thousands of creators and businesses who save hours every week with MultiMediaBlast.
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-white text-brand-purple hover:bg-white/90"
              >
                Get Started for Free
              </Button>
            </div>
          </section>
        )}
      </main>
      
      <footer className="py-10 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-lg mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Integrations</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Guides</a></li>
                <li><a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQs</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Media Kit</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookies</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Licenses</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2025 MultiMediaBlast. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
