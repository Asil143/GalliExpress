// GalliExpress Partner — Shop Context
// Resolves the partner's linked shop from Firestore.
// All screens use shopId from here instead of user.uid.

import React, { createContext, useContext, useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [shop, setShop] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((user) => {
      if (user) loadShop(user.uid);
      else { setShop(null); setShopId(null); setLoading(false); }
    });
    return unsub;
  }, []);

  const loadShop = async (uid) => {
    setLoading(true);
    try {
      // 1. Check partner doc for saved shopId
      const partnerDoc = await firestore().collection('partners').doc(uid).get();
      if (partnerDoc.exists && partnerDoc.data()?.shopId) {
        const sid = partnerDoc.data().shopId;
        const shopDoc = await firestore().collection('shops').doc(sid).get();
        if (shopDoc.exists) {
          setShop({ id: shopDoc.id, ...shopDoc.data() });
          setShopId(shopDoc.id);
          setLoading(false);
          return;
        }
      }
      // 2. Fallback: find shop where partnerId == uid
      const snap = await firestore()
        .collection('shops')
        .where('partnerId', '==', uid)
        .limit(1)
        .get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        setShop({ id: doc.id, ...doc.data() });
        setShopId(doc.id);
        await firestore()
          .collection('partners')
          .doc(uid)
          .set({ shopId: doc.id, uid, phone: auth().currentUser?.phoneNumber }, { merge: true });
      }
      // 3. No shop found — shopId stays null → onboarding screen shown
    } catch (e) {
    }
    setLoading(false);
  };

  const linkShop = async (sid) => {
    const uid = auth().currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    // Read the shop first — this must succeed
    const shopDoc = await firestore().collection('shops').doc(sid).get();
    if (!shopDoc.exists) throw new Error('Shop not found');

    // Write partner record (user owns this document)
    await firestore()
      .collection('partners')
      .doc(uid)
      .set({ shopId: sid, uid, phone: auth().currentUser?.phoneNumber }, { merge: true });

    // Best-effort: stamp partnerId + ensure isOpen is set on the shop doc
    try {
      await firestore().collection('shops').doc(sid).update({
        partnerId: uid,
        isOpen: shopDoc.data().isOpen ?? true, // write true if field was never set
      });
    } catch {
      // Acceptable — partners/{uid}.shopId is the primary lookup
    }

    setShop({ id: shopDoc.id, isOpen: true, ...shopDoc.data() });
    setShopId(sid);
  };

  const refreshShop = async () => {
    if (!shopId) return;
    const shopDoc = await firestore().collection('shops').doc(shopId).get();
    if (shopDoc.exists) setShop({ id: shopDoc.id, ...shopDoc.data() });
  };

  return (
    <ShopContext.Provider value={{ shop, shopId, loading, linkShop, refreshShop, setShop }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
