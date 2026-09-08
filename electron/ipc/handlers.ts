import { dialog, ipcMain } from 'electron';

import {
  createContestant,
  deleteContestant,
  duplicateContestant,
  getContestantsByQuizId,
  updateContestant,
} from '../database/dal/contestants';
import {
  createQuiz,
  deleteQuiz,
  duplicateQuiz,
  getAllQuizzes,
  getQuizById,
  searchQuizzes,
  updateQuiz,
} from '../database/dal/quizzes';
import {
  createQuestion,
  deleteQuestion,
  duplicateQuestion,
  getQuestionById,
  getQuestionsByQuizId,
  reorderQuestions,
  updateQuestion,
} from '../database/dal/questions';
import { getGameResultById, saveGameResult } from '../database/dal/results';
import {
  getImageDataUrl,
  getImageUrl,
  getMediaUrl,
  saveImage,
  saveMedia,
} from '../services/file.service';

function requirePositiveId(id: number): number {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('המזהה שנשלח אינו תקין.');
  }

  return id;
}

export function registerIpcHandlers(): void {
  ipcMain.handle('quiz:getAll', () => getAllQuizzes());
  ipcMain.handle('quiz:getById', (_event, id: number) =>
    getQuizById(requirePositiveId(id)),
  );
  ipcMain.handle('quiz:create', (_event, data) => createQuiz(data));
  ipcMain.handle('quiz:update', (_event, id: number, data) =>
    updateQuiz(requirePositiveId(id), data),
  );
  ipcMain.handle('quiz:delete', (_event, id: number) =>
    deleteQuiz(requirePositiveId(id)),
  );
  ipcMain.handle('quiz:duplicate', (_event, id: number) =>
    duplicateQuiz(requirePositiveId(id)),
  );
  ipcMain.handle('quiz:search', (_event, query: string) =>
    searchQuizzes(query),
  );

  ipcMain.handle('contestant:getByQuizId', (_event, quizId: number) =>
    getContestantsByQuizId(requirePositiveId(quizId)),
  );
  ipcMain.handle('contestant:create', (_event, data) => createContestant(data));
  ipcMain.handle('contestant:update', (_event, id: number, data) =>
    updateContestant(requirePositiveId(id), data),
  );
  ipcMain.handle('contestant:delete', (_event, id: number) =>
    deleteContestant(requirePositiveId(id)),
  );
  ipcMain.handle('contestant:duplicate', (_event, id: number) =>
    duplicateContestant(requirePositiveId(id)),
  );

  ipcMain.handle('question:getByQuizId', (_event, quizId: number) =>
    getQuestionsByQuizId(requirePositiveId(quizId)),
  );
  ipcMain.handle('question:getById', (_event, id: number) =>
    getQuestionById(requirePositiveId(id)),
  );
  ipcMain.handle('question:create', (_event, data) => createQuestion(data));
  ipcMain.handle('question:update', (_event, id: number, data) =>
    updateQuestion(requirePositiveId(id), data),
  );
  ipcMain.handle('question:delete', (_event, id: number) =>
    deleteQuestion(requirePositiveId(id)),
  );
  ipcMain.handle(
    'question:reorder',
    (_event, contestantId: number, orderedIds: number[]) =>
      reorderQuestions(requirePositiveId(contestantId), orderedIds),
  );
  ipcMain.handle(
    'question:duplicate',
    (_event, id: number, targetContestantId?: number) =>
      duplicateQuestion(
        requirePositiveId(id),
        targetContestantId === undefined
          ? undefined
          : requirePositiveId(targetContestantId),
      ),
  );

  ipcMain.handle('result:saveGameResult', (_event, data) =>
    saveGameResult(data),
  );
  ipcMain.handle(
    'file:selectAndSaveMedia',
    async (_event, category: string) => {
      const result = await dialog.showOpenDialog({
        title: 'בחירת מדיה לשאלה',
        properties: ['openFile'],
        filters: [
          {
            name: 'מדיה נתמכת',
            extensions: ['png', 'jpg', 'jpeg', 'mp4', 'mp3'],
          },
          { name: 'וידאו', extensions: ['mp4'] },
          { name: 'אודיו', extensions: ['mp3'] },
          { name: 'תמונות', extensions: ['png', 'jpg', 'jpeg'] },
        ],
      });

      if (result.canceled || !result.filePaths[0]) return null;
      return saveMedia(result.filePaths[0], category);
    },
  );
  ipcMain.handle('result:getById', (_event, id: number) =>
    getGameResultById(requirePositiveId(id)),
  );

  ipcMain.handle(
    'file:selectAndSaveImage',
    async (_event, category: string) => {
      const result = await dialog.showOpenDialog({
        title: 'בחירת תמונה',
        properties: ['openFile'],
        filters: [
          {
            name: 'תמונות',
            extensions: ['png', 'jpg', 'jpeg'],
          },
        ],
      });

      if (result.canceled || !result.filePaths[0]) {
        return null;
      }

      return saveImage(result.filePaths[0], category);
    },
  );
  ipcMain.handle('file:getImageUrl', (_event, relativePath: string) =>
    getImageUrl(relativePath),
  );
  ipcMain.handle('file:getMediaUrl', (_event, relativePath: string) =>
    getMediaUrl(relativePath),
  );
  ipcMain.handle('file:getImageDataUrl', (_event, relativePath: string) =>
    getImageDataUrl(relativePath),
  );
}
