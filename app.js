// Dirección de mi colección en Firestore
const URL_BASE =
  "https://firestore.googleapis.com/v1/projects/publica-tu-post/databases/(default)/documents/posts";

const form = document.getElementById("formPost");
const lista = document.getElementById("listaPosts");
const mensaje = document.getElementById("mensaje");

// Fecha en español
function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Traer los posts, los más nuevos primero
async function cargarPosts() {
  mensaje.textContent = "Cargando posts...";
  try {
    const res = await fetch(URL_BASE + "?orderBy=" + encodeURIComponent("Fecha desc"));
    if (!res.ok) throw new Error("Error " + res.status);
    const data = await res.json();
    const docs = data.documents || [];

    lista.innerHTML = "";
    mensaje.textContent = docs.length ? "" : "Todavía no hay posts.";
    docs.forEach((doc) => lista.appendChild(crearItem(doc)));
  } catch (error) {
    mensaje.textContent = "No se pudieron cargar los posts.";
    console.error(error);
  }
}

// Armar un post de la lista
function crearItem(doc) {
  const campos = doc.fields;
  const id = doc.name.split("/").pop();
  const favorito = campos.Favorito ? campos.Favorito.booleanValue : false;

  const li = document.createElement("li");
  li.className = "collection-item avatar";

  const avatar = document.createElement("i");
  avatar.className = "material-icons circle";
  avatar.textContent = "face";

  const titulo = document.createElement("span");
  titulo.className = "title";
  titulo.textContent = campos.Titulo ? campos.Titulo.stringValue : "";

  const texto = document.createElement("p");
  texto.textContent = campos.Contenido ? campos.Contenido.stringValue : "";
  texto.appendChild(document.createElement("br"));

  const fecha = document.createElement("i");
  fecha.textContent = campos.Fecha
    ? "Fecha de publicación: " + formatearFecha(campos.Fecha.timestampValue)
    : "";
  texto.appendChild(fecha);

  // Estrella de favorito
  const enlace = document.createElement("a");
  enlace.href = "#!";
  enlace.className = "secondary-content";
  enlace.addEventListener("click", (e) => {
    e.preventDefault();
    cambiarFavorito(id, !favorito);
  });

  const estrella = document.createElement("i");
  estrella.className = "material-icons " + (favorito ? "orange-text" : "grey-text");
  estrella.textContent = favorito ? "grade" : "star_border";
  enlace.appendChild(estrella);

  li.append(avatar, titulo, texto, enlace);
  return li;
}

// Marcar o desmarcar favorito
async function cambiarFavorito(id, valor) {
  try {
    const res = await fetch(URL_BASE + "/" + id + "?updateMask.fieldPaths=Favorito", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { Favorito: { booleanValue: valor } } }),
    });
    if (!res.ok) throw new Error("Error " + res.status);
    cargarPosts();
  } catch (error) {
    M.toast({ html: "No se pudo actualizar el favorito" });
    console.error(error);
  }
}

// Publicar un post nuevo
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const titulo = document.getElementById("tituloPost").value.trim();
  const contenido = document.getElementById("contenidoPost").value.trim();
  if (!titulo || !contenido) return;

  const nuevoPost = {
    fields: {
      Titulo: { stringValue: titulo },
      Contenido: { stringValue: contenido },
      Fecha: { timestampValue: new Date().toISOString() },
      Favorito: { booleanValue: false },
    },
  };

  try {
    const res = await fetch(URL_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoPost),
    });
    if (!res.ok) throw new Error("Error " + res.status);

    form.reset();
    M.updateTextFields();
    M.textareaAutoResize(document.getElementById("contenidoPost"));
    M.toast({ html: "Post publicado" });
    cargarPosts();
  } catch (error) {
    M.toast({ html: "No se pudo publicar el post" });
    console.error(error);
  }
});

// Al abrir la página
cargarPosts();