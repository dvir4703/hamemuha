import { dialog, ipcMain } from 'electron';

import {
  createContestant,
  deleteContestant,
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
import { getImageUrl, saveImage } from '../services/file.service';

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
}
