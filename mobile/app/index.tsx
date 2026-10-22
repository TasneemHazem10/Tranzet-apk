import React from 'react';
import { Redirect } from 'expo-router';
import AnimatedSplash from '../src/components/AnimatedSplash';
import { useAuth } from '../src/store/auth';

export default function Gate() {
  const { seenOnboarding, loading } = useAuth();

  if (loading) {
    return <AnimatedSplash />;
  }

  if (!seenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // This build has no login: every launch lands straight in the app (guest).
  return <Redirect href="/(main)" />;
}
