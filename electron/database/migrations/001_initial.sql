CREATE TABLE quizzes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    logo_path       TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contestants (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id         INTEGER NOT NULL,
    name            TEXT NOT NULL,
    display_order   INTEGER NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE questions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id         INTEGER NOT NULL,
    contestant_id   INTEGER NOT NULL,
    question_type   TEXT NOT NULL, -- 'multiple_choice' | 'true_false' | 'complete_sentence' | 'open_answer' | 'multiple_options' | 'association_hints'
    question_text   TEXT NOT NULL,
    image_path      TEXT,
    explanation     TEXT,
    correct_answer_text TEXT, -- לסוגים 3 (השלם משפט) ו-4 (תשובה פתוחה) בלבד
    points          INTEGER NOT NULL DEFAULT 10,
    time_limit      INTEGER,
    display_order   INTEGER NOT NULL,
    shuffle_answers BOOLEAN DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (contestant_id) REFERENCES contestants(id) ON DELETE CASCADE
);

-- לסוגים 1 (אמריקאית), 2 (נכון/לא נכון), 5 (אופציות מרובה), 6 (אסוציאציה+רמזים)
CREATE TABLE answers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id     INTEGER NOT NULL,
    answer_text     TEXT NOT NULL,
    image_path      TEXT,
    is_correct      BOOLEAN NOT NULL DEFAULT 0,
    display_order   INTEGER NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- לסוג 3 (חשיפת אות / רמז טקסטואלי) ולסוג 6 (אסוציאציות)
CREATE TABLE hints (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id     INTEGER NOT NULL,
    hint_type       TEXT NOT NULL, -- 'letter_reveal' | 'text'
    hint_text       TEXT,
    hint_order      INTEGER NOT NULL,
    points_penalty  INTEGER NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE game_results (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id         INTEGER NOT NULL,
    played_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_time      INTEGER,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE contestant_results (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_result_id  INTEGER NOT NULL,
    contestant_id   INTEGER NOT NULL,
    total_score     INTEGER NOT NULL DEFAULT 0,
    correct_count   INTEGER NOT NULL DEFAULT 0,
    wrong_count     INTEGER NOT NULL DEFAULT 0,
    hints_used      INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (game_result_id) REFERENCES game_results(id) ON DELETE CASCADE,
    FOREIGN KEY (contestant_id) REFERENCES contestants(id) ON DELETE CASCADE
);
