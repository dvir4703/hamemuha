ALTER TABLE quizzes ADD COLUMN timing_mode TEXT NOT NULL DEFAULT 'per_question'
    CHECK (timing_mode IN ('per_question', 'per_contestant'));

ALTER TABLE contestants ADD COLUMN total_time_limit INTEGER
    CHECK (total_time_limit IS NULL OR (
        typeof(total_time_limit) = 'integer'
        AND total_time_limit BETWEEN 30 AND 1200
        AND total_time_limit % 10 = 0
    ));

CREATE TRIGGER quiz_timing_mode_locked
BEFORE UPDATE OF timing_mode ON quizzes
WHEN NEW.timing_mode != OLD.timing_mode
BEGIN
    SELECT RAISE(ABORT, 'Quiz timing mode cannot change after creation');
END;

CREATE TRIGGER contestant_timing_insert
BEFORE INSERT ON contestants
WHEN ((SELECT timing_mode FROM quizzes WHERE id = NEW.quiz_id) = 'per_contestant')
    != (NEW.total_time_limit IS NOT NULL)
BEGIN
    SELECT RAISE(ABORT, 'Contestant time budget must match quiz timing mode');
END;

CREATE TRIGGER contestant_timing_update
BEFORE UPDATE OF total_time_limit, quiz_id ON contestants
WHEN ((SELECT timing_mode FROM quizzes WHERE id = NEW.quiz_id) = 'per_contestant')
    != (NEW.total_time_limit IS NOT NULL)
BEGIN
    SELECT RAISE(ABORT, 'Contestant time budget must match quiz timing mode');
END;

CREATE TRIGGER question_timing_insert
BEFORE INSERT ON questions
WHEN NEW.time_limit IS NOT NULL
    AND (SELECT timing_mode FROM quizzes WHERE id = NEW.quiz_id) = 'per_contestant'
BEGIN
    SELECT RAISE(ABORT, 'Per-contestant quizzes cannot have question time limits');
END;

CREATE TRIGGER question_timing_update
BEFORE UPDATE OF time_limit, quiz_id ON questions
WHEN NEW.time_limit IS NOT NULL
    AND (SELECT timing_mode FROM quizzes WHERE id = NEW.quiz_id) = 'per_contestant'
BEGIN
    SELECT RAISE(ABORT, 'Per-contestant quizzes cannot have question time limits');
END;
