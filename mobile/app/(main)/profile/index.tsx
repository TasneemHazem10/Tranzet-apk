import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Entrance, PressableScale, Stagger } from '../../../src/components/Motion';
import IconButton from '../../../src/components/IconButton';
import { useAuth } from '../../../src/store/auth';
import { useLanguage } from '../../../src/store/language';
import { fonts, radius, useTheme, type ThemeColors } from '../../../src/theme';

type Row = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
  tint?: string;
  onPress?: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { user, token } = useAuth();
  const { t, isRTL } = useLanguage();

  const rowDir = isRTL ? ('row-reverse' as const) : ('row' as const);
  const textAlign = isRTL ? ('right' as const) : ('left' as const);

  const accountRows: Row[] = [
    {
      key: 'edit',
      icon: 'person-circle-outline',
      title: t.profileEditData,
      sub: t.profileEditDataSub,
      tint: colors.dark,
      onPress: () => router.push('/profile/edit-profile' as never),
    },
  ];

  const securityRows: Row[] = [
    {
      key: 'password',
      icon: 'key-outline',
      title: t.profileChangePassword,
      sub: t.profileChangePasswordSub,
      tint: colors.green,
      onPress: () => router.push('/profile/change-password' as never),
    },
  ];

  const renderRow = (r: Row, index: number, listLength: number) => (
    <PressableScale
      key={r.key}
      onPress={r.onPress}
      style={[
        styles.row,
        index === 0 && { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
        index === listLength - 1 && { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
        index !== listLength - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
      ]}
      contentStyle={{ flexDirection: rowDir, alignItems: 'center', gap: 12, flex: 1 }}>
      <View style={[styles.rowIcon, r.tint ? { backgroundColor: r.tint + '1A' } : null]}>
        <Ionicons name={r.icon} size={20} color={r.tint ?? colors.dark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { textAlign: textAlign }]}>{r.title}</Text>
        {!!r.sub && <Text style={[styles.rowSub, { textAlign: textAlign }]}>{r.sub}</Text>}
      </View>
      <Ionicons
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={18}
        color={colors.textLight}
      />
    </PressableScale>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <IconButton
          icon={isRTL ? 'chevron-back' : 'chevron-forward'}
          variant="light"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)'))}
        />
        <Text style={styles.headerTitle}>{t.profileTitle}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Entrance direction="down" distance={20} scaleFrom={0.95}>
          <View style={styles.profileCard}>
            <LinearGradient
              colors={[colors.brandSoft, colors.card, colors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.avatarRing}>
              <LinearGradient
                colors={[colors.dark, colors.darkSoft]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.avatarText}>{user?.name?.trim().charAt(0)?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.userName, { textAlign: isRTL ? 'right' : 'left' }]}>
                {user?.name || t.profileGuest}
              </Text>
              {!!user?.phone && (
                <Text style={[styles.userPhone, { textAlign: isRTL ? 'right' : 'left' }]}>{user.phone}</Text>
              )}
              {!!user?.email && (
                <Text style={[styles.userEmail, { textAlign: isRTL ? 'right' : 'left' }]}>{user.email}</Text>
              )}
            </View>
            <View style={styles.verified}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            </View>
          </View>
        </Entrance>

        {token && (
          <>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t.profileAccountSection}
            </Text>
            <Stagger step={70} distance={14}>
              {accountRows.map((r, i) => renderRow(r, i, accountRows.length))}
            </Stagger>

            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', marginTop: 24 }]}>
              {t.profileSecuritySection}
            </Text>
            <Stagger step={70} distance={14}>
              {securityRows.map((r, i) => renderRow(r, i, securityRows.length))}
            </Stagger>
          </>
        )}

        <Entrance delay={200}>
          <Text style={[styles.version, { textAlign: 'center' }]}>TRANZET v1.0.0</Text>
        </Entrance>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.dark },
  body: {
    padding: 20,
    paddingBottom: 48,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 18,
    marginBottom: 22,
    overflow: 'hidden',
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  avatarText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 26,
  },
  cardText: {
    flex: 1,
    // Nudge the copy away from the trailing edge so the action buttons below
    // keep more visual separation from the page background.
    paddingStart: 8,
  },
  userName: {
    fontFamily: fonts.semiBold,
    fontSize: 16.5,
    color: colors.darkSoft,
  },
  userPhone: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textGray,
    marginTop: 3,
  },
  userEmail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  verified: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.green + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 10,
    paddingStart: 4,
  },
  row: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    color: colors.darkSoft,
  },
  rowSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  version: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textLight,
    marginTop: 22,
  },
});