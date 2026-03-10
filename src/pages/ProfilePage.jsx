import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, query, where, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase_data/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ShoppingCart, Heart, Wallet, Edit, Save, X, Settings,
  LogOut, FileText, HelpCircle, ChevronRight, CreditCard, Lock, User
} from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState({ name: 'User', email: '', phone: '' });
  const [tempUser, setTempUser] = useState(user);
  const [editMode, setEditMode] = useState(false);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState([
    { label: 'Total Orders', value: '0', icon: ShoppingCart },
    { label: 'Favorite Restaurants', value: '0', icon: Heart },
    { label: 'Favorite Foods', value: '0', icon: Heart },
    { label: 'Total Spent', value: 'R0.00', icon: Wallet }
  ]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        console.log('✅ User authenticated:', user.uid);
      } else {
        console.log('❌ No user authenticated, redirecting to login');
        navigate('/auth');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch user data and orders
  useEffect(() => {
    if (!currentUser) return;

    let unsubscribeUser, unsubscribeOrders;

    const setupListeners = async () => {
      try {
        console.log('📡 Setting up Firestore listeners...');

        // User data listener
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribeUser = onSnapshot(userRef,
          (userSnap) => {
            if (userSnap.exists()) {
              const userData = userSnap.data();
              console.log('✅ User data loaded:', userData);
              setUser(userData);
              setTempUser(userData);

              const favoriteRestaurants = userData?.favorites?.restaurants?.length || 0;
              const favoriteFoods = userData?.favorites?.foods?.length || 0;
              setStats(prev => {
                const newStats = [...prev];
                newStats[1].value = favoriteRestaurants.toString();
                newStats[2].value = favoriteFoods.toString();
                return newStats;
              });
            } else {
              console.warn('⚠️ User document does not exist');
            }
            setLoading(false);
          },
          (error) => {
            console.error('❌ Error loading user data:', error);
            showNotification('Unable to load profile', 'error');
            setLoading(false);
          }
        );

        // Orders listener
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, where('userId', '==', currentUser.uid));
        unsubscribeOrders = onSnapshot(ordersQuery,
          async (querySnapshot) => {
            console.log('📦 Orders found:', querySnapshot.size);
            const userOrders = [];
            let totalSpent = 0;

            for (const docSnap of querySnapshot.docs) {
              const orderData = docSnap.data();
              let vendorName = orderData.vendorName || 'Unknown Vendor';

              if (orderData.vendorId) {
                try {
                  const vendorRef = doc(db, 'vendors', orderData.vendorId);
                  const vendorSnap = await getDoc(vendorRef);
                  if (vendorSnap.exists()) vendorName = vendorSnap.data().name;
                } catch {}
              }

              userOrders.push({ id: docSnap.id, ...orderData, vendorName });
              totalSpent += orderData.total || 0;
            }

            userOrders.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            });

            setOrders(userOrders);
            setStats(prev => {
              const newStats = [...prev];
              newStats[0].value = userOrders.length.toString();
              newStats[3].value = `R${totalSpent.toFixed(2)}`;
              return newStats;
            });
          },
          (error) => {
            console.error('❌ Error loading orders:', error);
          }
        );
      } catch (error) {
        console.error('❌ Setup error:', error);
        showNotification('Unable to load profile', 'error');
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: tempUser.name,
        email: tempUser.email,
        phone: tempUser.phone
      });
      setEditMode(false);
      showNotification('Profile updated successfully!');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      showNotification('Unable to update profile', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      showNotification('Logged out successfully!');
      navigate('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
      showNotification('Unable to logout', 'error');
    }
  };

  const formatDate = (order) => {
    const date = order.createdAt?.toDate?.() || new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      delivered: { text: 'Delivered', class: 'badge-delivered' },
      pending: { text: 'Pending', class: 'badge-pending' },
      cancelled: { text: 'Cancelled', class: 'badge-cancelled' }
    };
    return badges[status?.toLowerCase()] || badges.pending;
  };

  const settingsMenu = [
    { label: 'Payment Methods', icon: CreditCard, action: () => showNotification('Coming soon!', 'info') },
    { label: 'Security & Privacy', icon: Lock, action: () => showNotification('Coming soon!', 'info') },
    { label: 'Help & Support', icon: HelpCircle, action: () => showNotification('Contact support at help@foodgo.com', 'info') },
    { label: 'Terms & Conditions', icon: FileText, action: () => showNotification('Terms available soon', 'info') },
    { label: 'Logout', icon: LogOut, action: () => setShowLogoutModal(true), isLogout: true }
  ];

  if (loading) {
    return (
      <div className="profile-container">
        <Navbar />
        <div style={{ height: '80px' }} />
        <div className="loading-state">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <div>Loading your profile...</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              Check console (F12) if this takes too long
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Navbar />
      <div style={{ height: '80px' }} />

      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <main className="profile-main">
        {/* Header */}
        <div className="profile-header">
          <div className="header-icon">
            <User size={40} />
          </div>
          <div>
            <h2>Welcome back, {user.name}!</h2>
            <p>Member since {user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <stat.icon size={24} />
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Personal Info */}
        <div className="section">
          <div className="section-header">
            <h3>Personal Information</h3>
            {!editMode && (
              <button className="edit-btn" onClick={() => setEditMode(true)}>
                <Edit size={16} /> Edit
              </button>
            )}
          </div>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Full Name</div>
              {editMode ? (
                <input
                  type="text"
                  value={tempUser.name}
                  onChange={(e) => setTempUser({ ...tempUser, name: e.target.value })}
                  className="info-input"
                />
              ) : (
                <div className="info-value">{user.name || 'Not provided'}</div>
              )}
            </div>
            <div className="info-item">
              <div className="info-label">Email</div>
              {editMode ? (
                <input
                  type="email"
                  value={tempUser.email}
                  onChange={(e) => setTempUser({ ...tempUser, email: e.target.value })}
                  className="info-input"
                />
              ) : (
                <div className="info-value">{user.email || 'Not provided'}</div>
              )}
            </div>
            <div className="info-item">
              <div className="info-label">Phone</div>
              {editMode ? (
                <input
                  type="tel"
                  value={tempUser.phone}
                  onChange={(e) => setTempUser({ ...tempUser, phone: e.target.value })}
                  className="info-input"
                />
              ) : (
                <div className="info-value">{user.phone || 'Not provided'}</div>
              )}
            </div>
          </div>
          {editMode && (
            <div className="edit-actions">
              <button className="save-btn" onClick={handleSaveProfile}>
                <Save size={16} /> Save Changes
              </button>
              <button className="cancel-btn" onClick={() => { setEditMode(false); setTempUser(user); }}>
                <X size={16} /> Cancel
              </button>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="section">
          <div className="section-header">
            <h3>Recent Orders</h3>
          </div>
          {orders.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={64} />
              <p>No orders yet. Start ordering delicious food!</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-info">
                    <h4>{order.vendorName}</h4>
                    <div className="order-meta">
                      <span>{formatDate(order)}</span>
                      <span>•</span>
                      <span>{order.items?.length || 1} items</span>
                      <span>•</span>
                      <span>R{order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <div className={`order-badge ${getStatusBadge(order.status).class}`}>
                    {getStatusBadge(order.status).text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="section">
          <div className="section-header">
            <h3>Settings & Account</h3>
          </div>
          <div className="settings-list">
            {settingsMenu.map((item, idx) => (
              <button
                key={idx}
                className={`settings-item ${item.isLogout ? 'logout-item' : ''}`}
                onClick={item.action}
              >
                <div className="settings-left">
                  <div className="settings-icon">
                    <item.icon size={20} />
                  </div>
                  <span className="settings-label">{item.label}</span>
                </div>
                <ChevronRight size={20} />
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <LogOut size={48} />
            </div>
            <h3>Logout Confirmation</h3>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-danger" onClick={handleLogout}>
                Yes, Logout
              </button>
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;