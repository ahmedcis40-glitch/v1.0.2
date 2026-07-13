import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Coins, ShieldAlert, LogOut, TrendingUp, ArrowUpRight, ArrowDownLeft, Landmark } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ 
  user, 
  token, 
  onLogout,
  onInitiateDeposit,
  onInitiateWithdraw,
  isOffline
}: { 
  user: any; 
  token: string | null;
  onLogout: () => void;
  onInitiateDeposit: () => void;
  onInitiateWithdraw: () => void;
  isOffline: boolean;
}) {
  const [cashWallet, setCashWallet] = useState({ balanceTotal: 150000, balanceFrozen: 0 });
  const [securitiesVal, setSecuritiesVal] = useState(650000);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  // L'éléphant grandit (scale de 1.0 à 2.2) lors du défilement vers le bas
  const elephantScale = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 2.2],
    extrapolate: 'clamp',
  });

  // L'éléphant s'estompe légèrement au scroll
  const elephantOpacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0.06, 0.02],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Liseré tricolore ivoirien */}
      <View style={styles.tricolor} />

      {/* 1. Éléphant géométrique d'arrière-plan animé au scroll (Position Absolue) */}
      <Animated.View 
        style={[
          styles.elephantContainer, 
          { 
            transform: [{ scale: elephantScale }],
            opacity: elephantOpacity
          }
        ]}
        pointerEvents="none"
      >
        {/* Forme géométrique tête */}
        <View style={styles.elephantHead} />
        {/* Oreille gauche */}
        <View style={styles.elephantEarLeft} />
        {/* Oreille droite */}
        <View style={styles.elephantEarRight} />
        {/* Trompe */}
        <View style={styles.elephantTrunk} />
        {/* Yeux */}
        <View style={styles.elephantEye} />
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.headerLogo}>🐘</Text>
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.headerTitle}>BAOU PORTFOLIO</Text>
            <Text style={styles.headerWelcome}>Ravi de vous revoir, {user?.firstName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <LogOut size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Bandeau Hors-ligne */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Mode Hors-ligne (Données en cache)</Text>
        </View>
      )}

      {/* Scrollable principal */}
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* Indicateurs financiers supérieurs */}
        <View style={styles.indicators}>
          
          {/* Solde Cash (Orange) */}
          <View style={[styles.indicatorCard, styles.cardOrange]}>
            <View style={styles.indicatorHeader}>
              <Text style={styles.indicatorLabel}>SOLDE CASH DISPONIBLE</Text>
              <Coins size={14} color="#ff8200" />
            </View>
            <Text style={styles.indicatorValueOrange}>
              {cashWallet.balanceTotal.toLocaleString()} F
            </Text>
            <Text style={styles.indicatorSub}>
              Gelé : {cashWallet.balanceFrozen.toLocaleString()} F
            </Text>
          </View>

          {/* Statut KYC (Blanc) */}
          <View style={[styles.indicatorCard, styles.cardWhite]}>
            <View style={styles.indicatorHeader}>
              <Text style={styles.indicatorLabel}>CONFORMITÉ RÉGLEMENTAIRE (KYC)</Text>
              <ShieldAlert size={14} color="#ffffff" />
            </View>
            <Text style={styles.indicatorValueWhite}>
              {user?.kycStatus === 'APPROUVE' ? 'DOSSIER APPROUVÉ' : 'ATTENTE VALIDATION'}
            </Text>
            <Text style={styles.indicatorSubWhite}>
              {user?.kycStatus === 'APPROUVE' ? 'Accès boursier complet' : 'Achat d\'actions bloqué'}
            </Text>
          </View>

          {/* Portefeuille d'actions (Vert) */}
          <View style={[styles.indicatorCard, styles.cardGreen]}>
            <View style={styles.indicatorHeader}>
              <Text style={styles.indicatorLabel}>PORTEFEUILLE ACTIONS BRVM</Text>
              <TrendingUp size={14} color="#10b981" />
            </View>
            <Text style={styles.indicatorValueGreen}>
              {securitiesVal.toLocaleString()} F
            </Text>
            <Text style={styles.indicatorSub}>
              Valorisation de vos titres cotés
            </Text>
          </View>

        </View>

        {/* Boutons d'actions transactionnelles */}
        <View style={styles.actionsGroup}>
          <TouchableOpacity style={styles.btnAction} onPress={onInitiateDeposit}>
            <ArrowUpRight size={18} color="#020617" style={{ marginRight: 6 }} />
            <Text style={styles.btnActionText}>Effectuer un Dépôt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnAction, styles.btnActionOutline]} onPress={onInitiateWithdraw}>
            <ArrowDownLeft size={18} color="#ff8200" style={{ marginRight: 6 }} />
            <Text style={styles.btnActionTextOutline}>Faire un Retrait</Text>
          </TouchableOpacity>
        </View>

        {/* Espace Boursier du Marché */}
        <View style={styles.marketSection}>
          <View style={styles.sectionHeader}>
            <Landmark size={16} color="#ff8200" />
            <Text style={styles.sectionTitle}>Marché Actions BRVM</Text>
          </View>

          <View style={styles.stockItem}>
            <View>
              <Text style={styles.stockCode}>SNTS</Text>
              <Text style={styles.stockName}>Sonatel</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.stockPrice}>16 500 F</Text>
              <Text style={styles.stockChangeUp}>+1.85%</Text>
            </View>
          </View>

          <View style={styles.stockItem}>
            <View>
              <Text style={styles.stockCode}>CIEC</Text>
              <Text style={styles.stockName}>CIE Côte d'Ivoire</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.stockPrice}>2 250 F</Text>
              <Text style={styles.stockChangeDown}>-1.20%</Text>
            </View>
          </View>

          <View style={styles.stockItem}>
            <View>
              <Text style={styles.stockCode}>SGCB</Text>
              <Text style={styles.stockName}>SG Côte d'Ivoire</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.stockPrice}>15 400 F</Text>
              <Text style={styles.stockChangeFlat}>0.00%</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 60 }} />

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  tricolor: {
    height: 3,
    backgroundColor: '#ff8200',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  headerLogo: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerWelcome: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
  },
  offlineBanner: {
    backgroundColor: '#ff8200',
    paddingVertical: 4,
    alignItems: 'center',
  },
  offlineText: {
    color: '#020617',
    fontSize: 9,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  // Éléphant géométrique d'arrière-plan en pure StyleSheet
  elephantContainer: {
    position: 'absolute',
    top: '40%',
    left: (width - 250) / 2, // centré horizontalement
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elephantHead: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ff8200',
  },
  elephantEarLeft: {
    position: 'absolute',
    left: 20,
    top: 30,
    width: 60,
    height: 90,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 130, 0, 0.7)',
    transform: [{ rotate: '-20deg' }],
  },
  elephantEarRight: {
    position: 'absolute',
    right: 20,
    top: 30,
    width: 60,
    height: 90,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 130, 0, 0.7)',
    transform: [{ rotate: '20deg' }],
  },
  elephantTrunk: {
    position: 'absolute',
    bottom: 20,
    width: 25,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#ff8200',
    transform: [{ rotate: '10deg' }],
  },
  elephantEye: {
    position: 'absolute',
    top: 90,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#020617',
  },

  // Indicateurs financiers
  indicators: {
    gap: 16,
  },
  indicatorCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    gap: 4,
  },
  cardOrange: {
    backgroundColor: '#090d16',
    borderColor: '#ff8200',
  },
  cardWhite: {
    backgroundColor: '#ff8200', // fond orange pour que le texte blanc ressorte
    borderColor: '#ffffff',
  },
  cardGreen: {
    backgroundColor: '#090d16',
    borderColor: '#10b981',
  },
  indicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  indicatorLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1.2,
  },
  indicatorValueOrange: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ff8200',
  },
  indicatorValueWhite: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  indicatorValueGreen: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10b981',
  },
  indicatorSub: {
    fontSize: 9,
    color: '#475569',
  },
  indicatorSubWhite: {
    fontSize: 9,
    color: '#f8fafc',
    fontWeight: 'bold',
  },

  // Actions
  actionsGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  btnAction: {
    flex: 1,
    backgroundColor: '#ff8200',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '900',
  },
  btnActionOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff8200',
  },
  btnActionTextOutline: {
    color: '#ff8200',
    fontSize: 12,
    fontWeight: '900',
  },

  // Marché Actions
  marketSection: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  stockCode: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    backgroundColor: '#020617',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  stockName: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
  },
  stockPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stockChangeUp: {
    fontSize: 9,
    color: '#10b981',
    fontWeight: 'bold',
    marginTop: 2,
  },
  stockChangeDown: {
    fontSize: 9,
    color: '#f43f5e',
    fontWeight: 'bold',
    marginTop: 2,
  },
  stockChangeFlat: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: 2,
  },
});
