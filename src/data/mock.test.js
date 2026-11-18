import { describe, expect, it } from "vitest";
import { scheduleError, scheduleLabel } from "./mock";

describe("scheduleLabel", () => {
  it("ordena los horarios y junta los días con las mismas horas", () => {
    expect(
      scheduleLabel([
        { day: 3, start: "15:30", end: "17:00" },
        { day: 2, start: "10:00", end: "11:30" },
        { day: 0, start: "10:00", end: "11:30" },
      ]),
    ).toBe("Lun, Mié 10:00–11:30 · Jue 15:30–17:00");
  });
});

describe("scheduleError", () => {
  const row = (day, start, end) => ({ day, start, end });

  it("acepta horarios válidos, incluso uno justo después de otro", () => {
    expect(scheduleError([row(1, "10:00", "11:30"), row(1, "11:30", "13:00")])).toBe("");
  });

  it.each([
    [[], "Agrega al menos un horario."],
    [[row(0, "10:00", "")], "Completa la hora de inicio y de fin."],
    [[row(1, "12:00", "12:00")], "El horario del martes debe terminar después de empezar."],
    [
      [row(2, "10:00", "12:00"), row(2, "11:00", "13:00")],
      "Hay dos horarios del miércoles que se cruzan.",
    ],
  ])("rechaza %j", (schedule, message) => {
    expect(scheduleError(schedule)).toBe(message);
  });
});
