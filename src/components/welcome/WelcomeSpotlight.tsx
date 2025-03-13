
import React, { useState, useEffect } from 'react';
import { Spotlight } from '@/components/ui/spotlight';
import { Button } from '@/components/ui/button';
import { ChevronRight, Droplets, Zap, Factory, Gauge } from 'lucide-react';
import { toast } from 'sonner';

interface WelcomeSpotlightProps {
  onClose: () => void;
}

const WelcomeSpotlight: React.FC<WelcomeSpotlightProps> = ({ onClose }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const features = [
    {
      title: "Asset Management",
      description: "A comprehensive solution for tracking, monitoring, and optimizing your facility assets.",
      icon: Gauge,
      color: "text-muscat-gold"
    },
    {
      title: "Water Efficiency",
      description: "Monitor and optimize water consumption across all facilities and systems.",
      icon: Droplets,
      color: "text-muscat-teal"
    },
    {
      title: "Energy Management",
      description: "Track electricity usage, identify savings opportunities, and reduce costs.",
      icon: Zap,
      color: "text-amber-500"
    },
    {
      title: "STP Operations",
      description: "Real-time monitoring and analytics for Sewage Treatment Plant operations.",
      icon: Factory,
      color: "text-muscat-lavender"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [features.length]);

  const handleGetStarted = () => {
    toast.success("Welcome to Muscat Bay Asset Manager", {
      description: "Your comprehensive facility management solution",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-muscat-primary/90 backdrop-blur-sm overflow-hidden">
      <Spotlight
        className="max-w-4xl w-full mx-auto p-6 md:p-10 rounded-3xl"
        fill="#68D1CC"
        spotlightSize="lg"
      >
        <div className="relative z-10 text-center space-y-8 p-8">
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
              Welcome to <span className="text-muscat-teal">Muscat Bay</span> Asset Manager
            </h2>
            <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto">
              Your comprehensive solution for facility management, utilities monitoring, and operational excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`p-5 rounded-xl backdrop-blur-sm transition-all duration-300 text-left ${
                  index === activeIndex 
                    ? "bg-white/10 border border-white/20 shadow-lg scale-105 transform" 
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${index === activeIndex ? "bg-white/10" : "bg-white/5"}`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-white/70 text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-6 animate-fade-in" style={{ animationDelay: "0.7s" }}>
            <Button 
              onClick={handleGetStarted}
              className="bg-muscat-teal hover:bg-muscat-teal/90 text-muscat-primary px-6 py-5 rounded-lg font-medium transition-all shadow-lg flex gap-2 items-center"
              size="lg"
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-transparent border-white/20 hover:bg-white/10 text-white px-6 py-5 rounded-lg transition-all"
              size="lg"
            >
              Skip Introduction
            </Button>
          </div>
        </div>
      </Spotlight>
    </div>
  );
};

export default WelcomeSpotlight;
