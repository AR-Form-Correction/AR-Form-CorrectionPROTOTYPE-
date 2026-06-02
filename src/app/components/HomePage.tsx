import { Button } from './ui/button';
import { motion } from 'motion/react';
import { Activity, Eye, Zap, Target, ArrowRight, CheckCircle2 } from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

export function HomePage({ onGetStarted }: HomePageProps) {
  const features = [
    {
      icon: Eye,
      title: 'AR Visual Guidance',
      description: 'Real-time stick figure overlay shows you exactly how to position your body',
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Audio and visual cues correct your form in real-time as you exercise',
    },
    {
      icon: Target,
      title: 'Joint-Level Precision',
      description: 'Advanced pose analysis tracks individual joints to ensure perfect form',
    },
    {
      icon: Activity,
      title: 'Smart Calibration',
      description: 'Personalized body mapping adapts to your unique proportions',
    },
  ];

  const benefits = [
    'Prevent injuries with real-time form correction',
    'Build muscle memory with consistent feedback',
    'Exercise safely without a personal trainer',
    'Track your progress over time',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6 overflow-auto">
      <div className="w-full max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* App Logo/Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl mb-6 shadow-2xl"
          >
            <Activity className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white mb-4"
          >
            AR Fitness Form Trainer
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-purple-200 mb-2 max-w-2xl mx-auto"
          >
            Perfect Your Exercise Form with Real-Time AR Guidance
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-purple-300 max-w-2xl mx-auto"
          >
            Experience the future of fitness training with augmented reality overlays that provide instant feedback on your exercise technique
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-purple-200" />
              </div>
              <h3 className="text-white mb-2">{feature.title}</h3>
              <p className="text-purple-200 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits & CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Benefits List */}
            <div>
              <h2 className="text-white mb-6">Why Use AR Form Correction?</h2>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-purple-100">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center md:text-right">
              <div className="inline-block">
                <p className="text-purple-200 mb-6">
                  Ready to transform your workout routine with AI-powered form correction?
                </p>
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 group"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-purple-300 text-sm mt-4">
                  No equipment needed • Works on any device
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center"
        >
          <h3 className="text-white mb-6">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Calibrate', desc: 'Position yourself and map your body' },
              { step: '2', title: 'Choose Exercise', desc: 'Select from push-ups, squats, and more' },
              { step: '3', title: 'Follow AR Guide', desc: 'Real-time overlay shows correct form' },
              { step: '4', title: 'Improve', desc: 'Get instant feedback and track progress' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + index * 0.1 }}
                className="relative"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white mx-auto mb-3">
                    {item.step}
                  </div>
                  <p className="text-white mb-1">{item.title}</p>
                  <p className="text-purple-200 text-sm">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-purple-400/30" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center mt-12"
        >
          <p className="text-purple-300 text-sm">
            This is a high-fidelity prototype demonstrating AR/MR fitness technology
          </p>
        </motion.div>
      </div>
    </div>
  );
}
