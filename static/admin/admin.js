// La Pastaiola admin panel. Edits content/*.json in the GitHub repository; GitHub Actions rebuilds the site.
// No server and no third-party code: the browser talks only to api.github.com with the admin's own token.
"use strict";
(() => {
  const REPO = { owner: "Ismagulovne", repo: "lapastaiola-site", branch: "main" };
  const SITE = "https://lapastaiola.co";
  const FILES = { settings: "content/settings.json", catalog: "content/catalog.json", pages: "content/pages.json", strings: "content/strings.json" };
  const LANG_NAMES = { en: "English", it: "Italiano", es: "Español", ru: "Русский" };
  const UI_LANGS = ["en", "ru"];

  // ---------------------------------------------------------------- interface texts (EN / RU)
  const I18N = {
    en: {
      admin: "Admin", signin: "Sign in", signout: "Sign out", token: "GitHub access token", remember: "Remember me on this device",
      signin_hint: "The admin panel saves your changes straight to the website's GitHub repository. Sign in with a personal access token of a GitHub account that can edit the repository.",
      token_help_title: "How to get a token (once, about 2 minutes)",
      token_help: [
        "Sign in to github.com with an account that has write access to the repository <b>Ismagulovne/lapastaiola-site</b>.",
        "Open <a href=\"https://github.com/settings/personal-access-tokens/new\" target=\"_blank\" rel=\"noopener\">Settings → Developer settings → Fine-grained tokens → Generate new token</a>.",
        "Repository access: <b>Only select repositories</b> → <b>lapastaiola-site</b>. Permissions: <b>Contents: Read and write</b>, <b>Actions: Read-only</b>.",
        "If the repository belongs to someone else's account, create a <a href=\"https://github.com/settings/tokens/new?scopes=repo&description=La%20Pastaiola%20admin\" target=\"_blank\" rel=\"noopener\">classic token</a> with the <b>repo</b> scope instead.",
        "Set an expiry date, generate the token, copy it and paste it here. Treat it like a password."
      ],
      token_where: "The token is kept only in this browser and sent only to GitHub.",
      checking: "Checking access…", bad_token: "GitHub did not accept this token.", no_push: "This account can view the repository but cannot edit it. Ask the owner for write access.",
      loading: "Loading content…", load_failed: "Could not load the content from GitHub.",
      nav_overview: "Overview", nav_business: "Business info", nav_products: "Products", nav_collections: "Collections", nav_pages: "Page texts", nav_strings: "Interface texts", nav_help: "Help",
      unsaved: "Unsaved changes", no_changes: "No unsaved changes", publish: "Save and publish", discard: "Discard changes", discard_confirm: "Discard all unsaved changes?",
      saving: "Saving to GitHub…", saved_building: "Saved. The website is being rebuilt…", live: "Published. The website is updated.", build_failed: "Saved, but the website build failed. Open the build log on GitHub.",
      build_slow: "Saved. The rebuild is taking longer than usual; check again in a minute.", save_failed: "Saving failed", conflict: "Someone else published changes to the content in the meantime. Copy anything important, then reload the page to get the latest version.",
      view_log: "Build log", view_site: "Open website", leave_warning: "You have unsaved changes.",
      editing_lang: "Editing language", missing: "missing translations", english_original: "English",
      yes: "Yes", no: "No", cancel: "Cancel", delete: "Delete", delete_q: "Delete for good?", back: "Back to list", add: "Add", search: "Search", open: "Open",
      overview_title: "Welcome", overview_text: "Change texts, products, prices, photos and opening hours here. Edits are kept in this browser until you press <b>Save and publish</b>; the website then updates in about a minute.",
      translations: "Translations", all_translated: "Everything is translated.", recent: "Recent changes", site_links: "Website",
      biz_title: "Business info", biz_hint: "Shown in the header, footer, contact page and Google listings.",
      f_name: "Business name", f_legal: "Legal name (footer)", f_email: "Email", f_phone: "Phone", f_street: "Street address", f_city: "City", f_state: "State", f_zip: "ZIP code",
      f_instagram: "Instagram link", f_facebook: "Facebook link", f_announcement: "Announcement bar (top of every page)", hours: "Opening hours", closed: "Closed", opens: "Opens", closes: "Closes",
      days: { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" },
      products_title: "Products", products_hint: "Click a product to edit it. Hidden products stay saved but do not appear on the website.",
      new_product: "New product", new_product_name: "Product name (English)", create: "Create", hidden: "Hidden", no_photo: "No photo", variants_n: "options",
      p_name: "Name", p_price: "Price, USD", p_price_hint: "Used when the product has no options.", p_desc: "Description", p_photo: "Photo", p_photo_hint: "JPEG or PNG. It is resized to 1200 px automatically.",
      p_upload: "Upload photo", p_variants: "Options (e.g. ravioli fillings)", p_variants_hint: "Leave empty for a single-price product. Option names follow the editing language above.",
      p_add_variant: "Add option", p_option: "Option name", p_collections: "Shown in collections", p_hidden: "Hide from the website", p_link: "Page address", p_link_hint: "Set when the product is created; it cannot be changed later.",
      exists: "A product with this address already exists.", bad_name: "Enter a name first.",
      collections_title: "Collections", collections_hint: "Collections group products on the Shop page. Use the arrows to change the order of products.",
      c_title: "Name", c_desc: "Description", c_show: "Show on the Shop page", c_products: "Products in this collection", c_add_product: "Add a product…", up: "Move up", down: "Move down", remove: "Remove",
      pages_title: "Page texts", pages_hint: "Texts of each page. Fields marked “Google” are what search engines show.",
      page_names: { home: "Home page", shop: "Shop", contact: "Contact & ordering", about: "About us", our_shop: "Our shop", classes: "Pasta classes", catering: "Catering", meal_kits: "Meal kits", not_found: "Page not found (404)" },
      strings_title: "Interface texts", strings_hint: "Buttons, menu items and small labels used on every page, in all languages at once.",
      help_title: "Help",
      help: [
        "<b>How publishing works.</b> Your edits stay in this browser until you press <b>Save and publish</b>. The changes are then saved to GitHub and the website rebuilds itself in about a minute. Every save is kept in the history, so nothing is lost.",
        "<b>Languages.</b> The website is in English, Italian and Spanish. Use the language tabs above a form to edit each version. If a translation is empty, the website shows the English text.",
        "<b>Photos.</b> Square photos look best in the shop grid. Large photos are resized automatically.",
        "<b>Rich text.</b> Use the toolbar for bold, italic, headings and lists. Pasted text is inserted without formatting.",
        "<b>Two people editing at once.</b> If someone else publishes while you are editing, the panel will warn you instead of overwriting their work.",
        "<b>Security.</b> Sign out on shared computers. If a token leaks, delete it on GitHub (Settings → Developer settings) and create a new one."
      ],
      ui_language: "Interface language", preview: "View on website", copy_en: "Copy English text"
    },
    ru: {
      admin: "Админка", signin: "Войти", signout: "Выйти", token: "Токен доступа GitHub", remember: "Запомнить на этом устройстве",
      signin_hint: "Админка сохраняет изменения прямо в репозиторий сайта на GitHub. Войдите с персональным токеном GitHub-аккаунта, у которого есть права на редактирование репозитория.",
      token_help_title: "Как получить токен (один раз, около 2 минут)",
      token_help: [
        "Войдите на github.com под аккаунтом с правом записи в репозиторий <b>Ismagulovne/lapastaiola-site</b>.",
        "Откройте <a href=\"https://github.com/settings/personal-access-tokens/new\" target=\"_blank\" rel=\"noopener\">Settings → Developer settings → Fine-grained tokens → Generate new token</a>.",
        "Repository access: <b>Only select repositories</b> → <b>lapastaiola-site</b>. Permissions: <b>Contents: Read and write</b>, <b>Actions: Read-only</b>.",
        "Если репозиторий принадлежит чужому аккаунту, создайте вместо этого <a href=\"https://github.com/settings/tokens/new?scopes=repo&description=La%20Pastaiola%20admin\" target=\"_blank\" rel=\"noopener\">классический токен</a> с правом <b>repo</b>.",
        "Укажите срок действия, создайте токен, скопируйте и вставьте сюда. Храните его как пароль."
      ],
      token_where: "Токен хранится только в этом браузере и отправляется только в GitHub.",
      checking: "Проверяю доступ…", bad_token: "GitHub не принял этот токен.", no_push: "Этот аккаунт видит репозиторий, но не может его менять. Попросите владельца дать права на запись.",
      loading: "Загружаю контент…", load_failed: "Не удалось загрузить контент из GitHub.",
      nav_overview: "Обзор", nav_business: "О бизнесе", nav_products: "Товары", nav_collections: "Коллекции", nav_pages: "Тексты страниц", nav_strings: "Надписи интерфейса", nav_help: "Справка",
      unsaved: "Есть несохранённые изменения", no_changes: "Несохранённых изменений нет", publish: "Сохранить и опубликовать", discard: "Отменить изменения", discard_confirm: "Отменить все несохранённые изменения?",
      saving: "Сохраняю в GitHub…", saved_building: "Сохранено. Сайт пересобирается…", live: "Опубликовано. Сайт обновлён.", build_failed: "Сохранено, но сборка сайта не удалась. Откройте журнал сборки на GitHub.",
      build_slow: "Сохранено. Сборка идёт дольше обычного, проверьте через минуту.", save_failed: "Не удалось сохранить", conflict: "Пока вы редактировали, кто-то другой опубликовал изменения. Скопируйте важное и перезагрузите страницу, чтобы получить свежую версию.",
      view_log: "Журнал сборки", view_site: "Открыть сайт", leave_warning: "Есть несохранённые изменения.",
      editing_lang: "Язык редактирования", missing: "нет перевода", english_original: "Английский",
      yes: "Да", no: "Нет", cancel: "Отмена", delete: "Удалить", delete_q: "Удалить насовсем?", back: "К списку", add: "Добавить", search: "Поиск", open: "Открыть",
      overview_title: "Добро пожаловать", overview_text: "Здесь меняются тексты, товары, цены, фото и часы работы. Правки хранятся в этом браузере, пока вы не нажмёте <b>Сохранить и опубликовать</b>; после этого сайт обновится примерно за минуту.",
      translations: "Переводы", all_translated: "Всё переведено.", recent: "Последние изменения", site_links: "Сайт",
      biz_title: "О бизнесе", biz_hint: "Показывается в шапке, подвале, на странице контактов и в Google.",
      f_name: "Название", f_legal: "Юридическое название (в подвале)", f_email: "Email", f_phone: "Телефон", f_street: "Адрес", f_city: "Город", f_state: "Штат", f_zip: "Индекс",
      f_instagram: "Ссылка на Instagram", f_facebook: "Ссылка на Facebook", f_announcement: "Строка объявления (вверху каждой страницы)", hours: "Часы работы", closed: "Выходной", opens: "Открытие", closes: "Закрытие",
      days: { mon: "Понедельник", tue: "Вторник", wed: "Среда", thu: "Четверг", fri: "Пятница", sat: "Суббота", sun: "Воскресенье" },
      products_title: "Товары", products_hint: "Нажмите на товар, чтобы его изменить. Скрытые товары сохраняются, но не показываются на сайте.",
      new_product: "Новый товар", new_product_name: "Название товара (по-английски)", create: "Создать", hidden: "Скрыт", no_photo: "Нет фото", variants_n: "вариантов",
      p_name: "Название", p_price: "Цена, USD", p_price_hint: "Используется, если у товара нет вариантов.", p_desc: "Описание", p_photo: "Фото", p_photo_hint: "JPEG или PNG. Размер автоматически уменьшается до 1200 px.",
      p_upload: "Загрузить фото", p_variants: "Варианты (например, начинки равиоли)", p_variants_hint: "Оставьте пустым, если у товара одна цена. Названия вариантов — на выбранном выше языке.",
      p_add_variant: "Добавить вариант", p_option: "Название варианта", p_collections: "Показывать в коллекциях", p_hidden: "Скрыть с сайта", p_link: "Адрес страницы", p_link_hint: "Задаётся при создании товара, потом не меняется.",
      exists: "Товар с таким адресом уже есть.", bad_name: "Сначала введите название.",
      collections_title: "Коллекции", collections_hint: "Коллекции группируют товары на странице магазина. Стрелками меняется порядок товаров.",
      c_title: "Название", c_desc: "Описание", c_show: "Показывать на странице магазина", c_products: "Товары в коллекции", c_add_product: "Добавить товар…", up: "Выше", down: "Ниже", remove: "Убрать",
      pages_title: "Тексты страниц", pages_hint: "Тексты каждой страницы. Поля с пометкой «Google» показываются в поисковиках.",
      page_names: { home: "Главная", shop: "Магазин", contact: "Контакты и заказ", about: "О нас", our_shop: "Наш магазин", classes: "Мастер-классы", catering: "Кейтеринг", meal_kits: "Наборы-ужины", not_found: "Страница не найдена (404)" },
      strings_title: "Надписи интерфейса", strings_hint: "Кнопки, пункты меню и мелкие подписи на всех страницах, сразу на всех языках.",
      help_title: "Справка",
      help: [
        "<b>Как работает публикация.</b> Правки хранятся в этом браузере, пока вы не нажмёте <b>Сохранить и опубликовать</b>. Тогда изменения сохраняются в GitHub, и сайт пересобирается примерно за минуту. Каждое сохранение остаётся в истории, ничего не теряется.",
        "<b>Языки.</b> Сайт на английском, итальянском и испанском. Вкладками языков над формой переключается редактируемая версия. Если перевод пустой, сайт показывает английский текст.",
        "<b>Фото.</b> В сетке магазина лучше смотрятся квадратные фото. Большие фото уменьшаются автоматически.",
        "<b>Форматированный текст.</b> Панель над полем: жирный, курсив, заголовок, списки. Вставленный текст вставляется без оформления.",
        "<b>Если редактируют двое.</b> Если кто-то опубликует изменения, пока вы редактируете, админка предупредит и не перезапишет чужую работу.",
        "<b>Безопасность.</b> На чужих компьютерах нажимайте «Выйти». Если токен утёк, удалите его на GitHub (Settings → Developer settings) и создайте новый."
      ],
      ui_language: "Язык интерфейса", preview: "Посмотреть на сайте", copy_en: "Скопировать английский текст"
    }
  };
  const FIELD = {
    en: { title: ["Page title", "Google · browser tab"], description: ["Short description", "Google · up to about 160 characters"], heading: ["Heading"], lead: ["Intro paragraph"],
      text: ["Text"], body_html: ["Main text"], button: ["Button"], form_title: ["Form heading"], form_subject: ["Email subject from the form"],
      email_subject: ["Booking email subject"], email_body: ["Booking email template"], price_line: ["Line after the price"], kids_title: ["Kids section heading"], kids_html: ["Kids section text"],
      hero_title: ["Big heading on the photo"], hero_button: ["Photo button 1"], hero_button_2: ["Photo button 2"], products_title: ["Products heading"], shop_all: ["“Shop all” button"],
      story_title: ["Story heading"], story_html: ["Story text"], story_button: ["Story button"], classes_title: ["Classes card heading"], classes_text: ["Classes card text"],
      catering_title: ["Catering card heading"], catering_text: ["Catering card text"], mealkits_title: ["Meal kits card heading"], mealkits_text: ["Meal kits card text"], visit_title: ["Visit us heading"],
      review_1: ["Review 1"], review_1_author: ["Review 1 author"], review_2: ["Review 2"], review_2_author: ["Review 2 author"], review_3: ["Review 3"], review_3_author: ["Review 3 author"] },
    ru: { title: ["Заголовок страницы", "Google · вкладка браузера"], description: ["Краткое описание", "Google · до ~160 символов"], heading: ["Заголовок"], lead: ["Вводный абзац"],
      text: ["Текст"], body_html: ["Основной текст"], button: ["Кнопка"], form_title: ["Заголовок формы"], form_subject: ["Тема письма из формы"],
      email_subject: ["Тема письма для записи"], email_body: ["Шаблон письма для записи"], price_line: ["Строка после цены"], kids_title: ["Заголовок блока для детей"], kids_html: ["Текст блока для детей"],
      hero_title: ["Большой заголовок на фото"], hero_button: ["Кнопка на фото 1"], hero_button_2: ["Кнопка на фото 2"], products_title: ["Заголовок блока товаров"], shop_all: ["Кнопка «Все товары»"],
      story_title: ["Заголовок «Наша история»"], story_html: ["Текст «Наша история»"], story_button: ["Кнопка «Наша история»"], classes_title: ["Карточка классов: заголовок"], classes_text: ["Карточка классов: текст"],
      catering_title: ["Карточка кейтеринга: заголовок"], catering_text: ["Карточка кейтеринга: текст"], mealkits_title: ["Карточка наборов: заголовок"], mealkits_text: ["Карточка наборов: текст"], visit_title: ["Заголовок «Приходите к нам»"],
      review_1: ["Отзыв 1"], review_1_author: ["Автор отзыва 1"], review_2: ["Отзыв 2"], review_2_author: ["Автор отзыва 2"], review_3: ["Отзыв 3"], review_3_author: ["Автор отзыва 3"] }
  };
  const PAGE_PATHS = { home: "/", shop: "/collections/all/", contact: "/pages/contact-us/", about: "/pages/about-us/", our_shop: "/pages/our-shop/", classes: "/pages/book-master-class-1/", catering: "/pages/caterings-1/", meal_kits: "/pages/meal-kits/", not_found: "/404.html" };

  // ---------------------------------------------------------------- state
  const store = (() => { try { return window.localStorage; } catch { return null; } })();
  const sess = (() => { try { return window.sessionStorage; } catch { return null; } })();
  const get = k => { try { return sess?.getItem(k) ?? store?.getItem(k); } catch { return null; } };
  const S = {
    ui: get("lp-admin-ui") || ((navigator.language || "").toLowerCase().startsWith("ru") ? "ru" : "en"),
    token: get("lp-admin-token"), user: null, data: null, orig: {}, head: null, images: new Map(),
    langs: ["en"], clang: "en", view: { section: "overview", id: null }, status: { kind: "", text: "", link: "" }, busy: false
  };
  const T = (k) => { const v = I18N[S.ui][k]; return v === undefined ? I18N.en[k] ?? k : v; };

  // ---------------------------------------------------------------- DOM helpers
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue;
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "html") el.innerHTML = v;
      else if (k === "value") el.value = v;
      else if (k === "checked") el.checked = !!v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const app = () => document.getElementById("app");
  const isLoc = v => v && typeof v === "object" && !Array.isArray(v) && "en" in v;
  const humanize = k => k.replace(/_html$/, "").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
  const plain = html => { const d = document.createElement("div"); d.innerHTML = html || ""; return d.textContent.trim(); };

  // ---------------------------------------------------------------- GitHub API
  async function gh(path, opts = {}) {
    const res = await fetch(`https://api.github.com${path}`, {
      ...opts,
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: `Bearer ${S.token}`, ...(opts.body ? { "Content-Type": "application/json" } : {}) }
    });
    if (!res.ok) { const e = new Error(`GitHub ${res.status}`); e.status = res.status; try { e.detail = (await res.json()).message; } catch {} throw e; }
    return res.status === 204 ? null : res.json();
  }
  const R = `/repos/${REPO.owner}/${REPO.repo}`;
  const b64ToText = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), c => c.charCodeAt(0)));

  async function loadAll() {
    const ref = await gh(`${R}/git/ref/heads/${REPO.branch}`);
    S.head = ref.object.sha;
    const data = {};
    await Promise.all(Object.entries(FILES).map(async ([k, path]) => {
      const f = await gh(`${R}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${S.head}`);
      const text = b64ToText(f.content);
      data[k] = JSON.parse(text);
      S.orig[k] = JSON.stringify(data[k]);
    }));
    S.data = data;
    S.langs = data.settings.languages?.length ? data.settings.languages : ["en"];
    if (!S.langs.includes(S.clang)) S.clang = "en";
    S.images.clear();
  }
  const changedFiles = () => S.data ? Object.keys(FILES).filter(k => JSON.stringify(S.data[k]) !== S.orig[k]) : [];
  const dirty = () => changedFiles().length > 0 || S.images.size > 0;

  async function publish() {
    if (!dirty() || S.busy) return;
    S.busy = true; setStatus("busy", T("saving")); renderSaveBar();
    try {
      const ref = await gh(`${R}/git/ref/heads/${REPO.branch}`);
      const head = ref.object.sha;
      if (head !== S.head) {
        const cmp = await gh(`${R}/compare/${S.head}...${head}`);
        if ((cmp.files || []).some(f => f.filename.startsWith("content/") || f.filename.startsWith("static/img/p/"))) throw Object.assign(new Error("conflict"), { conflict: true });
      }
      const commit = await gh(`${R}/git/commits/${head}`);
      const tree = [];
      for (const k of changedFiles()) {
        const blob = await gh(`${R}/git/blobs`, { method: "POST", body: JSON.stringify({ content: JSON.stringify(S.data[k], null, 2) + "\n", encoding: "utf-8" }) });
        tree.push({ path: FILES[k], mode: "100644", type: "blob", sha: blob.sha });
      }
      for (const [path, img] of S.images) {
        const blob = await gh(`${R}/git/blobs`, { method: "POST", body: JSON.stringify({ content: img.base64, encoding: "base64" }) });
        tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      }
      const newTree = await gh(`${R}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
      const parts = [...changedFiles().map(k => k), ...(S.images.size ? ["photos"] : [])];
      const msg = `Admin: update ${parts.join(", ")}${S.user ? ` (by ${S.user})` : ""}`;
      const newCommit = await gh(`${R}/git/commits`, { method: "POST", body: JSON.stringify({ message: msg, tree: newTree.sha, parents: [head] }) });
      await gh(`${R}/git/refs/heads/${REPO.branch}`, { method: "PATCH", body: JSON.stringify({ sha: newCommit.sha }) });
      S.head = newCommit.sha;
      for (const k of Object.keys(FILES)) S.orig[k] = JSON.stringify(S.data[k]);
      S.images.clear();
      setStatus("busy", T("saved_building"));
      watchBuild(newCommit.sha);
    } catch (e) {
      setStatus("err", e.conflict ? T("conflict") : `${T("save_failed")}: ${e.detail || e.message}`);
    } finally { S.busy = false; renderSaveBar(); }
  }

  async function watchBuild(sha) {
    const started = Date.now();
    while (Date.now() - started < 6 * 60 * 1000) {
      await new Promise(r => setTimeout(r, 6000));
      try {
        const runs = await gh(`${R}/actions/runs?head_sha=${sha}&per_page=1`);
        const run = runs.workflow_runs?.[0];
        if (run?.status === "completed") {
          if (run.conclusion === "success") setStatus("ok", T("live"), SITE);
          else setStatus("err", T("build_failed"), run.html_url);
          renderSaveBar(); return;
        }
        if (run) S.status.link = run.html_url;
      } catch { /* token may lack Actions:read; keep waiting quietly */ }
      renderSaveBar();
    }
    setStatus("busy", T("build_slow"), `https://github.com/${REPO.owner}/${REPO.repo}/actions`); renderSaveBar();
  }

  function setStatus(kind, text, link = "") { S.status = { kind, text, link }; }

  // ---------------------------------------------------------------- sanitizing rich text
  const ALLOWED = { P: "p", BR: "br", STRONG: "strong", B: "strong", EM: "em", I: "em", UL: "ul", OL: "ol", LI: "li", H3: "h3", H2: "h3", H4: "h3", DIV: "p" };
  function sanitize(html) {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    const walk = node => {
      let out = "";
      for (const n of node.childNodes) {
        if (n.nodeType === 3) out += n.textContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        else if (n.nodeType === 1) {
          const tag = ALLOWED[n.tagName];
          if (tag === "br") out += "<br>";
          else if (tag) out += `<${tag}>${walk(n)}</${tag}>`;
          else if (!["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(n.tagName)) out += walk(n);
        }
      }
      return out;
    };
    return walk(doc.body).replace(/<p>(\s|<br>)*<\/p>/g, "").replace(/ /g, " ").trim();
  }

  // ---------------------------------------------------------------- field widgets
  function changed() { renderSaveBar(); renderSideCounts(); }

  function textInput(value, onChange, { type = "text", multiline = false, rows = 3, placeholder = "" } = {}) {
    const el = multiline ? h("textarea", { rows, placeholder }) : h("input", { type, placeholder });
    el.value = value ?? "";
    el.addEventListener("input", () => { onChange(type === "number" ? (el.value === "" ? 0 : Number(el.value)) : el.value); changed(); });
    return el;
  }

  function richText(value, onChange) {
    const area = h("div", { class: "rt-area", contenteditable: "true", role: "textbox", "aria-multiline": "true" });
    area.innerHTML = sanitize(value || "");
    const cmd = (c, arg) => { area.focus(); document.execCommand(c, false, arg); onChange(sanitize(area.innerHTML)); changed(); };
    const btn = (label, title, fn) => h("button", { type: "button", title, "aria-label": title, onclick: fn }, label);
    area.addEventListener("input", () => { onChange(sanitize(area.innerHTML)); changed(); });
    area.addEventListener("paste", e => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); });
    return h("div", { class: "rt" },
      h("div", { class: "rt-bar" },
        btn(h("b", {}, "B"), "Bold", () => cmd("bold")), btn(h("i", {}, "I"), "Italic", () => cmd("italic")),
        btn("H", "Heading", () => cmd("formatBlock", "h3")), btn("¶", "Paragraph", () => cmd("formatBlock", "p")),
        btn("•", "Bulleted list", () => cmd("insertUnorderedList")), btn("1.", "Numbered list", () => cmd("insertOrderedList")),
        btn("⨯", "Clear formatting", () => cmd("removeFormat"))),
      area);
  }

  // A localized field ({en, it, es}) shown in the current editing language, with the English original as a hint.
  function locField(obj, key, { label, hint, kind } = {}) {
    if (!obj[key] || typeof obj[key] !== "object") obj[key] = { en: obj[key] || "" };
    const val = obj[key];
    const k = kind || (key.endsWith("_html") ? "rich" : (/(body|text|lead|description)$/.test(key) || (val.en || "").length > 80 ? "area" : "line"));
    const set = v => { val[S.clang] = v; };
    const cur = val[S.clang] ?? "";
    const control = k === "rich" ? richText(cur, set) : textInput(cur, set, { multiline: k === "area", rows: (val.en || "").split("\n").length > 2 ? 8 : 3 });
    const extra = [];
    if (S.clang !== "en" && val.en) {
      extra.push(h("div", { class: "orig" }, h("b", {}, `${T("english_original")}: `), k === "rich" ? plain(val.en) : val.en, " ",
        h("button", { type: "button", class: "link", onclick: () => { val[S.clang] = val.en; renderMain(); changed(); } }, T("copy_en"))));
    }
    return h("div", { class: "field" }, h("label", {}, label || humanize(key), S.clang !== "en" && !cur && val.en ? h("span", { class: "badge warn" }, T("missing")) : null),
      control, hint ? h("small", {}, hint) : null, extra);
  }

  function countMissing(obj, lang) {
    if (!obj || typeof obj !== "object") return 0;
    if (isLoc(obj)) return obj.en && !obj[lang] ? 1 : 0;
    return Object.values(obj).reduce((n, v) => n + countMissing(v, lang), 0);
  }

  function langTabs(record) {
    return h("div", { class: "toolbar-sticky" },
      h("span", { class: "hint", style: "margin:0" }, `${T("editing_lang")}:`),
      h("div", { class: "ltabs", role: "group", "aria-label": T("editing_lang") },
        S.langs.map(l => h("button", { type: "button", "aria-pressed": String(S.clang === l), onclick: () => { S.clang = l; renderMain(); } },
          `${l.toUpperCase()} · ${LANG_NAMES[l] || l}`, record && l !== "en" && countMissing(record, l) ? h("span", { class: "dot", title: T("missing") }) : null))));
  }

  // ---------------------------------------------------------------- globe switcher (interface language)
  const GLOBE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8c2.6 2.6 3.9 5.6 3.9 9.2s-1.3 6.6-3.9 9.2M12 2.8C9.4 5.4 8.1 8.4 8.1 12s1.3 6.6 3.9 9.2"/></svg>';
  function uiLangSwitch(onLight = false) {
    const list = h("ul", { hidden: true }, UI_LANGS.map(l => h("li", {}, h("button", { type: "button", "aria-current": l === S.ui ? "true" : false, onclick: () => {
      S.ui = l; try { store?.setItem("lp-admin-ui", l); } catch {} document.documentElement.lang = l; render(); } }, h("b", {}, l.toUpperCase()), LANG_NAMES[l]))));
    const btn = h("button", { type: "button", "aria-haspopup": "true", "aria-expanded": "false", title: T("ui_language"), "aria-label": T("ui_language"), html: `${GLOBE}<span>${S.ui.toUpperCase()}</span>` });
    const wrap = h("div", { class: `ui-lang${onLight ? " on-light" : ""}` }, btn, list);
    const closeList = () => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", e => {
      e.stopPropagation(); list.hidden = !list.hidden; btn.setAttribute("aria-expanded", String(!list.hidden));
      if (!list.hidden) setTimeout(() => document.addEventListener("click", closeList, { once: true }), 0);
    });
    wrap.addEventListener("keydown", e => { if (e.key === "Escape") closeList(); });
    return wrap;
  }

  // ---------------------------------------------------------------- screens
  function render() {
    document.documentElement.lang = S.ui;
    document.title = `La Pastaiola · ${T("admin")}`;
    if (!S.token || !S.data) return renderLogin();
    const a = app(); a.textContent = "";
    a.append(
      h("header", { class: "topbar" },
        h("img", { src: "../img/logo.png", alt: "" }),
        h("span", { class: "title" }, `La Pastaiola · ${T("admin")}`),
        h("a", { href: SITE, target: "_blank", rel: "noopener" }, T("view_site")),
        h("span", { class: "user" }, S.user || ""),
        uiLangSwitch(),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: signOut }, T("signout"))),
      h("div", { class: "shell" }, h("nav", { class: "side", id: "side", "aria-label": T("admin") }), h("main", { class: "main", id: "main" })),
      h("div", { class: "savebar", id: "savebar" }));
    renderSide(); renderMain(); renderSaveBar();
  }

  const SECTIONS = ["overview", "business", "products", "collections", "pages", "strings", "help"];
  function renderSide() {
    const side = document.getElementById("side"); if (!side) return;
    side.textContent = "";
    for (const s of SECTIONS) side.append(h("button", { type: "button", "aria-current": S.view.section === s ? "page" : false, onclick: () => { S.view = { section: s, id: null }; renderSide(); renderMain(); window.scrollTo(0, 0); } },
      T(`nav_${s}`), h("span", { class: "count", "data-count": s, hidden: true })));
    renderSideCounts();
  }
  function renderSideCounts() {
    if (!S.data) return;
    const miss = obj => S.langs.filter(l => l !== "en").reduce((n, l) => n + countMissing(obj, l), 0);
    const counts = { business: miss(S.data.settings), products: miss(S.data.catalog.products), collections: miss(S.data.catalog.collections), pages: miss(S.data.pages), strings: miss(S.data.strings) };
    document.querySelectorAll("[data-count]").forEach(el => { const n = counts[el.dataset.count]; el.hidden = !n; el.textContent = n || ""; el.title = T("missing"); });
  }

  function renderSaveBar() {
    const bar = document.getElementById("savebar"); if (!bar) return;
    bar.textContent = "";
    const d = dirty();
    const st = S.status.text ? h("span", { class: `status ${S.status.kind}` }, S.status.text, S.status.link ? [" ", h("a", { href: S.status.link, target: "_blank", rel: "noopener" }, S.status.kind === "ok" ? T("view_site") : T("view_log"))] : null)
      : h("span", { class: "status" }, d ? T("unsaved") : T("no_changes"));
    if (d && !S.busy && S.status.kind === "ok") S.status = { kind: "", text: "", link: "" };
    bar.append(st,
      h("button", { type: "button", class: "btn btn-outline", disabled: !d || S.busy, onclick: () => {
        if (!confirmInline(bar, T("discard_confirm"), () => { for (const k of Object.keys(FILES)) S.data[k] = JSON.parse(S.orig[k]); S.images.clear(); setStatus("", ""); render(); })) return; } }, T("discard")),
      h("button", { type: "button", class: "btn", disabled: !d || S.busy, onclick: publish }, T("publish")));
  }

  // Inline confirmation (the browser's confirm() may be blocked).
  function confirmInline(container, question, onYes) {
    const box = h("span", { class: "confirm" }, question, " ",
      h("button", { type: "button", class: "btn btn-danger btn-sm", onclick: () => { box.remove(); onYes(); } }, T("yes")),
      h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => box.remove() }, T("no")));
    container.prepend(box);
    return false;
  }

  function renderMain() {
    const main = document.getElementById("main"); if (!main) return;
    main.textContent = "";
    const v = S.view.section;
    main.append(...[].concat(
      v === "overview" ? viewOverview() : v === "business" ? viewBusiness() : v === "products" ? (S.view.id ? viewProduct(S.view.id) : viewProducts())
        : v === "collections" ? (S.view.id ? viewCollection(S.view.id) : viewCollections()) : v === "pages" ? (S.view.id ? viewPage(S.view.id) : viewPages())
        : v === "strings" ? viewStrings() : viewHelp()));
  }

  // Overview
  function viewOverview() {
    const D = S.data;
    const rows = S.langs.filter(l => l !== "en").map(l => {
      const n = countMissing(D.settings, l) + countMissing(D.catalog, l) + countMissing(D.pages, l) + countMissing(D.strings, l);
      return h("li", {}, `${LANG_NAMES[l]}: `, n ? h("span", { class: "badge warn" }, `${n} ${T("missing")}`) : h("span", { class: "badge" }, "✓"));
    });
    const recent = h("ul", { class: "order-list" }, h("li", {}, "…"));
    gh(`${R}/commits?path=content&per_page=6&sha=${REPO.branch}`).then(list => {
      recent.textContent = "";
      for (const c of list) recent.append(h("li", {}, h("span", {}, c.commit.message.split("\n")[0]), h("small", {}, new Date(c.commit.author.date).toLocaleString(S.ui === "ru" ? "ru-RU" : "en-US"))));
    }).catch(() => { recent.textContent = ""; });
    return [
      h("div", { class: "card" }, h("h1", {}, T("overview_title")), h("p", { html: T("overview_text") })),
      h("div", { class: "row" },
        h("div", { class: "card" }, h("h2", {}, T("site_links")), h("ul", { class: "order-list" },
          S.langs.map(l => h("li", {}, h("span", {}, LANG_NAMES[l]), h("a", { href: `${SITE}${l === "en" ? "" : "/" + l}/`, target: "_blank", rel: "noopener" }, T("open")))))),
        h("div", { class: "card" }, h("h2", {}, T("translations")), h("ul", { class: "order-list" }, rows))),
      h("div", { class: "card" }, h("h2", {}, T("recent")), recent)
    ];
  }

  // Business info
  function viewBusiness() {
    const s = S.data.settings;
    const f = (key, label, type = "text") => h("div", { class: "field" }, h("label", {}, T(label)), textInput(s[key], v => { s[key] = v; }, { type }));
    const days = T("days");
    return [
      h("h1", {}, T("biz_title")), h("p", { class: "hint" }, T("biz_hint")),
      h("div", { class: "card" },
        h("div", { class: "row" }, f("name", "f_name"), f("legal_name", "f_legal")),
        h("div", { class: "row" }, f("email", "f_email", "email"), f("phone", "f_phone", "tel")),
        h("div", { class: "row" }, f("street", "f_street"), f("city", "f_city"), f("state", "f_state"), f("zip", "f_zip")),
        h("div", { class: "row" }, f("instagram", "f_instagram", "url"), f("facebook", "f_facebook", "url"))),
      h("div", { class: "card" }, h("h2", {}, T("hours")),
        h("div", { class: "hours-row hint" }, h("span", {}, ""), h("span", {}, T("closed")), h("span", {}, T("opens")), h("span", {}, T("closes"))),
        s.hours.map(d => {
          const open = textInput(d.open, v => { d.open = v; }, { type: "time" }), close = textInput(d.close, v => { d.close = v; }, { type: "time" });
          open.disabled = close.disabled = d.closed;
          const cb = h("input", { type: "checkbox", checked: d.closed, onchange: e => { d.closed = e.target.checked; open.disabled = close.disabled = d.closed; changed(); } });
          return h("div", { class: "hours-row field", style: "margin:0 0 6px" }, h("b", {}, days[d.day] || d.day), h("label", { class: "check" }, cb, T("closed")), open, close);
        })),
      h("div", { class: "card" }, langTabs(s.announcement), locField(s, "announcement", { label: T("f_announcement"), kind: "line" }))
    ];
  }

  // Products
  const thumbSrc = p => { const staged = [...S.images.entries()].find(([path]) => path.endsWith(`/p/${p.image}`)); return staged ? staged[1].url : (p.image ? `../img/p/${p.image}` : "../img/logo.png"); };
  const priceText = p => p.variants?.length ? `$${Math.min(...p.variants.map(v => +v.price)).toFixed(2)}+ · ${p.variants.length} ${T("variants_n")}` : `$${Number(p.price).toFixed(2)}`;
  function viewProducts() {
    const list = h("div", { class: "plist" });
    const search = h("input", { type: "search", placeholder: T("search"), "aria-label": T("search") });
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      list.textContent = "";
      for (const p of S.data.catalog.products.filter(p => !q || JSON.stringify(p.title).toLowerCase().includes(q) || p.handle.includes(q))) {
        list.append(h("button", { type: "button", class: "pitem", onclick: () => { S.view.id = p.handle; renderMain(); window.scrollTo(0, 0); } },
          h("img", { src: thumbSrc(p), alt: "", loading: "lazy" }),
          h("span", {}, h("b", {}, p.title.en || p.handle), p.hidden ? h("span", { class: "badge off" }, T("hidden")) : null,
            S.langs.some(l => l !== "en" && countMissing(p, l)) ? h("span", { class: "badge warn" }, T("missing")) : null,
            h("div", { class: "meta" }, priceText(p))),
          h("span", { "aria-hidden": "true" }, "›")));
      }
    };
    search.addEventListener("input", draw); draw();
    const name = h("input", { type: "text", placeholder: T("new_product_name"), "aria-label": T("new_product_name") });
    const err = h("span", { class: "error" });
    const create = () => {
      const title = name.value.trim(); if (!title) { err.textContent = T("bad_name"); return; }
      const handle = title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!handle || S.data.catalog.products.some(p => p.handle === handle)) { err.textContent = T("exists"); return; }
      const blank = () => Object.fromEntries(S.langs.map(l => [l, ""]));
      S.data.catalog.products.unshift({ handle, title: { ...blank(), en: title }, price: 0, variants: [], description_html: blank(), image: "", hidden: true });
      S.view.id = handle; changed(); renderMain();
    };
    return [h("h1", {}, T("products_title")), h("p", { class: "hint" }, T("products_hint")),
      h("div", { class: "card toolbar" }, h("div", { class: "field" }, name), h("button", { type: "button", class: "btn", onclick: create }, T("new_product")), err),
      h("div", { class: "toolbar" }, h("div", { class: "field" }, search)), list];
  }

  async function resizeImage(file) {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.86));
    const base64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
    return { base64, url: URL.createObjectURL(blob) };
  }

  function viewProduct(handle) {
    const cat = S.data.catalog, p = cat.products.find(x => x.handle === handle);
    if (!p) { S.view.id = null; return viewProducts(); }
    p.variants = p.variants || [];
    const thumb = h("img", { class: "thumb", src: thumbSrc(p), alt: "" });
    const file = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", hidden: true, onchange: async e => {
      const f = e.target.files[0]; if (!f) return;
      const r = await resizeImage(f);
      const name = `${p.handle}-${Date.now().toString(36)}.jpg`;
      for (const k of [...S.images.keys()]) if (k.includes(`/p/${p.handle}-`)) S.images.delete(k);
      S.images.set(`static/img/p/${name}`, r); p.image = name; thumb.src = r.url; changed();
    } });
    const variantsBox = h("div", {});
    const drawVariants = () => {
      variantsBox.textContent = "";
      p.variants.forEach((v, i) => {
        if (!isLoc(v.name)) v.name = { en: v.name || "" };
        variantsBox.append(h("div", { class: "vrow" },
          textInput(v.name[S.clang] ?? "", val => { v.name[S.clang] = val; }, { placeholder: S.clang !== "en" ? (v.name.en || T("p_option")) : T("p_option") }),
          textInput(v.price, val => { v.price = val; }, { type: "number" }),
          h("button", { type: "button", class: "btn btn-outline btn-sm", title: T("remove"), onclick: () => { p.variants.splice(i, 1); changed(); drawVariants(); } }, "✕")));
      });
      variantsBox.append(h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => { p.variants.push({ name: { en: "" }, price: p.price || 0 }); changed(); drawVariants(); } }, `+ ${T("p_add_variant")}`));
    };
    drawVariants();
    const colsBox = h("div", {}, cat.collections.map(c => h("label", { class: "check", style: "margin-right:16px" },
      h("input", { type: "checkbox", checked: c.products.includes(p.handle), onchange: e => {
        if (e.target.checked) { if (!c.products.includes(p.handle)) c.products.push(p.handle); } else c.products = c.products.filter(x => x !== p.handle);
        changed(); } }), c.title.en)));
    const del = h("div", { class: "actions" });
    del.append(h("button", { type: "button", class: "btn btn-danger btn-sm", onclick: () => confirmInline(del, T("delete_q"), () => {
      cat.products = cat.products.filter(x => x !== p); for (const c of cat.collections) c.products = c.products.filter(x => x !== p.handle);
      S.view.id = null; changed(); renderMain(); }) }, T("delete")));
    return [
      h("p", {}, h("button", { type: "button", class: "link", onclick: () => { S.view.id = null; renderMain(); } }, `‹ ${T("back")}`)),
      h("h1", {}, p.title.en || p.handle),
      langTabs(p),
      h("div", { class: "split2" },
        h("div", {},
          h("div", { class: "card" }, locField(p, "title", { label: T("p_name"), kind: "line" }), locField(p, "description_html", { label: T("p_desc"), kind: "rich" })),
          h("div", { class: "card" }, h("h2", {}, T("p_variants")), h("p", { class: "hint" }, T("p_variants_hint")), variantsBox)),
        h("div", {},
          h("div", { class: "card" }, h("div", { class: "label" }, h("b", {}, T("p_photo"))), thumb, h("p", { class: "hint" }, T("p_photo_hint")),
            h("button", { type: "button", class: "btn btn-outline", onclick: () => file.click() }, T("p_upload")), file),
          h("div", { class: "card" },
            h("div", { class: "field" }, h("label", {}, T("p_price")), textInput(p.price, v => { p.price = v; }, { type: "number" }), h("small", {}, T("p_price_hint"))),
            h("div", { class: "field" }, h("label", { class: "check" }, h("input", { type: "checkbox", checked: p.hidden, onchange: e => { p.hidden = e.target.checked; changed(); } }), T("p_hidden"))),
            h("div", { class: "field" }, h("div", { class: "label" }, h("b", {}, T("p_collections"))), colsBox),
            h("div", { class: "field" }, h("div", { class: "label" }, h("b", {}, T("p_link"))),
              h("a", { href: `${SITE}/products/${p.handle}/`, target: "_blank", rel: "noopener" }, `/products/${p.handle}/`), h("small", {}, T("p_link_hint")))),
          h("div", { class: "card" }, del)))
    ];
  }

  // Collections
  function viewCollections() {
    return [h("h1", {}, T("collections_title")), h("p", { class: "hint" }, T("collections_hint")),
      h("div", { class: "plist" }, S.data.catalog.collections.map(c => h("button", { type: "button", class: "pitem", style: "grid-template-columns:1fr auto", onclick: () => { S.view.id = c.handle; renderMain(); } },
        h("span", {}, h("b", {}, c.title.en), c.show_in_shop ? null : h("span", { class: "badge" }, T("hidden")),
          S.langs.some(l => l !== "en" && countMissing(c, l)) ? h("span", { class: "badge warn" }, T("missing")) : null, h("div", { class: "meta" }, `${c.products.length} · /collections/${c.handle}/`)),
        h("span", { "aria-hidden": "true" }, "›"))))];
  }
  function viewCollection(handle) {
    const cat = S.data.catalog, c = cat.collections.find(x => x.handle === handle);
    if (!c) { S.view.id = null; return viewCollections(); }
    const listBox = h("div", {});
    const draw = () => {
      listBox.textContent = "";
      const ol = h("ol", { class: "order-list" });
      c.products.forEach((ph, i) => {
        const p = cat.products.find(x => x.handle === ph);
        ol.append(h("li", {}, h("span", {}, p ? p.title.en : ph),
          h("button", { type: "button", class: "btn btn-outline btn-sm", title: T("up"), disabled: i === 0, onclick: () => { [c.products[i - 1], c.products[i]] = [c.products[i], c.products[i - 1]]; changed(); draw(); } }, "↑"),
          h("button", { type: "button", class: "btn btn-outline btn-sm", title: T("down"), disabled: i === c.products.length - 1, onclick: () => { [c.products[i + 1], c.products[i]] = [c.products[i], c.products[i + 1]]; changed(); draw(); } }, "↓"),
          h("button", { type: "button", class: "btn btn-outline btn-sm", title: T("remove"), onclick: () => { c.products.splice(i, 1); changed(); draw(); } }, "✕")));
      });
      const sel = h("select", { "aria-label": T("c_add_product"), onchange: e => { if (e.target.value) { c.products.push(e.target.value); changed(); draw(); } } },
        h("option", { value: "" }, T("c_add_product")), cat.products.filter(p => !c.products.includes(p.handle)).map(p => h("option", { value: p.handle }, p.title.en)));
      listBox.append(ol, h("div", { class: "field" }, sel));
    };
    draw();
    return [
      h("p", {}, h("button", { type: "button", class: "link", onclick: () => { S.view.id = null; renderMain(); } }, `‹ ${T("back")}`)),
      h("h1", {}, c.title.en), langTabs(c),
      h("div", { class: "card" }, locField(c, "title", { label: T("c_title"), kind: "line" }), locField(c, "description_html", { label: T("c_desc"), kind: "rich" }),
        h("label", { class: "check" }, h("input", { type: "checkbox", checked: c.show_in_shop, onchange: e => { c.show_in_shop = e.target.checked; changed(); } }), T("c_show"))),
      h("div", { class: "card" }, h("h2", {}, T("c_products")), listBox),
      h("p", {}, h("a", { href: `${SITE}/collections/${c.handle}/`, target: "_blank", rel: "noopener" }, T("preview")))
    ];
  }

  // Pages
  function viewPages() {
    const names = T("page_names");
    return [h("h1", {}, T("pages_title")), h("p", { class: "hint" }, T("pages_hint")),
      h("div", { class: "plist" }, Object.keys(S.data.pages).map(k => h("button", { type: "button", class: "pitem", style: "grid-template-columns:1fr auto", onclick: () => { S.view.id = k; renderMain(); } },
        h("span", {}, h("b", {}, names[k] || humanize(k)), S.langs.some(l => l !== "en" && countMissing(S.data.pages[k], l)) ? h("span", { class: "badge warn" }, T("missing")) : null,
          h("div", { class: "meta" }, PAGE_PATHS[k] || "")), h("span", { "aria-hidden": "true" }, "›"))))];
  }
  function viewPage(key) {
    const page = S.data.pages[key], names = T("page_names"), labels = FIELD[S.ui] || FIELD.en;
    const fields = Object.keys(page).map(f => {
      const [label, hint] = labels[f] || FIELD.en[f] || [humanize(f)];
      if (isLoc(page[f])) return locField(page, f, { label, hint, kind: /email_body/.test(f) ? "area" : undefined });
      return h("div", { class: "field" }, h("label", {}, label), textInput(page[f], v => { page[f] = v; }));
    });
    return [
      h("p", {}, h("button", { type: "button", class: "link", onclick: () => { S.view.id = null; renderMain(); } }, `‹ ${T("back")}`)),
      h("h1", {}, names[key] || humanize(key)), langTabs(page),
      h("div", { class: "card" }, fields),
      PAGE_PATHS[key] ? h("p", {}, h("a", { href: `${SITE}${S.clang === "en" ? "" : "/" + S.clang}${PAGE_PATHS[key]}`, target: "_blank", rel: "noopener" }, T("preview"))) : null
    ];
  }

  // Interface texts: all languages side by side
  function viewStrings() {
    const st = S.data.strings;
    return [h("h1", {}, T("strings_title")), h("p", { class: "hint" }, T("strings_hint")),
      h("div", { class: "card tablewrap" }, h("table", { class: "kv" },
        h("thead", {}, h("tr", {}, h("th", {}, ""), S.langs.map(l => h("th", {}, LANG_NAMES[l])))),
        h("tbody", {}, Object.keys(st).map(k => h("tr", {}, h("th", { scope: "row" }, humanize(k)),
          S.langs.map(l => h("td", {}, textInput(st[k][l] ?? "", v => { st[k][l] = v; }, { multiline: /\n/.test(st[k].en || ""), rows: 6 })))))))) ];
  }

  function viewHelp() {
    return [h("h1", {}, T("help_title")), h("div", { class: "card" }, T("help").map(p => h("p", { html: p }))),
      h("div", { class: "card" }, h("h2", {}, T("token_help_title")), h("ol", {}, T("token_help").map(s => h("li", { html: s }))))];
  }

  // ---------------------------------------------------------------- login
  function renderLogin(error = "") {
    const a = app(); a.textContent = "";
    const input = h("input", { type: "password", autocomplete: "off", spellcheck: "false", "aria-label": T("token"), placeholder: "github_pat_… / ghp_…" });
    const remember = h("input", { type: "checkbox", checked: true });
    const err = h("p", { class: "error", role: "alert" }, error);
    const go = async () => {
      const tok = input.value.trim(); if (!tok) return;
      err.textContent = T("checking"); S.token = tok;
      const ok = await signIn(remember.checked);
      if (!ok.ok) { err.textContent = ok.msg; S.token = null; }
    };
    input.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    a.append(h("div", { class: "login" },
      h("div", { class: "logo" }, h("img", { src: "../img/logo.png", alt: "La Pastaiola" }), uiLangSwitch(true)),
      h("div", { class: "card" },
        h("h1", {}, `${T("admin")} · ${T("signin")}`),
        h("p", { class: "hint" }, T("signin_hint")),
        h("div", { class: "field" }, h("label", {}, T("token")), input, h("small", {}, T("token_where"))),
        h("div", { class: "field" }, h("label", { class: "check" }, remember, T("remember"))),
        h("div", { class: "actions" }, h("button", { type: "button", class: "btn", onclick: go }, T("signin"))), err),
      h("details", { class: "card" }, h("summary", {}, h("b", {}, T("token_help_title"))), h("ol", {}, T("token_help").map(s => h("li", { html: s }))))));
    if (!error) input.focus();
  }

  async function signIn(remember) {
    try {
      const repo = await gh(R);
      if (!repo.permissions?.push) return { ok: false, msg: T("no_push") };
      try { S.user = (await gh("/user")).login; } catch { S.user = null; }
      try { (remember ? store : sess)?.setItem("lp-admin-token", S.token); (remember ? sess : store)?.removeItem("lp-admin-token"); } catch {}
      app().textContent = ""; app().append(h("p", { class: "boot" }, T("loading")));
      await loadAll();
      render();
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.status === 401 || e.status === 403 || e.status === 404 ? T("bad_token") : `${T("load_failed")} ${e.detail || e.message}` };
    }
  }

  function signOut() {
    try { store?.removeItem("lp-admin-token"); sess?.removeItem("lp-admin-token"); } catch {}
    S.token = null; S.data = null; S.user = null; S.images.clear(); setStatus("", ""); render();
  }

  window.addEventListener("beforeunload", e => { if (dirty()) { e.preventDefault(); e.returnValue = T("leave_warning"); } });

  // boot
  if (S.token) signIn(!!store?.getItem("lp-admin-token")).then(r => { if (!r.ok) { S.token = null; renderLogin(r.msg); } });
  else render();
})();
