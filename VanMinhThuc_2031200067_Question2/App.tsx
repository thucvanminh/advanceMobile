import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, SafeAreaView } from 'react-native';
import firestore from '@react-native-firebase/firestore';

type Task = {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string;
};

const PRIORITIES = ['Low', 'Medium', 'High'];

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Low');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');
  const [dueDateError, setDueDateError] = useState('');

  useEffect(() => {
    const unsub = firestore().collection('tasks').onSnapshot(snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        title: d.data().title || '',
        description: d.data().description || '',
        priority: d.data().priority || 'Low',
        dueDate: d.data().dueDate || '',
      }));
      setTasks(list);
    });
    return () => unsub();
  }, []);

  function clearErrors() {
    setTitleError('');
    setDescError('');
    setDueDateError('');
  }

  function validate(): boolean {
    clearErrors();
    let valid = true;
    if (!title.trim()) { setTitleError('Title is required'); valid = false; }
    if (!description.trim()) { setDescError('Description is required'); valid = false; }
    if (!dueDate.trim()) { setDueDateError('Due date is required'); valid = false; }
    return valid;
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setPriority('Low');
    setDueDate('');
    setEditingId(null);
    clearErrors();
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      if (editingId) {
        await firestore().collection('tasks').doc(editingId).update({
          title: title.trim(), description: description.trim(),
          priority, dueDate: dueDate.trim(),
        });
      } else {
        await firestore().collection('tasks').add({
          title: title.trim(), description: description.trim(),
          priority, dueDate: dueDate.trim(),
        });
      }
      resetForm();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  function handleEdit(task: Task) {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setDueDate(task.dueDate);
    clearErrors();
  }

  function confirmDelete(id: string) {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await firestore().collection('tasks').doc(id).delete();
            if (editingId === id) resetForm();
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  }

  const filteredTasks = search.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()))
    : tasks;

  return (
    <SafeAreaView style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginVertical: 10 }}>Task Manager</Text>

      <TextInput placeholder="Search tasks..." value={search} onChangeText={setSearch}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8 }} />

      <FlatList data={filteredTasks} keyExtractor={item => item.id}
        style={{ flex: 1 }}
        ListEmptyComponent={<Text>No tasks</Text>}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: 'bold', flex: 1 }}>{item.title}</Text>
              <Text>{item.priority}</Text>
            </View>
            <Text>{item.description}</Text>
            <Text>{item.dueDate}</Text>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <TouchableOpacity onPress={() => handleEdit(item)}
                style={{ backgroundColor: '#3498db', padding: 6, marginRight: 6 }}>
                <Text style={{ color: '#fff' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item.id)}
                style={{ backgroundColor: '#e74c3c', padding: 6 }}>
                <Text style={{ color: '#fff' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} />

      <View style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, marginTop: 8 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>{editingId ? 'Edit Task' : 'New Task'}</Text>

        <TextInput placeholder="Title" value={title} onChangeText={t => { setTitle(t); if (titleError) setTitleError(''); }}
          style={{ borderWidth: 1, borderColor: titleError ? 'red' : '#ccc', padding: 8, marginBottom: 2 }} />
        {titleError ? <Text style={{ color: 'red', fontSize: 12, marginBottom: 4 }}>{titleError}</Text> : null}

        <TextInput placeholder="Description" value={description} onChangeText={d => { setDescription(d); if (descError) setDescError(''); }}
          style={{ borderWidth: 1, borderColor: descError ? 'red' : '#ccc', padding: 8, marginBottom: 2 }} />
        {descError ? <Text style={{ color: 'red', fontSize: 12, marginBottom: 4 }}>{descError}</Text> : null}

        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          {PRIORITIES.map(p => (
            <TouchableOpacity key={p} onPress={() => setPriority(p)}
              style={{ flex: 1, padding: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center',
                backgroundColor: priority === p ? '#6200ee' : 'transparent' }}>
              <Text style={{ color: priority === p ? '#fff' : '#000' }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput placeholder="Due date (e.g. 2025-12-31)" value={dueDate} onChangeText={d => { setDueDate(d); if (dueDateError) setDueDateError(''); }}
          style={{ borderWidth: 1, borderColor: dueDateError ? 'red' : '#ccc', padding: 8, marginBottom: 2 }} />
        {dueDateError ? <Text style={{ color: 'red', fontSize: 12, marginBottom: 4 }}>{dueDateError}</Text> : null}

        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          <TouchableOpacity onPress={handleSave}
            style={{ flex: 1, backgroundColor: '#6200ee', padding: 10, alignItems: 'center', marginRight: editingId ? 6 : 0 }}>
            <Text style={{ color: '#fff' }}>{editingId ? 'Update' : 'Add'}</Text>
          </TouchableOpacity>
          {editingId ? (
            <TouchableOpacity onPress={resetForm}
              style={{ flex: 1, backgroundColor: '#999', padding: 10, alignItems: 'center' }}>
              <Text style={{ color: '#fff' }}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default App;
