import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Flame, ArrowLeft, ArrowRight } from 'lucide-react';

interface OnboardingData {
  organizationCode: string;
  role: 'student' | 'employee' | 'athlete';
  emotionalState: 'anxious' | 'peaceful' | 'lost' | 'tired' | 'joyful' | 'stressed' | 'hopeful' | 'overwhelmed' | 'grateful' | 'restless';
  personalGoals: string[];
  personalityStyle: 'introvert' | 'extrovert' | 'thinker' | 'feeler' | 'mixed';
  checkInKeywords: string[];
  faithBackground: 'christian' | 'spiritual' | 'exploring' | 'other' | 'prefer_not_to_say';
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    organizationCode: '',
    role: 'student',
    faithBackground: 'christian',
    emotionalState: 'peaceful',
    personalGoals: [],
    personalityStyle: 'mixed',
    checkInKeywords: []
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const steps = [
    'Welcome',
    'Organization Code',
    'Role Selection',
    'Current Vibe',
    "What You're Working Toward",
    'Your Style',
    'Check-in Keywords'
  ];

  const personalGoalsOptions = [
    'Find clarity', 'Build confidence', 'Personal growth', 'Better mindset',
    'Stronger relationships', 'Manage stress', 'Emotional wellness', 'Self-awareness',
    'Purpose & direction', 'Daily consistency'
  ];

  const checkInKeywordsOptions = [
    'anxious', 'peaceful', 'stressed', 'grateful', 'overwhelmed', 'hopeful',
    'tired', 'energized', 'lonely', 'connected', 'uncertain', 'confident'
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Find organization
      let organizationId = null;
      if (data.organizationCode) {
        const { data: organization } = await supabase
          .from('organizations')
          .select('id')
          .eq('code', data.organizationCode.toUpperCase())
          .single();
        organizationId = organization?.id;
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({
          organization_id: organizationId,
          role: data.role,
          faith_background: data.faithBackground,
          personality_style: data.personalityStyle,
          onboarding_completed: true
        })
        .eq('user_id', user.id);

      // Create soul profile
      await supabase
        .from('soul_profiles')
        .insert({
          user_id: user.id,
          faith_background: data.faithBackground,
          emotional_state: data.emotionalState,
          personal_goals: data.personalGoals,
          personality_style: data.personalityStyle,
          check_in_keywords: data.checkInKeywords
        });

      // Track onboarding completion
      await supabase.rpc('update_user_engagement', {
        p_user_id: user.id,
        p_action_type: 'onboarding_completed',
        p_xp_earned: 50
      });

      toast({
        title: "You're all set! 🎉",
        description: "Your profile is ready. Let's get started on what matters most to you."
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const toggleArrayItem = (array: string[], item: string, setter: (value: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-full">
                <Flame className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome to SoulSpark AI
              </h2>
              <p className="text-muted-foreground mt-2">
                Let's get you set up with a quick 1-minute check-in so we can personalize your experience.
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="orgCode">Organization Code (Optional)</Label>
              <Input
                id="orgCode"
                placeholder="Enter your organization code"
                value={data.organizationCode}
                onChange={(e) => setData({ ...data, organizationCode: e.target.value })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                If your school, company, or team provided a code, enter it here.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label>What best describes you?</Label>
            <RadioGroup
              value={data.role}
              onValueChange={(value: any) => setData({ ...data, role: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="employee" />
                <Label htmlFor="employee">Employee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="athlete" id="athlete" />
                <Label htmlFor="athlete">Athlete</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label>How are you feeling right now?</Label>
            <p className="text-sm text-muted-foreground">Pick what resonates most with your current vibe.</p>
            <RadioGroup
              value={data.emotionalState}
              onValueChange={(value: any) => setData({ ...data, emotionalState: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="peaceful" id="peaceful" />
                <Label htmlFor="peaceful">Peaceful & calm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="joyful" id="joyful" />
                <Label htmlFor="joyful">Happy & energized</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hopeful" id="hopeful" />
                <Label htmlFor="hopeful">Hopeful & optimistic</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="anxious" id="anxious" />
                <Label htmlFor="anxious">Anxious or worried</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stressed" id="stressed" />
                <Label htmlFor="stressed">Stressed or overwhelmed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tired" id="tired" />
                <Label htmlFor="tired">Tired or burnt out</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lost" id="lost" />
                <Label htmlFor="lost">Lost or uncertain</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="restless" id="restless" />
                <Label htmlFor="restless">Restless or unmotivated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grateful" id="grateful" />
                <Label htmlFor="grateful">Grateful & content</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label>What are you working toward?</Label>
            <p className="text-sm text-muted-foreground">Choose what matters most to you right now. (Select all that apply)</p>
            <div className="flex flex-wrap gap-2">
              {personalGoalsOptions.map((goal) => (
                <Badge
                  key={goal}
                  variant={data.personalGoals.includes(goal) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem(data.personalGoals, goal, (value) => setData({ ...data, personalGoals: value }))}
                >
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label>What's your style?</Label>
            <p className="text-sm text-muted-foreground">How do you typically show up in life?</p>
            <RadioGroup
              value={data.personalityStyle}
              onValueChange={(value: any) => setData({ ...data, personalityStyle: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="introvert" id="introvert" />
                <Label htmlFor="introvert">Introvert - I recharge solo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="extrovert" id="extrovert" />
                <Label htmlFor="extrovert">Extrovert - I thrive with people</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thinker" id="thinker" />
                <Label htmlFor="thinker">Thinker - Logic first</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feeler" id="feeler" />
                <Label htmlFor="feeler">Feeler - Emotions first</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed">Mixed - A bit of everything</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Label>How do you want to check in?</Label>
            <p className="text-sm text-muted-foreground">Pick the words you'll use when you need support. (Select all that apply)</p>
            <div className="flex flex-wrap gap-2">
              {checkInKeywordsOptions.map((keyword) => (
                <Badge
                  key={keyword}
                  variant={data.checkInKeywords.includes(keyword) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleArrayItem(data.checkInKeywords, keyword, (value) => setData({ ...data, checkInKeywords: value }))}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-spiritual">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Check-In</CardTitle>
              <CardDescription>Step {step + 1} of {steps.length}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{Math.round(((step + 1) / steps.length) * 100)}%</div>
              <Progress value={((step + 1) / steps.length) * 100} className="w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStep()}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
            >
              {step === steps.length - 1 ? 'Complete' : 'Next'}
              {step !== steps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
