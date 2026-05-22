export interface Message {
  id: string;
  text: string;
  username: string;
  isSystem?: boolean;
}

export type RootStackParamList = {
  Home: undefined;
  GroupChat: { username: string };
};