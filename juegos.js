(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
  const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
  const tabs = [...document.querySelectorAll(".game-tab")];
  const panels = [...document.querySelectorAll(".game-panel")];
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((item) => { const active = item === tab; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
    panels.forEach((panel) => panel.classList.toggle("active", panel.id === "game-" + tab.dataset.game));
  }));
  const year = $("year"); if (year) year.textContent = new Date().getFullYear();
  const config = window.MEMORIA_VIVA_CONFIG || {};
  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    const message = link.dataset.message || "Hola, quiero información sobre Memoria Viva Maspalomas.";
    if (number.length >= 8) { link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`; link.target = "_blank"; link.rel = "noopener noreferrer"; }
  });
  const menuToggle = document.querySelector(".menu-toggle"), nav = $("nav-menu");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => { const open = nav.classList.toggle("open"); menuToggle.setAttribute("aria-expanded", String(open)); menuToggle.textContent = open ? "×" : "☰"; menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú"); });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); menuToggle.textContent = "☰"; }));
  }

  // Juego 1: parejas. No hay reloj ni penalización.
  const symbols = ["🌻", "☕", "🎸", "🐚", "🍊", "📚"];
  let deck = [], firstCard = null, lockBoard = false, matchedPairs = 0, turns = 0;
  function setupMemory() {
    deck = shuffle([...symbols, ...symbols]); firstCard = null; lockBoard = false; matchedPairs = 0; turns = 0;
    $("memory-grid").innerHTML = ""; $("memory-status").textContent = "Pulsa dos cartas para empezar."; $("memory-pairs").textContent = "Parejas: 0 de 6";
    deck.forEach((symbol, index) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "memory-card"; button.dataset.symbol = symbol; button.dataset.index = String(index); button.textContent = "✳"; button.setAttribute("aria-label", "Carta " + (index + 1) + ", oculta");
      button.addEventListener("click", () => flipCard(button)); $("memory-grid").appendChild(button);
    });
  }
  function flipCard(button) {
    if (lockBoard || button.disabled || button === firstCard || button.classList.contains("revealed")) return;
    button.textContent = button.dataset.symbol; button.classList.add("revealed"); button.setAttribute("aria-label", "Carta: " + button.dataset.symbol);
    if (!firstCard) { firstCard = button; $("memory-status").textContent = "Ahora busca otra carta igual."; return; }
    turns++; const second = button;
    if (firstCard.dataset.symbol === second.dataset.symbol) {
      [firstCard, second].forEach((card) => { card.classList.remove("revealed"); card.classList.add("matched"); card.disabled = true; }); matchedPairs++;
      $("memory-pairs").textContent = "Parejas: " + matchedPairs + " de 6";
      $("memory-status").textContent = matchedPairs === 6 ? "¡Habéis encontrado todas las parejas! ¡Bien hecho!" : "¡Pareja encontrada! Seguimos cuando quieras.";
      firstCard = null;
    } else {
      lockBoard = true; $("memory-status").textContent = "No pasa nada. Vamos a probar con otras cartas.";
      const previous = firstCard; firstCard = null;
      window.setTimeout(() => { [previous, second].forEach((card) => { card.classList.remove("revealed"); card.textContent = "✳"; card.setAttribute("aria-label", "Carta " + (Number(card.dataset.index) + 1) + ", oculta"); }); lockBoard = false; }, 1100);
    }
  }
  $("memory-reset").addEventListener("click", setupMemory); setupMemory();

  // Juego 2: refranes populares.
  const proverbs = [
    {q:"A quien madruga…",a:["Dios le ayuda","le entra sueño","se le hace tarde"],correct:0},
    {q:"Más vale pájaro en mano…",a:["que ciento volando","que una flor en mayo","que un pez en el río"],correct:0},
    {q:"No por mucho madrugar…",a:["amanece más temprano","se llega más lejos","se duerme mejor"],correct:0},
    {q:"En abril, aguas…",a:["mil","de jazmín","para el jardín"],correct:0},
    {q:"A caballo regalado…",a:["no le mires el diente","dale heno primero","déjalo descansar"],correct:0},
    {q:"De tal palo…",a:["tal astilla","tal camino","tal ventana"],correct:0},
    {q:"Al mal tiempo…",a:["buena cara","buen paraguas siempre","mejor quedarse quieto"],correct:0},
    {q:"Quien tiene un amigo…",a:["tiene un tesoro","tiene una casa","tiene dos sombreros"],correct:0},
    {q:"A falta de pan…",a:["buenas son tortas","bueno es el queso","mejor una sopa"],correct:0},
    {q:"Perro ladrador…",a:["poco mordedor","mucho soñador","buen cuidador"],correct:0}
  ];
  let proverbDeck = shuffle(proverbs), proverbIndex = 0;
  function showProverb() {
    if (proverbIndex >= proverbDeck.length) { proverbDeck = shuffle(proverbs); proverbIndex = 0; }
    const item = proverbDeck[proverbIndex]; $("proverb-counter").textContent = "Refrán " + (proverbIndex + 1) + " de " + proverbDeck.length; $("proverb-question").textContent = item.q; $("proverb-feedback").textContent = ""; $("proverb-options").innerHTML = "";
    item.a.forEach((answer, index) => { const button = document.createElement("button"); button.type = "button"; button.className = "quiz-option"; button.textContent = answer; button.addEventListener("click", () => {
      [...$("proverb-options").children].forEach((b) => b.disabled = true);
      if (index === item.correct) { button.classList.add("correct"); $("proverb-feedback").textContent = "¡Sí! Ese es el refrán más conocido. ¿En tu familia se decía de otra manera?"; }
      else { button.classList.add("incorrect"); $("proverb-options").children[item.correct].classList.add("correct"); $("proverb-feedback").textContent = "Una versión muy conocida es: " + item.q + " " + item.a[item.correct] + ". ¡También podéis compartir variantes!"; }
    }); $("proverb-options").appendChild(button); });
  }
  $("proverb-next").addEventListener("click", () => { proverbIndex++; showProverb(); }); showProverb();

  // Juego 3: cadena de palabras. Se comprueba la letra inicial, no el diccionario.
  let currentWord = "MESA", wordHistory = ["MESA"];
  function renderWord() { $("word-current").textContent = currentWord; $("word-prompt").textContent = "Busca una palabra que empiece por " + currentWord.slice(-1).toLocaleUpperCase("es") + "."; $("word-history").innerHTML = ""; wordHistory.forEach((word) => { const chip = document.createElement("span"); chip.className = "word-chip"; chip.textContent = word; $("word-history").appendChild(chip); }); }
  $("word-form").addEventListener("submit", (event) => {
    event.preventDefault(); const raw = $("word-input").value.trim(); const word = normalize(raw); const required = normalize(currentWord.slice(-1));
    if (!word || !/^[a-zñáéíóúü]+$/i.test(raw)) { $("word-feedback").textContent = "Prueba con una palabra sencilla, sin números."; return; }
    if (word[0] !== required) { $("word-feedback").textContent = "La palabra debe empezar por " + required.toLocaleUpperCase("es") + ". ¡Inténtalo de nuevo!"; return; }
    if (wordHistory.some((used) => normalize(used) === word)) { $("word-feedback").textContent = "Ya hemos usado esa palabra. ¿Se te ocurre otra?"; return; }
    currentWord = raw.toLocaleUpperCase("es"); wordHistory.push(currentWord); $("word-input").value = ""; $("word-feedback").textContent = "¡Buena palabra! Ahora toca empezar por " + currentWord.slice(-1) + "."; renderWord();
  });
  $("word-reset").addEventListener("click", () => { currentWord = "MESA"; wordHistory = ["MESA"]; $("word-feedback").textContent = "Empezamos de nuevo con MESA."; renderWord(); }); renderWord();

  // Juego 4: pistas musicales descriptivas; no incluye letras ni grabaciones.
  const songs = [
    {clue:"Una canción italiana muy conocida cuyo título invita a volar y que se hizo famosa internacionalmente en los años cincuenta.",a:["Volare (Nel blu dipinto di blu)","La Macarena","Bésame mucho"],correct:0},
    {clue:"Un pasodoble español muy popular que suele sonar en fiestas y verbenas, y que comparte nombre con una ciudad de Aragón.",a:["Valencia","Zaragoza","Sevilla"],correct:0},
    {clue:"Una canción tradicional de cumpleaños que muchas familias cantan cuando alguien sopla las velas.",a:["Cumpleaños feliz","La Tarara","Asturias, patria querida"],correct:0},
    {clue:"Una canción popular española asociada a una muñeca vestida de azul y a una historia contada con humor.",a:["Tengo una muñeca vestida de azul","Clavelitos","La chica ye-yé"],correct:0},
    {clue:"Una canción tradicional muy vinculada a Asturias, que también se canta en reuniones y celebraciones.",a:["Asturias, patria querida","Granada","La bamba"],correct:0},
    {clue:"Una canción festiva que se hizo mundialmente conocida por su baile con pasos de brazos y caderas.",a:["La Macarena","Volare","Resistiré"],correct:0}
  ];
  let songDeck = shuffle(songs), songIndex = 0;
  function showSong() {
    if (songIndex >= songDeck.length) { songDeck = shuffle(songs); songIndex = 0; }
    const item = songDeck[songIndex]; $("song-counter").textContent = "Pista " + (songIndex + 1) + " de " + songDeck.length; $("song-clue").textContent = item.clue; $("song-feedback").textContent = ""; $("song-options").innerHTML = "";
    shuffle(item.a.map((answer, index) => ({answer,index}))).forEach(({answer,index}) => { const button = document.createElement("button"); button.type = "button"; button.className = "quiz-option"; button.textContent = answer; button.addEventListener("click", () => {
      [...$("song-options").children].forEach((b) => b.disabled = true);
      if (index === item.correct) { button.classList.add("correct"); $("song-feedback").textContent = "¡Exacto! ¿La conocíais? Podéis tararearla o contar cuándo la escuchasteis."; }
      else { button.classList.add("incorrect"); [...$("song-options").children].forEach((b) => { if (b.textContent === item.a[item.correct]) b.classList.add("correct"); }); $("song-feedback").textContent = "La respuesta más adecuada es " + item.a[item.correct] + ". ¡A veces una canción trae muchas historias!"; }
    }); $("song-options").appendChild(button); });
  }
  $("song-next").addEventListener("click", () => { songIndex++; showSong(); }); showSong();

  // Juego 5: escena de objetos con un cambio por ronda.
  const scenes = [
    [{icon:"☕",name:"taza"},{icon:"📚",name:"libros"},{icon:"🌷",name:"flor"},{icon:"🔑",name:"llaves"},{icon:"🍎",name:"manzana"}],
    [{icon:"🕶️",name:"gafas"},{icon:"🧣",name:"bufanda"},{icon:"🕰️",name:"reloj"},{icon:"🧤",name:"guantes"},{icon:"🧢",name:"gorra"}],
    [{icon:"🍋",name:"limón"},{icon:"🥄",name:"cuchara"},{icon:"🍞",name:"pan"},{icon:"🫖",name:"tetera"},{icon:"🍐",name:"pera"}],
    [{icon:"✉️",name:"carta"},{icon:"✏️",name:"lápiz"},{icon:"📷",name:"cámara"},{icon:"🧵",name:"hilo"},{icon:"🪴",name:"planta"}]
  ];
  let scene = [], changed = null, scenePhase = "observe", previousScenes = [];
  function drawScene() { $("object-scene").innerHTML = ""; scene.forEach((item) => { const el = document.createElement("div"); el.className = "scene-object"; el.innerHTML = "<span aria-hidden=\"true\">" + item.icon + "</span><small>" + item.name + "</small>"; $("object-scene").appendChild(el); }); }
  function newScene() {
    let options = scenes.filter((_, i) => !previousScenes.includes(i)); if (!options.length) { previousScenes = []; options = scenes; }
    const index = scenes.indexOf(options[Math.floor(Math.random() * options.length)]); previousScenes.push(index); if (previousScenes.length > 2) previousScenes.shift();
    scene = [...scenes[index]]; changed = null; scenePhase = "observe"; $("scene-instruction").textContent = "Observa los cinco objetos. Cuando estés preparado, pulsa «Ya la he observado»."; $("scene-feedback").textContent = ""; $("scene-answers").innerHTML = ""; $("scene-show").disabled = false; drawScene();
  }
  $("scene-show").addEventListener("click", () => {
    if (scenePhase !== "observe") return;
    const index = Math.floor(Math.random() * scene.length); const original = scene[index]; const replacements = scenes.flat().filter((item) => item.name !== original.name && !scene.some((s) => s.name === item.name)); const replacement = replacements[Math.floor(Math.random() * replacements.length)];
    changed = {old: original, next: replacement}; scene[index] = replacement; scenePhase = "answer"; $("scene-instruction").textContent = "Un objeto ha cambiado. ¿Cuál crees que es el diferente?"; $("scene-show").disabled = true; drawScene();
    const choices = shuffle([original, replacement, ...scene.filter((item) => item.name !== replacement.name).slice(0,2)]);
    choices.forEach((item) => { const button = document.createElement("button"); button.type = "button"; button.className = "scene-answer"; button.textContent = item.name; button.addEventListener("click", () => {
      [...$("scene-answers").children].forEach((b) => b.disabled = true);
      if (item.name === replacement.name) { $("scene-feedback").textContent = "¡Bien visto! Ha aparecido " + replacement.name + " en lugar de " + original.name + ". ¿Jugamos otra vez?"; }
      else { $("scene-feedback").textContent = "El objeto que ha cambiado es " + replacement.name + ": antes estaba " + original.name + ". ¡Podemos intentarlo otra vez sin prisa!"; }
      $("scene-instruction").textContent = "Ronda terminada. Puedes empezar una nueva escena.";
    }); $("scene-answers").appendChild(button); });
  });
  $("scene-reset").addEventListener("click", newScene); newScene();

  // Juego 6: preguntas abiertas para conversación. No almacena respuestas.
  const prompts = [
    ["LUGARES","¿Había algún lugar al que te gustara ir de paseo?"],
    ["MÚSICA","¿Qué música te gustaba escuchar cuando eras joven?"],
    ["COCINA","¿Qué comida te recuerda a alguien querido?"],
    ["JUEGOS","¿A qué jugabas cuando eras pequeño o pequeña?"],
    ["CELEBRACIONES","¿Qué celebración disfrutabas especialmente?"],
    ["NATURALEZA","¿Había alguna planta o flor que te gustara cuidar?"],
    ["OFICIOS","¿Qué trabajo o oficio te ha parecido siempre interesante?"],
    ["OBJETOS","¿Conservas o recuerdas algún objeto con una historia especial?"],
    ["AMISTAD","¿Qué cualidad valoras mucho en una amistad?"],
    ["COSTUMBRES","¿Qué pequeña costumbre te alegra el día?"],
    ["VIAJES","¿Qué lugar te gustaría volver a visitar, aunque sea en recuerdos?"],
    ["SABORES","¿Qué olor de cocina te resulta especialmente familiar?"],
    ["FIESTAS","¿Qué canción o baile recuerdas de las fiestas del pueblo?"],
    ["NUEVOS RECUERDOS","¿Qué te gustaría hacer esta semana por puro gusto?"]
  ];
  let promptDeck = shuffle(prompts), promptIndex = 0, favouritePrompts = new Set();
  function showPrompt() { if (promptIndex >= promptDeck.length) { promptDeck = shuffle(prompts); promptIndex = 0; } const item = promptDeck[promptIndex]; $("memory-category").textContent = item[0]; $("memory-prompt").textContent = item[1]; $("prompt-feedback").textContent = ""; $("prompt-fav").textContent = favouritePrompts.has(item[1]) ? "♥ Pregunta guardada en esta sesión" : "♡ Me gusta esta pregunta"; }
  $("prompt-next").addEventListener("click", () => { promptIndex++; showPrompt(); });
  $("prompt-fav").addEventListener("click", () => { const item = promptDeck[promptIndex][1]; if (favouritePrompts.has(item)) { favouritePrompts.delete(item); $("prompt-feedback").textContent = "Pregunta quitada de favoritas."; } else { favouritePrompts.add(item); $("prompt-feedback").textContent = "Marcada como favorita mientras esta página esté abierta."; } showPrompt(); $("prompt-feedback").textContent = favouritePrompts.has(item) ? "Marcada como favorita mientras esta página esté abierta." : "Pregunta quitada de favoritas."; });
  showPrompt();
})();