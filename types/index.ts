export type User = {
  uid: string;
  email: string;
  username: string;
  createdAt: Date;
};

export type MessageType = {
  id: string;
  text: string;
  user: string;
  userId: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Chat: { username: string; userId: string };
};