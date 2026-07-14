import { test, expect } from '@playwright/test';

test.describe('Flux Fintech Client-Portal E2E', () => {
  test('devrait permettre de s\'inscrire, se connecter, consulter le dashboard et faire un dépôt avec polling', async ({ page }) => {
    let balanceTotal = 15000;
    let txStatus: 'EN_COURS' | 'SUCCES' = 'EN_COURS';
    let pendingTxCreated = false;

    // Intercepter les appels API Backend et renvoyer des mocks
    await page.route('**/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-uuid-1',
          email: 'test@baou.ci',
          firstName: 'Jean',
          lastName: 'Koffi',
          phone: '+2250701020304',
          role: 'CLIENT',
          kycStatus: 'EN_ATTENTE_VALIDATION',
        }),
      });
    });

    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'fake-jwt-token',
          user: {
            id: 'user-uuid-1',
            email: 'test@baou.ci',
            firstName: 'Jean',
            lastName: 'Koffi',
            phone: '+2250701020304',
            role: 'CLIENT',
            kycStatus: 'EN_ATTENTE_VALIDATION',
          },
        }),
      });
    });

    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-uuid-1',
          email: 'test@baou.ci',
          firstName: 'Jean',
          lastName: 'Koffi',
          phone: '+2250701020304',
          role: 'CLIENT',
          kycStatus: 'EN_ATTENTE_VALIDATION',
        }),
      });
    });

    await page.route('**/wallets/cash', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balanceTotal,
          balanceFrozen: 0.0,
          currency: 'XOF',
        }),
      });
    });

    await page.route('**/wallets/securities', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/market/stocks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { code: 'SNTS', name: 'SONATEL Sénégal', price: 15000, change: 1.2, open: 14800, high: 15100, low: 14750, volumeShares: 1000, volumeXof: 15000000 },
          { code: 'CIEC', name: 'CIE Côte d\'Ivoire', price: 5000, change: -0.5, open: 5050, high: 5100, low: 4980, volumeShares: 500, volumeXof: 2500000 }
        ]),
      });
    });

    await page.route('**/market/sgis', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['SGI de Test']),
      });
    });

    await page.route('**/wallets/transactions', async (route) => {
      const txs = pendingTxCreated ? [
        {
          idInternal: 'tx-1234',
          waveSessionId: 'tx-1234',
          amount: 5000,
          type: 'DEPOT',
          status: txStatus,
          createdAt: new Date().toISOString(),
        }
      ] : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(txs),
      });
    });

    await page.route('**/wave/deposit', async (route) => {
      pendingTxCreated = true;
      setTimeout(() => {
        balanceTotal = 20000;
        txStatus = 'SUCCES';
      }, 1000);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          idInternal: 'tx-1234',
          waveSessionId: 'tx-1234',
          status: 'PENDING',
        }),
      });
    });

    await page.route('**/orders/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/orders', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'order-1', status: 'EN_ATTENTE' }),
      });
    });

    // 1. Accéder à l'application
    await page.goto('/');

    // 2. Aller sur la page d'inscription en passant par l'espace investisseur
    await page.click('text=Commencer à investir');
    await page.click('text=Créez votre dossier KYC ici');
    await expect(page).toHaveURL(/\/register/);

    // Remplir le formulaire d'inscription
    await page.fill('#firstName', 'Jean');
    await page.fill('#lastName', 'Koffi');
    await page.fill('#email', 'test@baou.ci');
    await page.fill('#password', 'SecurePassword123!');
    await page.fill('#confirmPassword', 'SecurePassword123!');

    // Simuler l'upload des pièces justificatives
    const file1 = { name: 'cni.pdf', mimeType: 'application/pdf', buffer: Buffer.from('fake cni') };
    const file2 = { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake photo') };
    const file3 = { name: 'facture.pdf', mimeType: 'application/pdf', buffer: Buffer.from('fake doc') };
    await page.locator('input[type="file"]').nth(0).setInputFiles(file1);
    await page.locator('input[type="file"]').nth(1).setInputFiles(file2);
    await page.locator('input[type="file"]').nth(2).setInputFiles(file3);

    // Mock de l'alerte d'inscription réussie
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Inscription réussie');
      await dialog.accept();
    });

    await page.click('#registerBtn');
    await expect(page).toHaveURL(/\//); // Doit revenir à la racine (login)

    // 3. Ouvrir à nouveau l'espace investisseur pour se connecter
    await page.click('text=Commencer à investir');
    await page.fill('#phoneOrEmail', 'test@baou.ci');
    await page.fill('#password', 'SecurePassword123!');
    await page.click('#loginBtn');

    // Devrait arriver sur le Dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('#balanceDisplay')).toHaveText('15,000');

    // 4. Lancer un dépôt Mobile Money
    await page.click('#depositBtn');
    
    // Remplir le formulaire de dépôt
    await page.fill('input[type="number"]', '5000');
    await page.selectOption('select', 'ORANGE_CI');
    await page.fill('input[placeholder="2250700000000"]', '+2250701020304');

    // Intercepter la confirmation de la transaction finale
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('confirmée');
      await dialog.accept();
    });

    await page.click('#confirmDepositBtn');

    // Devrait afficher la bannière de validation en cours (polling)
    await expect(page.locator('text=Validation Mobile Money en cours...')).toBeVisible();

    // Attendre que le polling termine et mette à jour le solde
    await expect(page.locator('#balanceDisplay')).toHaveText('20,000');
    await expect(page.locator('text=Validation Mobile Money en cours...')).not.toBeVisible();
  });
});
