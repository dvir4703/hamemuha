import { contextBridge, ipcRenderer } from 'electron';

import type { ElectronApi } from '../src/types';

const api: ElectronApi = {
  quiz: {
    getAll: () => ipcRenderer.invoke('quiz:getAll'),
    getById: (id) => ipcRenderer.invoke('quiz:getById', id),
    create: (data) => ipcRenderer.invoke('quiz:create', data),
    update: (id, data) => ipcRenderer.invoke('quiz:update', id, data),
    delete: (id) => ipcRenderer.invoke('quiz:delete', id),
    duplicate: (id) => ipcRenderer.invoke('quiz:duplicate', id),
    search: (query) => ipcRenderer.invoke('quiz:search', query),
  },
  contestant: {
    getByQuizId: (quizId) =>
      ipcRenderer.invoke('contestant:getByQuizId', quizId),
    create: (data) => ipcRenderer.invoke('contestant:create', data),
    update: (id, data) => ipcRenderer.invoke('contestant:update', id, data),
    delete: (id) => ipcRenderer.invoke('contestant:delete', id),
    duplicate: (id) => ipcRenderer.invoke('contestant:duplicate', id),
  },
  question: {
    getByQuizId: (quizId) => ipcRenderer.invoke('question:getByQuizId', quizId),
    getById: (id) => ipcRenderer.invoke('question:getById', id),
    create: (data) => ipcRenderer.invoke('question:create', data),
    update: (id, data) => ipcRenderer.invoke('question:update', id, data),
    delete: (id) => ipcRenderer.invoke('question:delete', id),
    reorder: (contestantId, orderedIds) =>
      ipcRenderer.invoke('question:reorder', contestantId, orderedIds),
    duplicate: (id, targetContestantId) =>
      ipcRenderer.invoke('question:duplicate', id, targetContestantId),
  },
  result: {
    saveGameResult: (data) => ipcRenderer.invoke('result:saveGameResult', data),
    getById: (id) => ipcRenderer.invoke('result:getById', id),
  },
  file: {
    selectAndSaveImage: (category) =>
      ipcRenderer.invoke('file:selectAndSaveImage', category),
    selectAndSaveMedia: (category) =>
      ipcRenderer.invoke('file:selectAndSaveMedia', category),
    getImageUrl: (relativePath) =>
      ipcRenderer.invoke('file:getImageUrl', relativePath),
    getMediaUrl: (relativePath) =>
      ipcRenderer.invoke('file:getMediaUrl', relativePath),
    getImageDataUrl: (relativePath) =>
      ipcRenderer.invoke('file:getImageDataUrl', relativePath),
  },
  system: {
    platform: process.platform,
  },
};

contextBridge.exposeInMainWorld('api', api);
