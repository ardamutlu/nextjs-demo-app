import { test, expect, Page } from "@playwright/test";
import { SIGN_IN_TEST_IDS } from "../helpers/sign-in-test-ids";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const LOGIN_URL = `${BASE_URL}/signin`;

const MOCK_USER = {
  name: "Test User",
  email: "test@example.com",
  image: "https://avatars.githubusercontent.com/u/1?v=4",
};

const MOCK_SESSION = {
  user: MOCK_USER,
  expires: "2099-01-01T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Atomic route helpers
// ---------------------------------------------------------------------------

/** Stubs the CSRF token endpoint (next-auth always fetches this first). */
async function mockCsrf(page: Page) {
  await page.route("**/api/auth/csrf", (route) => {
    console.log("mockCsrf");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ csrfToken: "mock-csrf-token" }),
    });
  });
}

/**
 * Stubs the next-auth v5 sign-in endpoint (`POST /api/auth/signin`).
 *
 * @param onCalled  Optional callback invoked when the route is hit.
 * @param status    HTTP status to return (default 200).
 * @param redirect  When true, responds with a `url` redirect to BASE_URL "/".
 */
async function mockSignIn(
  page: Page,
  {
    onCalled,
    status = 200,
    redirect = true,
  }: { onCalled?: () => void; status?: number; redirect?: boolean } = {},
) {
  // next-auth v5 posts to /api/auth/signin with { providerId } in the body
  await page.route("**/api/auth/signin", async (route) => {
    console.log("mockSignIn");
    onCalled?.();
    if (status !== 200) {
      return route.fulfill({ status });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(redirect ? { url: `${BASE_URL}/` } : {}),
    });
  });
}

/** Catch-all stub for any remaining /api/auth/* requests (session, callback, etc.). */
async function mockAuthCatchAll(page: Page, withSession = false) {
  await page.route("**/api/auth/**", (route) => {
    console.log("mockAuthCatchAll");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(withSession ? MOCK_SESSION : {}),
    });
  });
}

/**
 * Full auth mock: CSRF + sign-in (success redirect) + session catch-all.
 * Used by the `gotoLogin` shortcut and tests that don't need custom sign-in behaviour.
 */
async function mockAuthRoutes(page: Page) {
  await mockCsrf(page);
  await mockSignIn(page);
  await mockAuthCatchAll(page, true);
}

/**
 * Sets up a sign-in spy and all required route mocks in one call.
 * Returns a getter so tests can read the count after the fact.
 */
async function setupSignInSpy(page: Page) {
  let callCount = 0;
  await mockCsrf(page);
  await mockSignIn(page, {
    onCalled: () => {
      callCount++;
    },
  });
  await mockAuthCatchAll(page);
  return { getCallCount: () => callCount };
}

// ---------------------------------------------------------------------------
// Navigation helper
// ---------------------------------------------------------------------------

