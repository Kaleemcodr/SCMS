
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  RESIDENT = 'RESIDENT'
}

export enum QueryStatus {
  NEW = 'NEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  UNDER_PROCESS = 'UNDER_PROCESS',
  BIG_ISSUE = 'BIG_ISSUE',
  RESOLVED = 'RESOLVED'
}

export interface User {
  houseNumber: string;
  phone: string;
  role: UserRole;
  isAdminAllowed?: boolean; // Set by Super Admin
  password?: string; // Security PIN/Password
}

export interface StatusUpdate {
  status: QueryStatus;
  timestamp: number;
  message: string;
  timeline?: string; // For BIG_ISSUE
}

export interface Query {
  id: string;
  residentHouseNumber: string;
  description?: string;
  image?: string; // base64
  voiceMail?: string; // base64
  voiceTranscript?: string; // Transcription field
  status: QueryStatus;
  createdAt: number;
  timeline: StatusUpdate[];
  solution?: {
    text: string; // Mandatory for Admin
    image?: string;
    voiceMail?: string;
    resolutionTranscript?: string;
    aiVerification?: {
      isResolved: boolean;
      reason: string;
    };
  };
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'ALERT' | 'EVENT';
  timestamp: number;
  author: string;
}

export interface ChatMessage {
  id: string;
  senderHouse: string;
  senderRole: UserRole;
  recipientHouse?: string; // Null for Group Chat
  type: 'GROUP' | 'DIRECT';
  content: string;
  timestamp: number;
}

export interface AppState {
  users: User[];
  queries: Query[];
  notices: Notice[];
  chatMessages: ChatMessage[];
  currentUser: User | null;
}
