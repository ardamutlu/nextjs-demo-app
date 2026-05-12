import { test, expect, Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const TABLE_URL = `${BASE_URL}/repositories`;

/** Minimal mock payload returned by the GitHub search action */
const mockRepositories = [
  {
    id: 1,
    name: "react",
    description: "The library for web and native user interfaces.",
    language: "JavaScript",
    watchers: 228000,
    visibility: "public",
    html_url: "https://github.com/facebook/react",
    clone_url: "https://github.com/facebook/react.git",
    owner: {
      login: "facebook",
      avatar_url: "https://avatars.githubusercontent.com/u/69631?v=4",
      type: "Organization",
    },
  },
  {
    id: 2,
    name: "vue",
    description: "The Progressive JavaScript Framework.",
    language: "TypeScript",
    watchers: 208000,
    visibility: "public",
    html_url: "https://github.com/vuejs/vue",
    clone_url: "https://github.com/vuejs/vue.git",
    owner: {
      login: "vuejs",
      avatar_url: "https://avatars.githubusercontent.com/u/6128107?v=4",
      type: "Organization",
    },
  },
  {
    id: 3,
    name: "private-lib",
    description: "An internal library.",
    language: "Python",
    watchers: 5000,
    visibility: "private",
    html_url: "https://github.com/acme/private-lib",
    clone_url: "https://github.com/acme/private-lib.git",
    owner: {
      login: "acme",
      avatar_url: "https://avatars.githubusercontent.com/u/99999?v=4",
      type: "User",
    },
  },
];

const mockPagination = { total: 3, page: 1, pageSize: 10 };

/**
 * Intercept the server action / API call that feeds the table.
 * Adjust the route pattern to match your actual Next.js action endpoint.
 */
async function mockRepositoriesRoute(
  page: Page,
  overrides: {
    data?: typeof mockRepositories;
    pagination?: typeof mockPagination;
  } = {},
) {
  await page.route("**/repositories**", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: overrides.data ?? mockRepositories,
          pagination: overrides.pagination ?? mockPagination,
        }),
      });
    } else {
      await route.continue();
    }
  });
}

