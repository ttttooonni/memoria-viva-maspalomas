(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
  const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
  const tabs = [...document.querySelectorAll(".game-tab")];
  const panels = [...document.querySelectorAll(".game-panel")];
  let playMode = "solo", difficulty = "medio";
  const modeButtons = [...document.querySelectorAll("[data-mode]")];
  const levelButtons = [...document.querySelectorAll("[data-level]")];
  function updateGuidance() {
    const guidance = $("play-guidance");
    if (!guidance) return;
    const modeText = playMode === "acompanado"
      ? "Modo en compañía: una persona puede leer las instrucciones, dar pistas y celebrar cada intento. Preguntad siempre si la persona quiere ayuda."
      : "Modo a mi ritmo: juega por tu cuenta o pide ayuda cuando te apetezca. Puedes parar o cambiar de juego en cualquier momento.";
    const levelText = difficulty === "facil"
      ? "Nivel tranquilo: menos cartas, pistas claras y palabras sencillas."
      : difficulty === "reto"
        ? "Un pequeño reto: más cartas y palabras de partida menos habituales. Sin cronómetro ni penalizaciones."
        : "Nivel habitual: una dificultad intermedia, adaptable según el día.";
    guidance.textContent = modeText + " " + levelText;
  }
  modeButtons.forEach((button) => button.addEventListener("click", () => {
    playMode = button.dataset.mode;
    modeButtons.forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
    updateGuidance();
    const support = $("prompt-support");
    if (support) support.textContent = playMode === "acompanado"
      ? "La persona acompañante puede leer despacio, escuchar sin corregir y dejar que la persona decida si quiere contar algo. También está bien pasar a otra pregunta."
      : "Puedes responder hablando, señalando una imagen o simplemente escuchando. No tienes que compartir nada que no te apetezca.";
  }));
  levelButtons.forEach((button) => button.addEventListener("click", () => {
    difficulty = button.dataset.level;
    levelButtons.forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
    updateGuidance();
    if (typeof setupMemory === "function") setupMemory();
    if (typeof resetWordGame === "function") resetWordGame();
    if (typeof newScene === "function") newScene();
  }));
  updateGuidance();
  document.querySelectorAll("[data-shortcut]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    const game = link.dataset.shortcut;
    const tab = tabs.find((item) => item.dataset.game === game);
    if (tab) tab.click();
    const stage = document.querySelector(".game-stage");
    if (stage) stage.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }));
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((item) => { const active = item === tab; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
    panels.forEach((panel) => panel.classList.toggle("active", panel.id === "game-" + tab.dataset.game));
  }));
  function activateGameFromHash() {
    const gameId = window.location.hash.match(/^#game-(parejas|refranes|palabras|canciones|cambios|recuerdos|canarias|fotografias)$/);
    if (!gameId) return;
    const tab = tabs.find((item) => item.dataset.game === gameId[1]);
    if (tab) {
      tab.click();
      window.setTimeout(() => document.getElementById("game-" + gameId[1])?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      }), 80);
    }
  }
  window.addEventListener("hashchange", activateGameFromHash);
  activateGameFromHash();
  const year = $("year"); if (year) year.textContent = new Date().getFullYear();
  const config = window.MEMORIA_VIVA_CONFIG || {};
  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    const message = link.dataset.message || "Hola, quiero información sobre Memoria Viva.";
    if (number.length >= 8) { link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`; link.target = "_blank"; link.rel = "noopener noreferrer"; }
  });
  const menuToggle = document.querySelector(".menu-toggle"), nav = $("nav-menu");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => { const open = nav.classList.toggle("open"); menuToggle.setAttribute("aria-expanded", String(open)); menuToggle.textContent = open ? "×" : "☰"; menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú"); });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); menuToggle.textContent = "☰"; }));
  }

  // Juego 1: parejas. No hay reloj ni penalización.
  const symbols = ["🌻", "☕", "🎸", "🐚", "🍊", "📚", "🧶", "🌼"];
  let deck = [], firstCard = null, lockBoard = false, matchedPairs = 0, turns = 0, memoryPairCount = 6;
  function setupMemory() {
    memoryPairCount = difficulty === "facil" ? 3 : difficulty === "reto" ? 8 : 6;
    deck = shuffle([...symbols.slice(0, memoryPairCount), ...symbols.slice(0, memoryPairCount)]); firstCard = null; lockBoard = false; matchedPairs = 0; turns = 0;
    $("memory-grid").innerHTML = ""; $("memory-status").textContent = "Pulsa dos cartas para empezar."; $("memory-pairs").textContent = "Parejas: 0 de " + memoryPairCount;
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
      $("memory-pairs").textContent = "Parejas: " + matchedPairs + " de " + memoryPairCount;
      $("memory-status").textContent = matchedPairs === memoryPairCount ? "¡Habéis encontrado todas las parejas! ¡Bien hecho!" : "¡Pareja encontrada! Seguimos cuando quieras.";
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
  proverbs.push(
    {q:"A buen hambre…",a:["no hay pan duro","le sobra el postre","se cena tarde"],correct:0},
    {q:"Cuando el río suena…",a:["agua lleva","se seca pronto","hay peces cantando"],correct:0},
    {q:"Más sabe el diablo por viejo…",a:["que por diablo","que por madrugar","que por viajar"],correct:0},
    {q:"Dime con quién andas…",a:["y te diré quién eres","y te diré dónde vives","y te invito a cenar"],correct:0},
    {q:"Ojos que no ven…",a:["corazón que no siente","pies que no caminan","manos que no tocan"],correct:0},
    {q:"A palabras necias…",a:["oídos sordos","respuesta larga","puertas abiertas"],correct:0},
    {q:"El que mucho abarca…",a:["poco aprieta","mucho descansa","todo lo guarda"],correct:0},
    {q:"Más vale tarde…",a:["que nunca","que mañana","que en invierno"],correct:0},
    {q:"No hay mal que por bien…",a:["no venga","no se cuente","no se duerma"],correct:0},
    {q:"En casa del herrero…",a:["cuchillo de palo","martillo de oro","puerta de hierro"],correct:0},
    {q:"A río revuelto…",a:["ganancia de pescadores","paseo de caminantes","canción de pastores"],correct:0},
    {q:"Cada maestrillo…",a:["tiene su librillo","tiene su sombrero","tiene su jardín"],correct:0},
    {q:"Cría cuervos…",a:["y te sacarán los ojos","y cantarán al alba","y cuidarán la casa"],correct:0},
    {q:"Quien mucho habla…",a:["mucho yerra","mucho camina","poco cocina"],correct:0},
    {q:"A la tercera…",a:["va la vencida","llega la primavera","se acaba el camino"],correct:0},
    {q:"De noche, todos los gatos…",a:["son pardos","son blancos","duermen de pie"],correct:0},
    {q:"El hábito no hace…",a:["al monje","al vecino","al jardinero"],correct:0},
    {q:"Más vale prevenir…",a:["que curar","que esperar sentado","que salir temprano"],correct:0},
    {q:"Quien canta…",a:["su mal espanta","su casa levanta","su mesa recoge"],correct:0},
    {q:"Agua que no has de beber…",a:["déjala correr","guárdala en casa","mézclala con miel"],correct:0},
    {q:"A cada cerdo…",a:["le llega su San Martín","le llega su verano","le llega su sombrero"],correct:0},
    {q:"Zapatero…",a:["a tus zapatos","a tu ventana","a tu jardín"],correct:0},
    {q:"La avaricia rompe…",a:["el saco","la ventana","la cuchara"],correct:0},
    {q:"Quien espera…",a:["desespera","siempre vuela","nunca descansa"],correct:0},
    {q:"Por la boca…",a:["muere el pez","canta el gallo","sale el sol"],correct:0},
    {q:"A grandes males…",a:["grandes remedios","grandes zapatos","grandes ventanas"],correct:0},
    {q:"El tiempo pone a cada uno…",a:["en su lugar","en su cocina","en su camino al mar"],correct:0},
    {q:"Donde hubo fuego…",a:["cenizas quedan","llueve en verano","crecen manzanos"],correct:0},
    {q:"Un grano no hace…",a:["granero","verano","camino"],correct:0},
    {q:"Quien no arriesga…",a:["no gana","no desayuna","no canta"],correct:0}
  );
  let proverbDeck = shuffle(proverbs), proverbIndex = 0;
  function showProverb() {
    if (proverbIndex >= proverbDeck.length) { proverbDeck = shuffle(proverbs); proverbIndex = 0; }
    const item = proverbDeck[proverbIndex]; $("proverb-counter").textContent = "Refrán " + (proverbIndex + 1) + " de " + proverbDeck.length; $("proverb-question").textContent = item.q; $("proverb-feedback").textContent = ""; $("proverb-options").innerHTML = "";
    item.a.forEach((answer, index) => { const button = document.createElement("button"); button.type = "button"; button.className = "quiz-option"; button.textContent = answer; button.dataset.correct = String(index === item.correct); button.addEventListener("click", () => {
      [...$("proverb-options").children].forEach((b) => b.disabled = true);
      if (index === item.correct) { button.classList.add("correct"); $("proverb-feedback").textContent = "¡Sí! Ese es el refrán más conocido. ¿En tu familia se decía de otra manera?"; }
      else { button.classList.add("incorrect"); $("proverb-options").children[item.correct].classList.add("correct"); $("proverb-feedback").textContent = "Una versión muy conocida es: " + item.q + " " + item.a[item.correct] + ". ¡También podéis compartir variantes!"; }
    }); $("proverb-options").appendChild(button); });
  }
  $("proverb-next").addEventListener("click", () => { proverbIndex++; showProverb(); }); showProverb();

  // Juego 3: cadena de palabras. Se comprueba la letra inicial, no el diccionario.
  let currentWord = "MESA", wordHistory = ["MESA"];
  function resetWordGame() { currentWord = difficulty === "facil" ? "CASA" : difficulty === "reto" ? "AZAHAR" : "MESA"; wordHistory = [currentWord]; $("word-feedback").textContent = "Empezamos de nuevo con " + currentWord + "."; renderWord(); }
  function renderWord() { $("word-current").textContent = currentWord; $("word-prompt").textContent = "Busca una palabra que empiece por " + currentWord.slice(-1).toLocaleUpperCase("es") + "."; $("word-history").innerHTML = ""; wordHistory.forEach((word) => { const chip = document.createElement("span"); chip.className = "word-chip"; chip.textContent = word; $("word-history").appendChild(chip); }); }
  $("word-form").addEventListener("submit", (event) => {
    event.preventDefault(); const raw = $("word-input").value.trim(); const word = normalize(raw); const required = normalize(currentWord.slice(-1));
    if (!word || !/^[a-zñáéíóúü]+$/i.test(raw)) { $("word-feedback").textContent = "Prueba con una palabra sencilla, sin números."; return; }
    if (word[0] !== required) { $("word-feedback").textContent = "La palabra debe empezar por " + required.toLocaleUpperCase("es") + ". ¡Inténtalo de nuevo!"; return; }
    if (wordHistory.some((used) => normalize(used) === word)) { $("word-feedback").textContent = "Ya hemos usado esa palabra. ¿Se te ocurre otra?"; return; }
    currentWord = raw.toLocaleUpperCase("es"); wordHistory.push(currentWord); $("word-input").value = ""; $("word-feedback").textContent = "¡Buena palabra! Ahora toca empezar por " + currentWord.slice(-1) + "."; renderWord();
  });
  $("word-reset").addEventListener("click", () => { resetWordGame(); }); renderWord();

  // Juego 4: pistas musicales descriptivas; no incluye letras ni grabaciones.
  const songs = [
    {clue:"Una canción italiana muy conocida cuyo título invita a volar y que se hizo famosa internacionalmente en los años cincuenta.",a:["Volare (Nel blu dipinto di blu)","La Macarena","Bésame mucho"],correct:0},
    {clue:"Un pasodoble español muy popular que suele sonar en fiestas y verbenas, y que comparte nombre con una ciudad de la Comunidad Valenciana.",a:["Valencia","Zaragoza","Sevilla"],correct:0},
    {clue:"Una canción tradicional de cumpleaños que muchas familias cantan cuando alguien sopla las velas.",a:["Cumpleaños feliz","La Tarara","Asturias, patria querida"],correct:0},
    {clue:"Una canción popular española asociada a una muñeca vestida de azul y a una historia contada con humor.",a:["Tengo una muñeca vestida de azul","Clavelitos","La chica ye-yé"],correct:0},
    {clue:"Una canción tradicional muy vinculada a Asturias, que también se canta en reuniones y celebraciones.",a:["Asturias, patria querida","Granada","La bamba"],correct:0},
    {clue:"Una canción festiva que se hizo mundialmente conocida por su baile con pasos de brazos y caderas.",a:["La Macarena","Volare","Resistiré"],correct:0}
  ];
  songs.push(
    {clue:"Un bolero romántico cuyo título pide un beso y se ha interpretado en muchos países.",a:["Bésame mucho","La bamba","Valencia"],correct:0},
    {clue:"Una canción muy conocida de los años sesenta que invita a resistir y se convirtió en himno de ánimo.",a:["Resistiré","Volare","La Tarara"],correct:0},
    {clue:"Una canción española asociada a una artista conocida como la chica ye-yé.",a:["La chica ye-yé","Granada","Clavelitos"],correct:0},
    {clue:"Un tema tradicional que menciona una región del norte de España y se canta en celebraciones.",a:["Asturias, patria querida","Malagueña salerosa","La Macarena"],correct:0},
    {clue:"Una canción popular infantil que cuenta la historia de una vaca de color lechero.",a:["La vaca lechera","Tengo una muñeca vestida de azul","El patio de mi casa"],correct:0},
    {clue:"Una canción tradicional que empieza hablando de una tarara y se canta en distintas versiones.",a:["La Tarara","Volare","Valencia"],correct:0},
    {clue:"Un pasodoble muy ligado a Andalucía y a una ciudad famosa por la Alhambra.",a:["Granada","Zaragoza","La Macarena"],correct:0},
    {clue:"Una canción festiva con un baile de palmas que se hizo famosa en todo el mundo en los años noventa.",a:["La Macarena","Bésame mucho","Resistiré"],correct:0},
    {clue:"Una canción tradicional de corro que habla de un patio y de juegos infantiles.",a:["El patio de mi casa","Volare","Valencia"],correct:0},
    {clue:"Una canción de tono alegre muy asociada a fiestas y reuniones, cuyo título es también un nombre de flor.",a:["Clavelitos","La Tarara","Asturias, patria querida"],correct:0},
    {clue:"Una canción popular mexicana que suele cantarse en fiestas y tiene un ritmo muy reconocible.",a:["La bamba","Valencia","Tengo una muñeca vestida de azul"],correct:0},
    {clue:"Una canción tradicional española que habla de una muñeca vestida de azul.",a:["Tengo una muñeca vestida de azul","Resistiré","Granada"],correct:0},
    {clue:"Una canción conocida por su estribillo sobre una ciudad mediterránea española.",a:["Valencia","La Macarena","La Tarara"],correct:0},
    {clue:"Una canción de cumpleaños que muchas personas recuerdan de reuniones familiares.",a:["Cumpleaños feliz","Volare","Clavelitos"],correct:0},
    {clue:"Una canción tradicional canaria puede escucharse en parrandas junto a instrumentos como el timple. ¿Qué tipo de música es?",a:["Música folclórica canaria","Ópera italiana exclusivamente","Música electrónica de discoteca"],correct:0}
  );
  let songDeck = shuffle(songs), songIndex = 0;
  function showSong() {
    if (songIndex >= songDeck.length) { songDeck = shuffle(songs); songIndex = 0; }
    const item = songDeck[songIndex]; $("song-counter").textContent = "Pista " + (songIndex + 1) + " de " + songDeck.length; $("song-clue").textContent = item.clue; $("song-feedback").textContent = ""; $("song-options").innerHTML = "";
    shuffle(item.a.map((answer, index) => ({answer,index}))).forEach(({answer,index}) => { const button = document.createElement("button"); button.type = "button"; button.className = "quiz-option"; button.textContent = answer; button.dataset.correct = String(index === item.correct); button.addEventListener("click", () => {
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
    ["GRAN CANARIA","¿Hay algún rincón de Gran Canaria al que te guste volver?"],
    ["GASTRONOMÍA CANARIA","¿Qué plato canario te recuerda a reuniones familiares?"],
    ["MÚSICA CANARIA","¿Has escuchado tocar el timple en alguna fiesta o reunión?"],
    ["TRADICIONES","¿Recuerdas alguna romería, fiesta o celebración de tu barrio?"],
    ["PAISAJES","¿Qué paisaje de las islas te parece especialmente bonito?"],
    ["NUEVOS RECUERDOS","¿Qué te gustaría hacer esta semana por puro gusto?"]
  ];
  prompts.push(
    ["INFANCIA","¿Qué juego te gustaba más en el recreo?"],
    ["INFANCIA","¿Recuerdas cómo era la casa donde creciste?"],
    ["ESCUELA","¿Qué asignatura o actividad disfrutabas en la escuela?"],
    ["AMISTAD","¿Cómo conociste a una amistad que conservas con cariño?"],
    ["TRABAJO","¿Cuál fue el primer trabajo que recuerdas?"],
    ["TRABAJO","¿Qué habilidad aprendiste trabajando y todavía te sirve?"],
    ["FAMILIA","¿Qué reunión familiar recuerdas con una sonrisa?"],
    ["FAMILIA","¿Qué receta se preparaba en casa en ocasiones especiales?"],
    ["COCINA","¿Te gustaba cocinar o preferías ayudar poniendo la mesa?"],
    ["COCINA","¿Qué fruta o dulce esperabas con ganas cuando eras pequeño?"],
    ["MÚSICA","¿Qué canción te anima cuando la escuchas?"],
    ["MÚSICA","¿Había alguna canción que se cantara mucho en tu casa?"],
    ["BAILE","¿Qué baile o música sonaba en las fiestas de tu juventud?"],
    ["VACACIONES","¿Recuerdas alguna excursión que saliera especialmente bien?"],
    ["VACACIONES","¿Eras más de playa, campo o paseos por el pueblo?"],
    ["BARRIO","¿Qué lugar de tu barrio ha cambiado mucho con los años?"],
    ["BARRIO","¿Había alguna tienda o mercado al que te gustara ir?"],
    ["TRADICIONES","¿Qué tradición te gustaría que conocieran las nuevas generaciones?"],
    ["CANARIAS","¿Qué paisaje de Canarias te gustaría enseñar a alguien que viene de visita?"],
    ["CANARIAS","¿Qué plato canario recomendarías a una persona que visita las islas?"],
    ["CANARIAS","¿Recuerdas alguna fiesta popular de tu municipio?"],
    ["NATURALEZA","¿Qué sonido de la naturaleza te resulta agradable?"],
    ["NATURALEZA","¿Qué planta, árbol o flor reconoces enseguida?"],
    ["OBJETOS","¿Qué objeto cotidiano te recuerda a otra época?"],
    ["OFICIOS","¿Qué oficio te habría gustado aprender?"],
    ["CELEBRACIONES","¿Cómo solíais celebrar los cumpleaños en casa?"],
    ["PEQUEÑOS PLACERES","¿Qué momento del día disfrutas más?"],
    ["PEQUEÑOS PLACERES","¿Qué actividad sencilla te gustaría hacer más a menudo?"],
    ["HISTORIAS","¿Quién de tu familia contaba buenas historias?"],
    ["HISTORIAS","¿Qué consejo de una persona querida recuerdas con cariño?"],
    ["AMISTAD","¿Qué detalle pequeño puede alegrarle el día a otra persona?"],
    ["VIAJES","¿Qué lugar cercano te gustaría volver a visitar?"],
    ["SABORES","¿Qué aroma te recuerda a una celebración o a una persona querida?"],
    ["FOTOGRAFÍAS","¿Qué te gusta mirar en una fotografía antigua?"],
    ["JUEGOS","¿Jugabas a las cartas, al dominó o a algún otro juego?"],
    ["RUTINAS","¿Qué costumbre sencilla te ayuda a empezar bien el día?"],
    ["MASCOTAS","¿Tuviste algún animal al que recuerdes con cariño?"],
    ["ESTACIONES","¿Qué es lo que más te gusta de la primavera o del verano?"],
    ["OFICIOS","¿Qué trabajo de tu familia te parecía curioso cuando eras pequeño?"],
    ["NUEVOS RECUERDOS","¿Qué cosa nueva te gustaría probar, aunque sea pequeña?"]
  );
  let promptDeck = shuffle(prompts), promptIndex = 0, favouritePrompts = new Set();
  function showPrompt() { if (promptIndex >= promptDeck.length) { promptDeck = shuffle(prompts); promptIndex = 0; } const item = promptDeck[promptIndex]; $("memory-category").textContent = item[0]; $("memory-prompt").textContent = item[1]; $("prompt-feedback").textContent = ""; $("prompt-fav").textContent = favouritePrompts.has(item[1]) ? "♥ Pregunta guardada en esta sesión" : "♡ Me gusta esta pregunta"; }
  $("prompt-next").addEventListener("click", () => { promptIndex++; showPrompt(); });
  $("prompt-fav").addEventListener("click", () => { const item = promptDeck[promptIndex][1]; if (favouritePrompts.has(item)) { favouritePrompts.delete(item); $("prompt-feedback").textContent = "Pregunta quitada de favoritas."; } else { favouritePrompts.add(item); $("prompt-feedback").textContent = "Marcada como favorita mientras esta página esté abierta."; } showPrompt(); $("prompt-feedback").textContent = favouritePrompts.has(item) ? "Marcada como favorita mientras esta página esté abierta." : "Pregunta quitada de favoritas."; });
  showPrompt();

  // Juego 7: cultura canaria, pensado para conversar y compartir recuerdos.
  const canaryQuestions = [
    {q:"¿Con qué se elabora tradicionalmente el gofio?",a:["Con cereales tostados y molidos","Con patata y queso","Con plátano y miel"],correct:0},
    {q:"¿Qué instrumento de cuerda es muy representativo de la música canaria?",a:["El timple","La gaita escocesa","La mandolina rusa"],correct:0},
    {q:"¿Cómo se suelen servir las papas arrugadas?",a:["Con su piel y sal, a menudo con mojo","Peladas y cubiertas de azúcar","En puré con nata"],correct:0},
    {q:"¿Qué formación rocosa es uno de los símbolos naturales de Gran Canaria?",a:["Roque Nublo","La Alhambra","Los Picos de Europa"],correct:0},
    {q:"¿Qué suele ser una romería tradicional?",a:["Una celebración popular con música y costumbres locales","Una competición de natación","Una exposición de coches"],correct:0},
    {q:"¿Qué fruta se cultiva ampliamente en Canarias y es conocida por su dulzor?",a:["El plátano","El arándano ártico","La grosella negra"],correct:0},
    {q:"¿Qué salsa canaria se sirve a menudo con papas arrugadas?",a:["Mojo","Pesto genovés","Salsa tártara"],correct:0},
    {q:"¿Qué nombre recibe una actividad tradicional de lucha canaria?",a:["Intentar derribar al contrario siguiendo reglas propias","Golpear una pelota con raqueta","Lanzar discos a una diana"],correct:0},
    {q:"¿Qué paisaje natural es muy conocido en Gran Canaria?",a:["Las dunas de Maspalomas","El glaciar Perito Moreno","El fiordo de Geiranger"],correct:0},
    {q:"¿Qué se puede encontrar en una fiesta tradicional canaria?",a:["Música, comida compartida y tradiciones locales","Solo deportes de invierno","Únicamente carreras de coches"],correct:0},
    {q:"¿Qué tipo de leche se usa tradicionalmente en muchos quesos canarios?",a:["Leche de cabra","Leche de reno","Leche de búfala exclusivamente"],correct:0},
    {q:"¿Qué instrumento puede acompañar una isa canaria?",a:["Timple","Didgeridoo","Balalaica"],correct:0}
  ];
  canaryQuestions.push(
    {q:"¿Qué isla canaria es conocida por el Parque Nacional del Teide?",a:["Tenerife","Lanzarote","Fuerteventura"],correct:0},
    {q:"¿Qué isla es famosa por el Parque Nacional de Timanfaya?",a:["Lanzarote","La Gomera","Gran Canaria"],correct:0},
    {q:"¿Cómo se llama el silbo tradicional de La Gomera?",a:["Silbo gomero","Canto del drago","Eco del Teide"],correct:0},
    {q:"¿Qué producto típico canario se elabora con leche y puede tener distintas curaciones?",a:["Queso","Galleta de arroz exclusivamente","Chocolate de menta"],correct:0},
    {q:"¿Qué árbol emblemático aparece en el paisaje canario y tiene una savia rojiza?",a:["Drago","Abedul","Castaño de Indias"],correct:0},
    {q:"¿Qué isla es conocida por sus paisajes volcánicos y playas de arena clara?",a:["Fuerteventura","La Gomera","El Hierro"],correct:0},
    {q:"¿Qué nombre recibe una vivienda tradicional excavada en roca en algunos lugares de Canarias?",a:["Casa cueva","Casa flotante","Casa de hielo"],correct:0},
    {q:"¿Qué baile tradicional canario se interpreta en fiestas populares?",a:["La isa","La polca bávara exclusivamente","El vals vienés únicamente"],correct:0},
    {q:"¿Qué se suele poner en el potaje canario?",a:["Verduras y legumbres","Solo chocolate","Fruta congelada"],correct:0},
    {q:"¿Qué isla es conocida por el Parque Nacional de Garajonay?",a:["La Gomera","La Palma","Lanzarote"],correct:0},
    {q:"¿Qué se celebra en muchas localidades canarias con carretas, música y vestimenta tradicional?",a:["Una romería","Una regata olímpica","Una feria de nieve"],correct:0},
    {q:"¿Cuál de estas islas forma parte de la provincia de Las Palmas?",a:["Gran Canaria","Tenerife","La Palma"],correct:0},
    {q:"¿Qué material volcánico oscuro es común en muchas playas canarias?",a:["Arena negra","Nieve permanente","Hielo azul"],correct:0},
    {q:"¿Qué bebida tradicional canaria se prepara con café, leche condensada y un toque de licor, según la versión?",a:["Barraquito","Horchata valenciana","Sidra asturiana"],correct:0},
    {q:"¿Qué animal marino puede avistarse en aguas de Canarias?",a:["Delfín","Pingüino emperador salvaje habitual","Morsa ártica"],correct:0},
    {q:"¿Qué isla es conocida por el observatorio del Roque de los Muchachos?",a:["La Palma","Fuerteventura","Gran Canaria"],correct:0},
    {q:"¿Qué oficio tradicional está relacionado con cuidar colmenas y recoger miel?",a:["Apicultura","Alfarería","Carpintería naval"],correct:0},
    {q:"¿Qué se suele usar para acompañar el gofio escaldado?",a:["Caldo","Helado de vainilla obligatoriamente","Sirope de chocolate"],correct:0}
  );
  let canaryDeck = shuffle(canaryQuestions), canaryIndex = 0;
  function showCanaryQuestion() {
    if (canaryIndex >= canaryDeck.length) { canaryDeck = shuffle(canaryQuestions); canaryIndex = 0; }
    const item = canaryDeck[canaryIndex];
    $("canary-counter").textContent = "Pregunta " + (canaryIndex + 1) + " de " + canaryDeck.length;
    $("canary-question").textContent = item.q; $("canary-feedback").textContent = ""; $("canary-options").innerHTML = "";
    shuffle(item.a.map((answer, index) => ({answer,index}))).forEach(({answer,index}) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "quiz-option"; button.textContent = answer; button.dataset.correct = String(index === item.correct);
      button.addEventListener("click", () => {
        [...$("canary-options").children].forEach((b) => b.disabled = true);
        if (index === item.correct) {
          button.classList.add("correct");
          $("canary-feedback").textContent = "¡Así es! ¿Qué recuerdo, receta o historia te viene a la cabeza al hablar de esto?";
        } else {
          button.classList.add("incorrect");
          [...$("canary-options").children].forEach((b) => { if (b.textContent === item.a[item.correct]) b.classList.add("correct"); });
          $("canary-feedback").textContent = "La respuesta que buscábamos era: " + item.a[item.correct] + ". No pasa nada: ¿conocías alguna historia relacionada?";
        }
      });
      $("canary-options").appendChild(button);
    });
  }
  $("canary-next").addEventListener("click", () => { canaryIndex++; showCanaryQuestion(); });
  showCanaryQuestion();

  // Ayudas universales: voz opcional, pistas amables y preferencias solo en memoria de sesión.
  const interestButtons = [...document.querySelectorAll("[data-interest]")];
  const selectedInterests = new Set(interestButtons.filter((button) => button.classList.contains("active")).map((button) => button.dataset.interest));
  const interestMap = {"LUGARES":["LUGARES","VIAJES","GRAN CANARIA","PAISAJES"],"MÚSICA":["MÚSICA","MÚSICA CANARIA","FIESTAS"],"COCINA":["COCINA","SABORES","GASTRONOMÍA CANARIA"],"TRADICIONES":["TRADICIONES","CELEBRACIONES","FIESTAS","COSTUMBRES"],"NATURALEZA":["NATURALEZA","PAISAJES","GRAN CANARIA"],"OTROS":["JUEGOS","OFICIOS","OBJETOS","AMISTAD","NUEVOS RECUERDOS"]};
  function makePromptDeck(){const allowed=new Set([...selectedInterests].flatMap((key)=>interestMap[key]||[]));const filtered=prompts.filter((item)=>allowed.has(item[0]));return shuffle(filtered.length?filtered:prompts);}
  promptDeck = makePromptDeck(); promptIndex = 0; showPrompt();
  interestButtons.forEach((button)=>button.addEventListener("click",()=>{const key=button.dataset.interest;if(selectedInterests.has(key))selectedInterests.delete(key);else selectedInterests.add(key);if(!selectedInterests.size)selectedInterests.add(key);interestButtons.forEach((item)=>{const active=selectedInterests.has(item.dataset.interest);item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active));});promptDeck=makePromptDeck();promptIndex=0;showPrompt();$("prompt-feedback").textContent="Preguntas adaptadas a tus temas favoritos."; }));
  const gameExplanations = {
    "game-parejas":"Vamos a jugar a las parejas. Toca una carta para verla y después toca otra. Si son iguales, has encontrado una pareja. Si son distintas, no pasa nada: observa dónde están y prueba de nuevo. Puedes tomarte todo el tiempo que necesites.",
    "game-refranes":"Vamos con los refranes de toda la vida. Lee o escucha el comienzo y elige cómo termina. Si en tu casa se decía de otra manera, esa variante también tiene su gracia. Aquí no venimos a examinarnos, sino a pasar un buen rato.",
    "game-palabras":"Jugamos a encadenar palabras. Mira la última letra de la palabra que aparece y piensa otra que empiece por esa letra. Puedes escribirla o decirla en voz alta con alguien que te acompañe. Si te quedas en blanco, pide una pista y seguimos.",
    "game-canciones":"A ver si reconocemos canciones conocidas. Escucha la pista y elige el título que te suene. Después podéis tararear la melodía o contar dónde la escuchabais. No reproducimos la canción: las pistas sirven para despertar recuerdos.",
    "game-cambios":"En este juego vamos a observar una pequeña escena. Mírala con calma y pulsa cuando estés preparado. Después cambiaremos un objeto y podrás intentar descubrir qué ha cambiado. Sin prisa y sin presión.",
    "game-recuerdos":"Esta actividad es para conversar. Escucha la pregunta y comparte lo que te apetezca, si te apetece. También puedes pasar a otra pregunta, hablar de un recuerdo inventado o simplemente escuchar. Tú decides qué quieres contar.",
    "game-canarias":"Damos un paseo por Canarias con preguntas sobre nuestras islas, sus comidas, sus paisajes y sus tradiciones. Elige la respuesta que te parezca. Y si conoces una historia distinta, ¡cuéntala! Lo importante es disfrutar y compartir.",
    "game-fotografias":"Vamos a mirar una fotografía. Fíjate en los colores, las formas y los detalles. No hace falta saber dónde se hizo: puedes contar qué te recuerda o qué sensación te da. Cuando quieras, pasamos a otra imagen."
  };
  function stopVoice(){if("speechSynthesis" in window)window.speechSynthesis.cancel();}
  function chooseSpanishVoice(utterance){
    if(!("speechSynthesis" in window))return;
    const voices=window.speechSynthesis.getVoices();
    // Los navegadores no suelen ofrecer una voz canaria específica; preferimos español de España.
    const preferred=voices.find((voice)=>/es-ES/i.test(voice.lang)&&/female|femenina|monica|elena|lucia|lucía/i.test(voice.name))
      || voices.find((voice)=>/es-ES/i.test(voice.lang))
      || voices.find((voice)=>/^es/i.test(voice.lang));
    if(preferred)utterance.voice=preferred;
  }
  function speakText(text,feedback){
    if(!("speechSynthesis" in window)||!text.trim()){if(feedback)feedback.textContent="La lectura en voz alta no está disponible en este navegador. Puedes leer el texto o pedir que te lo lean.";return;}
    stopVoice();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang="es-ES";utterance.rate=0.82;utterance.pitch=1.02;chooseSpanishVoice(utterance);
    utterance.onstart=()=>{if(feedback)feedback.textContent="Leyendo en voz alta…";};
    utterance.onend=()=>{if(feedback)feedback.textContent="Lectura terminada. Puedes volver a escucharla cuando quieras.";};
    utterance.onerror=()=>{if(feedback)feedback.textContent="No se pudo iniciar la voz. Comprueba que el dispositivo tenga una voz en español instalada.";};
    window.speechSynthesis.speak(utterance);
  }
  function textForPanel(panel){
    const title=panel.querySelector("h3")?.textContent||"";
    const explanation=gameExplanations[panel.id]||"";
    const question=panel.querySelector("#proverb-question, #song-clue, #canary-question, #word-prompt, #scene-instruction, #memory-prompt, #photo-prompt")?.textContent||"";
    const extra=panel.querySelector("#photo-support, #prompt-support")?.textContent||"";
    const options=[...panel.querySelectorAll(".quiz-option:not(:disabled), .scene-answer:not(:disabled)")].map((b)=>b.textContent).join(". ");
    const scene=panel.querySelector("#object-scene")?.textContent||"";
    return[title,explanation,question,extra,options,scene].filter(Boolean).join(". ");
  }
  function giveHint(panel,feedback){const id=panel.id;if(id==="game-palabras"){const letter=$("word-current")?.textContent.slice(-1)||"A";feedback.textContent="Pista: piensa en una palabra cotidiana que empiece por «"+letter+"». También puedes decirla en voz alta en vez de escribirla.";return;}if(id==="game-recuerdos"){feedback.textContent="Pista: puedes empezar por una persona, un lugar, un olor o una canción. También puedes pasar a otra pregunta; no tienes que contar nada personal.";return;}if(id==="game-fotografias"){feedback.textContent="Pista: fíjate primero en los colores y las formas. Después puedes hablar de un lugar parecido, de un paseo o de lo que te hace sentir la imagen.";return;}if(id==="game-parejas"){feedback.textContent="Pista: empieza con dos cartas. Si no coinciden, observa dónde están y vuelve a probar sin prisa.";return;}if(id==="game-cambios"){feedback.textContent="Pista: compara los objetos uno a uno. Puedes leer sus nombres en voz alta y tomarte todo el tiempo que quieras.";return;}const wrong=[...panel.querySelectorAll(".quiz-option:not(:disabled)")].find((button)=>button.dataset.correct==="false");if(wrong){wrong.disabled=true;wrong.classList.add("hinted-option");feedback.textContent="Aquí tienes una pista: hemos apartado una opción que no era la respuesta. Puedes elegir entre las restantes.";}else feedback.textContent="Pista: lee las opciones en voz alta y elige la que te resulte más familiar. No hay prisa.";}
  function addAssistiveTools(){document.querySelectorAll(".game-panel").forEach((panel)=>{if(panel.querySelector(".assistive-tools"))return;const tools=document.createElement("div");tools.className="assistive-tools";const listen=document.createElement("button");listen.type="button";listen.className="assistive-button";listen.textContent="🔊 Escuchar";listen.setAttribute("aria-label","Leer en voz alta el contenido de este juego");const hint=document.createElement("button");hint.type="button";hint.className="assistive-button";hint.textContent="💡 Dar una pista";const stop=document.createElement("button");stop.type="button";stop.className="assistive-button";stop.textContent="■ Parar voz";const feedback=document.createElement("p");feedback.className="assistive-feedback";feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");listen.addEventListener("click",()=>speakText(textForPanel(panel),feedback));stop.addEventListener("click",()=>{stopVoice();feedback.textContent="Lectura detenida.";});hint.addEventListener("click",()=>giveHint(panel,feedback));tools.append(listen,hint,stop,feedback);const target=panel.querySelector(".quiz-card, .word-card, .scene-card, .memory-prompt-card, .photo-question");if(target)target.appendChild(tools);else panel.appendChild(tools);});}
  addAssistiveTools();
  const photos=[
  {src:"https://commons.wikimedia.org/wiki/Special:FilePath/Roque_Nublo,_gran_canaria.JPG?width=1000",alt:"El Roque Nublo, formación rocosa de Gran Canaria",title:"¿Qué te llama la atención de este paisaje?",category:"PAISAJES",support:"Puedes describir lo que ves, contar si has estado allí o elegir otra fotografía.",credit:'Fotografía: Donarreiskoffer · CC BY 3.0 · <a href="https://commons.wikimedia.org/wiki/File:Roque_Nublo,_gran_canaria.JPG" target="_blank" rel="noopener noreferrer">Ver fuente y licencia</a>',topic:"LUGARES"},
  {src:"https://commons.wikimedia.org/wiki/Special:FilePath/Dunas_de_Maspalomas,_Gran_Canaria.jpg?width=1000",alt:"Dunas de Maspalomas en Gran Canaria",title:"¿Te recuerda a algún paseo, día de playa o viaje?",category:"RECUERDOS Y LUGARES",support:"Puedes hablar del mar, la arena, el viento o de otro lugar que te guste.",credit:'Fotografía: Marcela Střelcová · CC BY-SA 4.0 · <a href="https://commons.wikimedia.org/wiki/File:Dunas_de_Maspalomas,_Gran_Canaria.jpg" target="_blank" rel="noopener noreferrer">Ver fuente y licencia</a>',topic:"LUGARES"},
  {src:"https://commons.wikimedia.org/wiki/Special:FilePath/Timple-001.jpg?width=1000",alt:"Un timple canario de cinco cuerdas",title:"¿Qué música o celebración te viene a la cabeza al ver este instrumento?",category:"MÚSICA CANARIA",support:"Quizá recuerdes una fiesta, una isa, una parranda o una canción familiar.",credit:'Fotografía: Villanueva · CC BY-SA 3.0 · <a href="https://commons.wikimedia.org/wiki/File:Timple-001.jpg" target="_blank" rel="noopener noreferrer">Ver fuente y licencia</a>',topic:"MÚSICA"}];
  let photoIndex=0;
  function showPhoto(){const matching=photos.filter((photo)=>selectedInterests.has(photo.topic));const collection=matching.length?matching:photos;const photo=collection[photoIndex%collection.length];$("photo-image").onerror=()=>{$("photo-feedback").textContent="No se pudo cargar la fotografía. Comprueba la conexión o abre el enlace de la fuente.";};$("photo-image").src=photo.src;$("photo-image").alt=photo.alt;$("photo-category").textContent=photo.category;$("photo-prompt").textContent=photo.title;$("photo-support").textContent=photo.support;$("photo-credit").innerHTML=photo.credit;$("photo-feedback").textContent="";}
  $("photo-next").addEventListener("click",()=>{photoIndex=(photoIndex+1)%photos.length;showPhoto();});

})();