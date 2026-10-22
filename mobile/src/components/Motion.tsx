import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useMotionActive, useReducedMotion } from '../hooks/useMotion';
import { spring, timing } from './motion/presets';

type Direction = 'up' | 'down' | 'left' | 'right' | 'fade';

type EntranceProps = {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
  distance?: number;
  direction?: Direction;
  scaleFrom?: number;
};

function offsetsFor(direction: Direction, distance: number) {
  switch (direction) {
    case 'up':
      return { x: 0, y: distance };
    case 'down':
      return { x: 0, y: -distance };
    case 'left':
      return { x: distance, y: 0 };
    case 'right':
      return { x: -distance, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

/** Fade + drift + scale entrance, driven by UI-thread springs. */
export function Entrance({
  children,
  delay = 0,
  style,
  distance = 18,
  direction = 'up',
  scaleFrom,
}: EntranceProps) {
  const reduced = useReducedMotion();
  const start = offsetsFor(direction, distance);

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(start.x);
  const translateY = useSharedValue(start.y);
  const scale = useSharedValue(scaleFrom ?? 1);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      scale.value = 1;
      return;
    }
    // Opacity rides the same spring as the drift so the element never
    // reaches full opacity while it is still sliding into place.
    opacity.value = withDelay(delay, withSpring(1, spring.fade));
    translateX.value = withDelay(delay, withSpring(0, spring.entrance));
    translateY.value = withDelay(delay, withSpring(0, spring.entrance));
    if (scaleFrom != null) {
      scale.value = withDelay(delay, withSpring(1, spring.pop));
    }
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
    };
  }, [delay, distance, direction, scaleFrom, reduced, opacity, translateX, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

/** Staggers children entrances with an incremental delay. */
export function Stagger({
  children,
  step = 80,
  delay = 0,
  distance = 16,
  direction = 'up',
}: {
  children: React.ReactNode;
  step?: number;
  delay?: number;
  distance?: number;
  direction?: Direction;
}) {
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <Entrance key={i} delay={delay + i * step} distance={distance} direction={direction}>
          {child}
        </Entrance>
      ))}
    </>
  );
}

type PressableScaleProps = {
  children: React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  style?: ViewStyle | (ViewStyle | false | null | undefined)[];
  contentStyle?: ViewStyle | ViewStyle[] | (ViewStyle | false | null | undefined)[];
  pressedStyle?: ViewStyle | ViewStyle[] | (ViewStyle | false | null | undefined)[];
  scaleTo?: number;
  accessibilityLabel?: string;
};

/** Pressable with a bouncy UI-thread spring scale feedback. */
export function PressableScale({
  children,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  style,
  contentStyle,
  pressedStyle,
  scaleTo = 0.94,
  accessibilityLabel,
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (!reduced) {
      scale.value = withSpring(scaleTo, spring.pressIn);
    }
    onPressIn?.();
  }, [reduced, scale, scaleTo, onPressIn]);

  const handlePressOut = useCallback(() => {
    if (!reduced) {
      scale.value = withSpring(1, spring.pressOut);
    }
    onPressOut?.();
  }, [reduced, scale, onPressOut]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (reduced) {
    return (
      <View style={style as ViewStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel}
          style={({ pressed }) => [contentStyle, pressed && (pressedStyle ?? { opacity: 0.8 })].filter(Boolean)}>
          {children}
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [contentStyle, pressed && pressedStyle].filter(Boolean)}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

/** Looping pulse ring — great behind live dots / drivers on the map. */
export function Pulse({
  color = '#FF3B1F',
  size = 18,
  duration = 1600,
  style,
}: {
  color?: string;
  size?: number;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const reduced = useReducedMotion();
  // Pauses the ring while the screen is covered, the app is backgrounded or
  // the user asked for reduced motion.
  const active = useMotionActive();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withSequence(withTiming(1, { duration, easing: timing.fade.easing }), withTiming(0, { duration: 0 })),
      -1
    );
    return () => cancelAnimation(progress);
  }, [progress, duration, active]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - progress.value),
    transform: [{ scale: 1 + 1.6 * progress.value }],
  }));

  if (reduced) return null;

  return (
    <View pointerEvents="none" style={[styles.pulseBase, style]}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/** Shimmer skeleton placeholder (pulsing opacity on the UI thread). */
export function Skeleton({
  width,
  height,
  radius = 12,
  style,
}: {
  width?: number | 'auto';
  height: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  // Shimmer stops when nothing can be seen: unfocused screen, backgrounded
  // app or reduced motion (the skeleton stays visible at a static opacity).
  const active = useMotionActive();
  const glow = useSharedValue(0.35);

  useEffect(() => {
    if (!active) {
      cancelAnimation(glow);
      glow.value = 0.6;
      return;
    }
    glow.value = withRepeat(
      withSequence(withTiming(0.9, timing.glow), withTiming(0.35, timing.glow)),
      -1
    );
    return () => cancelAnimation(glow);
  }, [glow, active]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Animated.View style={[styles.skeleton, { width, height, borderRadius: radius }, animatedStyle, style]} />
  );
}

const styles = StyleSheet.create({
  pulseBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    borderWidth: 2,
  },
  skeleton: {
    backgroundColor: '#E8E6E1',
  },
});

// Reusable animation toolkit used across every screen.
export type { Direction, EntranceProps, PressableScaleProps };