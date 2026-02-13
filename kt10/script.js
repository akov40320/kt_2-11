/**
 * Мини SPA на History API
 * - клики по меню: pushState + render()
 * - popstate: render()
 * - поддержка GH Pages refresh через ?route=...
 */

const app = document.getElementById("app");
const links = Array.from(document.querySelectorAll("a[data-link]"));

function getBase() {
  // base path = /<repo>/kt10
  // We compute from current location (ending with /kt10/ or /kt10/index.html)
  const p = location.pathname;
  if (p.endsWith("/")) return p.replace(/\/$/, "");
  if (p.endsWith("/index.html")) return p.replace(/\/index\.html$/, "");
  // deep route: /kt10/about -> base /kt10
  return p.split("/").slice(0, -1).join("/");
}

const BASE = getBase();

const routes = {
  "/": () => `
    <h2>Главная</h2>
    <p>Это простая SPA. Попробуйте перейти на «О нас» и «Контакты» — перезагрузки страницы нет.</p>
    <p class="muted">Состояние URL: <code>${location.pathname}</code></p>
  `,
  "/about": () => `
    <h2>О нас</h2>
    <p>Пример страницы, которая подгружается и рендерится на клиенте.</p>
  `,
  "/contacts": () => `
    <h2>Контакты</h2>
    <p>email: example@example.com</p>
    <p class="muted">Можно дополнить формой обратной связи.</p>
  `
};

function normalizePath(pathname) {
  // pathname includes BASE; convert to route like "/about"
  if (pathname.startsWith(BASE)) {
    const r = pathname.slice(BASE.length) || "/";
    return r.startsWith("/") ? r : "/" + r;
  }
  return "/";
}

function setActive(route) {
  links.forEach(a => {
    const r = a.getAttribute("href");
    a.classList.toggle("active", r === route);
  });
}

function render(route) {
  const view = routes[route] || (() => `
    <h2>404</h2>
    <p>Страница не найдена: <code>${route}</code></p>
    <p><a href="/" data-link>Перейти на главную</a></p>
  `);

  app.innerHTML = view();
  setActive(route);
}

function navigate(route) {
  history.pushState({ route }, "", BASE + (route === "/" ? "/" : route));
  render(route);
}

window.addEventListener("popstate", () => {
  const route = normalizePath(location.pathname);
  render(route);
});

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-link]");
  if (!a) return;
  e.preventDefault();
  const route = a.getAttribute("href");
  navigate(route);
});

// GH Pages 404 redirect support
const url = new URL(location.href);
const redirectedRoute = url.searchParams.get("route");
if (redirectedRoute) {
  url.searchParams.delete("route");
  history.replaceState({}, "", BASE + redirectedRoute);
}

window.onload = () => {
  render(normalizePath(location.pathname));
};
