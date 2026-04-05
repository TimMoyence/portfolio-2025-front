# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Auth — Page de connexion >> login echoue affiche un message d'erreur
- Location: e2e/auth.spec.ts:65:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#auth-tab-log-in input[name="email"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
    - link "Passer au contenu principal" [ref=e3] [cursor=pointer]:
        - /url: "#main-content"
    - generic [ref=e4]:
        - navigation "Navigation principale" [ref=e5]:
            - generic [ref=e6]:
                - link "Asili Design" [ref=e8] [cursor=pointer]:
                    - /url: "#"
                    - img [ref=e9]
                    - paragraph [ref=e10]: Asili Design
                - generic [ref=e11]:
                    - list [ref=e12]:
                        - listitem [ref=e13]:
                            - link "Présentation" [ref=e14] [cursor=pointer]:
                                - /url: /presentation
                        - listitem [ref=e15]:
                            - link "Projets" [ref=e16] [cursor=pointer]:
                                - /url: /client-project
                        - listitem [ref=e17]:
                            - link "Offres" [ref=e18] [cursor=pointer]:
                                - /url: /offer
                    - button "L'Atelier" [ref=e20] [cursor=pointer]:
                        - generic [ref=e21]: L'Atelier
                        - img [ref=e22]:
                            - img [ref=e23]
                    - generic [ref=e25]:
                        - button "Audit" [ref=e26] [cursor=pointer]
                        - button "Contact" [ref=e27] [cursor=pointer]
                        - button "Espace utilisateur" [ref=e28] [cursor=pointer]:
                            - img [ref=e29]:
                                - img [ref=e30]
        - main [ref=e32]:
            - generic [ref=e34]:
                - generic [ref=e38]:
                    - paragraph [ref=e39]: Accès
                    - heading "Connexion ou inscription" [level=1] [ref=e40]
                    - paragraph [ref=e41]: Rejoignez votre espace sécurisé pour suivre vos projets et vos échanges.
                - generic [ref=e46]:
                    - tablist [ref=e47]:
                        - tab "S'inscrire" [ref=e48] [cursor=pointer]:
                            - generic [ref=e49]: S'inscrire
                        - tab "Connexion" [active] [selected] [ref=e50] [cursor=pointer]:
                            - generic [ref=e51]: Connexion
                    - tabpanel "Connexion" [ref=e52]:
                        - generic [ref=e53]:
                            - heading "Se connecter" [level=2] [ref=e54]
                            - paragraph [ref=e55]: Votre espace de croissance commence
                        - generic [ref=e56]:
                            - generic [ref=e57]:
                                - textbox "Email" [ref=e58]:
                                    - /placeholder: " "
                                - generic: Email
                            - generic [ref=e59]:
                                - textbox "Mot de passe" [ref=e60]:
                                    - /placeholder: " "
                                - generic: Mot de passe
                            - generic [ref=e61]:
                                - button "Log in" [ref=e62] [cursor=pointer]:
                                    - generic [ref=e63]: Log in
                                - paragraph [ref=e64]:
                                    - link "Mot de passe oublié ?" [ref=e65] [cursor=pointer]:
                                        - /url: /forgot-password
                                - button "Connectez-vous avec Google" [ref=e66] [cursor=pointer]:
                                    - img [ref=e67]:
                                        - img [ref=e68]
                                    - paragraph [ref=e73]: Connectez-vous avec Google
                - region "Parler de votre situation" [ref=e75]:
                    - generic [ref=e76]:
                        - generic "Contact information" [ref=e77]:
                            - paragraph [ref=e78]: Contact
                            - heading "Parler de votre situation" [level=3] [ref=e79]
                            - paragraph [ref=e80]: Vous avez un besoin, une contrainte ou une idée à clarifier ?
                            - paragraph [ref=e81]: Un premier échange permet de comprendre votre contexte et de définir la suite la plus pertinente.
                        - generic "Contact methods" [ref=e82]:
                            - generic [ref=e83]:
                                - generic [ref=e84]:
                                    - img [ref=e86]:
                                        - img [ref=e87]
                                    - generic [ref=e89]:
                                        - heading "Email" [level=3] [ref=e90]
                                        - 'link "Email: moyencet@gmail.com" [ref=e91] [cursor=pointer]':
                                            - /url: mailto:moyencet@gmail.com
                                            - text: moyencet@gmail.com
                                - generic [ref=e92]:
                                    - img [ref=e94]:
                                        - img [ref=e95]
                                    - generic [ref=e97]:
                                        - heading "Téléphone" [level=3] [ref=e98]
                                        - 'link "Téléphone: +33 6 98 50 32 82" [ref=e99] [cursor=pointer]':
                                            - /url: tel:+33698503282
                                            - text: +33 6 98 50 32 82
                                - generic [ref=e100]:
                                    - img [ref=e102]:
                                        - img [ref=e103]
                                    - generic [ref=e105]:
                                        - heading "Bureau" [level=3] [ref=e106]
                                        - 'link "Bureau: Bordeaux, 33100, France" [ref=e107] [cursor=pointer]':
                                            - /url: https://www.google.com/maps/place/Allée+Serr,+33100+Bordeaux,+France/@44.8353083,-0.5750133,17z/data=!3m1!4b1!4m6!3m5!1s0xd5527dace2f6b7f:0x8c6f3e3f8a4f4e2!8m2!3d44.8353042!4d-0.5728246!16s%2Fg%2F11c52_5y9r
                                            - text: Bordeaux, 33100, France
        - generic [ref=e110]:
            - paragraph [ref=e111]:
                - text: Nous utilisons des cookies essentiels pour faire fonctionner le site et mémoriser vos choix. Aucun cookie analytique ou marketing n’est activé sans votre accord.
                - link "Paramètres des cookies" [ref=e112] [cursor=pointer]:
                    - /url: /cookie-settings
            - generic [ref=e113]:
                - button "Essentiels uniquement" [ref=e114] [cursor=pointer]
                - button "Tout accepter" [ref=e115] [cursor=pointer]
