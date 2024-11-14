import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

export const socketService = {
  connect() {
    if (!socket.connected) {
      socket.connect();
    }
  },

  disconnect() {
    socket.disconnect();
  },

  // Question events
  onQuestionAdded(callback: (question: any) => void) {
    socket.on('questionAdded', callback);
  },

  offQuestionAdded() {
    socket.off('questionAdded');
  },

  emitQuestionAdded(question: any) {
    socket.emit('questionAdded', question);
  },

  // Exam events
  onExamStarted(callback: (exam: any) => void) {
    socket.on('examStarted', callback);
  },

  offExamStarted() {
    socket.off('examStarted');
  },

  onExamEnded(callback: (examId: string) => void) {
    socket.on('examEnded', callback);
  },

  offExamEnded() {
    socket.off('examEnded');
  },

  // Student events
  onStudentJoined(callback: (data: { examId: string, studentId: string }) => void) {
    socket.on('studentJoined', callback);
  },

  offStudentJoined() {
    socket.off('studentJoined');
  },

  onStudentLeft(callback: (data: { examId: string, studentId: string }) => void) {
    socket.on('studentLeft', callback);
  },

  offStudentLeft() {
    socket.off('studentLeft');
  },

  // Connection status
  onConnect(callback: () => void) {
    socket.on('connect', callback);
  },

  onDisconnect(callback: () => void) {
    socket.on('disconnect', callback);
  },

  onError(callback: (error: Error) => void) {
    socket.on('error', callback);
  }
};