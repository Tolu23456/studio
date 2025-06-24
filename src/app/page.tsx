import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Gift, PlayCircle, Star } from "lucide-react";
import Link from "next/link";
import LandingHeader from "@/components/layout/landing-header";
import LandingFooter from "@/components/layout/landing-footer";

export default function Home() {
  const features = [
    {
      icon: <PlayCircle className="w-8 h-8 text-primary" />,
      title: "Watch Ads",
      description: "Earn Cubes by watching short and engaging video ads from our partners.",
      dataAiHint: "video play",
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-primary" />,
      title: "Complete Tasks",
      description: "Boost your earnings by completing simple tasks like surveys and app downloads.",
      dataAiHint: "checklist task",
    },
    {
      icon: <Gift className="w-8 h-8 text-primary" />,
      title: "Daily Rewards",
      description: "Log in every day to claim your daily bonus Cubes and keep the streak going.",
      dataAiHint: "gift box",
    },
    {
      icon: <Star className="w-8 h-8 text-primary" />,
      title: "Engage with Offers",
      description: "Discover exciting offers from top brands and get rewarded for your engagement.",
      dataAiHint: "star reward",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="w-full py-12 sm:py-20 md:py-28 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_550px] lg:gap-12 xl:grid-cols-[1fr_650px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter font-headline sm:text-5xl md:text-6xl/none">
                    Turn Your Time into Rewards with Adsener
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Watch ads, complete tasks, and play games to earn Cubes.
                    Redeem your Cubes for amazing prizes. It's that simple.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/register">Get Started for Free</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">Login to Your Account</Link>
                  </Button>
                </div>
              </div>
              <svg
                width="650"
                height="450"
                viewBox="0 0 650 450"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto aspect-video w-full rounded-xl object-contain lg:order-last"
                aria-labelledby="hero-illustration-title"
              >
                <title id="hero-illustration-title">An illustration of a mobile app interface showing graphs and floating reward cubes.</title>
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary) / 0.1)" />
                    <stop offset="100%" stopColor="hsl(var(--primary) / 0.0)" />
                  </linearGradient>
                  <filter id="drop-shadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
                    <feOffset dx="5" dy="5" result="offsetblur"/>
                    <feFlood floodColor="hsl(var(--foreground) / 0.1)"/>
                    <feComposite in2="offsetblur" operator="in"/>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <rect width="650" height="450" fill="url(#grad1)" />
                <circle cx="50" cy="50" r="100" fill="hsl(var(--primary) / 0.05)" />
                <circle cx="600" cy="400" r="120" fill="hsl(var(--accent) / 0.05)" />

                <g style={{ filter: 'url(#drop-shadow)' }}>
                  <rect x="175" y="50" width="300" height="350" rx="30" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
                  <rect x="195" y="70" width="260" height="40" rx="10" fill="hsl(var(--muted))" />
                  
                  <rect x="195" y="130" width="120" height="120" rx="10" fill="hsl(var(--primary) / 0.1)"/>
                  <path d="M220 220L245 180L270 200L295 160" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                  
                  <rect x="335" y="130" width="120" height="120" rx="10" fill="hsl(var(--muted))" />
                  
                  <rect x="195" y="270" width="260" height="60" rx="10" fill="hsl(var(--muted))" />
                  <rect x="195" y="350" width="180" height="30" rx="10" fill="hsl(var(--muted))" />
                </g>
                
                <g transform="translate(100, 150)" style={{ filter: 'url(#drop-shadow)' }}>
                    <rect width="60" height="60" rx="10" fill="hsl(var(--primary))" transform="rotate(-15)"/>
                    <text x="18" y="42" fontFamily="PT Sans, sans-serif" fontSize="32" fill="hsl(var(--primary-foreground))" fontWeight="bold">C</text>
                </g>
                
                <g transform="translate(480, 250)" style={{ filter: 'url(#drop-shadow)' }}>
                    <rect width="80" height="80" rx="15" fill="hsl(var(--accent))" transform="rotate(20)"/>
                    <text x="25" y="55" fontFamily="PT Sans, sans-serif" fontSize="40" fill="hsl(var(--accent-foreground))" fontWeight="bold">C</text>
                </g>
                
                <g transform="translate(500, 80) scale(0.8)" style={{ filter: 'url(#drop-shadow)' }}>
                    <rect width="40" height="40" rx="8" fill="hsl(var(--primary) / 0.7)" transform="rotate(10)"/>
                </g>
                
                <g transform="translate(120, 350)" style={{ filter: 'url(#drop-shadow)' }}>
                    <rect width="50" height="50" rx="8" fill="hsl(var(--accent) / 0.6)" transform="rotate(-25)"/>
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 sm:py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter font-headline sm:text-5xl">
                  How You Can Earn
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  We provide a variety of ways for you to earn Cubes. Choose what you enjoy the most and start earning today.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                  <CardHeader>
                    <div className="mx-auto flex items-center justify-center bg-primary/10 rounded-full w-16 h-16 mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 sm:py-20 md:py-28 bg-secondary/50">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter font-headline md:text-4xl/tight">
                Ready to Start Earning?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Join thousands of users who are already earning rewards on Adsener.
                Sign up is quick, easy, and free!
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
               <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/register">Create an Account</Link>
                </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