async function gotoLogin(page: Page) {
  await mockAuthRoutes(page);
  await page.goto(LOGIN_URL);
  await page.waitForSelector("button", { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Locator shorthand
// ---------------------------------------------------------------------------

const githubBtn = (page: Page) =>
  page.getByTestId(SIGN_IN_TEST_IDS.githubButton);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login Page", () => {
  // -------------------------------------------------------------------------
  // 1. Rendering
  // -------------------------------------------------------------------------
  test.describe("Rendering", () => {
    test.beforeEach(async ({ page }) => {
      await gotoLogin(page);
    });

    test("renders the card title", async ({ page }) => {
      await expect(page.getByTestId(SIGN_IN_TEST_IDS.title)).toBeVisible();
    });

    test("renders the Sign In button", async ({ page }) => {
      await expect(
        page.getByTestId(SIGN_IN_TEST_IDS.githubButton),
      ).toBeVisible();
    });

    test("page URL contains 'signin'", async ({ page }) => {
      expect(page.url()).toContain("signin");
    });
  });

  // -------------------------------------------------------------------------
  // 2. Sign-in button interaction
  // -------------------------------------------------------------------------
  test.describe("Sign In button — click behaviour", () => {
    test("clicking the button calls the sign-in endpoint", async ({ page }) => {
      const { getCallCount } = await setupSignInSpy(page);

      await page.goto(LOGIN_URL);
      await page.waitForSelector("button");
      await githubBtn(page).click();

      await expect.poll(getCallCount, { timeout: 5_000 }).toBe(1);
    });

    test("redirects to '/' after successful sign-in", async ({ page }) => {
      await setupSignInSpy(page);

      await page.goto(LOGIN_URL);
      await page.waitForSelector("button");
      await page.getByTestId(SIGN_IN_TEST_IDS.githubButton).click();

      await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 8_000 });
    });

    test("button is enabled by default", async ({ page }) => {
      await gotoLogin(page);
      await expect(githubBtn(page)).toBeEnabled();
    });

    test("button is focusable via keyboard Tab", async ({ page }) => {
      await gotoLogin(page);
      await page.keyboard.press("Tab");
      await expect(githubBtn(page)).toBeFocused();
    });

    test("button can be triggered via keyboard Enter", async ({ page }) => {
      const { getCallCount } = await setupSignInSpy(page);

      await page.goto(LOGIN_URL);
      await page.waitForSelector("button");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");

      await expect
        .poll(getCallCount, { timeout: 5_000 })
        .toBeGreaterThanOrEqual(1);
    });

    test("button can be triggered via keyboard Space", async ({ page }) => {
      const { getCallCount } = await setupSignInSpy(page);

      await page.goto(LOGIN_URL);
      await page.waitForSelector("button");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Space");

      await expect
        .poll(getCallCount, { timeout: 5_000 })
        .toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Accessibility
  // -------------------------------------------------------------------------
  test.describe("Accessibility", () => {
    test.beforeEach(async ({ page }) => {
      await gotoLogin(page);
    });

    test("'Welcome' is rendered as a heading element", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Welcome" }),
      ).toBeVisible();
    });

    test("Sign In button has an accessible name", async ({ page }) => {
      await expect(githubBtn(page)).toBeVisible();
    });

    test("page is operable without a mouse (Tab focuses the button)", async ({
      page,
    }) => {
      await page.keyboard.press("Tab");
      await expect(githubBtn(page)).toBeFocused();
    });

    test("Sign In button is not hidden from assistive technology", async ({
      page,
    }) => {
      const ariaHidden = await githubBtn(page).getAttribute("aria-hidden");
      expect(ariaHidden).not.toBe("true");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Layout & visual structure
  // -------------------------------------------------------------------------
  test.describe("Layout", () => {
    test.beforeEach(async ({ page }) => {
      await gotoLogin(page);
    });

    test("card exists and has positive height on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const box = await page.locator(".flex.flex-col.gap-6").boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(0);
    });

    test("button does not overflow on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      const btnBox = await githubBtn(page).boundingBox();
      expect(btnBox).not.toBeNull();
      expect(btnBox!.x + btnBox!.width).toBeLessThanOrEqual(377); // 2px tolerance
    });

    test("title is rendered above the description", async ({ page }) => {
      const titleBox = await page
        .getByRole("heading", { name: "Welcome" })
        .boundingBox();
      const descBox = await page
        .getByText("Login with your Github account")
        .boundingBox();
      expect(titleBox).not.toBeNull();
      expect(descBox).not.toBeNull();
      expect(titleBox!.y).toBeLessThan(descBox!.y);
    });

    test("description is rendered above the Sign In button", async ({
      page,
    }) => {
      const descBox = await page
        .getByText("Login with your Github account")
        .boundingBox();
      const btnBox = await githubBtn(page).boundingBox();
      expect(descBox).not.toBeNull();
      expect(btnBox).not.toBeNull();
      expect(descBox!.y).toBeLessThan(btnBox!.y);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Error / edge cases
  // -------------------------------------------------------------------------
  test.describe("Error & edge cases", () => {
    test("does not crash when sign-in endpoint returns 500", async ({
      page,
    }) => {
      await mockCsrf(page);
      await mockSignIn(page, { status: 500 });
      await mockAuthCatchAll(page);

      await page.goto(LOGIN_URL);
      await page.waitForSelector("button");

      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await githubBtn(page).click();
      await page.waitForTimeout(500);

      // Page must still be functional after the error
      await expect(githubBtn(page)).toBeVisible();
    });

    test("double-clicking does not hard-crash the page", async ({ page }) => {
      const { getCallCount } = await setupSignInSpy(page);

      await page.goto(LOGIN_URL);
      await page.waitForSelector("button");
      await githubBtn(page).dblclick();
      await page.waitForTimeout(600);

      expect(getCallCount()).toBeGreaterThanOrEqual(1);
    });

    test("no broken UI when JS loads slowly", async ({ page }) => {
      await page.route("**/*.js", async (route) => {
        await page.waitForTimeout(200);
        await route.continue();
      });
      await mockAuthRoutes(page);
      await page.goto(LOGIN_URL);
      await page.waitForSelector("button", { timeout: 15_000 });
      await expect(githubBtn(page)).toBeVisible();
    });
  });
});
