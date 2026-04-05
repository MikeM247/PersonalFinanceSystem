import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  const response = await request.post("/__test__/reset");
  expect(response.ok()).toBeTruthy();
});

test("redirects unauthenticated access to login with next path", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard&reason=unauthenticated$/);
  await expect(page.getByTestId("login-message")).toHaveText("Please sign in to continue.");
});

test("shows a generic error for invalid credentials", async ({ page, request }) => {
  const credentials = await (await request.get("/__test__/owner-credentials")).json();

  await page.goto("/login?next=%2Fdashboard");
  await page.getByTestId("email-input").fill(credentials.email);
  await page.getByTestId("password-input").fill("wrong-password");
  await page.getByTestId("submit-button").click();

  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  await expect(page.getByTestId("login-message")).toHaveText("Invalid email or password.");
});

test("allows login and restores the protected session after reload", async ({ page, request }) => {
  const credentials = await (await request.get("/__test__/owner-credentials")).json();

  await page.goto("/login?next=%2Fdashboard");
  await page.getByTestId("email-input").fill(credentials.email);
  await page.getByTestId("password-input").fill(credentials.password);
  await page.getByTestId("submit-button").click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("protected-content")).toBeVisible();
  await expect(page.getByTestId("session-user")).toHaveText("Signed in as owner@example.com");

  await page.reload();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("protected-content")).toBeVisible();
  await expect(page.getByTestId("session-user")).toHaveText("Signed in as owner@example.com");
});

test("supports logout and returns the user to login", async ({ page, request }) => {
  const credentials = await (await request.get("/__test__/owner-credentials")).json();

  await page.goto("/login?next=%2Fdashboard");
  await page.getByTestId("email-input").fill(credentials.email);
  await page.getByTestId("password-input").fill(credentials.password);
  await page.getByTestId("submit-button").click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByTestId("logout-button").click();

  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard&reason=logged_out$/);
  await expect(page.getByTestId("login-message")).toHaveText("You have been signed out.");
});

test("redirects expired sessions back to login with recovery messaging", async ({ page, request }) => {
  const credentials = await (await request.get("/__test__/owner-credentials")).json();

  await page.goto("/login?next=%2Fdashboard");
  await page.getByTestId("email-input").fill(credentials.email);
  await page.getByTestId("password-input").fill(credentials.password);
  await page.getByTestId("submit-button").click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const expireResponse = await request.post("/__test__/time", {
    data: { iso: "2026-04-05T18:30:00.000Z" },
  });
  expect(expireResponse.ok()).toBeTruthy();

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard&reason=expired$/);
  await expect(page.getByTestId("login-message")).toHaveText("Your session has expired. Please sign in again.");
});
