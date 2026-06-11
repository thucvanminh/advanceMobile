import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { initMessaging, registerNotificationHandlers } from './src/services/messaging';
import { signInWithGoogle, signOut, UserProfile } from './src/services/googleAuth';
import { signUpWithEmail, signInWithEmail } from './src/services/emailAuth';

const COLORS = {
  green: '#D4F8D4',
  blue: '#D1D9FF',
  pink: '#FFD1D1',
  teal: '#A9F0F0',
  yellow: '#FFF9C4',
  purple: '#F8D1FF',
  fab: '#E57373',
  textGray: '#666',
};

const NOTE_COLORS = [
  COLORS.green,
  COLORS.blue,
  COLORS.pink,
  COLORS.teal,
  COLORS.yellow,
  COLORS.purple,
];

type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  created_at: any;
  updated_at: any;
};

// ─── Login Screen ───────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onLogin();
    } catch (error: any) {
      let title = 'Login Failed';
      let message = 'Please try again.';

      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/invalid-email'
      ) {
        title = ' Incorrect Email or Password';
        message = 'The email or password you entered is incorrect. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        title = 'Too Many Attempts';
        message = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        title = 'Network Error';
        message = 'Please check your internet connection.';
      }

      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (mode === 'signup' && !displayName.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      }
      onLogin();
    } catch (error: any) {
      let title = 'Error';
      let message = error.message || 'Please try again.';

      if (mode === 'login') {
        // Login errors
        if (
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/invalid-email'
        ) {
          title = 'Incorrect Email or Password';
          message = 'The email or password you entered is incorrect. Please try again.';
        } else if (error.code === 'auth/too-many-requests') {
          title = 'Too Many Attempts';
          message = 'Too many failed attempts. Please try again later.';
        } else if (error.code === 'auth/network-request-failed') {
          title = 'Network Error';
          message = 'Please check your internet connection.';
        }
      } else {
        // Signup errors
        if (error.code === 'auth/email-already-in-use') {
          title = 'Email Already Registered';
          message = 'This email is already in use. Please sign in instead.';
        } else if (error.code === 'auth/weak-password') {
          title = 'Weak Password';
          message = 'Password must be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
          title = 'Invalid Email';
          message = 'Please enter a valid email address.';
        }
      }

      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginContent}>
        <Text style={styles.loginTitle}>📝 Notes App</Text>
        <Text style={styles.loginSubtitle}>
          {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
        </Text>

        {/* Email/Password Form */}
        {mode === 'signup' && (
          <TextInput
            style={styles.loginInput}
            placeholder="Your name"
            placeholderTextColor="#999"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.loginInput}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.loginInput}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.emailButton, loading && styles.buttonDisabled]}
          onPress={handleEmailSubmit}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.emailButtonText}>
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          disabled={loading}>
          <Text style={styles.switchModeText}>
            {mode === 'login'
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign-In */}
        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        firestore()
          .collection('users')
          .doc(firebaseUser.uid)
          .get()
          .then(doc => {
            if (doc.exists()) {
              setUser(doc.data() as UserProfile);
            } else {
              // Fallback: create profile from Firebase user
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                createdAt: firestore.FieldValue.serverTimestamp(),
              });
            }
          });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch notes when user is logged in
  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection('notes')
      .where('userId', '==', user.uid)
      .orderBy('created_at', 'desc')
      .onSnapshot(
        snapshot => {
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            content: doc.data().content,
            color: doc.data().color || COLORS.green,
            created_at: doc.data().created_at,
            updated_at: doc.data().updated_at,
          }));
          setNotes(list);
        },
        error => {
          Alert.alert('Error', error.message);
        },
      );

    return () => unsubscribe();
  }, [user]);

  // ─── FCM: Init messaging + register handlers (topic-based) ──────────────
  useEffect(() => {
    let unsubscribeHandlers: (() => void) | undefined;

    initMessaging()
      .then(() => {
        unsubscribeHandlers = registerNotificationHandlers(() => {
          // On notification tap: could navigate to a specific note
          // For now, just log it
          console.log('Notification tapped');
        });
      })
      .catch(error => {
        console.error('FCM init error:', error);
      });

    return () => {
      if (unsubscribeHandlers) {
        unsubscribeHandlers();
      }
    };
  }, []);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      n =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    );
  }, [notes, searchQuery]);

  const getRandomColor = () =>
    NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];

  const addNote = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Empty', 'Please enter a title.');
      return;
    }
    if (!newContent.trim()) {
      Alert.alert('Empty', 'Please enter content.');
      return;
    }
    try {
      const timestamp = firestore.FieldValue.serverTimestamp();
      await firestore().collection('notes').add({
        title: newTitle.trim(),
        content: newContent.trim(),
        color: getRandomColor(),
        created_at: timestamp,
        updated_at: timestamp,
        userId: user?.uid,
      });
      setNewTitle('');
      setNewContent('');
      setAddModalVisible(false);
      Alert.alert('✅ Success', 'Note created!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const deleteNote = (id: string) => {
    Alert.alert('Delete', 'Delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await firestore().collection('notes').doc(id).delete();
            Alert.alert('🗑️ Deleted', 'Note deleted!');
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const openDetail = (note: Note) => {
    setSelectedNote(note);
    setDetailModalVisible(true);
  };

  // ─── Loading ────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </SafeAreaView>
    );
  }

  // ─── Login ──────────────────────────────────────────────────────────────

  if (!user) {
    return <LoginScreen onLogin={() => {}} />;
  }

  // ─── Notes List ─────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.color }]}
      onPress={() => openDetail(item)}
      onLongPress={() => deleteNote(item.id)}
      activeOpacity={0.8}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardContent} numberOfLines={6}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerTitle}>Notes</Text>
            <Text style={styles.headerSubtitle}>{user.displayName || user.email}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
            <Text style={styles.icon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      <FlatList
        data={filteredNotes}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? 'No matching notes.'
                : 'No notes yet. Tap + to add!'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Note</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor="#999"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="Content"
              placeholderTextColor="#999"
              value={newContent}
              onChangeText={setNewContent}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setNewTitle('');
                  setNewContent('');
                  setAddModalVisible(false);
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={addNote}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <Text style={styles.icon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Note</Text>
            <TouchableOpacity
              onPress={() => {
                if (selectedNote) {
                  setDetailModalVisible(false);
                  deleteNote(selectedNote.id);
                }
              }}>
              <Text style={styles.icon}>🗑️</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.detailArea,
              { backgroundColor: selectedNote?.color || '#FFF' },
            ]}>
            <Text style={styles.detailTitle}>{selectedNote?.title}</Text>
            <Text style={styles.detailBody}>{selectedNote?.content}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ─── Login ─────────────────────────────────────────────────────
  loginContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContent: {
    alignItems: 'center',
    padding: 40,
    width: '80%',
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 220,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  emailButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 220,
    alignItems: 'center',
    marginBottom: 12,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchModeText: {
    color: '#6200ee',
    fontSize: 14,
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 14,
  },

  // ─── Main ──────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 70,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutBtn: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signOutText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  icon: {
    fontSize: 24,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  listPadding: {
    padding: 10,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 15,
    height: 180,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: COLORS.fab,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabIcon: {
    color: 'white',
    fontSize: 35,
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },
  modalInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6200ee',
  },
  saveButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: '#FFF',
  },
  detailArea: {
    flex: 1,
    padding: 25,
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailBody: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
    width: '100%',
  },
});

export default App;
