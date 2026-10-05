import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

const expectNoA11yViolations = async (page: Page) => {
  // Audit the settled UI: mid-entrance opacity would skew contrast. Infinite ones (spinners) never settle.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
};

/** Each player gets their own context, so their own session, like separate devices. */
const openPlayer = async (browser: Browser, path = "/") => {
  const page = await (await browser.newContext()).newPage();
  await page.goto(path);
  return page;
};

/** Non-white pixels on the canvas, to compare what two players see. */
const inkPixels = (page: Page) =>
  page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data ?? [];
    let ink = 0;
    for (let i = 0; i < data.length; i += 4) if ((data[i] ?? 255) < 250) ink++;
    return ink;
  });

test("two players play a full turn", async ({ browser }) => {
  const alice = await openPlayer(browser);
  await expectNoA11yViolations(alice);
  await alice.getByLabel("Your name").fill("Alice");
  await alice.getByRole("button", { name: "Create a room" }).click();
  await expect(alice.getByRole("heading", { name: "Settings" })).toBeVisible();
  const code = new URL(alice.url()).searchParams.get("room");
  expect(code).toMatch(/^[A-Z0-9]{6}$/);

  // The invite link lands straight on a "Join room" action.
  const bob = await openPlayer(browser, `/?room=${code}`);
  await bob.getByLabel("Your name").fill("Bob");
  await bob.getByRole("button", { name: `Join room ${code}` }).click();
  await expect(alice.getByText("Bob joined the room")).toBeVisible();
  await expect(bob.getByRole("combobox", { name: "Rounds" })).toBeDisabled();
  await expectNoA11yViolations(alice);

  await alice.getByRole("button", { name: "Start game" }).click();
  await expect(bob.getByText("Alice is picking a word…")).toBeVisible();
  const choice = alice.locator(".choice").first();
  const word = (await choice.innerText()).toLowerCase();
  await choice.click();

  // Guessers see only blanks; the drawer sees the word.
  await expect(alice.locator(".word--known")).toContainText(word);
  await expect(bob.locator(".hint__char")).toHaveCount(word.replace(/ /g, "").length);

  const box = await alice.locator("canvas").boundingBox();
  if (!box) throw new Error("canvas not rendered");
  await alice.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await alice.mouse.down();
  await alice.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7, { steps: 20 });
  await alice.mouse.up();
  await expect.poll(() => inkPixels(bob)).toBeGreaterThan(1_000);

  await alice.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => inkPixels(bob)).toBe(0);
  await expectNoA11yViolations(bob);

  await bob.getByLabel("Your guess").fill(word.toUpperCase());
  await bob.keyboard.press("Enter");
  await expect(alice.getByText("Everyone got it!")).toBeVisible();
  await expect(alice.locator(".gains")).toContainText("Bob");
  // The correct answer is never echoed into chat.
  await expect(alice.locator(".msg:not(.msg--system)", { hasText: new RegExp(`^Bob ${word}$`, "i") })).toHaveCount(0);
  await expectNoA11yViolations(alice);
});

test("a refresh keeps your seat", async ({ browser }) => {
  const host = await openPlayer(browser);
  await host.getByLabel("Your name").fill("Host");
  await host.getByRole("button", { name: "Create a room" }).click();
  await expect(host.getByRole("heading", { name: "Settings" })).toBeVisible();

  await host.reload();
  await expect(host.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(host.locator(".roster__item")).toHaveCount(1);

  await host.getByRole("button", { name: "Leave room" }).click();
  await expect(host.getByRole("button", { name: "Create a room" })).toBeVisible();
  expect(new URL(host.url()).searchParams.get("room")).toBeNull();
});
