(function () {
  // Botones para copiar datos de contacto
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var el = document.getElementById(btn.getAttribute("data-copy"));
      if (!el) return;
      var text = el.textContent.trim();
      var original = btn.textContent;
      function reset() { setTimeout(function () { btn.textContent = original; }, 1600); }
      function select() {
        var r = document.createRange();
        r.selectNodeContents(el);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        btn.textContent = "Seleccionado";
        reset();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { btn.textContent = "Copiado"; reset(); }, select);
      } else {
        select();
      }
    });
  });

  // Filtro de proyectos por línea de servicio
  var filters = document.querySelectorAll(".filter");
  var items = document.querySelectorAll("main [data-lines]");
  var count = document.getElementById("project-count");
  function apply(line) {
    var shown = 0;
    items.forEach(function (it) {
      var match = line === "todos" || it.getAttribute("data-lines").split(" ").indexOf(line) !== -1;
      it.hidden = !match;
      if (match) shown++;
    });
    filters.forEach(function (f) { f.setAttribute("aria-pressed", String(f.getAttribute("data-line") === line)); });
    if (count) count.textContent = shown === 1 ? "1 proyecto" : shown + " proyectos";
  }
  filters.forEach(function (f) {
    f.addEventListener("click", function () { apply(f.getAttribute("data-line")); });
  });
})();