```

# Test source

```ts
  1   | /**
  2   |  * Tests E2E du flux d'authentification (login / register).
  3   |  *
  4   |  * Toutes les requetes API sont interceptees via page.route()
  5   |  * pour fonctionner SANS backend reel.
  6   |  */
  7   | import { test, expect } from "@playwright/test";
  8   | import { API_BASE, MOCK_SESSION, MOCK_USER } from "./fixtures";
  9   |
  10  | test.describe("Auth — Page de connexion", () => {
  11  |   test("la page login affiche le formulaire avec email et mot de passe", async ({
  12  |     page,
  13  |   }) => {
  14  |     await page.goto("/login");
  15  |
  16  |     // Le composant AuthComponent demarre sur l'onglet "sign-up" par defaut.
  17  |     // On clique sur l'onglet "Connexion" pour afficher le formulaire de login.
  18  |     const loginTab = page.locator("#auth-trigger-log-in");
  19  |     await expect(loginTab).toBeVisible();
  20  |     await loginTab.click();
  21  |
  22  |     // Verification que les champs du formulaire login sont presents
  23  |     const emailInput = page.locator('#auth-tab-log-in input[name="email"]');
  24  |     const passwordInput = page.locator(
  25  |       '#auth-tab-log-in input[name="password"]',
  26  |     );
  27  |     await expect(emailInput).toBeVisible();
  28  |     await expect(passwordInput).toBeVisible();
  29  |
  30  |     // Le bouton de soumission doit etre present
  31  |     const submitButton = page.locator('#auth-tab-log-in button[type="submit"]');
  32  |     await expect(submitButton).toBeVisible();
  33  |   });
  34  |
  35  |   test("login reussi redirige vers la page d'accueil", async ({ page }) => {
  36  |     // Mock de l'endpoint POST /auth/login
  37  |     await page.route(`${API_BASE}/auth/login`, async (route) => {
  38  |       await route.fulfill({
  39  |         status: 200,
  40  |         contentType: "application/json",
  41  |         body: JSON.stringify(MOCK_SESSION),
  42  |       });
  43  |     });
  44  |
  45  |     await page.goto("/login");
  46  |
  47  |     // Basculer vers l'onglet connexion
  48  |     await page.locator("#auth-trigger-log-in").click();
  49  |
  50  |     // Remplir le formulaire
  51  |     await page
  52  |       .locator('#auth-tab-log-in input[name="email"]')
  53  |       .fill("test@test.com");
  54  |     await page
  55  |       .locator('#auth-tab-log-in input[name="password"]')
  56  |       .fill("password123");
  57  |
  58  |     // Soumettre
  59  |     await page.locator('#auth-tab-log-in button[type="submit"]').click();
  60  |
  61  |     // Apres un login reussi, le composant redirige vers "/"
  62  |     await expect(page).toHaveURL("/");
  63  |   });
  64  |
  65  |   test("login echoue affiche un message d'erreur", async ({ page }) => {
  66  |     // Mock de l'endpoint POST /auth/login qui retourne une erreur 401
  67  |     await page.route(`${API_BASE}/auth/login`, async (route) => {
  68  |       await route.fulfill({
  69  |         status: 401,
  70  |         contentType: "application/json",
  71  |         body: JSON.stringify({
  72  |           message: "Identifiants invalides",
  73  |           statusCode: 401,
  74  |         }),
  75  |       });
  76  |     });
  77  |
  78  |     await page.goto("/login");
  79  |
  80  |     // Basculer vers l'onglet connexion
  81  |     await page.locator("#auth-trigger-log-in").click();
  82  |
  83  |     // Remplir le formulaire avec des identifiants incorrects
  84  |     await page
  85  |       .locator('#auth-tab-log-in input[name="email"]')
> 86  |       .fill("wrong@test.com");
      |        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  87  |     await page
  88  |       .locator('#auth-tab-log-in input[name="password"]')
  89  |       .fill("wrongpassword");
  90  |
  91  |     // Soumettre
  92  |     await page.locator('#auth-tab-log-in button[type="submit"]').click();
  93  |
  94  |     // Le message d'erreur doit s'afficher dans le panneau login
  95  |     const errorMessage = page.locator("#auth-tab-log-in .text-red-500");
  96  |     await expect(errorMessage).toBeVisible();
  97  |   });
  98  | });
  99  |
  100 | test.describe("Auth — Page d'inscription", () => {
  101 |   test("la page register affiche le formulaire avec tous les champs", async ({
  102 |     page,
  103 |   }) => {
  104 |     await page.goto("/register");
  105 |
  106 |     // Le composant AuthComponent affiche l'onglet "sign-up" par defaut
  107 |     // quand on navigue vers /register (ou /login d'ailleurs).
  108 |     // Verifions que le panneau inscription est visible.
  109 |     const signupPanel = page.locator("#auth-tab-sign-up");
  110 |     await expect(signupPanel).toBeVisible();
  111 |
  112 |     // Verification des champs du formulaire d'inscription
  113 |     const firstNameInput = page.locator(
  114 |       '#auth-tab-sign-up input[name="firstName"]',
  115 |     );
  116 |     const lastNameInput = page.locator(
  117 |       '#auth-tab-sign-up input[name="lastName"]',
  118 |     );
  119 |     const emailInput = page.locator('#auth-tab-sign-up input[name="email"]');
  120 |     const passwordInput = page.locator(
  121 |       '#auth-tab-sign-up input[name="password"]',
  122 |     );
  123 |     const verifPasswordInput = page.locator(
  124 |       '#auth-tab-sign-up input[name="verifPassword"]',
  125 |     );
  126 |
  127 |     await expect(firstNameInput).toBeVisible();
  128 |     await expect(lastNameInput).toBeVisible();
  129 |     await expect(emailInput).toBeVisible();
  130 |     await expect(passwordInput).toBeVisible();
  131 |     await expect(verifPasswordInput).toBeVisible();
  132 |
  133 |     // Le bouton de soumission doit etre present
  134 |     const submitButton = page.locator(
  135 |       '#auth-tab-sign-up button[type="submit"]',
  136 |     );
  137 |     await expect(submitButton).toBeVisible();
  138 |   });
  139 | });
  140 |
  141 | test.describe("Auth — Navigation login / register", () => {
  142 |   test("les onglets permettent de basculer entre inscription et connexion", async ({
  143 |     page,
  144 |   }) => {
  145 |     await page.goto("/login");
  146 |
  147 |     // Par defaut, l'onglet inscription est actif
  148 |     const signupTab = page.locator("#auth-trigger-sign-up");
  149 |     const loginTab = page.locator("#auth-trigger-log-in");
  150 |
  151 |     await expect(signupTab).toHaveAttribute("data-state", "active");
  152 |     await expect(loginTab).toHaveAttribute("data-state", "inactive");
  153 |
  154 |     // Cliquer sur l'onglet connexion
  155 |     await loginTab.click();
  156 |     await expect(loginTab).toHaveAttribute("data-state", "active");
  157 |     await expect(signupTab).toHaveAttribute("data-state", "inactive");
  158 |
  159 |     // Le panneau login doit etre visible
  160 |     await expect(page.locator("#auth-tab-log-in")).toBeVisible();
  161 |
  162 |     // Cliquer sur l'onglet inscription pour revenir
  163 |     await signupTab.click();
  164 |     await expect(signupTab).toHaveAttribute("data-state", "active");
  165 |     await expect(page.locator("#auth-tab-sign-up")).toBeVisible();
  166 |   });
  167 |
  168 |   test('le lien "Mot de passe oublie" mene vers /forgot-password', async ({
  169 |     page,
  170 |   }) => {
  171 |     await page.goto("/login");
  172 |
  173 |     // Basculer vers l'onglet connexion pour voir le lien
  174 |     await page.locator("#auth-trigger-log-in").click();
  175 |
  176 |     const forgotLink = page.locator(
  177 |       '#auth-tab-log-in a[href="/forgot-password"]',
  178 |     );
  179 |     await expect(forgotLink).toBeVisible();
  180 |     await forgotLink.click();
  181 |
  182 |     await expect(page).toHaveURL("/forgot-password");
  183 |   });
  184 | });
  185 |
```
