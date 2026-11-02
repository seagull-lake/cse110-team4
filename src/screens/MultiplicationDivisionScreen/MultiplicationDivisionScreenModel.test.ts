import { beforeEach, describe, expect, it, vi } from "vitest";
import { MultiplicationDivisionScreenModel, MAX_COMBO_MULTIPLIER } from "./MultiplicationDivisionScreenModel.ts";

const values = new Map<string, string>();

const localStorageMock = {
    getItem(key: string): string | null {
        return values.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
        values.set(key, value);
    },
};

const sampleProblem = { firstOperand: 3, operator: "x", secondOperand: 4, choices: [10, 12, 14, 7], answer: 12 };

describe("Multiplication and Division scoring", () => {
    beforeEach(() => {
        values.clear();
        vi.stubGlobal("localStorage", localStorageMock);
    });

    it("tracks and persists its score independently", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.recordAnswer(true, 100);

        expect(model.getScore()).toBe(100);
        expect(model.finishGame()).toBe(true);

        const nextGame = new MultiplicationDivisionScreenModel();
        expect(nextGame.getScore()).toBe(0);
        expect(nextGame.getHighScore()).toBe(100);
    });

    it("multiplies points by the combo, starting at 1x", () => {
        const model = new MultiplicationDivisionScreenModel();

        expect(model.recordAnswer(true, 50)).toBe(50);    // x1
        expect(model.getCombo()).toBe(1);
        expect(model.recordAnswer(true, 50)).toBe(100);   // x2
        expect(model.recordAnswer(true, 50)).toBe(150);   // x3
        expect(model.getScore()).toBe(300);
    });

    it("caps the multiplier while the streak keeps counting", () => {
        const model = new MultiplicationDivisionScreenModel();
        for (let streak = 1; streak < MAX_COMBO_MULTIPLIER; streak++) model.recordAnswer(true, 50);

        expect(model.recordAnswer(true, 50)).toBe(50 * MAX_COMBO_MULTIPLIER);   // streak == cap
        expect(model.recordAnswer(true, 50)).toBe(50 * MAX_COMBO_MULTIPLIER);   // past the cap
        expect(model.getCombo()).toBe(MAX_COMBO_MULTIPLIER + 1);
    });

    it("starts over at x1 after a miss from a capped combo", () => {
        const model = new MultiplicationDivisionScreenModel();
        for (let i = 0; i < MAX_COMBO_MULTIPLIER + 2; i++) model.recordAnswer(true, 50);

        model.recordAnswer(false, 50);

        expect(model.getCombo()).toBe(0);
        expect(model.recordAnswer(true, 50)).toBe(50);   // back to x1
    });

    it("resets the combo after an incorrect answer", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.recordAnswer(true, 50);
        model.recordAnswer(true, 50);

        expect(model.recordAnswer(false, 50)).toBe(0);
        expect(model.getCombo()).toBe(0);
        expect(model.recordAnswer(true, 50)).toBe(50);
    });

    it("resets the combo when the game resets", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.recordAnswer(true, 50);
        model.recordAnswer(true, 50);

        model.resetGame();

        expect(model.getCombo()).toBe(0);
        expect(model.getScore()).toBe(0);
    });

    it("checks whether a chosen index is the correct answer", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.newRound(sampleProblem);

        expect(model.isCorrectChoice(1)).toBe(true);
        expect(model.isCorrectChoice(0)).toBe(false);
        expect(model.isCorrectChoice(99)).toBe(false);
    });

    it("counts rounds and resets them with the game", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.newRound({ firstOperand: 1, operator: "x", secondOperand: 1, choices: [1, 2, 3, 4], answer: 1 });
        model.newRound({ firstOperand: 1, operator: "x", secondOperand: 1, choices: [1, 2, 3, 4], answer: 1 });
        expect(model.getRound()).toBe(2);

        model.resetGame();
        expect(model.getRound()).toBe(0);
    });

    it("reports where the correct answer is so a wrong answer can show it", () => {
        const model = new MultiplicationDivisionScreenModel();
        expect(model.getCorrectChoiceIndex()).toBe(-1);   // no round yet

        model.newRound(sampleProblem);
        expect(model.getCorrectChoiceIndex()).toBe(1);

        model.newRound({ ...sampleProblem, choices: [10, 14, 7, 12] });
        expect(model.getCorrectChoiceIndex()).toBe(3);
    });

    it("keeps the score unchanged after a wrong answer", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.newRound(sampleProblem);
        model.recordAnswer(true, 50);

        model.recordAnswer(model.isCorrectChoice(0), 50);   // wrong

        expect(model.getScore()).toBe(50);
        expect(model.getCombo()).toBe(0);
    });

    it("treats every choice as wrong before a round has started", () => {
        const model = new MultiplicationDivisionScreenModel();
        expect(model.isCorrectChoice(0)).toBe(false);
    });

    it("rejects negative choice indexes", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.newRound(sampleProblem);
        expect(model.isCorrectChoice(-1)).toBe(false);
    });

    it("checks choices against the current round's problem only", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.newRound(sampleProblem);                                      // 12 is at index 1
        model.newRound({ ...sampleProblem, choices: [12, 10, 14, 7] });     // 12 moved to index 0

        expect(model.isCorrectChoice(0)).toBe(true);
        expect(model.isCorrectChoice(1)).toBe(false);
    });

    it("does not report a new high score when the old one is not beaten", () => {
        const firstGame = new MultiplicationDivisionScreenModel();
        firstGame.recordAnswer(true, 100);
        firstGame.finishGame();

        const secondGame = new MultiplicationDivisionScreenModel();
        secondGame.recordAnswer(true, 50);

        expect(secondGame.finishGame()).toBe(false);
        expect(secondGame.getHighScore()).toBe(100);
    });

    it("awards points for a correct choice and nothing for a wrong one", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.newRound(sampleProblem);

        expect(model.recordAnswer(model.isCorrectChoice(1), 50)).toBe(50);   // correct
        expect(model.recordAnswer(model.isCorrectChoice(0), 50)).toBe(0);    // wrong
        expect(model.getScore()).toBe(50);
        expect(model.getCombo()).toBe(0);
    });

    it("does not report a new high score when the score only ties it", () => {
        const firstGame = new MultiplicationDivisionScreenModel();
        firstGame.recordAnswer(true, 100);
        firstGame.finishGame();

        const tiedGame = new MultiplicationDivisionScreenModel();
        tiedGame.recordAnswer(true, 100);

        expect(tiedGame.finishGame()).toBe(false);
    });
});