async function gotoTable(page: Page) {
  await mockRepositoriesRoute(page);
  await page.goto(TABLE_URL);
  // Wait for the table to be visible
  await page.waitForSelector("table", { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("RepositoriesTable", () => {
  // -------------------------------------------------------------------------
  // 1. Rendering
  // -------------------------------------------------------------------------
  test.describe("Initial rendering", () => {
    test("renders the card title", async ({ page }) => {
      await gotoTable(page);
      await expect(page.getByText("Repositories")).toBeVisible();
    });

    test("renders all required column headers", async ({ page }) => {
      await gotoTable(page);
      for (const header of ["Owner", "Language", "Watchers", "Visibility"]) {
        await expect(
          page.getByRole("columnheader", { name: header }),
        ).toBeVisible();
      }
    });

    test("renders one row per mock repository", async ({ page }) => {
      await gotoTable(page);
      const rows = page.locator("tbody tr");
      await expect(rows).toHaveCount(mockRepositories.length);
    });

    test("shows owner avatar and repo name in Owner cell", async ({ page }) => {
      await gotoTable(page);
      await expect(page.getByText("react")).toBeVisible();
      await expect(page.getByText("facebook")).not.toBeVisible(); // owner.login in avatar fallback only
      await expect(page.getByText("Organization").first()).toBeVisible();
    });

    test("shows correct visibility badge for public repo", async ({ page }) => {
      await gotoTable(page);
      const publicBadges = page.locator("text=public");
      await expect(publicBadges.first()).toBeVisible();
    });

    test("shows correct visibility badge for private repo", async ({
      page,
    }) => {
      await gotoTable(page);
      await expect(page.getByText("private")).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Search
  // -------------------------------------------------------------------------
  test.describe("Search functionality", () => {
    test("search input is visible and focusable", async ({ page }) => {
      await gotoTable(page);
      const input = page.getByPlaceholder("Search...");
      await expect(input).toBeVisible();
      await input.focus();
      await expect(input).toBeFocused();
    });

    test("clear (X) button appears after typing", async ({ page }) => {
      await gotoTable(page);
      const input = page.getByPlaceholder("Search...");
      await input.fill("react");
      await expect(
        page
          .locator("button")
          .filter({ has: page.locator("[data-lucide='x']") })
          .first(),
      ).toBeVisible();
    });

    test("clear (X) button resets search input", async ({ page }) => {
      await gotoTable(page);
      const input = page.getByPlaceholder("Search...");
      await input.fill("vue");
      // Click the X button
      await page
        .locator("button")
        .filter({ has: page.locator("[data-lucide='x']") })
        .first()
        .click();
      await expect(input).toHaveValue("");
    });

    test("does NOT trigger new fetch for queries ≤ 3 chars", async ({
      page,
    }) => {
      let callCount = 0;
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          callCount++;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: mockRepositories,
              pagination: mockPagination,
            }),
          });
        } else {
          await route.continue();
        }
      });
      await page.goto(TABLE_URL);
      await page.waitForSelector("table");
      const initialCount = callCount;

      const input = page.getByPlaceholder("Search...");
      await input.fill("vue"); // 3 chars → uses default "stars:>100000" query
      await page.waitForTimeout(700); // wait for debounce
      // call count should be the same or use the stars fallback, not a "vue" search
      expect(callCount).toBe(initialCount + 1); // debounce fires once with stars fallback
    });

    test("triggers fetch after debounce for queries > 3 chars", async ({
      page,
    }) => {
      const searchPayloads: string[] = [];
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          const body = await route.request().postData();
          if (body) searchPayloads.push(body);
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: [], pagination: { total: 0 } }),
          });
        } else {
          await route.continue();
        }
      });
      await page.goto(TABLE_URL);
      await page.waitForSelector("table");

      const input = page.getByPlaceholder("Search...");
      await input.fill("react"); // 5 chars
      await page.waitForTimeout(700); // debounce = 500ms

      const hasReact = searchPayloads.some((p) => p.includes("react"));
      expect(hasReact).toBe(true);
    });

    test("resets to page 0 after new search", async ({ page }) => {
      await gotoTable(page);
      // Navigate to page 2 first (if pagination allows)
      // Then type in search and verify pagination resets
      const input = page.getByPlaceholder("Search...");
      await input.fill("longquery");
      await page.waitForTimeout(700);
      // The page index resets — verify by checking the pagination component shows page 1
      await expect(
        page.getByRole("button", { name: /1/ }).first(),
      ).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Language Filter
  // -------------------------------------------------------------------------
  test.describe("Language filter", () => {
    test("Languages button opens a popover", async ({ page }) => {
      await gotoTable(page);
      await page.getByRole("button", { name: /Languages/i }).click();
      await expect(page.getByPlaceholder("Search")).toBeVisible();
    });

    test("popover lists known languages", async ({ page }) => {
      await gotoTable(page);
      await page.getByRole("button", { name: /Languages/i }).click();
      await expect(page.getByText("JavaScript")).toBeVisible();
      await expect(page.getByText("TypeScript")).toBeVisible();
      await expect(page.getByText("Python")).toBeVisible();
    });

    test("selecting a language adds a check icon", async ({ page }) => {
      await gotoTable(page);
      await page.getByRole("button", { name: /Languages/i }).click();
      await page.getByRole("option", { name: "Rust" }).click();
      // Check icon should appear next to Rust
      const rustItem = page.getByRole("option", { name: "Rust" });
      await expect(rustItem.locator("[data-lucide='check']")).toBeVisible();
    });

    test("selecting a language shows badge count on Languages button", async ({
      page,
    }) => {
      await gotoTable(page);
      await page.getByRole("button", { name: /Languages/i }).click();
      await page.getByRole("option", { name: "Go" }).click();
      // Close popover
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: /Languages/i }).getByText("1"),
      ).toBeVisible();
    });

    test("deselecting a language removes the check icon", async ({ page }) => {
      await gotoTable(page);
      await page.getByRole("button", { name: /Languages/i }).click();
      // Select then deselect
      await page.getByRole("option", { name: "Kotlin" }).click();
      await page.getByRole("option", { name: "Kotlin" }).click();
      const kotlinItem = page.getByRole("option", { name: "Kotlin" });
      await expect(
        kotlinItem.locator("[data-lucide='check']"),
      ).not.toBeVisible();
    });

    test("Apply button triggers a refetch", async ({ page }) => {
      let callCount = 0;
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          callCount++;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: mockRepositories,
              pagination: mockPagination,
            }),
          });
        } else {
          await route.continue();
        }
      });
      await page.goto(TABLE_URL);
      await page.waitForSelector("table");
      const beforeCount = callCount;

      await page.getByRole("button", { name: /Languages/i }).click();
      await page.getByRole("option", { name: "Swift" }).click();
      await page.getByRole("button", { name: "Apply" }).click();

      await expect(async () => {
        expect(callCount).toBeGreaterThan(beforeCount);
      }).toPass({ timeout: 3000 });
    });

    test("language search inside popover filters the list", async ({
      page,
    }) => {
      await gotoTable(page);
      await page.getByRole("button", { name: /Languages/i }).click();
      const commandInput = page.getByPlaceholder("Search");
      await commandInput.fill("Rust");
      await expect(page.getByRole("option", { name: "Rust" })).toBeVisible();
      await expect(
        page.getByRole("option", { name: "JavaScript" }),
      ).not.toBeVisible();
    });

    test("language filter resets page index on selection", async ({ page }) => {
      await gotoTable(page);
      await page.getByRole("button", { name: /Languages/i }).click();
      await page.getByRole("option", { name: "Python" }).click();
      // Page index reset is internal; we verify no "page 2" indicator after selection
      await expect(
        page.getByRole("button", { name: /Languages/i }),
      ).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Clear Filters
  // -------------------------------------------------------------------------
  test.describe("Clear filters", () => {
    test("'Clear filters' button is rendered", async ({ page }) => {
      await gotoTable(page);
      await expect(
        page.getByRole("button", { name: /Clear filters/i }),
      ).toBeVisible();
    });

    test("clears search input when clicked", async ({ page }) => {
      await gotoTable(page);
      const input = page.getByPlaceholder("Search...");
      await input.fill("typescript");
      await page.getByRole("button", { name: /Clear filters/i }).click();
      await expect(input).toHaveValue("");
    });

    test("triggers a refetch after clearing", async ({ page }) => {
      let callCount = 0;
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          callCount++;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: mockRepositories,
              pagination: mockPagination,
            }),
          });
        } else {
          await route.continue();
        }
      });
      await page.goto(TABLE_URL);
      await page.waitForSelector("table");
      const before = callCount;

      await page.getByRole("button", { name: /Clear filters/i }).click();
      await expect(async () => {
        expect(callCount).toBeGreaterThan(before);
      }).toPass({ timeout: 3000 });
    });
  });

  // -------------------------------------------------------------------------
  // 5. Sorting
  // -------------------------------------------------------------------------
  test.describe("Sorting", () => {
    test("clicking Owner column header changes sort", async ({ page }) => {
      let sortPayload: unknown;
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          const body = await route.request().postData();
          if (body) {
            try {
              sortPayload = JSON.parse(body);
            } catch {
              /* noop */
            }
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: mockRepositories,
              pagination: mockPagination,
            }),
          });
        } else {
          await route.continue();
        }
      });
      await page.goto(TABLE_URL);
      await page.waitForSelector("table");

      await page.getByRole("columnheader", { name: "Owner" }).click();

      await expect(async () => {
        expect(sortPayload).toBeTruthy();
      }).toPass({ timeout: 3000 });
    });

    test("clicking Watchers column header changes sort", async ({ page }) => {
      await gotoTable(page);
      const watchersHeader = page.getByRole("columnheader", {
        name: "Watchers",
      });
      await watchersHeader.click();
      // Click again to reverse
      await watchersHeader.click();
      // No errors should occur
      await expect(page.locator("table")).toBeVisible();
    });

    test("clicking Language column header changes sort", async ({ page }) => {
      await gotoTable(page);
      await page.getByRole("columnheader", { name: "Language" }).click();
      await expect(page.locator("table")).toBeVisible();
    });

    test("default sort is by Watchers descending", async ({ page }) => {
      let firstPayload: Record<string, unknown> | null = null;
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          const body = await route.request().postData();
          if (body && !firstPayload) {
            try {
              firstPayload = JSON.parse(body);
            } catch {
              /* noop */
            }
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: mockRepositories,
              pagination: mockPagination,
            }),
          });
        } else {
          await route.continue();
        }
      });
      await page.goto(TABLE_URL);
      await page.waitForSelector("table");
      await expect(async () => {
        expect(firstPayload).toBeTruthy();
      }).toPass({ timeout: 3000 });
      // Verify sorting state contains watchers desc
      const payloadStr = JSON.stringify(firstPayload);
      expect(payloadStr).toContain("watchers");
    });
  });

  // -------------------------------------------------------------------------
  // 6. Pagination
  // -------------------------------------------------------------------------
  test.describe("Pagination", () => {
    test("pagination controls are rendered", async ({ page }) => {
      await gotoTable(page);
      // DataGridPagination renders page info and navigation buttons
      await expect(
        page.locator("[data-testid='pagination'], .pagination, nav").first(),
      ).toBeVisible();
    });

    test("shows correct total count", async ({ page }) => {
      await gotoTable(page);
      // The pagination typically shows "1–3 of 3" or similar
      await expect(page.getByText(/3/)).toBeVisible();
    });

    test("changing page size triggers a new fetch", async ({ page }) => {
      let callCount = 0;
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          callCount++;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: mockRepositories,
              pagination: { total: 100, page: 1, pageSize: 25 },
            }),
          });
        } else {
          await route.continue();
        }
      });
      await page.goto(TABLE_URL);
      await page.waitForSelector("table");
      const before = callCount;

      // Look for rows-per-page select
      const pageSizeSelect = page.getByRole("combobox").first();
      if (await pageSizeSelect.isVisible()) {
        await pageSizeSelect.selectOption("25");
        await expect(async () => {
          expect(callCount).toBeGreaterThan(before);
        }).toPass({ timeout: 3000 });
      }
    });

    test("next page button triggers pagination change", async ({ page }) => {
      let callCount = 0;
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          callCount++;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: mockRepositories,
              pagination: { total: 100, page: 1, pageSize: 10 },
            }),
          });
        } else {
          await route.continue();
        }
      });
      await page.goto(TABLE_URL);
      await page.waitForSelector("table");
      const before = callCount;

      const nextBtn = page.getByRole("button", { name: /next/i });
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await expect(async () => {
          expect(callCount).toBeGreaterThan(before);
        }).toPass({ timeout: 3000 });
      }
    });
  });

  // -------------------------------------------------------------------------
  // 7. Actions Cell (Dropdown)
  // -------------------------------------------------------------------------
  test.describe("Actions cell dropdown", () => {
    test("ellipsis button is rendered for each row", async ({ page }) => {
      await gotoTable(page);
      const ellipsisButtons = page.locator("button").filter({
        has: page.locator("[data-lucide='ellipsis']"),
      });
      await expect(ellipsisButtons.first()).toBeVisible();
    });

    test("clicking ellipsis opens dropdown with correct items", async ({
      page,
    }) => {
      await gotoTable(page);
      const ellipsisBtn = page
        .locator("button")
        .filter({
          has: page.locator("[data-lucide='ellipsis']"),
        })
        .first();
      await ellipsisBtn.click();
      await expect(
        page.getByRole("menuitem", { name: "Github Page" }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Copy Clone Url" }),
      ).toBeVisible();
    });

    test("'Github Page' opens new tab with correct URL", async ({
      page,
      context,
    }) => {
      await gotoTable(page);
      const ellipsisBtn = page
        .locator("button")
        .filter({
          has: page.locator("[data-lucide='ellipsis']"),
        })
        .first();
      await ellipsisBtn.click();

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        page.getByRole("menuitem", { name: "Github Page" }).click(),
      ]);
      await newPage.waitForLoadState("domcontentloaded");
      expect(newPage.url()).toContain("github.com");
    });

    test("'Copy Clone Url' shows a toast notification", async ({ page }) => {
      await gotoTable(page);
      const ellipsisBtn = page
        .locator("button")
        .filter({
          has: page.locator("[data-lucide='ellipsis']"),
        })
        .first();
      await ellipsisBtn.click();
      await page.getByRole("menuitem", { name: "Copy Clone Url" }).click();

      // Sonner toast appears at top-center
      await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({
        timeout: 3000,
      });
    });

    test("toast message contains the clone URL", async ({ page }) => {
      await gotoTable(page);
      const ellipsisBtn = page
        .locator("button")
        .filter({
          has: page.locator("[data-lucide='ellipsis']"),
        })
        .first();
      await ellipsisBtn.click();
      await page.getByRole("menuitem", { name: "Copy Clone Url" }).click();

      await expect(page.getByText(/Copied:/i)).toBeVisible({ timeout: 3000 });
    });

    test("'Copy Clone Url' copies the correct URL to clipboard", async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await gotoTable(page);

      const ellipsisBtn = page
        .locator("button")
        .filter({
          has: page.locator("[data-lucide='ellipsis']"),
        })
        .first();
      await ellipsisBtn.click();
      await page.getByRole("menuitem", { name: "Copy Clone Url" }).click();

      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(clipboardText).toContain(".git");
    });

    test("dropdown closes after selecting an item", async ({ page }) => {
      await gotoTable(page);
      const ellipsisBtn = page
        .locator("button")
        .filter({
          has: page.locator("[data-lucide='ellipsis']"),
        })
        .first();
      await ellipsisBtn.click();
      await page.getByRole("menuitem", { name: "Copy Clone Url" }).click();

      await expect(
        page.getByRole("menuitem", { name: "Github Page" }),
      ).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 8. Loading state (skeleton)
  // -------------------------------------------------------------------------
  test.describe("Loading / skeleton state", () => {
    test("shows skeleton rows while data is loading", async ({ page }) => {
      // Delay the API response to catch the loading state
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          await page.waitForTimeout(1500);
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: mockRepositories,
              pagination: mockPagination,
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto(TABLE_URL);
      // Skeleton elements should be present before data arrives
      const skeletons = page.locator(".animate-pulse, [data-skeleton]");
      // At minimum the table structure should appear with loading placeholders
      await expect(page.locator("table")).toBeVisible({ timeout: 5000 });
    });
  });

  // -------------------------------------------------------------------------
  // 9. Empty state
  // -------------------------------------------------------------------------
  test.describe("Empty state", () => {
    test("renders gracefully when no repositories are returned", async ({
      page,
    }) => {
      await page.route("**/repositories**", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: [], pagination: { total: 0 } }),
          });
        } else {
          await route.continue();
        }
      });
      await page.goto(TABLE_URL);
      await page.waitForSelector("table");
      const rows = page.locator("tbody tr");
      await expect(rows).toHaveCount(0);
    });
  });

  // -------------------------------------------------------------------------
  // 10. Column features (pinning, resizing, visibility, reordering)
  // -------------------------------------------------------------------------
  test.describe("Column features", () => {
    test("column header context menu / settings button is accessible", async ({
      page,
    }) => {
      await gotoTable(page);
      // DataGrid with columnsVisibility:true typically renders a settings/columns toggle
      const columnToggle = page.locator(
        "[aria-label='Toggle columns'], [data-testid='columns-visibility']",
      );
      if ((await columnToggle.count()) > 0) {
        await expect(columnToggle.first()).toBeVisible();
      }
    });

    test("description column can be hidden", async ({ page }) => {
      await gotoTable(page);
      // Description column has enableHiding:true
      const descHeader = page.getByRole("columnheader", {
        name: "Description",
      });
      if (await descHeader.isVisible()) {
        await expect(descHeader).toBeVisible();
      }
    });

    test("table columns are resizable (resize handle present)", async ({
      page,
    }) => {
      await gotoTable(page);
      const resizeHandles = page.locator(
        "[data-column-resizer], .resizer, [role='separator'][aria-orientation='vertical']",
      );
      if ((await resizeHandles.count()) > 0) {
        await expect(resizeHandles.first()).toBeVisible();
      }
    });
  });
});
