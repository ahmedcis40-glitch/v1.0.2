import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity, SafeAreaView, Dimensions, Platform, StatusBar, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Coins, ShieldAlert, LogOut, TrendingUp, ArrowUpRight, ArrowDownLeft, Landmark, Wallet, FileText } from 'lucide-react-native';
import { api } from '../lib/api';

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
  const [cashWallet, setCashWallet] = useState({ balanceTotal: 0, balanceFrozen: 0 });
  const [securitiesVal, setSecuritiesVal] = useState(0);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'trade' | 'history'>('wallet');
  const [myTransactions, setMyTransactions] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [orderType, setOrderType] = useState<'ACHAT' | 'VENTE'>('ACHAT');
  const [quantity, setQuantity] = useState('1');
  const [orderPrice, setOrderPrice] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    if (!token || activeTab !== 'history') return;
    api.wallets.getTransactions(token)
      .then(res => {
        if (Array.isArray(res)) setMyTransactions(res);
      })
      .catch(console.error);
  }, [token, activeTab]);

  useEffect(() => {
    let active = true;
    const fetchStocks = async () => {
      try {
        setLoadingStocks(true);
        const res = await api.market.getStocks();
        if (active && Array.isArray(res)) {
          setStocks(res);
        }
      } catch (err) {
        console.error("Erreur de récupération des cours:", err);
      } finally {
        if (active) setLoadingStocks(false);
      }
    };

    fetchStocks();
    const interval = setInterval(fetchStocks, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const fetchWalletData = async () => {
      try {
        const cashRes = await api.wallets.getCash(token);
        if (active && cashRes) {
          setCashWallet(cashRes);
        }
        
        const secRes = await api.wallets.getSecurities(token);
        if (active && Array.isArray(secRes)) {
          const totalVal = secRes.reduce((sum, item) => sum + (item.quantite * item.coursMoyen), 0);
          setSecuritiesVal(totalVal);
        }
      } catch (err) {
        console.error("Erreur chargement portefeuilles:", err);
      }
    };

    fetchWalletData();
    const interval = setInterval(fetchWalletData, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token]);
  
  const handleSelectStock = (stock: any) => {
    if (user?.kycStatus !== 'APPROUVE') {
      Alert.alert(
        "Accès Boursier Bloqué",
        "Votre dossier KYC n'est pas encore approuvé par la SGI. L'achat et la vente d'actions sont bloqués temporairement. Veuillez envoyer vos justificatifs depuis le portail d'administration pour validation."
      );
      return;
    }
    setSelectedStock(stock);
    setOrderPrice(stock.lastPrice?.toString() || '0');
    setQuantity('1');
    setOrderType('ACHAT');
  };

  const handlePlaceOrder = async () => {
    if (!selectedStock || !token) return;
    const qty = parseInt(quantity);
    const price = parseFloat(orderPrice);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Erreur", "Veuillez saisir une quantité valide.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      Alert.alert("Erreur", "Veuillez saisir un cours proposé valide.");
      return;
    }

    setSubmittingOrder(true);
    try {
      await api.orders.create({
        symbol: selectedStock.symbol,
        type: orderType,
        quantity: qty,
        price: price,
      }, token);
      
      Alert.alert("Succès", `Votre ordre d'${orderType === 'ACHAT' ? 'achat' : 'vente'} pour ${qty} actions ${selectedStock.symbol} a été soumis avec succès à la SGI !`);
      setSelectedStock(null);
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible de soumettre l'ordre.");
    } finally {
      setSubmittingOrder(false);
    }
  };

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
        
        {/* Onglet 1 : Portefeuille */}
        {activeTab === 'wallet' && (
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
        )}

        {/* Onglet 2 : Bourse / Dépôt */}
        {activeTab === 'trade' && (
          <>
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
                <Text style={styles.sectionTitle}>Marché Actions BRVM (En Direct)</Text>
              </View>

              {loadingStocks && stocks.length === 0 ? (
                <ActivityIndicator color="#ff8200" style={{ marginVertical: 20 }} />
              ) : stocks.length === 0 ? (
                <Text style={{ color: '#475569', fontSize: 10, textAlign: 'center', marginVertical: 10 }}>Aucune action disponible</Text>
              ) : (
                stocks.slice(0, 10).map((stock) => {
                  const changeVal = parseFloat(stock.changePercent || '0');
                  const isUp = changeVal > 0;
                  const isDown = changeVal < 0;

                  return (
                    <TouchableOpacity key={stock.symbol} style={styles.stockItem} onPress={() => handleSelectStock(stock)}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.stockCode}>{stock.symbol}</Text>
                        </View>
                        <Text style={styles.stockName} numberOfLines={1}>{stock.name}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.stockPrice}>{stock.lastPrice?.toLocaleString()} F</Text>
                        <Text style={
                          isUp ? styles.stockChangeUp : isDown ? styles.stockChangeDown : styles.stockChangeFlat
                        }>
                          {isUp ? `+${stock.changePercent}%` : `${stock.changePercent}%`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* Onglet 3 : Historique */}
        {activeTab === 'history' && (
          <View style={styles.marketSection}>
            <View style={styles.sectionHeader}>
              <FileText size={16} color="#ff8200" />
              <Text style={styles.sectionTitle}>Historique Wave (Dépôts / Retraits)</Text>
            </View>

            {myTransactions.length === 0 ? (
              <Text style={{ color: '#475569', fontSize: 10, textAlign: 'center', marginVertical: 20 }}>Aucune transaction enregistrée</Text>
            ) : (
              myTransactions.map((tx) => (
                <View key={tx.idInternal || tx.id} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#0f172a'
                }}>
                  <View>
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>
                      {tx.type === 'DEPOT' ? '📥 Dépôt Cash' : '📤 Retrait Cash'}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 9, marginTop: 2 }}>
                      Ref: {tx.idInternal?.slice(0, 8)}...
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>{tx.amount?.toLocaleString()} F</Text>
                    <Text style={{ 
                      fontSize: 9, 
                      fontWeight: 'bold',
                      marginTop: 2,
                      color: tx.status === 'SUCCES' ? '#10b981' : tx.status === 'ECHEC' ? '#f43f5e' : '#eab308'
                    }}>
                      {tx.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 100 }} />

      </Animated.ScrollView>

      {/* Barre de navigation inférieure fixe */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setActiveTab('wallet')}
        >
          <Wallet size={18} color={activeTab === 'wallet' ? '#ff8200' : '#64748b'} />
          <Text style={[styles.navButtonText, activeTab === 'wallet' && styles.navButtonTextActive]}>
            Portefeuille
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setActiveTab('trade')}
        >
          <TrendingUp size={18} color={activeTab === 'trade' ? '#ff8200' : '#64748b'} />
          <Text style={[styles.navButtonText, activeTab === 'trade' && styles.navButtonTextActive]}>
            Bourse
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setActiveTab('history')}
        >
          <FileText size={18} color={activeTab === 'history' ? '#ff8200' : '#64748b'} />
          <Text style={[styles.navButtonText, activeTab === 'history' && styles.navButtonTextActive]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>
      {/* Modal de négociation d'actions */}
      {selectedStock && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedStock}
          onRequestClose={() => setSelectedStock(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Passer un ordre SGI</Text>
                  <Text style={{ color: '#64748b', fontSize: 10 }}>{selectedStock.name} ({selectedStock.symbol})</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedStock(null)} style={styles.closeBtn}>
                  <Text style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.orderTypeSwitch}>
                <TouchableOpacity 
                  style={[styles.switchBtn, orderType === 'ACHAT' && styles.switchBtnActive]} 
                  onPress={() => setOrderType('ACHAT')}
                >
                  <Text style={[styles.switchText, orderType === 'ACHAT' && styles.switchTextActive]}>ACHAT</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.switchBtn, orderType === 'VENTE' && styles.switchBtnActive]} 
                  onPress={() => setOrderType('VENTE')}
                >
                  <Text style={[styles.switchText, orderType === 'VENTE' && styles.switchTextActive]}>VENTE</Text>
                </TouchableOpacity>
              </View>

              <View style={{ gap: 16, marginVertical: 16 }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>QUANTITÉ D'ACTIONS</Text>
                  <View style={styles.inputRow}>
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => setQuantity(Math.max(1, parseInt(quantity || '1') - 1).toString())}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.inputField}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="number-pad"
                      textAlign="center"
                    />
                    <TouchableOpacity 
                      style={styles.qtyBtn}
                      onPress={() => setQuantity((parseInt(quantity || '1') + 1).toString())}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>COURS PROPOSÉ (XOF)</Text>
                  <TextInput
                    style={[styles.inputField, { textAlign: 'left', paddingHorizontal: 12 }]}
                    value={orderPrice}
                    onChangeText={setOrderPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Résumé financier */}
              {(() => {
                const qty = parseInt(quantity || '0');
                const price = parseFloat(orderPrice || '0');
                const brut = qty * price;
                const commission = brut * 0.0156;
                const total = orderType === 'ACHAT' ? brut + commission : brut - commission;
                return (
                  <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Montant Brut</Text>
                      <Text style={styles.summaryVal}>{brut.toLocaleString()} F</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Frais SGI (1.56%)</Text>
                      <Text style={styles.summaryVal}>{commission.toLocaleString(undefined, { maximumFractionDigits: 2 })} F</Text>
                    </View>
                    <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8, marginTop: 8 }]}>
                      <Text style={[styles.summaryLabel, { color: '#ffffff', fontWeight: 'bold' }]}>Estimation Totale</Text>
                      <Text style={[styles.summaryVal, { color: orderType === 'ACHAT' ? '#ff8200' : '#10b981', fontWeight: 'bold' }]}>
                        {total.toLocaleString(undefined, { maximumFractionDigits: 2 })} F
                      </Text>
                    </View>
                  </View>
                );
              })()}

              <TouchableOpacity 
                style={[styles.placeOrderBtn, submittingOrder && styles.placeOrderBtnDisabled]}
                onPress={handlePlaceOrder}
                disabled={submittingOrder}
              >
                {submittingOrder ? (
                  <ActivityIndicator color="#020617" size="small" />
                ) : (
                  <Text style={styles.placeOrderBtnText}>Soumettre l'ordre à la SGI</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
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
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navButtonText: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: 3,
  },
  navButtonTextActive: {
    color: '#ff8200',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#090d16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
  },
  orderTypeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  switchBtnActive: {
    backgroundColor: '#ff8200',
  },
  switchText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
  },
  switchTextActive: {
    color: '#020617',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 1.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    color: '#ff8200',
    fontWeight: 'bold',
  },
  inputField: {
    flex: 1,
    height: 48,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeOrderBtn: {
    backgroundColor: '#ff8200',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  placeOrderBtnText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '900',
  },
  placeOrderBtnDisabled: {
    backgroundColor: 'rgba(255, 130, 0, 0.5)',
  },
});
