import { test, expect } from '@playwright/test';

test.describe('AutoCheck Brasil E2E Tests', () => {
  test('should load homepage and perform plate search', async ({ page }) => {
    await page.goto('/');
    
    // Check title / branding
    await expect(page.locator('text=AutoCheck Brasil')).toBeVisible();

    // Type plate JIX7B91 in search input
    const input = page.locator('input[placeholder*="ABC"]');
    await input.fill('JIX7B91');

    // Click search button
    const searchBtn = page.locator('button:has-text("Consultar")');
    await searchBtn.click();

    // Verify it navigates to preview/report view
    await expect(page.locator('text=Consulta Veicular Consolidada')).toBeVisible({ timeout: 10000 });
  });

  test('should open admin panel and check api status', async ({ page }) => {
    await page.goto('/');
    
    // Click admin access button
    const adminBtn = page.locator('button:has-text("Painel Admin")');
    await adminBtn.click();

    // Verify admin panel loaded
    await expect(page.locator('text=Painel de Controle e Auditoria')).toBeVisible();

    // Click API status tab
    const apiTab = page.locator('button:has-text("Status & Logs de APIs")');
    await apiTab.click();

    // Verify API endpoints are listed
    await expect(page.locator('text=BrasilAPI (FIPE & CEP & CNPJ)')).toBeVisible();
  });
});
