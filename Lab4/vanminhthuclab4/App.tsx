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
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

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

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('notes')
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
  }, []);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q),
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
      });
      setNewTitle('');
      setNewContent('');
      setAddModalVisible(false);
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
          <Text style={styles.icon}>🔍</Text>
        </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
