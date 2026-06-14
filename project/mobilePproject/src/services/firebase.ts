// Firebase service
// react-native-firebase tự động đọc cấu hình từ google-services.json
// Không cần gọi initializeApp thủ công

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const db = firestore();
db.settings({ ignoreUndefinedProperties: true });

export { auth, db };
